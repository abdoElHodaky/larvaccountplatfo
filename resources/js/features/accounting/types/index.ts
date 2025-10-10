/**
 * Accounting Types
 * Comprehensive types for accounting features
 */

export interface Account {
    id: number;
    tenant_id: number;
    parent_id?: number;
    code: string;
    name: string;
    description?: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    subtype: string;
    normal_balance: 'debit' | 'credit';
    is_active: boolean;
    is_system: boolean;
    allow_manual_entries: boolean;
    currency: string;
    opening_balance: number;
    current_balance: number;
    balance: number; // Legacy compatibility
    tax_code?: string;
    reporting_categories?: string[];
    metadata?: Record<string, any>;
    parent?: Account;
    children?: Account[];
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: number;
    tenant_id: number;
    transaction_number: string;
    reference?: string;
    type: 'journal_entry' | 'invoice' | 'payment' | 'receipt' | 'transfer' | 'adjustment' | 'opening_balance' | 'closing_entry';
    transaction_date: string;
    date: string; // Legacy compatibility
    description: string;
    notes?: string;
    total_amount: number;
    amount: number; // Legacy compatibility
    currency: string;
    exchange_rate: number;
    status: 'draft' | 'pending' | 'approved' | 'posted' | 'cancelled' | 'reversed';
    created_by: number;
    approved_by?: number;
    reversed_by?: number;
    reversal_of?: number;
    source_type?: string;
    source_id?: number;
    posted_at?: string;
    approved_at?: string;
    cancelled_at?: string;
    reversed_at?: string;
    metadata?: Record<string, any>;
    journal_entries?: JournalEntry[];
    account_id?: number; // Legacy compatibility
    account?: Account; // Legacy compatibility
    created_at: string;
    updated_at: string;
}

export interface JournalEntry {
    id: number;
    tenant_id: number;
    transaction_id: number;
    account_id: number;
    type: 'debit' | 'credit';
    amount: number;
    currency: string;
    exchange_rate: number;
    base_amount: number;
    description?: string;
    reference?: string;
    date?: string; // Legacy compatibility
    total_debit?: number; // Legacy compatibility
    total_credit?: number; // Legacy compatibility
    transactions?: Transaction[]; // Legacy compatibility
    is_reconciled: boolean;
    reconciled_at?: string;
    reconciled_by?: number;
    department?: string;
    project?: string;
    cost_center?: string;
    dimensions?: Record<string, any>;
    metadata?: Record<string, any>;
    account?: Account;
    transaction?: Transaction;
    created_at: string;
    updated_at: string;
}

export interface AccountBalance {
    id: number;
    tenant_id: number;
    account_id: number;
    period_date: string;
    period_type: 'daily' | 'monthly' | 'quarterly' | 'yearly';
    opening_balance: number;
    debit_total: number;
    credit_total: number;
    closing_balance: number;
    currency: string;
    opening_balance_base: number;
    debit_total_base: number;
    credit_total_base: number;
    closing_balance_base: number;
    is_reconciled: boolean;
    reconciled_at?: string;
    reconciled_by?: number;
    calculated_at?: string;
    calculated_by?: number;
    metadata?: Record<string, any>;
    account?: Account;
    created_at: string;
    updated_at: string;
}

export interface DashboardStats {
    total_accounts: number;
    total_transactions: number;
    total_balance: number;
    monthly_revenue: number;
    monthly_expenses: number;
    pending_transactions: number;
    recent_transactions: Transaction[];
    account_balances: {
        assets: number;
        liabilities: number;
        equity: number;
        revenue: number;
        expenses: number;
    };
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

export interface Filters {
    account_type?: AccountType;
    date_from?: string;
    date_to?: string;
    search?: string;
}
