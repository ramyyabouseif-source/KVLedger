export const theme = {
  colors: {
    primary: '#214F96',
    secondary: '#FE9F14',
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  gradients: {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700',
    secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600',
    accent: 'bg-gradient-to-r from-accent-500 to-accent-600',
    success: 'bg-gradient-to-r from-success-500 to-success-600',
  },
  shadows: {
    primary: 'shadow-primary-500/25',
    secondary: 'shadow-secondary-500/25',
    accent: 'shadow-accent-500/25',
    success: 'shadow-success-500/25',
  },
} as const;

export const getStatusColor = (status: number) => {
  const statusColors = {
    0: 'text-warning-600 bg-warning-50 border-warning-200', // Pending
    1: 'text-primary-600 bg-primary-50 border-primary-200', // Active
    2: 'text-error-600 bg-error-50 border-error-200', // Defaulted
    3: 'text-success-600 bg-success-50 border-success-200', // Completed
  };
  return statusColors[status as keyof typeof statusColors] || 'text-gray-600 bg-gray-50 border-gray-200';
};

export const getAmountColor = (amount: number, threshold: number = 5000) => {
  if (amount >= threshold) return 'text-success-600';
  if (amount >= threshold * 0.5) return 'text-warning-600';
  return 'text-error-600';
};