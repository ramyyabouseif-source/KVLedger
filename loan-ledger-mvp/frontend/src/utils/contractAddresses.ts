/**
 * Contract addresses configuration for different networks
 * @dev These addresses should be updated after contract deployment
 */

export const CONTRACT_ADDRESSES = {
  localhost: {
    LoanRegistry: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    LoanRegistryOptimized: process.env.NEXT_PUBLIC_OPTIMIZED_CONTRACT_ADDRESS || '',
    LoanRegistrySecure: process.env.NEXT_PUBLIC_SECURE_CONTRACT_ADDRESS || '',
    LoanRegistryUltraOptimized: process.env.NEXT_PUBLIC_ULTRA_OPTIMIZED_CONTRACT_ADDRESS || '',
  },
  sepolia: {
    LoanRegistry: process.env.NEXT_PUBLIC_SEPOLIA_LOAN_REGISTRY || '',
    LoanRegistryOptimized: process.env.NEXT_PUBLIC_SEPOLIA_OPTIMIZED || '',
    LoanRegistrySecure: process.env.NEXT_PUBLIC_SEPOLIA_SECURE || '',
    LoanRegistryUltraOptimized: process.env.NEXT_PUBLIC_SEPOLIA_ULTRA_OPTIMIZED || '',
  },
} as const;

/**
 * Get contract address for current network
 * @param network - Network name
 * @param contractType - Type of contract
 * @returns Contract address or empty string if not found
 */
export const getContractAddress = (
  network: keyof typeof CONTRACT_ADDRESSES,
  contractType: keyof typeof CONTRACT_ADDRESSES.localhost
): string => {
  return CONTRACT_ADDRESSES[network]?.[contractType] || '';
};

/**
 * Network configuration for different blockchain networks
 */
export const NETWORK_CONFIG = {
  localhost: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: process.env.NEXT_PUBLIC_LOCALHOST_RPC_URL || 'http://localhost:8545',
    blockExplorer: 'http://localhost:8545',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const;

/**
 * Get network configuration by chain ID
 * @param chainId - Chain ID to look up
 * @returns Network configuration or null if not found
 */
export const getNetworkByChainId = (chainId: number) => {
  return Object.values(NETWORK_CONFIG).find(network => network.chainId === chainId) || null;
};

/**
 * Check if a network is supported
 * @param chainId - Chain ID to check
 * @returns True if network is supported
 */
export const isSupportedNetwork = (chainId: number): boolean => {
  return getNetworkByChainId(chainId) !== null;
};