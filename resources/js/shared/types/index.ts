/**
 * Shared Types Index
 * Centralized exports for all shared types
 */

// Common types
export type {
  BreadcrumbItem,
  FormErrors,
  NavigationItem,
  PaginatedData,
  SelectOption,
} from './common';

// Authentication types
export type {
  User,
  Organization,
  Tenant,
  PageProps,
} from './auth';

// Laravel/Inertia types
export type {
  Account,
  AccountBalance,
  DashboardStats,
  JournalEntry,
  Transaction,
} from './laravel';

// Re-export accounting types for backward compatibility
export type {
  AccountType,
  TransactionType,
  BalanceSheetItem,
  IncomeStatementItem,
} from '@/features/accounting/types';

// Legacy compatibility - keep existing types
export interface BaseEntity {
  id: string | number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface FormFieldProps extends ComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
}
