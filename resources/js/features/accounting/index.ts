/**
 * Accounting Feature Module
 * Barrel exports for the accounting feature with lazy loading support
 */

// Store exports
export { accountingModel } from './stores/accountingModel';
export type { 
  AccountingModel, 
  AccountingState, 
  Account, 
  Transaction, 
  JournalEntry, 
  Filters 
} from './stores/accountingModel';

// API exports
export { accountingApi } from './services/accountingApi';
export type { ApiResponse, PaginatedResponse } from './services/accountingApi';

// Hook exports
export {
  useAccounting,
  useAccounts,
  useTransactions,
  useJournalEntries,
  useFilters,
  useAccountingStats,
  useAccountingLoading,
  useAccountingError,
} from './hooks/useAccounting';

// Lazy component exports
export {
  ChartOfAccounts,
  TransactionList,
  TransactionForm,
  JournalEntries,
  BalanceSheet,
  AccountsPage,
  TransactionsPage,
  JournalEntriesPage,
} from '../../shared/utils/lazyComponents';

// Feature metadata
export const accountingFeature = {
  name: 'accounting',
  version: '1.0.0',
  description: 'Comprehensive accounting management with Rematch and React.lazy',
  
  // Lazy loading configuration
  lazyComponents: [
    'ChartOfAccounts',
    'TransactionList',
    'TransactionForm',
    'JournalEntries',
    'BalanceSheet',
    'AccountsPage',
    'TransactionsPage',
    'JournalEntriesPage',
  ],
  
  // Store configuration
  storeModel: 'accounting',
  
  // API endpoints
  apiEndpoints: [
    'accounts',
    'transactions',
    'journal-entries',
  ],
  
  // Permissions required
  permissions: [
    'view_accounts',
    'create_accounts',
    'edit_accounts',
    'delete_accounts',
    'view_transactions',
    'create_transactions',
    'edit_transactions',
    'view_journal_entries',
    'create_journal_entries',
    'edit_journal_entries',
  ],
  
  // Routes
  routes: [
    '/accounting',
    '/accounting/accounts',
    '/accounting/transactions',
    '/accounting/journal-entries',
  ],
};

// Feature initialization
export const initializeAccountingFeature = async () => {
  // This could be used to preload critical components or initialize data
  console.log('Initializing accounting feature...');
  
  // Preload critical components if needed
  // await import('./components/organisms/ChartOfAccounts');
  
  return accountingFeature;
};

export default {
  ...accountingFeature,
  initialize: initializeAccountingFeature,
};
