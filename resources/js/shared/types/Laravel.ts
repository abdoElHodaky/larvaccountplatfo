export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    avatar?: string;
    role?: string;
    permissions?: string[];
    created_at: string;
    updated_at: string;
}

export interface Tenant {
    id: number;
    name: string;
    slug: string;
    domain?: string;
    subdomain?: string;
    logo?: string;
    settings?: Record<string, any>;
    subscription_status?: string;
    created_at: string;
    updated_at: string;
}

export interface Organization {
    id: number;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    website?: string;
    industry?: string;
    size?: string;
    settings?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

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
    description: string;
    notes?: string;
    total_amount: number;
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

export interface PageProps<_T extends Record<string, unknown> = Record<string, unknown>> {
    auth: {
        user: User;
        tenant?: Tenant;
        organization?: Organization;
        permissions?: string[];
    };
    flash?: {
        message?: string;
        error?: string;
        success?: string;
        warning?: string;
    };
    errors?: Record<string, string>;
    [key: string]: any;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
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

export interface FormErrors {
    [key: string]: string | string[];
}

export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

export interface NavigationItem {
    name: string;
    href: string;
    icon?: React.ComponentType<any>;
    current?: boolean;
    children?: NavigationItem[];
    badge?: string | number;
    permission?: string;
}

export interface BreadcrumbItem {
    name: string;
    href?: string;
    current?: boolean;
}
