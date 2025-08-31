import { ethers } from 'ethers';
import { 
  getRupeeFlowContract, 
  getTokenContract, 
  CONTRACT_ADDRESSES,
  parseEther,
  formatEther 
} from './blockchain';

export interface TransferData {
  recipient: string;
  amount: string;
  stablecoin: string;
  sourceCurrency: string;
  destinationCurrency: string;
  sourceCountry: string;
  destinationCountry: string;
  recipientDetails: string;
}

export interface TransferStatus {
  id: number;
  sender: string;
  recipient: string;
  amount: string;
  stablecoin: string;
  sourceCurrency: string;
  destinationCurrency: string;
  sourceCountry: string;
  destinationCountry: string;
  exchangeRate: string;
  feeAmount: string;
  status: number;
  createdAt: number;
  completedAt: number;
  blockchainTxHash: string;
  recipientDetails: string;
}

export class BlockchainService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(signer: ethers.Signer) {
    this.signer = signer;
    this.contract = getRupeeFlowContract(signer);
  }

  // Get contract instance
  getContract(): ethers.Contract {
    return this.contract;
  }

  // Get user's transfer count
  async getUserTransferCount(userAddress: string): Promise<number> {
    try {
      const count = await this.contract.getUserTransferCount(userAddress);
      return Number(count);
    } catch (error) {
      console.error('Error getting user transfer count:', error);
      throw error;
    }
  }

  // Get transfer by ID
  async getTransfer(transferId: number): Promise<TransferStatus> {
    try {
      const transfer = await this.contract.transfers(transferId);
      
      return {
        id: Number(transfer.id),
        sender: transfer.sender,
        recipient: transfer.recipient,
        amount: formatEther(transfer.amount),
        stablecoin: transfer.stablecoin,
        sourceCurrency: transfer.sourceCurrency,
        destinationCurrency: transfer.destinationCurrency,
        sourceCountry: transfer.sourceCountry,
        destinationCountry: transfer.destinationCountry,
        exchangeRate: formatEther(transfer.exchangeRate),
        feeAmount: formatEther(transfer.feeAmount),
        status: Number(transfer.status),
        createdAt: Number(transfer.createdAt),
        completedAt: Number(transfer.completedAt),
        blockchainTxHash: transfer.blockchainTxHash,
        recipientDetails: transfer.recipientDetails,
      };
    } catch (error) {
      console.error('Error getting transfer:', error);
      throw error;
    }
  }

  // Get user's transfers
  async getUserTransfers(userAddress: string, startIndex: number = 0, count: number = 10): Promise<TransferStatus[]> {
    try {
      const totalCount = await this.getUserTransferCount(userAddress);
      const transfers: TransferStatus[] = [];

      const endIndex = Math.min(startIndex + count, totalCount);
      
      for (let i = startIndex; i < endIndex; i++) {
        const transferId = await this.contract.userTransfers(userAddress, i);
        const transfer = await this.getTransfer(Number(transferId));
        transfers.push(transfer);
      }

      return transfers;
    } catch (error) {
      console.error('Error getting user transfers:', error);
      throw error;
    }
  }

  // Initiate a transfer
  async initiateTransfer(data: TransferData): Promise<{ transferId: number; txHash: string }> {
    try {
      const amount = parseEther(data.amount);
      
      const tx = await this.contract.initiateTransfer(
        data.recipient,
        amount,
        data.stablecoin,
        data.sourceCurrency,
        data.destinationCurrency,
        data.sourceCountry,
        data.destinationCountry,
        data.recipientDetails
      );

      const receipt = await tx.wait();
      
      // Get transfer ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'TransferInitiated';
        } catch {
          return false;
        }
      });

      if (!event) {
        throw new Error('TransferInitiated event not found');
      }

      const parsedEvent = this.contract.interface.parseLog(event);
      const transferId = Number(parsedEvent.args.transferId);

      return {
        transferId,
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('Error initiating transfer:', error);
      throw error;
    }
  }

  // Complete a transfer (operator only)
  async completeTransfer(transferId: number): Promise<string> {
    try {
      const tx = await this.contract.completeTransfer(transferId);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Error completing transfer:', error);
      throw error;
    }
  }

  // Cancel a transfer
  async cancelTransfer(transferId: number): Promise<string> {
    try {
      const tx = await this.contract.cancelTransfer(transferId);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      throw error;
    }
  }

  // Get fee percentage
  async getFeePercentage(): Promise<number> {
    try {
      const feeBps = await this.contract.feeBps();
      return Number(feeBps) / 100; // Convert basis points to percentage
    } catch (error) {
      console.error('Error getting fee percentage:', error);
      throw error;
    }
  }

  // Check if token is supported
  async isTokenSupported(tokenAddress: string): Promise<boolean> {
    try {
      return await this.contract.supportedStablecoins(tokenAddress);
    } catch (error) {
      console.error('Error checking token support:', error);
      throw error;
    }
  }

  // Get token balance
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    try {
      const tokenContract = getTokenContract(tokenAddress);
      const balance = await tokenContract.balanceOf(userAddress);
      const decimals = await tokenContract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  // Approve token spending
  async approveToken(tokenAddress: string, amount: string): Promise<string> {
    try {
      const tokenContract = getTokenContract(tokenAddress, this.signer);
      const parsedAmount = parseEther(amount);
      
      const tx = await tokenContract.approve(CONTRACT_ADDRESSES.RUPEEFLOW, parsedAmount);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Error approving token:', error);
      throw error;
    }
  }

  // Check token allowance
  async getTokenAllowance(tokenAddress: string, userAddress: string): Promise<string> {
    try {
      const tokenContract = getTokenContract(tokenAddress);
      const allowance = await tokenContract.allowance(userAddress, CONTRACT_ADDRESSES.RUPEEFLOW);
      const decimals = await tokenContract.decimals();
      return ethers.formatUnits(allowance, decimals);
    } catch (error) {
      console.error('Error getting token allowance:', error);
      throw error;
    }
  }

  // Listen to transfer events
  onTransferInitiated(callback: (transferId: number, sender: string, recipient: string, amount: string) => void) {
    this.contract.on('TransferInitiated', (transferId, sender, recipient, amount, stablecoin, sourceCurrency, destinationCurrency, feeAmount) => {
      callback(
        Number(transferId),
        sender,
        recipient,
        formatEther(amount)
      );
    });
  }

  onTransferCompleted(callback: (transferId: number, recipient: string, amount: string, txHash: string) => void) {
    this.contract.on('TransferCompleted', (transferId, recipient, amount, blockchainTxHash) => {
      callback(
        Number(transferId),
        recipient,
        formatEther(amount),
        blockchainTxHash
      );
    });
  }

  onTransferFailed(callback: (transferId: number, sender: string, reason: string) => void) {
    this.contract.on('TransferFailed', (transferId, sender, reason) => {
      callback(
        Number(transferId),
        sender,
        reason
      );
    });
  }

  // Remove event listeners
  removeAllListeners() {
    this.contract.removeAllListeners();
  }
}

// Helper function to create service instance
export function createBlockchainService(signer: ethers.Signer): BlockchainService {
  return new BlockchainService(signer);
}
