/**
 * Page Registry
 * 
 * Centralized registry for all Inertia.js pages.
 * This provides a single source of truth for page imports and helps with code splitting.
 */

// Import all page components
import { 
    AccountingPages, 
    InventoryPages, 
    OrganizationPages, 
    SalesPages,
    AuthPages,
    DashboardPages 
} from './features';

// Page registry mapping
export const pageRegistry = {
    // Authentication pages
    'auth/Login': AuthPages.Login,
    'auth/Register': AuthPages.Register,
    'auth/ForgotPassword': AuthPages.ForgotPassword,
    'auth/ResetPassword': AuthPages.ResetPassword,
    
    // Dashboard pages
    'dashboard/Index': DashboardPages.Index,
    
    // Accounting pages
    'accounting/Dashboard': AccountingPages.Dashboard,
    'accounting/Accounts/Index': AccountingPages.AccountsIndex,
    'accounting/Accounts/Create': AccountingPages.AccountsCreate,
    'accounting/Accounts/Show': AccountingPages.AccountsShow,
    'accounting/Transactions/Index': AccountingPages.TransactionsIndex,
    'accounting/JournalEntries/Index': AccountingPages.JournalEntriesIndex,
    
    // Inventory pages
    'inventory/Dashboard': InventoryPages.Dashboard,
    'inventory/ProductDetail': InventoryPages.ProductDetail,
    
    // Organization pages
    'organization/Index': OrganizationPages.Index,
    
    // Sales pages
    'sales/Dashboard': SalesPages.Dashboard,
} as const;

// Type for page names
export type PageName = keyof typeof pageRegistry;

// Helper function to resolve page component
export function resolvePage(name: string) {
    const component = pageRegistry[name as PageName];
    if (!component) {
        throw new Error(`Page component "${name}" not found in registry`);
    }
    return component;
}

// Alias for backward compatibility
export const resolvePageComponent = resolvePage;
