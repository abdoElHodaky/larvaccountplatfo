/**
 * Shared Types Index
 * Centralized exports for all shared types
 */

// Common types - explicit exports to avoid conflicts
export type { 
  PaginatedData, 
  FormErrors, 
  NavigationItem, 
  BreadcrumbItem, 
  BaseEntity 
} from './common';

export type { SelectOption } from './common';

// Authentication types
export * from './auth';

// Laravel/Inertia types - explicit exports to avoid conflicts with accounting types
export type { 
  User, 
  Tenant, 
  Organization, 
  PageProps 
} from './laravel';

// Use accounting types as the primary source for these interfaces
export type { 
  Account, 
  Transaction, 
  JournalEntry, 
  AccountBalance, 
  DashboardStats 
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
