import { ethers } from 'ethers';

// Network Configuration
export const NETWORKS = {
  POLYGON_MUMBAI: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  POLYGON_AMOY: {
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorer: 'https://www.oklink.com/amoy',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  LOCALHOST: {
    chainId: 1337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    explorer: '',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

// Contract Addresses (Update these with your deployed contract addresses)
export const CONTRACT_ADDRESSES = {
  RUPEEFLOW: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x0000000000000000000000000000000000000000',
  USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || '0x0000000000000000000000000000000000000000',
};

// RupeeFlow Contract ABI (Core functions)
export const RUPEEFLOW_ABI = [
  // Transfer functions
  'function initiateTransfer(address recipient, uint256 amount, address stablecoin, string sourceCurrency, string destinationCurrency, string sourceCountry, string destinationCountry, string recipientDetails) external returns (uint256)',
  'function completeTransfer(uint256 transferId) external',
  'function cancelTransfer(uint256 transferId) external',
  'function refundTransfer(uint256 transferId) external',
  
  // View functions
  'function transfers(uint256 transferId) external view returns (uint256 id, address sender, address recipient, uint256 amount, address stablecoin, string sourceCurrency, string destinationCurrency, string sourceCountry, string destinationCountry, uint256 exchangeRate, uint256 feeAmount, uint8 status, uint256 createdAt, uint256 completedAt, string blockchainTxHash, string recipientDetails)',
  'function userTransfers(address user, uint256 index) external view returns (uint256)',
  'function getUserTransferCount(address user) external view returns (uint256)',
  'function feeBps() external view returns (uint256)',
  'function supportedStablecoins(address token) external view returns (bool)',
  
  // Events
  'event TransferInitiated(uint256 indexed transferId, address indexed sender, address indexed recipient, uint256 amount, address stablecoin, string sourceCurrency, string destinationCurrency, uint256 feeAmount)',
  'event TransferCompleted(uint256 indexed transferId, address indexed recipient, uint256 amount, string blockchainTxHash)',
  'event TransferFailed(uint256 indexed transferId, address indexed sender, string reason)',
  'event TransferCancelled(uint256 indexed transferId, address indexed sender)',
  'event TransferRefunded(uint256 indexed transferId, address indexed sender, uint256 amount)',
];

// ERC20 Token ABI
export const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// Provider and Contract Instances
export function getProvider(network = NETWORKS.POLYGON_MUMBAI) {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return new ethers.JsonRpcProvider(network.rpcUrl);
}

export function getContract(address: string, abi: any, signer?: ethers.Signer) {
  const provider = getProvider();
  if (signer) {
    return new ethers.Contract(address, abi, signer);
  }
  return new ethers.Contract(address, abi, provider);
}

export function getRupeeFlowContract(signer?: ethers.Signer) {
  return getContract(CONTRACT_ADDRESSES.RUPEEFLOW, RUPEEFLOW_ABI, signer);
}

export function getTokenContract(tokenAddress: string, signer?: ethers.Signer) {
  return getContract(tokenAddress, ERC20_ABI, signer);
}

// Utility Functions
export async function formatEther(wei: bigint): Promise<string> {
  return ethers.formatEther(wei);
}

export function parseEther(ether: string): bigint {
  return ethers.parseEther(ether);
}

export async function getBalance(address: string): Promise<string> {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  return formatEther(balance);
}

export async function getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
  const contract = getTokenContract(tokenAddress);
  const balance = await contract.balanceOf(userAddress);
  const decimals = await contract.decimals();
  return ethers.formatUnits(balance, decimals);
}

// Network Switching
export async function switchNetwork(chainId: number) {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, add it
        const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
        if (network) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: network.name,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: network.explorer ? [network.explorer] : [],
            }],
          });
        }
      }
    }
  }
}
