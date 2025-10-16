/**
 * Features Module Index
 * Centralized exports for all feature modules
 */

// Accounting Feature
export * from './accounting/services/accounts/accountService';
export * from './accounting/services/transactions/transactionService';
export * from './accounting/services/reports/reportService';
export * from './accounting/services/accountingApiAlova';

// Purchase Feature
export * from './purchase';
export * from './purchase/types';

// Business Operations Feature
export * from './businessOperations';
export * from './businessOperations/types';

// Feature Constants
export const FEATURE_CONSTANTS = {
  // Accounting
  ACCOUNT_TYPES: ['asset', 'liability', 'equity', 'revenue', 'expense'] as const,
  TRANSACTION_TYPES: ['debit', 'credit'] as const,
  REPORT_TYPES: ['balance_sheet', 'income_statement', 'cash_flow', 'trial_balance', 'custom'] as const,
  
  // Purchase
  PURCHASE_ORDER_STATUSES: ['draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled'] as const,
  VENDOR_TYPES: ['supplier', 'contractor', 'service_provider'] as const,
  
  // Business Operations
  PROCESS_CATEGORIES: ['finance', 'hr', 'operations', 'sales', 'marketing', 'compliance', 'custom'] as const,
  PROCESS_STATUSES: ['draft', 'active', 'inactive', 'deprecated', 'archived'] as const,
  WORKFLOW_STEP_TYPES: ['manual', 'automated', 'approval', 'notification', 'integration', 'decision', 'parallel', 'loop'] as const,
  INSTANCE_STATUSES: ['pending', 'in_progress', 'waiting_approval', 'on_hold', 'completed', 'cancelled', 'failed'] as const,
  PRIORITIES: ['low', 'medium', 'high', 'urgent'] as const
};

// Feature Type Guards
export const FeatureTypeGuards = {
  /**
   * Check if value is a valid account type
   */
  isAccountType: (value: any): value is typeof FEATURE_CONSTANTS.ACCOUNT_TYPES[number] => {
    return FEATURE_CONSTANTS.ACCOUNT_TYPES.includes(value);
  },
  
  /**
   * Check if value is a valid transaction type
   */
  isTransactionType: (value: any): value is typeof FEATURE_CONSTANTS.TRANSACTION_TYPES[number] => {
    return FEATURE_CONSTANTS.TRANSACTION_TYPES.includes(value);
  },
  
  /**
   * Check if value is a valid report type
   */
  isReportType: (value: any): value is typeof FEATURE_CONSTANTS.REPORT_TYPES[number] => {
    return FEATURE_CONSTANTS.REPORT_TYPES.includes(value);
  },
  
  /**
   * Check if value is a valid purchase order status
   */
  isPurchaseOrderStatus: (value: any): value is typeof FEATURE_CONSTANTS.PURCHASE_ORDER_STATUSES[number] => {
    return FEATURE_CONSTANTS.PURCHASE_ORDER_STATUSES.includes(value);
  },
  
  /**
   * Check if value is a valid process category
   */
  isProcessCategory: (value: any): value is typeof FEATURE_CONSTANTS.PROCESS_CATEGORIES[number] => {
    return FEATURE_CONSTANTS.PROCESS_CATEGORIES.includes(value);
  },
  
  /**
   * Check if value is a valid priority
   */
  isPriority: (value: any): value is typeof FEATURE_CONSTANTS.PRIORITIES[number] => {
    return FEATURE_CONSTANTS.PRIORITIES.includes(value);
  }
};

// Feature Utilities
export const FeatureUtils = {
  /**
   * Get account type display name
   */
  getAccountTypeDisplayName: (type: string) => {
    const displayNames: Record<string, string> = {
      asset: 'Asset',
      liability: 'Liability',
      equity: 'Equity',
      revenue: 'Revenue',
      expense: 'Expense'
    };
    return displayNames[type] || type;
  },
  
  /**
   * Get transaction type display name
   */
  getTransactionTypeDisplayName: (type: string) => {
    const displayNames: Record<string, string> = {
      debit: 'Debit',
      credit: 'Credit'
    };
    return displayNames[type] || type;
  },
  
  /**
   * Get status color class
   */
  getStatusColorClass: (status: string, type: 'purchase' | 'process' | 'instance' = 'purchase') => {
    const colorMaps = {
      purchase: {
        draft: 'bg-gray-100 text-gray-800',
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        completed: 'bg-blue-100 text-blue-800',
        cancelled: 'bg-gray-100 text-gray-800'
      },
      process: {
        draft: 'bg-gray-100 text-gray-800',
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-yellow-100 text-yellow-800',
        deprecated: 'bg-orange-100 text-orange-800',
        archived: 'bg-gray-100 text-gray-800'
      },
      instance: {
        pending: 'bg-yellow-100 text-yellow-800',
        in_progress: 'bg-blue-100 text-blue-800',
        waiting_approval: 'bg-purple-100 text-purple-800',
        on_hold: 'bg-orange-100 text-orange-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-gray-100 text-gray-800',
        failed: 'bg-red-100 text-red-800'
      }
    };
    
    return colorMaps[type][status] || 'bg-gray-100 text-gray-800';
  },
  
  /**
   * Get priority color class
   */
  getPriorityColorClass: (priority: string) => {
    const colorMap: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colorMap[priority] || 'bg-gray-100 text-gray-800';
  },
  
  /**
   * Format account code
   */
  formatAccountCode: (code: string, type?: string) => {
    // Add type prefix if provided
    if (type) {
      const prefixes: Record<string, string> = {
        asset: '1',
        liability: '2',
        equity: '3',
        revenue: '4',
        expense: '5'
      };
      const prefix = prefixes[type];
      if (prefix && !code.startsWith(prefix)) {
        return `${prefix}${code.padStart(3, '0')}`;
      }
    }
    return code;
  },
  
  /**
   * Calculate financial ratio
   */
  calculateRatio: (numerator: number, denominator: number, decimals: number = 2) => {
    if (denominator === 0) return 0;
    return Number((numerator / denominator).toFixed(decimals));
  },
  
  /**
   * Format business process name
   */
  formatProcessName: (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
};

