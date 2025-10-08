/**
 * Features Index
 * 
 * This module provides centralized access to all feature modules.
 * Each feature is organized by business domain with its own pages, components, and logic.
 */

// Feature Components
export * from './accounting/components';
export * from './inventory/components';
export * from './reporting/components';
export * from './organization/components';

// Feature Pages
export * as AuthPages from './auth/pages';
export * as AccountingPages from './accounting/pages';
export * as DashboardPages from './dashboard/pages';
