/**
 * Lazy Component Loading Utilities
 * Code splitting and dynamic imports for better performance
 */

import { lazy, ComponentType } from 'react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

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
  () => import('../components/dashboard/DashboardOverview')
);

export const MetricsCards = lazyWithRetry(
  () => import('../components/dashboard/MetricsCards')
);

export const RecentTransactions = lazyWithRetry(
  () => import('../components/dashboard/RecentTransactions')
);

export const QuickActions = lazyWithRetry(
  () => import('../components/dashboard/QuickActions')
);

export const FinancialChart = lazyWithRetry(
  () => import('../components/dashboard/FinancialChart')
);

export const CashFlowWidget = lazyWithRetry(
  () => import('../components/dashboard/CashFlowWidget')
);

// Accounting Components
export const ChartOfAccounts = lazyWithRetry(
  () => import('../components/accounting/ChartOfAccounts')
);

export const TransactionList = lazyWithRetry(
  () => import('../components/accounting/TransactionList')
);

export const TransactionForm = lazyWithRetry(
  () => import('../components/accounting/TransactionForm')
);

export const JournalEntries = lazyWithRetry(
  () => import('../components/accounting/JournalEntries')
);

// Report Components
export const IncomeStatement = lazyWithRetry(
  () => import('../components/reports/IncomeStatement')
);

export const BalanceSheet = lazyWithRetry(
  () => import('../components/reports/BalanceSheet')
);

export const TrialBalance = lazyWithRetry(
  () => import('../components/reports/TrialBalance')
);

export const ReportBuilder = lazyWithRetry(
  () => import('../components/reports/ReportBuilder')
);

// Settings Components
export const TenantSettings = lazyWithRetry(
  () => import('../components/settings/TenantSettings')
);

export const UserManagement = lazyWithRetry(
  () => import('../components/settings/UserManagement')
);

export const IntegrationSettings = lazyWithRetry(
  () => import('../components/settings/IntegrationSettings')
);

export const BillingSettings = lazyWithRetry(
  () => import('../components/settings/BillingSettings')
);

// Real-time Components
export const WebSocketProvider = lazyWithRetry(
  () => import('../components/realtime/WebSocketProvider')
);

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload dashboard components as they're most likely to be used first
  import('../components/dashboard/DashboardOverview');
  import('../components/dashboard/MetricsCards');
  import('../components/dashboard/RecentTransactions');
  import('../components/dashboard/QuickActions');
};

// Preload components based on user role/permissions
export const preloadByRole = (userRole: string, permissions: string[]) => {
  if (permissions.includes('view_dashboard')) {
    import('../components/dashboard/DashboardOverview');
    import('../components/dashboard/MetricsCards');
  }
  
  if (permissions.includes('manage_transactions')) {
    import('../components/accounting/TransactionList');
    import('../components/accounting/TransactionForm');
  }
  
  if (permissions.includes('view_reports')) {
    import('../components/reports/IncomeStatement');
  }
  
  if (userRole === 'admin') {
    import('../components/settings/TenantSettings');
    import('../components/settings/UserManagement');
  }
};

// Preload components based on route
export const preloadByRoute = (currentRoute: string) => {
  switch (currentRoute) {
    case '/dashboard':
      import('../components/dashboard/FinancialChart');
      import('../components/dashboard/CashFlowWidget');
      break;
    case '/transactions':
      import('../components/accounting/TransactionForm');
      import('../components/accounting/JournalEntries');
      break;
    case '/accounts':
      import('../components/accounting/TransactionList');
      break;
    case '/reports':
      import('../components/reports/BalanceSheet');
      import('../components/reports/TrialBalance');
      break;
    case '/settings':
      import('../components/settings/UserManagement');
      import('../components/settings/IntegrationSettings');
      break;
  }
};

// Component bundle information for monitoring
export const componentBundles = {
  dashboard: [
    'DashboardOverview',
    'MetricsCards', 
    'RecentTransactions',
    'QuickActions',
    'FinancialChart',
    'CashFlowWidget'
  ],
  accounting: [
    'ChartOfAccounts',
    'TransactionList',
    'TransactionForm', 
    'JournalEntries'
  ],
  reports: [
    'IncomeStatement',
    'BalanceSheet',
    'TrialBalance',
    'ReportBuilder'
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
  
  // Accounting
  ChartOfAccounts,
  TransactionList,
  TransactionForm,
  JournalEntries,
  
  // Reports
  IncomeStatement,
  BalanceSheet,
  TrialBalance,
  ReportBuilder,
  
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

