/**
 * Accounting Domain Type Definitions
 * 
 * Consolidated and standardized interfaces for all accounting-related entities.
 * These replace the scattered Account interfaces throughout the application.
 */

import { 
  BaseEntity, 
  OrganizationScoped, 
  Auditable, 
  Hierarchical, 
  Stateful,
  Money,
  DateRange,
  ID 
} from './PATTERNS';

// Account types
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountSubType = 
  // Asset subtypes
  | 'current_asset' | 'fixed_asset' | 'other_asset'
  // Liability subtypes  
  | 'current_liability' | 'long_term_liability' | 'other_liability'
  // Equity subtypes
  | 'owner_equity' | 'retained_earnings' | 'other_equity'
  // Revenue subtypes
  | 'operating_revenue' | 'other_revenue'
  // Expense subtypes
  | 'operating_expense' | 'other_expense';

// Transaction types
export type TransactionType = 'debit' | 'credit';
export type JournalEntryStatus = 'draft' | 'posted' | 'reversed' | 'closed';
export type PaymentMethod = 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';

// Base Account interface - replaces all scattered Account interfaces
export interface Account extends BaseEntity, OrganizationScoped, Auditable, Hierarchical {
  name: string;
  code: string;
  type: AccountType;
  subType?: AccountSubType;
  description?: string;
  balance: number;
  isActive: boolean;
  isBankAccount?: boolean;
  bankAccountNumber?: string;
  taxCode?: string;
  notes?: string;
}

// Account form data for creating/editing accounts
export interface AccountFormData extends Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'> {
  initialBalance?: number;
}

// Account with balance information
export interface AccountWithBalance extends Account {
  currentBalance: number;
  availableBalance?: number;
  pendingBalance?: number;
  balanceAsOf: string;
}

// Chart of accounts structure
export interface ChartOfAccounts {
  organizationId: number;
  accounts: AccountHierarchy[];
  totalAccounts: number;
  lastUpdated: string;
}

// Account hierarchy for tree display
export interface AccountHierarchy extends Account {
  children: AccountHierarchy[];
  depth: number;
  hasChildren: boolean;
  isExpanded?: boolean;
}

// Transaction entity
export interface Transaction extends BaseEntity, OrganizationScoped, Auditable {
  reference: string;
  description: string;
  amount: Money;
  date: string;
  type: TransactionType;
  accountId: number;
  account?: Account;
  journalEntryId?: number;
  journalEntry?: JournalEntry;
  reconciled: boolean;
  reconciledAt?: string;
  paymentMethod?: PaymentMethod;
  checkNumber?: string;
  attachments?: string[];
  tags?: string[];
  notes?: string;
}

// Transaction form data
export interface TransactionFormData extends Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'account' | 'journalEntry'> {
  // Additional fields for form handling
  accountCode?: string;
  splitTransactions?: SplitTransactionData[];
}

// Split transaction data for complex entries
export interface SplitTransactionData {
  accountId: number;
  accountCode?: string;
  description: string;
  amount: Money;
  type: TransactionType;
}

// Journal Entry entity
export interface JournalEntry extends BaseEntity, OrganizationScoped, Auditable, Stateful<JournalEntryStatus> {
  reference: string;
  description: string;
  date: string;
  totalAmount: Money;
  entries: JournalEntryLine[];
  attachments?: string[];
  notes?: string;
  reversalOf?: number;
  reversedBy?: number;
  postingDate?: string;
  period: string; // Accounting period (e.g., "2024-01")
}

// Journal Entry Line (individual debit/credit lines)
export interface JournalEntryLine {
  id?: number;
  accountId: number;
  account?: Account;
  description?: string;
  debit: Money;
  credit: Money;
  reference?: string;
}

// Journal Entry form data
export interface JournalEntryFormData extends Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'entries'> {
  entries: JournalEntryLineFormData[];
}

// Journal Entry Line form data
export interface JournalEntryLineFormData extends Omit<JournalEntryLine, 'id' | 'account'> {
  accountCode?: string;
}

// Budget entity
export interface Budget extends BaseEntity, OrganizationScoped, Auditable {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'closed';
  totalBudget: Money;
  lineItems: BudgetLineItem[];
  notes?: string;
}

// Budget Line Item
export interface BudgetLineItem extends BaseEntity {
  budgetId: number;
  accountId: number;
  account?: Account;
  budgetedAmount: Money;
  actualAmount?: Money;
  variance?: Money;
  variancePercentage?: number;
  period: string;
  notes?: string;
}

// Financial Forecast entity
export interface FinancialForecast extends BaseEntity, OrganizationScoped, Auditable {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'archived';
  lineItems: ForecastLineItem[];
  assumptions?: string;
  notes?: string;
}

// Forecast Line Item
export interface ForecastLineItem extends BaseEntity {
  forecastId: number;
  accountId: number;
  account?: Account;
  forecastedAmount: Money;
  period: string;
  growthRate?: number;
  assumptions?: string;
}

// Tax Rate entity
export interface TaxRate extends BaseEntity, OrganizationScoped, Auditable {
  name: string;
  code: string;
  rate: number; // Percentage (e.g., 8.5 for 8.5%)
  description?: string;
  isActive: boolean;
  effectiveDate: string;
  expiryDate?: string;
  taxType: 'sales' | 'purchase' | 'income' | 'other';
  applicableAccounts?: number[];
}

// Account Balance snapshot
export interface AccountBalance extends BaseEntity, OrganizationScoped {
  accountId: number;
  account?: Account;
  balance: Money;
  date: string;
  period: string;
  balanceType: 'opening' | 'closing' | 'current';
}

// Financial Reports
export interface BalanceSheet {
  organizationId: number;
  asOfDate: string;
  currency: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  totalAssets: Money;
  totalLiabilitiesAndEquity: Money;
  isBalanced: boolean;
  generatedAt: string;
}

export interface IncomeStatement {
  organizationId: number;
  startDate: string;
  endDate: string;
  currency: string;
  revenue: IncomeStatementSection;
  expenses: IncomeStatementSection;
  grossProfit: Money;
  netIncome: Money;
  generatedAt: string;
}

export interface TrialBalance {
  organizationId: number;
  asOfDate: string;
  currency: string;
  accounts: TrialBalanceAccount[];
  totalDebits: Money;
  totalCredits: Money;
  isBalanced: boolean;
  generatedAt: string;
}

// Report sections
export interface BalanceSheetSection {
  name: string;
  accounts: BalanceSheetAccount[];
  total: Money;
}

export interface IncomeStatementSection {
  name: string;
  accounts: IncomeStatementAccount[];
  total: Money;
}

// Report account structures
export interface BalanceSheetAccount {
  accountId: number;
  accountCode: string;
  accountName: string;
  balance: Money;
  parentId?: number;
  level: number;
}

export interface IncomeStatementAccount {
  accountId: number;
  accountCode: string;
  accountName: string;
  amount: Money;
  parentId?: number;
  level: number;
}

export interface TrialBalanceAccount {
  accountId: number;
  accountCode: string;
  accountName: string;
  debitBalance: Money;
  creditBalance: Money;
}

// Dashboard metrics
export interface AccountingMetrics {
  organizationId: number;
  period: DateRange;
  totalRevenue: Money;
  totalExpenses: Money;
  netIncome: Money;
  totalAssets: Money;
  totalLiabilities: Money;
  totalEquity: Money;
  cashFlow: Money;
  accountsReceivable: Money;
  accountsPayable: Money;
  bankBalance: Money;
  generatedAt: string;
}

// Cash flow data
export interface CashFlowData {
  organizationId: number;
  period: DateRange;
  operatingActivities: CashFlowSection;
  investingActivities: CashFlowSection;
  financingActivities: CashFlowSection;
  netCashFlow: Money;
  openingCashBalance: Money;
  closingCashBalance: Money;
  generatedAt: string;
}

export interface CashFlowSection {
  name: string;
  items: CashFlowItem[];
  total: Money;
}

export interface CashFlowItem {
  description: string;
  amount: Money;
  accountId?: number;
}

// Reconciliation
export interface BankReconciliation extends BaseEntity, OrganizationScoped, Auditable {
  accountId: number;
  account?: Account;
  statementDate: string;
  statementBalance: Money;
  bookBalance: Money;
  reconciledBalance: Money;
  status: 'in_progress' | 'completed' | 'reviewed';
  outstandingDeposits: Money;
  outstandingChecks: Money;
  adjustments: ReconciliationAdjustment[];
  notes?: string;
}

export interface ReconciliationAdjustment {
  id: string;
  description: string;
  amount: Money;
  type: 'deposit' | 'withdrawal' | 'fee' | 'interest' | 'other';
  date: string;
  reference?: string;
}

// Component Props Interfaces
export interface AccountFormProps {
  account?: Account;
  onSubmit: (data: AccountFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
}

export interface AccountCardProps {
  account: Account;
  showBalance?: boolean;
  showActions?: boolean;
  onEdit?: (account: Account) => void;
  onDelete?: (id: number) => void;
  onView?: (account: Account) => void;
  className?: string;
}

export interface TransactionFormProps {
  transaction?: Transaction;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
  accounts: Account[];
}

export interface JournalEntryFormProps {
  journalEntry?: JournalEntry;
  onSubmit: (data: JournalEntryFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
  accounts: Account[];
}

export interface AccountingDashboardProps {
  organizationId: number;
  period?: DateRange;
  refreshInterval?: number;
  showMetrics?: boolean;
  showCharts?: boolean;
  showRecentTransactions?: boolean;
}

export interface FinancialReportProps {
  organizationId: number;
  reportType: 'balance_sheet' | 'income_statement' | 'trial_balance' | 'cash_flow';
  period?: DateRange;
  asOfDate?: string;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  loading?: boolean;
}

// API Response Types
export interface AccountsResponse {
  accounts: Account[];
  total: number;
  chartOfAccounts?: ChartOfAccounts;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  summary?: {
    totalDebits: Money;
    totalCredits: Money;
    netAmount: Money;
  };
}

export interface JournalEntriesResponse {
  journalEntries: JournalEntry[];
  total: number;
  summary?: {
    totalAmount: Money;
    postedCount: number;
    draftCount: number;
  };
}

// Search and Filter Types
export interface AccountFilters {
  type?: AccountType[];
  subType?: AccountSubType[];
  isActive?: boolean;
  hasBalance?: boolean;
  parentId?: number;
  search?: string;
}

export interface TransactionFilters {
  accountId?: number[];
  type?: TransactionType[];
  dateRange?: DateRange;
  amountRange?: { min: number; max: number };
  reconciled?: boolean;
  paymentMethod?: PaymentMethod[];
  search?: string;
}

export interface JournalEntryFilters {
  status?: JournalEntryStatus[];
  dateRange?: DateRange;
  period?: string[];
  search?: string;
}

// Constants
export const ACCOUNT_TYPES: Record<AccountType, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expense',
};

export const TRANSACTION_TYPES: Record<TransactionType, string> = {
  debit: 'Debit',
  credit: 'Credit',
};

export const JOURNAL_ENTRY_STATUSES: Record<JournalEntryStatus, string> = {
  draft: 'Draft',
  posted: 'Posted',
  reversed: 'Reversed',
  closed: 'Closed',
};

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  check: 'Check',
  credit_card: 'Credit Card',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
};
