/**
 * Shared Types Index
 * Centralized exports for all shared types
 */

// Common types (specific exports to avoid conflicts)
export type { PaginatedData, FormErrors, NavigationItem, BreadcrumbItem, BaseEntity } from './common';
export type { SelectOption } from './common';

// Authentication types
export * from './auth';

// Laravel/Inertia types (specific exports to avoid conflicts)
export type { 
  User, 
  Tenant, 
  Organization, 
  Account, 
  Transaction, 
  JournalEntry, 
  AccountBalance, 
  PageProps, 
  DashboardStats 
} from './laravel';

// Re-export accounting types for backward compatibility
export * from '@/features/accounting/types';

// Legacy compatibility - BaseEntity is already exported from common.ts

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
