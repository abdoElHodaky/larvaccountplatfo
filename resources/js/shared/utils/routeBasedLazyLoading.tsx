/**
 * Route-Based Lazy Loading System
 * Optimized lazy loading strategy that avoids static/dynamic import conflicts
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

/**
 * Route-based page lazy loading
 * These are the main page components that should be lazy-loaded
 */

// Dashboard Pages
export const DashboardPage = lazyWithRetry(
  () => import('../../features/dashboard/pages/Dashboard')
);

// Accounting Pages - Only lazy load pages, not individual components
export const AccountsPage = lazyWithRetry(
  () => import('../../features/accounting/pages/Accounts')
);

export const TransactionsPage = lazyWithRetry(
  () => import('../../features/accounting/pages/Transactions')
);

export const JournalEntriesPage = lazyWithRetry(
  () => import('../../features/accounting/pages/JournalEntries')
);

// Inventory Pages
export const InventoryDashboardPage = lazyWithRetry(
  () => import('../../features/inventory/pages/Dashboard')
);

export const ProductDetailPage = lazyWithRetry(
  () => import('../../features/inventory/pages/ProductDetail')
);

// Sales Pages
export const SalesDashboardPage = lazyWithRetry(
  () => import('../../features/sales/pages/Dashboard')
);

// Organization Pages
export const OrganizationIndexPage = lazyWithRetry(
  () => import('../../features/organization/pages/Index')
);

// Auth Pages
export const LoginPage = lazyWithRetry(
  () => import('../../features/auth/pages/Login')
);

export const RegisterPage = lazyWithRetry(
  () => import('../../features/auth/pages/Register')
);

/**
 * Component-level lazy loading for truly dynamic components
 * Only include components that are NOT statically imported elsewhere
 */

// Only include components that actually exist and are conditionally loaded
// Most components are now statically imported in their respective pages

/**
 * Intelligent preloading based on user behavior and route patterns
 */
export class RouteBasedPreloader {
  private static instance: RouteBasedPreloader;
  private preloadedRoutes = new Set<string>();
  private userBehaviorData: { [route: string]: number } = {};

  static getInstance(): RouteBasedPreloader {
    if (!RouteBasedPreloader.instance) {
      RouteBasedPreloader.instance = new RouteBasedPreloader();
    }
    return RouteBasedPreloader.instance;
  }

  /**
   * Initialize the route preloader
   */
  initialize(): void {
    // Set up route change listeners if needed
    // This method can be extended with initialization logic
    console.log('RouteBasedPreloader initialized');
  }

  /**
   * Preload likely next routes based on current route and user behavior
   */
  preloadLikelyRoutes(currentRoute: string): void {
    // Track user behavior
    this.userBehaviorData[currentRoute] = (this.userBehaviorData[currentRoute] || 0) + 1;

    // Define route relationships for intelligent preloading
    const routeRelationships: { [key: string]: string[] } = {
      '/dashboard': ['/transactions', '/accounts', '/reports'],
      '/transactions': ['/accounts', '/journal-entries'],
      '/accounts': ['/transactions', '/reports'],
      '/reports': ['/dashboard', '/transactions'],
      '/inventory': ['/sales', '/reports'],
      '/sales': ['/inventory', '/transactions'],
      '/organization': ['/dashboard'],
    };

    const likelyRoutes = routeRelationships[currentRoute] || [];
    
    // Preload likely routes with a delay to avoid blocking current page
    setTimeout(() => {
      likelyRoutes.forEach(route => {
        if (!this.preloadedRoutes.has(route)) {
          this.preloadRoute(route);
          this.preloadedRoutes.add(route);
        }
      });
    }, 1000);
  }

  /**
   * Preload specific route components
   */
  private preloadRoute(route: string): void {
    switch (route) {
      case '/dashboard':
        import('../../features/dashboard/pages/Dashboard');
        break;
      case '/transactions':
        import('../../features/accounting/pages/Transactions');
        break;
      case '/accounts':
        import('../../features/accounting/pages/Accounts');
        break;
      case '/journal-entries':
        import('../../features/accounting/pages/JournalEntries');
        break;
      case '/inventory':
        import('../../features/inventory/pages/Dashboard');
        break;
      case '/sales':
        import('../../features/sales/pages/Dashboard');
        break;
      case '/organization':
        import('../../features/organization/pages/Index');
        break;
    }
  }

  /**
   * Preload components based on user permissions
   */
  preloadByPermissions(permissions: string[]): void {
    if (permissions.includes('view_dashboard')) {
      import('../../features/dashboard/pages/Dashboard');
    }
    
    if (permissions.includes('manage_transactions')) {
      import('../../features/accounting/pages/Transactions');
      import('../../features/accounting/pages/Accounts');
    }
    
    if (permissions.includes('manage_inventory')) {
      import('../../features/inventory/pages/Dashboard');
    }
    
    if (permissions.includes('manage_sales')) {
      import('../../features/sales/pages/Dashboard');
    }
    
    if (permissions.includes('admin')) {
      import('../../features/organization/pages/Index');
    }
  }

  /**
   * Get preloading statistics for performance monitoring
   */
  getPreloadingStats(): { preloadedCount: number; behaviorData: typeof this.userBehaviorData } {
    return {
      preloadedCount: this.preloadedRoutes.size,
      behaviorData: { ...this.userBehaviorData },
    };
  }
}

// Export singleton instance
export const routePreloader = RouteBasedPreloader.getInstance();

/**
 * Hook for using route-based lazy loading in components
 */
export const useRouteBasedPreloading = (currentRoute: string) => {
  React.useEffect(() => {
    routePreloader.preloadLikelyRoutes(currentRoute);
  }, [currentRoute]);
};

export default {
  // Pages
  DashboardPage,
  AccountsPage,
  TransactionsPage,
  JournalEntriesPage,
  InventoryDashboardPage,
  ProductDetailPage,
  SalesDashboardPage,
  OrganizationIndexPage,
  LoginPage,
  RegisterPage,
  
  // Utilities
  routePreloader,
  useRouteBasedPreloading,
};
