/**
 * @deprecated Use @/features/[feature]/pages instead
 * 
 * Legacy re-exports for backward compatibility.
 * This file maintains compatibility with existing imports while encouraging
 * migration to the new feature-based structure.
 */

// Auth pages
export { Login, Register, TenantSelect } from '@/features/auth/pages';

// Accounting pages
export { 
    AccountsIndex, 
    AccountsCreate, 
    AccountsShow,
    TransactionsIndex,
    JournalEntriesIndex 
} from '@/features/accounting/pages';

// Dashboard pages
export { Dashboard } from '@/features/dashboard/pages';
