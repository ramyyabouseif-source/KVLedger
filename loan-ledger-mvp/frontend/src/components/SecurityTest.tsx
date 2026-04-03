'use client';

import { useState } from 'react';
import {
  validateAndSanitizeInput,
  validateEmail,
  validateEthereumAddress,
  validateLoanAmount,
  generateCSRFToken,
  validateCSRFToken,
  checkRateLimit,
  secureSetItem,
  secureGetItem,
  secureRemoveItem,
  sanitizeError,
  generateSecureRandom,
  isNotEmpty,
  truncateText,
  validateFileUpload,
  validateUrl,
  generateSecureSessionToken,
  validateSessionToken
} from '../utils/security';

export default function SecurityTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testInput, setTestInput] = useState('');

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runAllTests = () => {
    setTestResults([]);
    addResult('🚀 Starting Security Tests...');

    // Test 1: Input Validation & Sanitization
    addResult('📝 Testing Input Validation...');
    
    const maliciousInput = '<script>alert("hack!")</script>Hello World';
    const result1 = validateAndSanitizeInput(maliciousInput);
    addResult(`✅ XSS Prevention: "${maliciousInput}" → "${result1.sanitizedValue}"`);
    
    const longInput = 'a'.repeat(1500);
    const result2 = validateAndSanitizeInput(longInput, 100);
    addResult(`✅ Length Validation: Input truncated from ${longInput.length} to ${result2.sanitizedValue.length} chars`);

    // Test 2: Email Validation
    addResult('📧 Testing Email Validation...');
    
    const validEmail = 'user@example.com';
    const invalidEmail = 'not-an-email';
    const emailResult1 = validateEmail(validEmail);
    const emailResult2 = validateEmail(invalidEmail);
    addResult(`✅ Valid Email: "${validEmail}" → ${emailResult1.isValid ? 'VALID' : 'INVALID'}`);
    addResult(`✅ Invalid Email: "${invalidEmail}" → ${emailResult2.isValid ? 'VALID' : 'INVALID'}`);

    // Test 3: Ethereum Address Validation
    addResult('⛓️ Testing Ethereum Address Validation...');
    
    const validAddress = '0x742d35Cc6634C0532925a3b8D7b1C8b4E6C8E4C4';
    const invalidAddress = 'not-an-address';
    const ethResult1 = validateEthereumAddress(validAddress);
    const ethResult2 = validateEthereumAddress(invalidAddress);
    addResult(`✅ Valid ETH Address: ${ethResult1.isValid ? 'VALID' : 'INVALID'}`);
    addResult(`✅ Invalid ETH Address: ${ethResult2.isValid ? 'VALID' : 'INVALID'}`);

    // Test 4: Loan Amount Validation
    addResult('💰 Testing Loan Amount Validation...');
    
    const validAmount = '500';
    const invalidAmount = '-100';
    const amountResult1 = validateLoanAmount(validAmount);
    const amountResult2 = validateLoanAmount(invalidAmount);
    addResult(`✅ Valid Amount: "${validAmount}" → ${amountResult1.isValid ? 'VALID' : 'INVALID'}`);
    addResult(`✅ Invalid Amount: "${invalidAmount}" → ${amountResult2.isValid ? 'VALID' : 'INVALID'}`);

    // Test 5: CSRF Protection
    addResult('🔐 Testing CSRF Protection...');
    
    const token = generateCSRFToken();
    const isValidToken = validateCSRFToken(token);
    const isInvalidToken = validateCSRFToken('fake-token');
    addResult(`✅ CSRF Token Generation: ${token.substring(0, 8)}...`);
    addResult(`✅ Valid Token Check: ${isValidToken ? 'VALID' : 'INVALID'}`);
    addResult(`✅ Invalid Token Check: ${isInvalidToken ? 'VALID' : 'INVALID'}`);

    // Test 6: Rate Limiting
    addResult('⏱️ Testing Rate Limiting...');
    
    const testId = 'test-user-123';
    const allowed1 = checkRateLimit(testId, 60000, 5);
    const allowed2 = checkRateLimit(testId, 60000, 5);
    const allowed3 = checkRateLimit(testId, 60000, 5);
    addResult(`✅ Rate Limit Test: Request 1: ${allowed1 ? 'ALLOWED' : 'BLOCKED'}`);
    addResult(`✅ Rate Limit Test: Request 2: ${allowed2 ? 'ALLOWED' : 'BLOCKED'}`);
    addResult(`✅ Rate Limit Test: Request 3: ${allowed3 ? 'ALLOWED' : 'BLOCKED'}`);

    // Test 7: Secure Storage
    addResult('🔒 Testing Secure Storage...');
    
    const testData = { userId: '123', wallet: '0x742d35Cc6634C0532925a3b8D7b1C8b4E6C8E4C4' };
    secureSetItem('test-data', testData);
    const retrievedData = secureGetItem('test-data');
    addResult(`✅ Secure Storage: Data stored and retrieved: ${JSON.stringify(retrievedData)}`);
    secureRemoveItem('test-data');

    // Test 8: Error Sanitization
    addResult('🚨 Testing Error Sanitization...');
    
    const dangerousError = '<script>alert("hack!")</script>Database error';
    const sanitizedError = sanitizeError(dangerousError);
    addResult(`✅ Error Sanitization: "${dangerousError}" → "${sanitizedError}"`);

    // Test 9: Utility Functions
    addResult('🔧 Testing Utility Functions...');
    
    const randomString = generateSecureRandom(16);
    const notEmptyTest = isNotEmpty('  hello  ');
    const emptyTest = isNotEmpty('');
    const truncatedText = truncateText('This is a very long text that should be truncated', 20);
    
    addResult(`✅ Random String: ${randomString}`);
    addResult(`✅ Not Empty Test: "${notEmptyTest ? 'PASS' : 'FAIL'}"`);
    addResult(`✅ Empty Test: "${emptyTest ? 'FAIL' : 'PASS'}"`);
    addResult(`✅ Text Truncation: "${truncatedText}"`);

    // Test 10: File Upload Security
    addResult('📁 Testing File Upload Security...');
    
    const validFile = validateFileUpload('document.pdf', 1024000);
    const invalidFile = validateFileUpload('malware.exe', 1024000);
    const pathTraversalFile = validateFileUpload('../../../etc/passwd', 1024);
    
    addResult(`✅ Valid File: "${validFile.isValid ? 'VALID' : 'INVALID'}"`);
    addResult(`✅ Invalid File: "${invalidFile.isValid ? 'VALID' : 'INVALID'}"`);
    addResult(`✅ Path Traversal File: "${pathTraversalFile.isValid ? 'VALID' : 'INVALID'}"`);

    // Test 11: URL Security
    addResult('🔗 Testing URL Security...');
    
    const validUrl = validateUrl('https://example.com');
    const dangerousUrl = validateUrl('javascript:alert("xss")');
    const invalidUrl = validateUrl('not-a-url');
    
    addResult(`✅ Valid URL: "${validUrl.isValid ? 'VALID' : 'INVALID'}"`);
    addResult(`✅ Dangerous URL: "${dangerousUrl.isValid ? 'VALID' : 'INVALID'}"`);
    addResult(`✅ Invalid URL: "${invalidUrl.isValid ? 'VALID' : 'INVALID'}"`);

    // Test 12: Session Token Security
    addResult('🎫 Testing Session Token Security...');
    
    const userId = 'user123';
    const sessionToken = generateSecureSessionToken(userId);
    const validToken = validateSessionToken(sessionToken);
    const invalidToken = validateSessionToken('fake-token');
    
    addResult(`✅ Session Token Generated: ${sessionToken.substring(0, 20)}...`);
    addResult(`✅ Valid Token: "${validToken.isValid ? 'VALID' : 'INVALID'}"`);
    addResult(`✅ Invalid Token: "${invalidToken.isValid ? 'VALID' : 'INVALID'}"`);

    addResult('🎉 All Security Tests Completed!');
  };

  const testCustomInput = () => {
    if (!testInput.trim()) {
      addResult('❌ Please enter some text to test');
      return;
    }

    const result = validateAndSanitizeInput(testInput);
    addResult(`🧪 Custom Input Test: "${testInput}" → "${result.sanitizedValue}"`);
    addResult(`🧪 Validation Result: ${result.isValid ? 'VALID' : 'INVALID'}`);
    if (result.errors.length > 0) {
      addResult(`🧪 Errors: ${result.errors.join(', ')}`);
    }
  };

  return (
    <div style={{
      padding: '2rem',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      margin: '2rem',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h2 style={{
        color: 'white',
        fontSize: '2rem',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        🛡️ Security Features Test
      </h2>
      
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        justifyContent: 'center'
      }}>
        <button
          onClick={runAllTests}
          style={{
            background: 'linear-gradient(135deg, #FE9F14 0%, #EA580C 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🚀 Run All Tests
        </button>
        
        <button
          onClick={() => setTestResults([])}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🗑️ Clear Results
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="Enter text to test security validation..."
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '14px'
          }}
        />
        <button
          onClick={testCustomInput}
          style={{
            background: 'linear-gradient(135deg, #214F96 0%, #1D4ED8 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🧪 Test Input
        </button>
      </div>

      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        padding: '1rem',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Test Results:</h3>
        {testResults.length === 0 ? (
          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
            Click &quot;Run All Tests&quot; to see security features in action!
          </p>
        ) : (
          testResults.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '0.5rem',
                marginBottom: '0.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#e2e8f0',
                fontFamily: 'monospace'
              }}
            >
              {result}
            </div>
          ))
        )}
      </div>
    </div>
  );
}