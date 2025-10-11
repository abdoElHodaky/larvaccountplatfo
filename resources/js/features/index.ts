/**
 * Features Index
 * 
 * This module provides centralized access to all feature modules.
 * Each feature is organized by business domain with its own pages, components, and logic.
 */

// Feature Components
export * from './accounting/components';
export * from './dashboard/components';
export * from './inventory/components';
export * from './reporting/components';
export * from './organization/components';
export * from './sales/components';

// Feature Pages
export * as AuthPages from './auth/pages';
export * as AccountingPages from './accounting/pages';
export * as DashboardPages from './dashboard/pages';
export * as InventoryPages from './inventory/pages';
export * as OrganizationPages from './organization/pages';
export * as SalesPages from './sales/pages';
// Note: Additional feature pages will be added as features are implemented

// Feature Types
export * as AccountingTypes from './accounting/types';
export * as InventoryTypes from './inventory/types';
export * as SalesTypes from './sales/types';
export * as OrganizationTypes from './organization/types';
// Note: Additional feature types will be added as features are implemented
