'use client';

import { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { formatAddress } from '../utils/formatting';

/**
 * WalletConnection Component
 * 
 * Educational Notes:
 * - This component demonstrates how to connect to Web3 wallets
 * - MetaMask injects a global 'ethereum' object into the browser
 * - We use the ethers.js library to interact with the blockchain
 * - The component manages connection state and user feedback
 */
export default function WalletConnection() {
  const {
    isConnected,
    account,
    chainId,
    network,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork
  } = useContract();

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<string>('');

  // Handle wallet connection with detailed feedback
  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionStep('Initializing connection...');
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }
      
      setConnectionStep('Requesting account access...');
      await connectWallet();
      setConnectionStep('Connection successful!');
      
      // Clear step after success
      setTimeout(() => setConnectionStep(''), 2000);
    } catch (error: any) {
      console.error('Connection failed:', error);
      setConnectionStep(`Connection failed: ${error.message}`);
      
      // Clear error after 5 seconds
      setTimeout(() => setConnectionStep(''), 5000);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle network switching
  const handleSwitchNetwork = async () => {
    try {
      setConnectionStep('Switching to localhost network...');
      await switchNetwork(31337);
      setConnectionStep('Network switched successfully!');
      
      setTimeout(() => setConnectionStep(''), 2000);
    } catch (error: any) {
      console.error('Network switch failed:', error);
      setConnectionStep(`Network switch failed: ${error.message}`);
      
      setTimeout(() => setConnectionStep(''), 5000);
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      margin: '2rem 0'
    }}>
      <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.25rem' }}>
        🔗 Wallet Connection
      </h3>
      
      {/* Educational Info */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <h4 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0', fontSize: '14px' }}>
          💡 What is MetaMask?
        </h4>
        <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0', lineHeight: '1.4' }}>
          MetaMask is your gateway to blockchain applications. It securely stores your 
          private keys and allows you to interact with smart contracts without exposing 
          your sensitive information.
        </p>
      </div>
      
      {!isConnected ? (
        <div>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
            Connect your MetaMask wallet to interact with the KVLedger smart contracts
          </p>
          
          {/* Connection Status */}
          {connectionStep && (
            <div style={{
              background: 'rgba(254, 159, 20, 0.1)',
              border: '1px solid rgba(254, 159, 20, 0.3)',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1rem'
            }}>
              <p style={{ color: '#fe9f14', fontSize: '14px', margin: '0' }}>
                🔄 {connectionStep}
              </p>
            </div>
          )}
          
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            style={{
              background: isConnecting 
                ? 'rgba(254, 159, 20, 0.5)' 
                : 'linear-gradient(135deg, #FE9F14 0%, #EA580C 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              width: '100%'
            }}
          >
            {isConnecting ? '🔄 Connecting...' : '🦊 Connect MetaMask'}
          </button>
          
          {/* Help Text */}
          <div style={{
            background: 'rgba(107, 114, 128, 0.1)',
            borderRadius: '6px',
            padding: '0.75rem',
            marginTop: '1rem'
          }}>
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
              📋 Setup Instructions:
            </p>
            <ol style={{ color: '#9ca3af', fontSize: '12px', margin: '0', paddingLeft: '1rem' }}>
              <li>Install MetaMask browser extension</li>
              <li>Create a new wallet or import existing</li>
              <li>Add localhost network (Chain ID: 31337)</li>
              <li>Click "Connect MetaMask" above</li>
            </ol>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ 
            background: 'rgba(34, 197, 94, 0.1)', 
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <span style={{ color: '#22c55e' }}>✅</span>
              <span style={{ color: 'white', fontWeight: '600' }}>Wallet Connected</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0' }}>
              <strong>Address:</strong> {formatAddress(account || '')}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0' }}>
              <strong>Network:</strong> {network} (Chain ID: {chainId})
            </p>
          </div>
          
          {/* Connection Status */}
          {connectionStep && (
            <div style={{
              background: 'rgba(254, 159, 20, 0.1)',
              border: '1px solid rgba(254, 159, 20, 0.3)',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1rem'
            }}>
              <p style={{ color: '#fe9f14', fontSize: '14px', margin: '0' }}>
                🔄 {connectionStep}
              </p>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={disconnectWallet}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer',
                fontSize: '14px',
                flex: 1
              }}
            >
              Disconnect
            </button>
            
            {chainId !== 31337 && (
              <button
                onClick={handleSwitchNetwork}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  flex: 1
                }}
              >
                Switch to Localhost
              </button>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <p style={{ color: '#ef4444', fontSize: '14px', margin: '0' }}>
            ❌ {error}
          </p>
        </div>
      )}
    </div>
  );
}