/**
 * Accounting Types
 * Comprehensive types for accounting features
 * 
 * Note: Core types (Account, Transaction, JournalEntry, AccountBalance, DashboardStats)
 * are imported from shared/types/laravel to avoid duplicates
 */

// Re-export core types from laravel types for convenience
export type { Account as BaseAccount, Transaction as BaseTransaction, JournalEntry as BaseJournalEntry, AccountBalance, DashboardStats } from '@/shared/types/laravel';

// Extended types with legacy compatibility fields
export interface Account extends BaseAccount {
    balance: number; // Legacy compatibility
}

export interface Transaction extends BaseTransaction {
    date: string; // Legacy compatibility
    amount: number; // Legacy compatibility
    account_id?: number; // Legacy compatibility
    account?: Account; // Legacy compatibility
}

export interface JournalEntry extends BaseJournalEntry {
    date?: string; // Legacy compatibility
    total_debit?: number; // Legacy compatibility
    total_credit?: number; // Legacy compatibility
    transactions?: Transaction[]; // Legacy compatibility
}

// Legacy compatibility types
export interface TrialBalanceItem {
    account: Account;
    debit: number;
    credit: number;
}

export interface BalanceSheetItem {
    account: Account;
    amount: number;
    children?: BalanceSheetItem[];
}

export interface IncomeStatementItem {
    account: Account;
    amount: number;
    children?: IncomeStatementItem[];
}

export type AccountType = 
    | 'asset'
    | 'liability'
    | 'equity'
    | 'revenue'
    | 'expense';

export interface AccountingFilters {
    account_type?: AccountType;
    date_from?: string;
    date_to?: string;
    search?: string;
}
