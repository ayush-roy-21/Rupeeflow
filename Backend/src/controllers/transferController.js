const { v4: uuidv4 } = require('uuid');
const { ethers } = require('ethers');
const prisma = require('../config/database');
const logger = require('../config/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/environment');

/**
 * Get transfer quote
 */
const getTransferQuote = asyncHandler(async (req, res) => {
  const {
    sourceAmount,
    sourceCurrency,
    destinationCurrency,
    sourceCountry,
    destinationCountry
  } = req.body;

  // Validate currencies
  const supportedCurrencies = ['INR', 'RUB', 'USD'];
  if (!supportedCurrencies.includes(sourceCurrency) || !supportedCurrencies.includes(destinationCurrency)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported currency pair',
      code: 'UNSUPPORTED_CURRENCY'
    });
  }

  // Get exchange rate (mock for now, integrate with real API)
  const exchangeRate = await getExchangeRate(sourceCurrency, destinationCurrency);
  
  // Calculate destination amount
  const destinationAmount = sourceAmount * exchangeRate;
  
  // Calculate fees
  const fees = calculateTransferFees(sourceAmount, sourceCurrency, destinationCurrency);
  
  // Calculate total amount
  const totalAmount = sourceAmount + fees.totalFee;
  
  // Generate quote ID
  const quoteId = uuidv4();
  
  // Store quote in Redis for 15 minutes
  const quote = {
    id: quoteId,
    sourceAmount,
    sourceCurrency,
    destinationAmount,
    destinationCurrency,
    exchangeRate,
    fees,
    totalAmount,
    sourceCountry,
    destinationCountry,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    userId: req.user?.id
  };

  // TODO: Store quote in Redis

  logger.info(`Transfer quote generated: ${quoteId} for user: ${req.user?.id}`);

  res.json({
    success: true,
    message: 'Transfer quote generated successfully',
    data: {
      quoteId,
      sourceAmount,
      sourceCurrency,
      destinationAmount,
      destinationCurrency,
      exchangeRate,
      fees,
      totalAmount,
      expiresAt: quote.expiresAt
    }
  });
});

/**
 * Create transfer
 */
const createTransfer = asyncHandler(async (req, res) => {
  const {
    quoteId,
    sourceAmount,
    sourceCurrency,
    destinationCurrency,
    recipientName,
    recipientPhone,
    recipientEmail,
    purpose,
    sourceCountry,
    destinationCountry
  } = req.body;

  // Validate quote (check if it exists and hasn't expired)
  // TODO: Retrieve quote from Redis and validate

  // Check user KYC status
  if (req.user.kycStatus !== 'VERIFIED') {
    return res.status(403).json({
      success: false,
      message: 'KYC verification required to create transfers',
      code: 'KYC_REQUIRED'
    });
  }

  // Check transfer limits
  const transferLimits = await getTransferLimits(req.user.id, sourceCurrency);
  if (sourceAmount > transferLimits.maxAmount) {
    return res.status(400).json({
      success: false,
      message: 'Transfer amount exceeds limit',
      code: 'TRANSFER_LIMIT_EXCEEDED',
      limit: transferLimits.maxAmount
    });
  }

  // Create transfer record
  const transfer = await prisma.transfer.create({
    data: {
      id: uuidv4(),
      userId: req.user.id,
      sourceAmount,
      sourceCurrency,
      destinationCurrency,
      recipientName,
      recipientPhone,
      recipientEmail,
      purpose,
      sourceCountry,
      destinationCountry,
      status: 'PENDING',
      exchangeRate: 0, // Will be updated when processing
      fees: 0, // Will be calculated
      blockchainTxHash: null,
      estimatedCompletionTime: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    }
  });

  // Initiate blockchain transfer
  try {
    const { ethers } = require('ethers');
    const RupeeFlowABI = require('../../artifacts/contracts/RupeeFlow.sol/RupeeFlow.json');
    
    // Get contract instance
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-mumbai.maticvigil.com');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, RupeeFlowABI.abi, wallet);
    
    // Prepare transfer data
    const recipientAddress = "0x0000000000000000000000000000000000000000"; // Mock recipient
    const amount = ethers.parseEther(sourceAmount.toString());
    const stablecoinAddress = process.env.USDC_ADDRESS || "0x0000000000000000000000000000000000000000";
    
    // Initiate transfer on blockchain
    const tx = await contract.initiateTransfer(
      recipientAddress,
      amount,
      stablecoinAddress,
      sourceCurrency,
      destinationCurrency,
      sourceCountry,
      destinationCountry,
      JSON.stringify({
        name: recipientName,
        phone: recipientPhone,
        email: recipientEmail,
        purpose: purpose
      })
    );
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    // Update transfer with blockchain transaction hash
    await prisma.transfer.update({
      where: { id: transfer.id },
      data: { blockchainTxHash: receipt.hash }
    });
    
    logger.info(`Blockchain transfer initiated: ${transfer.id}, TX: ${receipt.hash}`);
    
  } catch (error) {
    logger.error('Blockchain transfer failed:', error);
    // Update transfer status to failed
    await prisma.transfer.update({
      where: { id: transfer.id },
      data: { status: 'FAILED' }
    });
  }

  logger.info(`Transfer created: ${transfer.id} for user: ${req.user.id}`);

  res.status(201).json({
    success: true,
    message: 'Transfer created successfully',
    data: {
      transfer: {
        id: transfer.id,
        status: transfer.status,
        estimatedCompletionTime: transfer.estimatedCompletionTime
      }
    }
  });
});

/**
 * Get transfer by ID
 */
const getTransfer = asyncHandler(async (req, res) => {
  const { transferId } = req.params;

  const transfer = await prisma.transfer.findFirst({
    where: {
      id: transferId,
      userId: req.user.id
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  if (!transfer) {
    return res.status(404).json({
      success: false,
      message: 'Transfer not found',
      code: 'TRANSFER_NOT_FOUND'
    });
  }

  res.json({
    success: true,
    data: { transfer }
  });
});

/**
 * Get user transfers with pagination and filters
 */
const getUserTransfers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    sourceCurrency,
    destinationCurrency,
    startDate,
    endDate
  } = req.query;

  const skip = (page - 1) * limit;

  // Build where clause
  const where = {
    userId: req.user.id
  };

  if (status) where.status = status;
  if (sourceCurrency) where.sourceCurrency = sourceCurrency;
  if (destinationCurrency) where.destinationCurrency = destinationCurrency;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Get transfers
  const [transfers, total] = await Promise.all([
    prisma.transfer.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sourceAmount: true,
        sourceCurrency: true,
        destinationCurrency: true,
        recipientName: true,
        status: true,
        createdAt: true,
        estimatedCompletionTime: true,
        blockchainTxHash: true
      }
    }),
    prisma.transfer.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      transfers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    }
  });
});

/**
 * Cancel transfer
 */
const cancelTransfer = asyncHandler(async (req, res) => {
  const { transferId } = req.params;

  const transfer = await prisma.transfer.findFirst({
    where: {
      id: transferId,
      userId: req.user.id,
      status: { in: ['PENDING', 'PROCESSING'] }
    }
  });

  if (!transfer) {
    return res.status(404).json({
      success: false,
      message: 'Transfer not found or cannot be cancelled',
      code: 'TRANSFER_NOT_CANCELLABLE'
    });
  }

  // Update transfer status
  await prisma.transfer.update({
    where: { id: transferId },
    data: { 
      status: 'CANCELLED',
      cancelledAt: new Date()
    }
  });

  // TODO: Process refund if payment was made
  // TODO: Send cancellation notification

  logger.info(`Transfer cancelled: ${transferId} by user: ${req.user.id}`);

  res.json({
    success: true,
    message: 'Transfer cancelled successfully'
  });
});

/**
 * Get transfer status
 */
const getTransferStatus = asyncHandler(async (req, res) => {
  const { transferId } = req.params;

  const transfer = await prisma.transfer.findFirst({
    where: {
      id: transferId,
      userId: req.user.id
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      estimatedCompletionTime: true,
      blockchainTxHash: true,
      sourceAmount: true,
      sourceCurrency: true,
      destinationCurrency: true,
      recipientName: true
    }
  });

  if (!transfer) {
    return res.status(404).json({
      success: false,
      message: 'Transfer not found',
      code: 'TRANSFER_NOT_FOUND'
    });
  }

  // Get blockchain status if available
  let blockchainStatus = null;
  if (transfer.blockchainTxHash) {
    blockchainStatus = await getBlockchainStatus(transfer.blockchainTxHash);
  }

  res.json({
    success: true,
    data: {
      transfer,
      blockchainStatus
    }
  });
});

// Helper functions
async function getExchangeRate(sourceCurrency, destinationCurrency) {
  // TODO: Integrate with real exchange rate API
  const rates = {
    'INR-RUB': 1.12,
    'RUB-INR': 0.89,
    'USD-INR': 83.45,
    'USD-RUB': 93.67
  };

  const pair = `${sourceCurrency}-${destinationCurrency}`;
  return rates[pair] || 1.0;
}

function calculateTransferFees(amount, sourceCurrency, destinationCurrency) {
  // Base fee structure
  const baseFee = 0.018; // 1.8%
  const minFee = sourceCurrency === 'INR' ? 100 : 2;
  const maxFee = sourceCurrency === 'INR' ? 5000 : 100;

  let fee = amount * baseFee;
  fee = Math.max(fee, minFee);
  fee = Math.min(fee, maxFee);

  return {
    baseFee: fee,
    processingFee: 0,
    totalFee: fee
  };
}

async function getTransferLimits(userId, currency) {
  // TODO: Implement proper limit calculation based on user KYC level
  return {
    maxAmount: currency === 'INR' ? 1000000 : 10000, // 10L INR or 10K USD
    dailyLimit: currency === 'INR' ? 500000 : 5000,
    monthlyLimit: currency === 'INR' ? 5000000 : 50000
  };
}

async function getBlockchainStatus(txHash) {
  try {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-mumbai.maticvigil.com');
    
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!tx || !receipt) {
      return {
        confirmed: false,
        confirmations: 0,
        blockNumber: null,
        status: 'pending'
      };
    }
    
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;
    
    return {
      confirmed: receipt.status === 1,
      confirmations: confirmations,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString()
    };
  } catch (error) {
    logger.error('Error getting blockchain status:', error);
    return {
      confirmed: false,
      confirmations: 0,
      blockNumber: null,
      status: 'error',
      error: error.message
    };
  }
}

module.exports = {
  getTransferQuote,
  createTransfer,
  getTransfer,
  getUserTransfers,
  cancelTransfer,
  getTransferStatus
};
