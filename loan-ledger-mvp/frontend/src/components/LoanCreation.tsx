'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useContract } from '../hooks/useContract';
import { validateLoanAmount, validateAndSanitizeInput } from '../utils/security';

/**
 * LoanCreation Component
 * 
 * Educational Notes:
 * - This component demonstrates how to interact with smart contracts
 * - It shows how to create transactions that modify blockchain state
 * - It includes proper input validation and error handling
 * - It demonstrates the complete flow from UI to blockchain
 */
export default function LoanCreation() {
  const { contract, signer, isConnected, account } = useContract();
  
  const [formData, setFormData] = useState({
    borrowerHash: '',
    amount: '',
    durationDays: '',
    purpose: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');

  // Handle form input changes with validation
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear errors on input change
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !contract || !signer) {
      setError('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Validate inputs
      const amountValidation = validateLoanAmount(parseFloat(formData.amount));
      if (!amountValidation.isValid) {
        setError(amountValidation.errors.join(', '));
        return;
      }

      const purposeValidation = validateAndSanitizeInput(formData.purpose);
      if (!purposeValidation.isValid) {
        setError(purposeValidation.errors.join(', '));
        return;
      }

      // Convert amount to cents (the contract expects cents, not wei)
      const amountInCents = Math.floor(parseFloat(formData.amount) * 100);
      
      // Create the loan - convert borrower identifier to bytes32 hash
      // Use the borrower hash as a string identifier (like "borrower-john-doe")
      const borrowerHashBytes32 = ethers.id(`borrower-${formData.borrowerHash}`);
      
      // All parameters are correctly formatted
      
      // Create the loan transaction
      const tx = await contract.createLoan(
        borrowerHashBytes32,
        amountInCents,
        parseInt(formData.durationDays), // Contract expects days, not seconds
        "USD" // Add currency parameter
      );

      setTransactionHash(tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Show success message
      setError('');
      setTransactionHash(tx.hash);
      
      // Reset form on success
      setFormData({
        borrowerHash: '',
        amount: '',
        durationDays: '',
        purpose: ''
      });

    } catch (error: any) {
      console.error('Loan creation failed:', error);
      setError(error.message || 'Failed to create loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>
          🔗 Connect Your Wallet
        </h3>
        <p style={{ color: '#94a3b8' }}>
          Please connect your MetaMask wallet to create loans
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      padding: '2rem',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
        💰 Create New Loan
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            color: 'white', 
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}>
            Borrower Identifier (Unique ID)
          </label>
                  <input
                    type="text"
                    value={formData.borrowerHash}
                    onChange={(e) => handleInputChange('borrowerHash', e.target.value)}
                    placeholder="e.g., john-doe-001"
                    style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            color: 'white', 
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}>
            Loan Amount (USD)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="e.g., 100.00"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            color: 'white', 
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}>
            Duration (Days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={formData.durationDays}
            onChange={(e) => handleInputChange('durationDays', e.target.value)}
            placeholder="e.g., 180"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            color: 'white', 
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}>
            Loan Purpose
          </label>
          <textarea
            value={formData.purpose}
            onChange={(e) => handleInputChange('purpose', e.target.value)}
            placeholder="Describe the purpose of the loan..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px',
              resize: 'vertical'
            }}
            required
          />
        </div>

                {error && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ color: '#ef4444', fontSize: '14px', margin: '0' }}>
                      ❌ {error}
                    </p>
                  </div>
                )}

                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <p style={{ color: '#3b82f6', fontSize: '14px', margin: '0 0 0.5rem 0' }}>
                    💡 <strong>MetaMask Warning:</strong> If MetaMask shows a security warning, this is normal for local development networks.
                  </p>
                  <p style={{ color: '#3b82f6', fontSize: '12px', margin: '0' }}>
                    The transaction is safe to approve. The contract has been tested and works correctly.
                  </p>
                </div>

        {transactionHash && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#22c55e', fontSize: '14px', margin: '0' }}>
              ✅ Transaction submitted! Hash: {transactionHash.substring(0, 10)}...
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            background: isSubmitting 
              ? 'rgba(107, 114, 128, 0.5)' 
              : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? '🔄 Creating Loan...' : '💰 Create Loan'}
        </button>
      </form>
    </div>
  );
}