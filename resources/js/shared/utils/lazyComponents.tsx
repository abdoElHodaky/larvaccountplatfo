/**
 * Lazy Component Loading Utilities
 * Code splitting and dynamic imports for better performance
 */

import React, { lazy, ComponentType } from 'react';

// Retry mechanism for failed dynamic imports
const retry = (fn: () => Promise<any>, retriesLeft = 5, interval = 1000): Promise<any> => {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((error) => {
        setTimeout(() => {
          if (retriesLeft === 1) {
            reject(error);
            return;
          }
          retry(fn, retriesLeft - 1, interval).then(resolve, reject);
        }, interval);
      });
  });
};

// Enhanced lazy loading with retry mechanism
const lazyWithRetry = (importFunc: () => Promise<{ default: ComponentType<any> }>) => {
  return lazy(() => retry(importFunc));
};

// Dashboard Components
export const DashboardOverview = lazyWithRetry(
  () => import('../../features/dashboard/components/organisms/DashboardOverview')
);

export const MetricsCards = lazyWithRetry(
  () => import('../../features/dashboard/components/organisms/MetricsCards')
);

export const RecentTransactions = lazyWithRetry(
  () => import('../../features/dashboard/components/organisms/RecentTransactions')
);

export const QuickActions = lazyWithRetry(
  () => import('../../features/dashboard/components/organisms/QuickActions')
);

export const FinancialChart = lazyWithRetry(
  () => import('../../features/dashboard/components/organisms/FinancialChart')
);

export const CashFlowWidget = lazyWithRetry(
  () => import('../../features/dashboard/components/organisms/CashFlowWidget')
);

// Accounting Components - Only lazy load components not used in static imports
// Note: ChartOfAccounts, TransactionList, TransactionForm, JournalEntries are statically imported
// in their respective pages, so we don't need lazy versions here

export const BalanceSheet = lazyWithRetry(
  () => import('../../features/accounting/components/organisms/BalanceSheet')
);

// Accounting Pages
export const AccountsPage = lazyWithRetry(
  () => import('../../features/accounting/pages/Accounts')
);

export const TransactionsPage = lazyWithRetry(
  () => import('../../features/accounting/pages/Transactions')
);

export const JournalEntriesPage = lazyWithRetry(
  () => import('../../features/accounting/pages/JournalEntries')
);

// Report Components
export const IncomeStatement = lazyWithRetry(
  () => import('../../features/accounting/components/organisms/IncomeStatement')
);

export const BalanceSheetReport = lazyWithRetry(
  () => import('../../features/accounting/components/organisms/BalanceSheet')
);

export const TrialBalance = lazyWithRetry(
  () => import('../../features/accounting/components/organisms/TrialBalance')
);

export const ReportBuilder = lazyWithRetry(
  () => import('../../features/reporting/components/organisms/ReportBuilder')
);

// Organization Components (formerly Settings)
export const TenantSettings = lazyWithRetry(
  () => import('../../features/organization/components/organisms/TenantSettings')
);

export const UserManagement = lazyWithRetry(
  () => import('../../features/organization/components/organisms/UserManagement')
);

export const IntegrationSettings = lazyWithRetry(
  () => import('../../features/organization/components/organisms/IntegrationSettings')
);

export const BillingSettings = lazyWithRetry(
  () => import('../../features/organization/components/organisms/BillingSettings')
);

// Real-time Components - Remove lazy loading for WebSocketProvider as it's statically imported
// Note: WebSocketProvider is statically imported in useRealTimeNotifications.ts

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload dashboard components as they're most likely to be used first
  import('../../features/dashboard/components/organisms/DashboardOverview');
  import('../../features/dashboard/components/organisms/MetricsCards');
  import('../../features/dashboard/components/organisms/RecentTransactions');
  import('../../features/dashboard/components/organisms/QuickActions');
};

// Preload components based on user role/permissions
export const preloadByRole = (userRole: string, permissions: string[]) => {
  if (permissions.includes('view_dashboard')) {
    import('../../features/dashboard/components/organisms/DashboardOverview');
    import('../../features/dashboard/components/organisms/MetricsCards');
  }
  
  // Remove conflicting preloads for components that are statically imported
  if (permissions.includes('manage_transactions')) {
    // TransactionList and TransactionForm are statically imported in their pages
    // Only preload components that are truly lazy-loaded
    import('../../features/accounting/components/organisms/BalanceSheet');
  }
  
  if (permissions.includes('view_reports')) {
    import('../../features/accounting/components/organisms/IncomeStatement');
  }
  
  if (userRole === 'admin') {
    import('../../features/organization/components/organisms/TenantSettings');
    import('../../features/organization/components/organisms/UserManagement');
  }
};

// Preload components based on route - only preload truly lazy components
export const preloadByRoute = (currentRoute: string) => {
  switch (currentRoute) {
    case '/dashboard':
      import('../../features/dashboard/components/organisms/FinancialChart');
      import('../../features/dashboard/components/organisms/CashFlowWidget');
      break;
    case '/transactions':
      // TransactionForm and JournalEntries are statically imported in their pages
      // Only preload components that are truly lazy-loaded
      import('../../features/accounting/components/organisms/BalanceSheet');
      break;
    case '/accounts':
      // TransactionList is statically imported in Accounts page
      // Preload related components instead
      import('../../features/accounting/components/organisms/BalanceSheet');
      break;
    case '/reports':
      import('../../features/accounting/components/organisms/BalanceSheet');
      import('../../features/accounting/components/organisms/TrialBalance');
      break;
    case '/settings':
      import('../../features/organization/components/organisms/UserManagement');
      import('../../features/organization/components/organisms/IntegrationSettings');
      break;
  }
};

// Inventory Components
export const InventoryList = lazyWithRetry(
  () => import('../../features/inventory/components/organisms/InventoryList')
);

export const InventoryForm = lazyWithRetry(
  () => import('../../features/inventory/components/organisms/InventoryForm')
);

// Organization Components
export const OrganizationSettings = lazyWithRetry(
  () => import('../../features/organization/components/organisms/OrganizationSettings')
);

export const UserManagementOrg = lazyWithRetry(
  () => import('../../features/organization/components/organisms/UserManagement')
);

// Reporting Components
export const ReportDashboard = lazyWithRetry(
  () => import('../../features/reporting/components/organisms/ReportDashboard')
);

export const CustomReportBuilder = lazyWithRetry(
  () => import('../../features/reporting/components/organisms/CustomReportBuilder')
);

// Auth Pages
export const LoginPage = lazyWithRetry(
  () => import('../../features/auth/pages/Login')
);

export const RegisterPage = lazyWithRetry(
  () => import('../../features/auth/pages/Register')
);

// Dashboard Pages
export const DashboardPage = lazyWithRetry(
  () => import('../../features/dashboard/pages/Dashboard')
);

// Component bundle information for monitoring
export const componentBundles = {
  dashboard: [
    'DashboardOverview',
    'MetricsCards', 
    'RecentTransactions',
    'QuickActions',
    'FinancialChart',
    'CashFlowWidget',
    'DashboardPage'
  ],
  accounting: [
    'ChartOfAccounts',
    'TransactionList',
    'TransactionForm', 
    'JournalEntries',
    'BalanceSheet',
    'AccountsPage',
    'TransactionsPage',
    'JournalEntriesPage'
  ],
  inventory: [
    'InventoryList',
    'InventoryForm'
  ],
  organization: [
    'OrganizationSettings',
    'UserManagementOrg'
  ],
  reporting: [
    'IncomeStatement',
    'BalanceSheet',
    'TrialBalance',
    'ReportBuilder',
    'ReportDashboard',
    'CustomReportBuilder'
  ],
  auth: [
    'LoginPage',
    'RegisterPage'
  ],
  settings: [
    'TenantSettings',
    'UserManagement',
    'IntegrationSettings',
    'BillingSettings'
  ]
};

// Performance monitoring for lazy loading
export const trackComponentLoad = (componentName: string, loadTime: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'component_load', {
      component_name: componentName,
      load_time: loadTime,
      event_category: 'performance'
    });
  }
  
  console.log(`Component ${componentName} loaded in ${loadTime}ms`);
};

// HOC for tracking component load times
export const withLoadTracking = <P extends object>(
  WrappedComponent: ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const endTime = performance.now();
      trackComponentLoad(componentName, endTime - startTime);
    }, []);
    
    return <WrappedComponent {...props} />;
  };
};

export default {
  // Dashboard
  DashboardOverview,
  MetricsCards,
  RecentTransactions,
  QuickActions,
  FinancialChart,
  CashFlowWidget,
  DashboardPage,
  
  // Accounting
  ChartOfAccounts,
  TransactionList,
  TransactionForm,
  JournalEntries,
  BalanceSheet,
  AccountsPage,
  TransactionsPage,
  JournalEntriesPage,
  
  // Inventory
  InventoryList,
  InventoryForm,
  
  // Organization
  OrganizationSettings,
  UserManagementOrg,
  
  // Reports
  IncomeStatement,
  TrialBalance,
  ReportBuilder,
  ReportDashboard,
  CustomReportBuilder,
  
  // Auth
  LoginPage,
  RegisterPage,
  
  // Settings
  TenantSettings,
  UserManagement,
  IntegrationSettings,
  BillingSettings,
  
  // Real-time
  WebSocketProvider,
  
  // Utilities
  preloadCriticalComponents,
  preloadByRole,
  preloadByRoute,
  trackComponentLoad,
  withLoadTracking,
};
