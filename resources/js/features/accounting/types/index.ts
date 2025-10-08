// Accounting types
import { BaseEntity } from '../../../shared/types';

export interface Account extends BaseEntity {
  code: string;
  name: string;
  type: AccountType;
  parent_id?: number;
  balance: number;
  is_active: boolean;
}

export interface Transaction extends BaseEntity {
  reference: string;
  description: string;
  date: string;
  amount: number;
  account_id: number;
  account?: Account;
}

export interface JournalEntry extends BaseEntity {
  reference: string;
  description: string;
  date: string;
  total_debit: number;
  total_credit: number;
  transactions: Transaction[];
}

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

