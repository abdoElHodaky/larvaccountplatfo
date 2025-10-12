/**
 * Features Index
 * 
 * This module provides centralized access to all feature modules.
 * Each feature is organized by business domain with its own pages, components, and logic.
 */

// Feature Components
export * from './accounting/Button';
export * from './dashboard/Button';
export * from './inventory/Button';
export * from './reporting/Button';
export * from './organization/Button';
export * from './sales/Button';

// Feature Pages
export * as AuthPages from './auth/pages';
export * as AccountingPages from './accounting/pages';
export * as DashboardPages from './dashboard/pages';
export * as InventoryPages from './inventory/pages';
export * as OrganizationPages from './organization/pages';
export * as SalesPages from './sales/pages';
// Note: Additional feature pages will be added as features are implemented

// Feature Types
export * as AccountingTypes from './accounting/ICONSIZES';
export * as InventoryTypes from './inventory/ICONSIZES';
export * as SalesTypes from './sales/ICONSIZES';
export * as OrganizationTypes from './organization/ICONSIZES';
// Note: Additional feature types will be added as features are implemented
