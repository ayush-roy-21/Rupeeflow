'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { NETWORKS, switchNetwork } from '@/lib/blockchain';

interface WalletContextType {
  isConnected: boolean;
  account: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToNetwork: (chainId: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
  };

  // Initialize provider
  const initializeProvider = () => {
    if (isMetaMaskInstalled()) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
      return provider;
    }
    return null;
  };

  // Connect wallet
  const connect = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = initializeProvider();
      if (!provider) {
        throw new Error('Failed to initialize provider');
      }

      // Request account access
      const accounts = await provider.send('eth_requestAccounts', []);
      const account = accounts[0];
      
      if (!account) {
        throw new Error('No accounts found');
      }

      // Get signer
      const signer = await provider.getSigner();
      
      // Get network
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Check if we're on a supported network
      const supportedChainIds = Object.values(NETWORKS).map(n => n.chainId);
      if (!supportedChainIds.includes(chainId)) {
        // Auto-switch to Mumbai testnet
        await switchNetwork(NETWORKS.POLYGON_MUMBAI.chainId);
        const newNetwork = await provider.getNetwork();
        setChainId(Number(newNetwork.chainId));
      } else {
        setChainId(chainId);
      }

      setAccount(account);
      setSigner(signer);
      setIsConnected(true);

      // Store connection state
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAccount', account);

    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setError(null);
    
    // Clear stored state
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAccount');
  };

  // Switch network
  const switchToNetwork = async (targetChainId: number) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await switchNetwork(targetChainId);
      
      // Update chain ID after switching
      if (provider) {
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));
      }
    } catch (err: any) {
      console.error('Failed to switch network:', err);
      setError(err.message || 'Failed to switch network');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        disconnect();
      } else {
        // Account changed
        setAccount(accounts[0]);
        localStorage.setItem('walletAccount', accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      // Reload page when chain changes
      window.location.reload();
    };

    const handleDisconnect = () => {
      disconnect();
    };

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    // Check for existing connection
    const wasConnected = localStorage.getItem('walletConnected') === 'true';
    const savedAccount = localStorage.getItem('walletAccount');
    
    if (wasConnected && savedAccount) {
      // Try to reconnect
      connect();
    }

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    };
  }, []);

  const value: WalletContextType = {
    isConnected,
    account,
    chainId,
    provider,
    signer,
    connect,
    disconnect,
    switchToNetwork,
    isLoading,
    error,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
