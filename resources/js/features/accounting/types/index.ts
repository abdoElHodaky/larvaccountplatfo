/**
 * Accounting Types
 * Comprehensive types for accounting features
 * 
 * Note: Core types (Account, Transaction, JournalEntry, AccountBalance, DashboardStats)
 * are imported from shared/types/laravel to avoid duplicates
 */

// Re-export core types from laravel types
export type { Account, Transaction, JournalEntry, AccountBalance, DashboardStats } from '@/shared/types/laravel';

// Extended types with legacy compatibility fields
export interface AccountWithBalance extends Account {
    balance: number; // Legacy compatibility
}

export interface TransactionWithLegacy extends Transaction {
    date: string; // Legacy compatibility
    amount: number; // Legacy compatibility
    account_id?: number; // Legacy compatibility
    account?: AccountWithBalance; // Legacy compatibility
}

export interface JournalEntryWithLegacy extends JournalEntry {
    date?: string; // Legacy compatibility
    total_debit?: number; // Legacy compatibility
    total_credit?: number; // Legacy compatibility
    transactions?: TransactionWithLegacy[]; // Legacy compatibility
}

// Legacy compatibility types
export interface TrialBalanceItem {
    account: AccountWithBalance;
    debit: number;
    credit: number;
}

export interface BalanceSheetItem {
    account: AccountWithBalance;
    amount: number;
    children?: BalanceSheetItem[];
}

export interface IncomeStatementItem {
    account: AccountWithBalance;
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
