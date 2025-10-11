/**
 * Shared Types Index
 * Centralized exports for all shared types
 */

// Common types (base types used across the app)
export {
    type PaginatedData,
    type FormErrors,
    type SelectOption,
    type NavigationItem,
    type BreadcrumbItem,
    type BaseEntity,
} from './common';

// Authentication types
export * from './auth';

// Laravel/Inertia types (specific to Laravel backend)
export {
    type User,
    type Tenant,
    type Organization,
    type Account,
    type Transaction,
    type JournalEntry,
    type AccountBalance,
    type PageProps,
    type DashboardStats,
} from './laravel';

// Re-export accounting types for backward compatibility
export * from '@/features/accounting/types';

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
