/**
 * GraphQL TypeScript Type Definitions
 * Generated types for GraphQL operations
 */

// Base Types
export interface ID {
  readonly __typename?: 'ID';
  readonly value: string;
}

export interface DateTime {
  readonly __typename?: 'DateTime';
  readonly value: string;
}

// Account Types
export interface Account {
  readonly __typename?: 'Account';
  readonly id: ID;
  readonly code: string;
  readonly name: string;
  readonly type: AccountType;
  readonly description?: string;
  readonly isActive: boolean;
  readonly parentId?: ID;
  readonly balance: number;
  readonly debitBalance: number;
  readonly creditBalance: number;
  readonly parent?: Account;
  readonly children?: ReadonlyArray<Account>;
  readonly transactions?: TransactionConnection;
  readonly createdAt: DateTime;
  readonly updatedAt: DateTime;
}

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

export interface AccountBalance {
  readonly __typename?: 'AccountBalance';
  readonly balance: number;
  readonly debitTotal: number;
  readonly creditTotal: number;
  readonly transactionCount: number;
  readonly lastUpdated: DateTime;
  readonly periodStart?: DateTime;
  readonly periodEnd?: DateTime;
}

// User Types
export interface User {
  readonly __typename?: 'User';
  readonly id: ID;
  readonly name: string;
  readonly email: string;
  readonly avatar?: string;
  readonly role: UserRole;
  readonly permissions?: ReadonlyArray<string>;
  readonly isActive: boolean;
  readonly lastLoginAt?: DateTime;
  readonly organizations?: ReadonlyArray<OrganizationMember>;
  readonly preferences?: UserPreferences;
  readonly createdAt: DateTime;
  readonly updatedAt: DateTime;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  USER = 'USER'
}

export interface UserPreferences {
  readonly __typename?: 'UserPreferences';
  readonly theme: string;
  readonly language: string;
  readonly timezone: string;
  readonly currency: string;
}

// Organization Types
export interface Organization {
  readonly __typename?: 'Organization';
  readonly id: ID;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly logo?: string;
  readonly address?: Address;
  readonly settings?: OrganizationSettings;
  readonly subscription?: Subscription;
  readonly users?: ReadonlyArray<User>;
  readonly accounts?: ReadonlyArray<Account>;
  readonly createdAt: DateTime;
  readonly updatedAt: DateTime;
}

export interface OrganizationMember {
  readonly __typename?: 'OrganizationMember';
  readonly id: ID;
  readonly name: string;
  readonly slug: string;
  readonly role: UserRole;
  readonly joinedAt: DateTime;
}

export interface Address {
  readonly __typename?: 'Address';
  readonly street?: string;
  readonly city?: string;
  readonly state?: string;
  readonly country?: string;
  readonly postalCode?: string;
}

export interface OrganizationSettings {
  readonly __typename?: 'OrganizationSettings';
  readonly currency: string;
  readonly timezone: string;
  readonly dateFormat: string;
  readonly fiscalYearStart: string;
  readonly taxSettings?: TaxSettings;
  readonly integrations?: IntegrationSettings;
  readonly notifications?: NotificationSettings;
}

export interface TaxSettings {
  readonly __typename?: 'TaxSettings';
  readonly defaultTaxRate: number;
  readonly taxNumber?: string;
  readonly taxRegions?: ReadonlyArray<string>;
}

// Transaction Types
export interface Transaction {
  readonly __typename?: 'Transaction';
  readonly id: ID;
  readonly date: DateTime;
  readonly description: string;
  readonly amount: number;
  readonly type: TransactionType;
  readonly reference?: string;
  readonly account: Account;
  readonly journalEntry?: JournalEntry;
  readonly createdAt: DateTime;
  readonly updatedAt: DateTime;
}

export enum TransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT'
}

export interface JournalEntry {
  readonly __typename?: 'JournalEntry';
  readonly id: ID;
  readonly date: DateTime;
  readonly description: string;
  readonly reference?: string;
  readonly transactions: ReadonlyArray<Transaction>;
  readonly totalAmount: number;
  readonly createdAt: DateTime;
  readonly updatedAt: DateTime;
}

// Connection Types (for pagination)
export interface Connection<T> {
  readonly data: ReadonlyArray<T>;
  readonly paginatorInfo: PaginatorInfo;
}

export interface PaginatorInfo {
  readonly __typename?: 'PaginatorInfo';
  readonly currentPage: number;
  readonly hasMorePages: boolean;
  readonly total: number;
  readonly count: number;
  readonly firstItem?: number;
  readonly lastItem?: number;
  readonly perPage: number;
}

export type AccountConnection = Connection<Account>;
export type UserConnection = Connection<User>;
export type TransactionConnection = Connection<Transaction>;

// Input Types
export interface CreateAccountInput {
  readonly code: string;
  readonly name: string;
  readonly type: AccountType;
  readonly description?: string;
  readonly parentId?: ID;
  readonly organizationId: ID;
}

export interface UpdateAccountInput {
  readonly code?: string;
  readonly name?: string;
  readonly description?: string;
  readonly parentId?: ID;
  readonly isActive?: boolean;
}

// Subscription Types
export interface Subscription {
  readonly __typename?: 'Subscription';
  readonly plan: string;
  readonly status: SubscriptionStatus;
  readonly expiresAt?: DateTime;
  readonly features?: ReadonlyArray<string>;
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

// Integration Types
export interface IntegrationSettings {
  readonly __typename?: 'IntegrationSettings';
  readonly banking?: boolean;
  readonly payroll?: boolean;
  readonly inventory?: boolean;
}

export interface NotificationSettings {
  readonly __typename?: 'NotificationSettings';
  readonly email?: boolean;
  readonly slack?: boolean;
  readonly webhook?: boolean;
}

// Statistics Types
export interface OrganizationStats {
  readonly __typename?: 'OrganizationStats';
  readonly totalRevenue: number;
  readonly totalExpenses: number;
  readonly netIncome: number;
  readonly accountsCount: number;
  readonly transactionsCount: number;
  readonly usersCount: number;
  readonly growth?: GrowthStats;
  readonly topAccounts?: ReadonlyArray<TopAccount>;
}

export interface GrowthStats {
  readonly __typename?: 'GrowthStats';
  readonly revenue: number;
  readonly expenses: number;
  readonly transactions: number;
}

export interface TopAccount {
  readonly __typename?: 'TopAccount';
  readonly id: ID;
  readonly name: string;
  readonly balance: number;
  readonly transactionCount: number;
}
