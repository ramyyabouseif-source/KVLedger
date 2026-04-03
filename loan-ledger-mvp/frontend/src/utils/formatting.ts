import { getStatusColor, getAmountColor } from './theme';

/**
 * Format currency amount from cents to dollar string
 * @param cents - Amount in cents
 * @returns Formatted currency string
 */
export const formatCurrency = (cents: number): string => {
  if (typeof cents !== 'number' || isNaN(cents)) {
    return '$0.00';
  }
  
  // Handle negative values
  const isNegative = cents < 0;
  const absoluteCents = Math.abs(cents);
  
  const formatted = `$${(absoluteCents / 100).toFixed(2)}`;
  return isNegative ? `-${formatted}` : formatted;
};

/**
 * Format Ethereum address for display
 * @param address - Full Ethereum address
 * @returns Truncated address for display
 */
export const formatAddress = (address: string): string => {
  if (!address || typeof address !== 'string' || address.length < 10) {
    return 'Invalid Address';
  }
  
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format timestamp to readable date string
 * @param timestamp - Unix timestamp (seconds or milliseconds)
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number): string => {
  if (!timestamp || typeof timestamp !== 'number' || isNaN(timestamp)) {
    return 'Invalid Date';
  }
  
  // Handle both seconds and milliseconds timestamps
  const date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format loan status number to readable string
 * @param status - Status number
 * @returns Human-readable status string
 */
export const formatStatus = (status: number): string => {
  const statusMap = {
    0: 'Pending',
    1: 'Active',
    2: 'Defaulted',
    3: 'Completed',
  };
  
  if (typeof status !== 'number' || isNaN(status)) {
    return 'Unknown';
  }
  
  return statusMap[status as keyof typeof statusMap] || 'Unknown';
};

/**
 * Format status with color styling
 * @param status - Status number
 * @returns Object with text and CSS class name
 */
export const formatStatusWithColor = (status: number): { text: string; className: string } => {
  try {
    return {
      text: formatStatus(status),
      className: getStatusColor(status),
    };
  } catch (error) {
    console.error('Error formatting status with color:', error);
    return {
      text: 'Unknown',
      className: 'text-gray-500',
    };
  }
};

/**
 * Format amount with color styling
 * @param cents - Amount in cents
 * @returns Object with text and CSS class name
 */
export const formatAmountWithColor = (cents: number): { text: string; className: string } => {
  try {
    return {
      text: formatCurrency(cents),
      className: getAmountColor(cents),
    };
  } catch (error) {
    console.error('Error formatting amount with color:', error);
    return {
      text: '$0.00',
      className: 'text-gray-500',
    };
  }
};

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 * @param num - Number to format
 * @returns Formatted number string
 */
export const formatLargeNumber = (num: number): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1e9) {
    return `${sign}${(absNum / 1e9).toFixed(1)}B`;
  } else if (absNum >= 1e6) {
    return `${sign}${(absNum / 1e6).toFixed(1)}M`;
  } else if (absNum >= 1e3) {
    return `${sign}${(absNum / 1e3).toFixed(1)}K`;
  }
  
  return num.toString();
};