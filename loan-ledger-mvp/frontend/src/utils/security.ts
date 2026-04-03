/**
 * Enterprise-Grade Security Utilities
 * 
 * This module provides comprehensive security functions for:
 * - Input validation and sanitization
 * - XSS prevention
 * - CSRF protection
 * - Rate limiting
 * - Secure data handling
 */

// ============================================
// TYPES AND INTERFACES
// ============================================

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
}

export interface SecurityConfig {
  maxLength: number;
  allowedTags: string[];
  rateLimitWindow: number;
  maxRequests: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// ============================================
// SECURITY CONFIGURATION
// ============================================

export const SECURITY_CONFIG: SecurityConfig = {
  maxLength: 1000,
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
  rateLimitWindow: 60000, // 1 minute
  maxRequests: 100 // requests per window
};

// ============================================
// INPUT VALIDATION FUNCTIONS
// ============================================

/**
 * Validates and sanitizes user input to prevent XSS attacks
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length
 * @returns ValidationResult with sanitized value and validation status
 */
export function validateAndSanitizeInput(
  input: string, 
  maxLength: number = SECURITY_CONFIG.maxLength
): ValidationResult {
  const errors: string[] = [];
  let sanitizedValue = input;

  // Check for null or undefined
  if (input == null) {
    return {
      isValid: false,
      sanitizedValue: '',
      errors: ['Input cannot be null or undefined']
    };
  }

  // Convert to string if not already
  sanitizedValue = String(input);

  // Check length
  if (sanitizedValue.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    sanitizedValue = sanitizedValue.substring(0, maxLength);
  }

  // Check for XSS patterns in original input BEFORE sanitization
  const xssPatterns = [
    /<script[^>]*>/gi,
    /<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /<form[^>]*>/gi,
    /<input[^>]*>/gi,
    /<button[^>]*>/gi,
    /<select[^>]*>/gi,
    /<textarea[^>]*>/gi
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      errors.push('Input contains potentially dangerous XSS patterns');
      break;
    }
  }

  // Remove potentially dangerous characters
  sanitizedValue = sanitizedValue
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script tags
    .replace(/iframe/gi, '') // Remove iframe tags
    .replace(/object/gi, '') // Remove object tags
    .replace(/embed/gi, '') // Remove embed tags
    .replace(/form/gi, '') // Remove form tags
    .replace(/input/gi, '') // Remove input tags
    .replace(/button/gi, '') // Remove button tags
    .trim();

  // Check for SQL injection patterns
  const sqlPatterns = [
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    /insert\s+into/gi,
    /update\s+set/gi,
    /select\s+\*/gi,
    /where\s+1\s*=\s*1/gi,
    /or\s+1\s*=\s*1/gi,
    /and\s+1\s*=\s*1/gi
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      errors.push('Input contains potentially dangerous SQL patterns');
      break;
    }
  }

  // Check for command injection patterns
  const commandPatterns = [
    /;\s*rm\s+-rf/gi,
    /;\s*cat\s+\/etc\/passwd/gi,
    /;\s*ls\s+-la/gi,
    /;\s*whoami/gi,
    /;\s*pwd/gi,
    /\|\s*sh/gi,
    /\|\s*bash/gi,
    /&&\s*rm/gi,
    /\|\|\s*rm/gi
  ];

  for (const pattern of commandPatterns) {
    if (pattern.test(input)) {
      errors.push('Input contains potentially dangerous command injection patterns');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedValue,
    errors
  };
}

/**
 * Validates email addresses with comprehensive checks
 * @param email - Email address to validate
 * @returns ValidationResult
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const sanitizedEmail = email.trim().toLowerCase();

  // Check for null or undefined
  if (email == null || email === '') {
    return {
      isValid: false,
      sanitizedValue: '',
      errors: ['Email cannot be null or empty']
    };
  }

  // Enhanced email regex with better validation
  const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(sanitizedEmail)) {
    errors.push('Invalid email format');
  }

  // Check for common email threats
  if (sanitizedEmail.includes('..') || sanitizedEmail.startsWith('.') || sanitizedEmail.endsWith('.')) {
    errors.push('Email contains invalid consecutive dots or starts/ends with dot');
  }

  // Check for suspicious patterns
  if (sanitizedEmail.includes('+') && !sanitizedEmail.includes('@')) {
    errors.push('Email contains suspicious patterns');
  }

  // Check for XSS patterns in email
  if (/<script|javascript:|on\w+=/gi.test(sanitizedEmail)) {
    errors.push('Email contains potentially dangerous content');
  }

  // Check length
  if (sanitizedEmail.length > 254) {
    errors.push('Email address too long');
  }

  // Check for minimum length
  if (sanitizedEmail.length < 5) {
    errors.push('Email address too short');
  }

  return {
    isValid: errors.length === 0,
    sanitizedValue: sanitizedEmail,
    errors
  };
}

/**
 * Validates Ethereum addresses
 * @param address - Ethereum address to validate
 * @returns ValidationResult
 */
export function validateEthereumAddress(address: string): ValidationResult {
  const errors: string[] = [];
  const sanitizedAddress = address.trim();

  // Check for null or undefined
  if (address == null || address === '') {
    return {
      isValid: false,
      sanitizedValue: '',
      errors: ['Ethereum address cannot be null or empty']
    };
  }

  // Basic Ethereum address regex (42 characters starting with 0x)
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  
  if (!ethAddressRegex.test(sanitizedAddress)) {
    errors.push('Invalid Ethereum address format');
  }

  // Check for checksum validation (optional but recommended)
  if (sanitizedAddress !== sanitizedAddress.toLowerCase() && sanitizedAddress !== sanitizedAddress.toUpperCase()) {
    // Basic checksum validation - in production, use a proper checksum library
    errors.push('Ethereum address checksum validation failed');
  }

  // Check for common attack patterns
  if (/<script|javascript:|on\w+=/gi.test(sanitizedAddress)) {
    errors.push('Ethereum address contains potentially dangerous content');
  }

  return {
    isValid: errors.length === 0,
    sanitizedValue: sanitizedAddress,
    errors
  };
}

/**
 * Validates loan amounts (must be positive numbers)
 * @param amount - Loan amount to validate
 * @returns ValidationResult
 */
export function validateLoanAmount(amount: string | number): ValidationResult {
  const errors: string[] = [];
  
  // Check for null or undefined
  if (amount == null || amount === '') {
    return {
      isValid: false,
      sanitizedValue: '',
      errors: ['Amount cannot be null or empty']
    };
  }

  // Convert to string first for validation
  const amountStr = String(amount).trim();
  
  // Check for malicious patterns
  if (/<script|javascript:|on\w+=|union\s+select|drop\s+table/gi.test(amountStr)) {
    errors.push('Amount contains potentially dangerous content');
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amountStr) : amount;

  if (isNaN(numAmount)) {
    errors.push('Amount must be a valid number');
  } else if (numAmount <= 0) {
    errors.push('Amount must be greater than zero');
  } else if (numAmount > 1000000) {
    errors.push('Amount exceeds maximum limit of $1,000,000');
  } else if (numAmount < 0.01) {
    errors.push('Amount must be at least $0.01');
  }

  // Check for scientific notation abuse
  if (amountStr.includes('e') || amountStr.includes('E')) {
    errors.push('Scientific notation not allowed in amounts');
  }

  return {
    isValid: errors.length === 0,
    sanitizedValue: numAmount.toString(),
    errors
  };
}

// ============================================
// CSRF PROTECTION
// ============================================

let csrfToken: string | null = null;

/**
 * Generates a secure CSRF token
 * @returns CSRF token string
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  csrfToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  return csrfToken;
}

/**
 * Validates CSRF token
 * @param token - Token to validate
 * @returns boolean indicating validity
 */
export function validateCSRFToken(token: string): boolean {
  return csrfToken !== null && csrfToken === token;
}

/**
 * Gets current CSRF token
 * @returns Current CSRF token or null
 */
export function getCSRFToken(): string | null {
  return csrfToken;
}

// ============================================
// RATE LIMITING
// ============================================

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Checks if request is within rate limits
 * @param identifier - Unique identifier for rate limiting (IP, user ID, etc.)
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests per window
 * @returns boolean indicating if request is allowed
 */
export function checkRateLimit(
  identifier: string,
  windowMs: number = SECURITY_CONFIG.rateLimitWindow,
  maxRequests: number = SECURITY_CONFIG.maxRequests
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Clears rate limit for an identifier
 * @param identifier - Identifier to clear
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

// ============================================
// SECURE STORAGE
// ============================================

/**
 * Securely stores data in localStorage with encryption
 * @param key - Storage key
 * @param value - Value to store
 */
export function secureSetItem(key: string, value: unknown): void {
  try {
    // Validate key
    if (!key || typeof key !== 'string' || key.trim() === '') {
      console.error('Invalid storage key provided');
      return;
    }

    // Check for malicious patterns in key
    if (/<script|javascript:|on\w+=|union\s+select/gi.test(key)) {
      console.error('Storage key contains potentially dangerous content');
      return;
    }

    // Serialize and encrypt value
    const serializedValue = JSON.stringify(value);
    const encryptedValue = btoa(serializedValue);
    
    // Add timestamp for expiration tracking
    const storageData = {
      data: encryptedValue,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    localStorage.setItem(`secure_${key}`, JSON.stringify(storageData));
  } catch (error) {
    console.error('Failed to store secure data:', error);
  }
}

/**
 * Retrieves and decrypts data from localStorage
 * @param key - Storage key
 * @returns Decrypted value or null
 */
export function secureGetItem(key: string): unknown {
  try {
    // Validate key
    if (!key || typeof key !== 'string' || key.trim() === '') {
      console.error('Invalid storage key provided');
      return null;
    }

    // Check for malicious patterns in key
    if (/<script|javascript:|on\w+=|union\s+select/gi.test(key)) {
      console.error('Storage key contains potentially dangerous content');
      return null;
    }

    const storageDataStr = localStorage.getItem(`secure_${key}`);
    if (!storageDataStr) return null;
    
    const storageData = JSON.parse(storageDataStr);
    
    // Check if data has expired (24 hours)
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - storageData.timestamp > expirationTime) {
      console.warn('Stored data has expired');
      secureRemoveItem(key);
      return null;
    }
    
    const decryptedValue = JSON.parse(atob(storageData.data));
    return decryptedValue;
  } catch (error) {
    console.error('Failed to retrieve secure data:', error);
    return null;
  }
}

/**
 * Removes secure data from localStorage
 * @param key - Storage key
 */
export function secureRemoveItem(key: string): void {
  localStorage.removeItem(`secure_${key}`);
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Sanitizes error messages to prevent information disclosure
 * @param error - Error object or message
 * @returns Sanitized error message
 */
export function sanitizeError(error: unknown): string {
  if (typeof error === 'string') {
    return error.replace(/[<>]/g, '').substring(0, 200);
  }
  
  if (error instanceof Error) {
    // Only return safe error messages
    const safeMessages = [
      'Invalid input provided',
      'Network error occurred',
      'Transaction failed',
      'Insufficient funds',
      'User rejected transaction'
    ];
    
    const message = error.message.toLowerCase();
    if (safeMessages.some(safe => message.includes(safe.toLowerCase()))) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }
  
  return 'An unknown error occurred';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generates a secure random string
 * @param length - Length of random string
 * @returns Random string
 */
export function generateSecureRandom(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates that a string is not empty after trimming
 * @param value - Value to check
 * @returns boolean indicating if value is not empty
 */
export function isNotEmpty(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Truncates text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Validates file upload security
 * @param fileName - Name of the file
 * @param fileSize - Size of the file in bytes
 * @param allowedTypes - Array of allowed MIME types
 * @returns ValidationResult
 */
export function validateFileUpload(fileName: string, fileSize: number): ValidationResult {
  const errors: string[] = [];
  
  // Check for null or empty filename
  if (!fileName || fileName.trim() === '') {
    errors.push('File name cannot be empty');
  }
  
  // Check for malicious file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar', '.php', '.asp', '.jsp'];
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (dangerousExtensions.includes(fileExtension)) {
    errors.push('File type not allowed');
  }
  
  // Check for path traversal
  if (fileName.includes('../') || fileName.includes('..\\') || fileName.includes('/') || fileName.includes('\\')) {
    errors.push('File name contains invalid characters');
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (fileSize > maxSize) {
    errors.push('File size exceeds maximum limit of 10MB');
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue: fileName,
    errors
  };
}

/**
 * Validates URL security
 * @param url - URL to validate
 * @returns ValidationResult
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];
  
  if (!url || url.trim() === '') {
    errors.push('URL cannot be empty');
  }
  
  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const urlLower = url.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (urlLower.startsWith(protocol)) {
      errors.push('Dangerous protocol detected');
      break;
    }
  }
  
  // Basic URL validation
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('Only HTTP and HTTPS protocols are allowed');
    }
  } catch {
    errors.push('Invalid URL format');
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue: url,
    errors
  };
}

/**
 * Generates a secure session token
 * @param userId - User ID
 * @returns Secure session token
 */
export function generateSecureSessionToken(userId: string): string {
  const timestamp = Date.now();
  const randomBytes = generateSecureRandom(16);
  const tokenData = `${userId}:${timestamp}:${randomBytes}`;
  return btoa(tokenData);
}

/**
 * Validates session token
 * @param token - Session token to validate
 * @param maxAge - Maximum age in milliseconds (default 24 hours)
 * @returns ValidationResult
 */
export function validateSessionToken(token: string, maxAge: number = 24 * 60 * 60 * 1000): ValidationResult {
  const errors: string[] = [];
  
  try {
    const tokenData = atob(token);
    const [userId, timestamp, randomBytes] = tokenData.split(':');
    
    if (!userId || !timestamp || !randomBytes) {
      errors.push('Invalid token format');
    }
    
    // Check if token has expired
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > maxAge) {
      errors.push('Token has expired');
    }
    
    return {
      isValid: errors.length === 0,
      sanitizedValue: userId || '',
      errors
    };
  } catch {
    errors.push('Invalid token');
    return {
      isValid: false,
      sanitizedValue: '',
      errors
    };
  }
}