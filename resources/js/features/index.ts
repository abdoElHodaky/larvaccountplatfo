/**
 * Features Index
 * 
 * This module provides centralized access to all feature modules.
 * Each feature is organized by business domain with its own pages, components, and logic.
 */

// Feature Components
export { Button } from '@/shared/components/atoms/Button';

// Feature Pages
export * as AuthPages from './auth/pages';
export * as AccountingPages from './accounting/pages';
export * as DashboardPages from './dashboard/pages';
export * as InventoryPages from './inventory/pages';
export * as OrganizationPages from './organization/pages';
export * as SalesPages from './sales/pages';
// Note: Additional feature pages will be added as features are implemented

// Feature Types
export type { AccountType } from '@/shared/types/ACCOUNTTYPES';
export type { TransactionType } from '@/shared/types/ACCOUNTTYPES';
// Note: Additional feature types will be added as features are implemented
