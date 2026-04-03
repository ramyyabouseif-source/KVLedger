/**
 * Comprehensive type definitions for the KVLedger application
 */

// ============================================
// LOAN TYPES
// ============================================

export interface Loan {
  id: number;
  borrowerHash: string;
  amountInCents: number;
  disbursedAt: number;
  dueDate: number;
  totalRepaid: number;
  status: LoanStatus;
  currency: string;
  durationDays: number;
}

export interface Repayment {
  amount: number;
  timestamp: number;
  notesHash: string;
}

export enum LoanStatus {
  PENDING = 0,
  ACTIVE = 1,
  DEFAULTED = 2,
  COMPLETED = 3,
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  address: string;
  role: UserRole;
  balance?: number;
  isVerified?: boolean;
  lastActive?: number;
}

export enum UserRole {
  DONOR = 'donor',
  BORROWER = 'borrower',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

// ============================================
// CONTRACT TYPES
// ============================================

export interface ContractConfig {
  address: string;
  networkId: number;
  rpcUrl: string;
  chainId: number;
  name: string;
  blockExplorer?: string;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// FORM TYPES
// ============================================

export interface CreateLoanForm {
  borrowerHash: string;
  amountInCents: number;
  durationDays: number;
  currency: string;
}

export interface RecordRepaymentForm {
  loanId: number;
  amountInCents: number;
  notes: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, record: T) => React.ReactNode;
}

// ============================================
// VALIDATION TYPES
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

// ============================================
// EVENT TYPES
// ============================================

export interface ContractEvent {
  name: string;
  args: unknown[];
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

export interface LoanCreatedEvent {
  name: 'LoanCreated';
  args: [
    number, // loanId
    string, // borrowerHash
    number, // amountInCents
    number, // dueDate
    string  // currency
  ];
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

// ============================================
// UTILITY TYPES
// ============================================

export type NetworkName = 'localhost' | 'sepolia' | 'mainnet';
export type ContractType = 'LoanRegistry' | 'LoanRegistryOptimized' | 'LoanRegistrySecure' | 'LoanRegistryUltraOptimized';
export type Currency = 'USD' | 'KES' | 'UGX' | 'EUR' | 'GBP';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FilterOptions {
  status?: LoanStatus[];
  currency?: Currency[];
  dateRange?: {
    start: number;
    end: number;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}