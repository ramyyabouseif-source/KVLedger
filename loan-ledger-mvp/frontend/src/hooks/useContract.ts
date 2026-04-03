import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../utils/contractAddresses';

interface ContractState {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contract: ethers.Contract | null;
  account: string;
  isConnected: boolean;
  chainId: number | null;
  network: string | null;
  error: string | null;
}

export const useContract = () => {
  const [state, setState] = useState<ContractState>({
    provider: null,
    signer: null,
    contract: null,
    account: '',
    isConnected: false,
    chainId: null,
    network: null,
    error: null,
  });

  const connectWallet = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      setState(prev => ({
        ...prev,
        provider,
        signer,
        account: accounts[0],
        chainId: Number(network.chainId),
        network: network.name,
        isConnected: true,
      }));

    } catch (error) {
      console.error('Error connecting wallet:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  }, []);

  // Check if wallet is already connected on page load
  const checkWalletConnection = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        const contractAddress = CONTRACT_ADDRESSES.localhost.LoanRegistry;
        
        // Contract ABI - Using the exact ABI from the deployed contract
        const contractABI = [
          "function createLoan(bytes32 _borrowerHash, uint256 _amountInCents, uint256 _durationDays, string memory _currency) external returns (uint256)",
          "function recordRepayment(uint256 _loanId, uint256 _amountInCents, string memory _notes) external",
          "function getTotalLoans() external view returns (uint256)",
          "function getLoanDetails(uint256 _loanId) external view returns (uint256, bytes32, uint256, uint256, uint256, uint256, uint8, string memory)",
          "function getLoanStatus(uint256 _loanId) external view returns (uint8)",
          "function getRepaymentHistory(uint256 _loanId) external view returns (uint256[], string[] memory)",
          "function admin() external view returns (address)",
          "function loanCount() external view returns (uint256)"
        ];
        
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        
        setState({
          provider,
          signer,
          contract,
          account: accounts[0].address,
          isConnected: true,
          chainId: Number(network.chainId),
          network: network.name,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setState({
      provider: null,
      signer: null,
      contract: null,
      account: '',
      isConnected: false,
      chainId: null,
      network: null,
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async (chainId: number) => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    }
  }, []);

  // Check wallet connection on component mount
  useEffect(() => {
    checkWalletConnection();

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          disconnectWallet();
        } else {
          // User switched accounts
          checkWalletConnection();
        }
      };

      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [checkWalletConnection, disconnectWallet]);

  // Initialize contract when provider and signer are available
  useEffect(() => {
    if (state.provider && state.signer && state.chainId) {
        // Contract ABI - Using the exact ABI from the deployed contract
        const contractABI = [
          "function createLoan(bytes32 _borrowerHash, uint256 _amountInCents, uint256 _durationDays, string memory _currency) external returns (uint256)",
          "function recordRepayment(uint256 _loanId, uint256 _amountInCents, string memory _notes) external",
          "function getLoan(uint256 _loanId) external view returns (tuple(uint256 id, bytes32 borrowerHash, uint256 amountInCents, uint256 disbursedAt, uint256 dueDate, uint256 totalRepaid, uint8 status, string currency))",
          "function getTotalLoans() external view returns (uint256)",
          "function admin() external view returns (address)",
          "function loanCount() external view returns (uint256)"
        ];

      const networkConfig = Object.values(NETWORK_CONFIG).find(
        config => config.chainId === state.chainId
      );

      if (networkConfig) {
        const contractAddress = CONTRACT_ADDRESSES[networkConfig.name.toLowerCase() as keyof typeof CONTRACT_ADDRESSES]?.LoanRegistry;
        
        if (contractAddress) {
          const contract = new ethers.Contract(contractAddress, contractABI, state.signer);
          setState(prev => ({ ...prev, contract }));
        }
      }
    }
  }, [state.provider, state.signer, state.chainId]);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
};