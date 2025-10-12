/**
 * Import/Export System Tests
 * 
 * Tests to ensure the unified import/export system works correctly
 * and all components can be properly imported.
 */

import { describe, it, expect } from 'vitest';

describe('Import/Export System', () => {
    describe('Feature Pages', () => {
        it('should import all auth pages', async () => {
            const { Login, Register, TenantSelect, ForgotPassword, ResetPassword } = await import('../../../features/auth/pages');
            
            expect(Login).toBeDefined();
            expect(Register).toBeDefined();
            expect(TenantSelect).toBeDefined();
            expect(ForgotPassword).toBeDefined();
            expect(ResetPassword).toBeDefined();
        });

        it('should import all dashboard pages', async () => {
            const { Index } = await import('../../../features/dashboard/pages');
            
            expect(Index).toBeDefined();
        });

        it('should import all accounting pages', async () => {
            const { 
                Dashboard, 
                AccountsIndex, 
                AccountsCreate, 
                AccountsShow,
                TransactionsIndex,
                JournalEntriesIndex 
            } = await import('../../../features/accounting/pages');
            
            expect(Dashboard).toBeDefined();
            expect(AccountsIndex).toBeDefined();
            expect(AccountsCreate).toBeDefined();
            expect(AccountsShow).toBeDefined();
            expect(TransactionsIndex).toBeDefined();
            expect(JournalEntriesIndex).toBeDefined();
        });

        it('should import all inventory pages', async () => {
            const { Dashboard, ProductDetail } = await import('../../../features/inventory/pages');
            
            expect(Dashboard).toBeDefined();
            expect(ProductDetail).toBeDefined();
        });

        it('should import all organization pages', async () => {
            const { Index } = await import('../../../features/organization/pages');
            
            expect(Index).toBeDefined();
        });

        it('should import all sales pages', async () => {
            const { Dashboard } = await import('../../../features/sales/pages');
            
            expect(Dashboard).toBeDefined();
        });
    });

    describe('Feature Types', () => {
        it('should import all accounting types', async () => {
            const accountingTypes = await import('../../../features/accounting/types');
            
            expect(accountingTypes).toBeDefined();
            expect(typeof accountingTypes).toBe('object');
        });

        it('should import all inventory types', async () => {
            const inventoryTypes = await import('../../../features/inventory/types');
            
            expect(inventoryTypes).toBeDefined();
            expect(typeof inventoryTypes).toBe('object');
        });

        it('should import all organization types', async () => {
            const organizationTypes = await import('../../../features/organization/types');
            
            expect(organizationTypes).toBeDefined();
            expect(typeof organizationTypes).toBe('object');
        });

        it('should import all sales types', async () => {
            const salesTypes = await import('../../../features/sales/types');
            
            expect(salesTypes).toBeDefined();
            expect(typeof salesTypes).toBe('object');
        });
    });

    describe('Shared Utilities', () => {
        it('should import all shared formatters', async () => {
            const { 
                formatCurrency, 
                formatNumber, 
                formatDate, 
                formatRelativeTime,
                formatPercentage,
                formatFileSize,
                formatPhoneNumber,
                truncateText,
                capitalizeFirst,
                slugify
            } = await import('../../../shared/utils/formatters');
            
            expect(formatCurrency).toBeDefined();
            expect(formatNumber).toBeDefined();
            expect(formatDate).toBeDefined();
            expect(formatRelativeTime).toBeDefined();
            expect(formatPercentage).toBeDefined();
            expect(formatFileSize).toBeDefined();
            expect(formatPhoneNumber).toBeDefined();
            expect(truncateText).toBeDefined();
            expect(capitalizeFirst).toBeDefined();
            expect(slugify).toBeDefined();
        });

        it('should import shared utilities from main index', async () => {
            const sharedUtils = await import('../../../shared/utils');
            
            expect(sharedUtils.formatCurrency).toBeDefined();
            expect(sharedUtils.formatNumber).toBeDefined();
            expect(sharedUtils.formatDate).toBeDefined();
        });
    });

    describe('Main Features Index', () => {
        it('should import all feature namespaces', async () => {
            const { 
                AccountingPages,
                InventoryPages,
                OrganizationPages,
                SalesPages,
                AuthPages,
                DashboardPages
            } = await import('../../../features');
            
            expect(AccountingPages).toBeDefined();
            expect(InventoryPages).toBeDefined();
            expect(OrganizationPages).toBeDefined();
            expect(SalesPages).toBeDefined();
            expect(AuthPages).toBeDefined();
            expect(DashboardPages).toBeDefined();
        });

        it('should import all feature types', async () => {
            const { 
                AccountingTypes,
                InventoryTypes,
                OrganizationTypes,
                SalesTypes
            } = await import('../../../features');
            
            expect(AccountingTypes).toBeDefined();
            expect(InventoryTypes).toBeDefined();
            expect(OrganizationTypes).toBeDefined();
            expect(SalesTypes).toBeDefined();
        });
    });

    describe('Page Registry', () => {
        it('should import page registry', async () => {
            const { pageRegistry, resolvePage } = await import('../../../pages');
            
            expect(pageRegistry).toBeDefined();
            expect(resolvePage).toBeDefined();
            expect(typeof pageRegistry).toBe('object');
            expect(typeof resolvePage).toBe('function');
        });

        it('should resolve auth pages correctly', async () => {
            const { resolvePage } = await import('../../../pages');
            
            const LoginPage = resolvePage('auth/Login');
            const RegisterPage = resolvePage('auth/Register');
            const ForgotPasswordPage = resolvePage('auth/ForgotPassword');
            
            expect(LoginPage).toBeDefined();
            expect(RegisterPage).toBeDefined();
            expect(ForgotPasswordPage).toBeDefined();
        });

        it('should resolve dashboard pages correctly', async () => {
            const { resolvePage } = await import('../../../pages');
            
            const DashboardPage = resolvePage('dashboard/Index');
            
            expect(DashboardPage).toBeDefined();
        });

        it('should resolve accounting pages correctly', async () => {
            const { resolvePage } = await import('../../../pages');
            
            const AccountingDashboard = resolvePage('accounting/Dashboard');
            const AccountsIndex = resolvePage('accounting/Accounts/Index');
            
            expect(AccountingDashboard).toBeDefined();
            expect(AccountsIndex).toBeDefined();
        });

        it('should handle invalid page names gracefully', async () => {
            const { resolvePage } = await import('../../../pages');
            
            expect(() => resolvePage('invalid/page')).toThrow();
        });
    });
});
