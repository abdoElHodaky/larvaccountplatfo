/**
 * Enhanced Page Registry - Phase 6 Inertia.js Integration
 * 
 * Advanced page registry with lazy loading, preloading, caching,
 * and performance optimizations for Inertia.js pages.
 */

import { lazy, ComponentType } from 'react';
import type { PageProps } from '@inertiajs/react';

// Page metadata interface
export interface PageMetadata {
  title?: string;
  description?: string;
  preload?: string[];
  cache?: boolean;
  cacheDuration?: number;
  bundle?: string;
  priority?: 'high' | 'medium' | 'low';
  prefetch?: boolean;
}

// Enhanced page registry entry
export interface PageRegistryEntry {
  component: () => Promise<{ default: ComponentType<PageProps> }>;
  metadata: PageMetadata;
  loaded?: boolean;
  loading?: Promise<{ default: ComponentType<PageProps> }>;
}

// Page registry type
export type PageRegistry = Record<string, PageRegistryEntry>;

// Create lazy component with metadata
function createLazyPage(
  importFn: () => Promise<{ default: ComponentType<PageProps> }>,
  metadata: PageMetadata = {}
): PageRegistryEntry {
  return {
    component: importFn,
    metadata: {
      cache: true,
      cacheDuration: 300000, // 5 minutes default
      priority: 'medium',
      prefetch: false,
      ...metadata,
    },
    loaded: false,
  };
}

// Enhanced page registry with metadata and optimizations
export const enhancedPageRegistry: PageRegistry = {
  // Authentication Pages
  'auth/Login': createLazyPage(
    () => import('@/features/auth/pages/Login'),
    {
      title: 'Login - Laravel Accounting Platform',
      description: 'Sign in to your accounting platform',
      priority: 'high',
      prefetch: true,
      bundle: 'auth',
    }
  ),
  
  'auth/Register': createLazyPage(
    () => import('@/features/auth/pages/Register'),
    {
      title: 'Register - Laravel Accounting Platform',
      description: 'Create your accounting platform account',
      priority: 'medium',
      bundle: 'auth',
    }
  ),
  
  'auth/ForgotPassword': createLazyPage(
    () => import('@/features/auth/pages/ForgotPassword'),
    {
      title: 'Forgot Password - Laravel Accounting Platform',
      description: 'Reset your password',
      priority: 'low',
      bundle: 'auth',
    }
  ),
  
  'auth/ResetPassword': createLazyPage(
    () => import('@/features/auth/pages/ResetPassword'),
    {
      title: 'Reset Password - Laravel Accounting Platform',
      description: 'Set your new password',
      priority: 'low',
      bundle: 'auth',
    }
  ),
  
  // Dashboard Pages
  'dashboard/Index': createLazyPage(
    () => import('@/features/dashboard/pages/Dashboard'),
    {
      title: 'Dashboard - Laravel Accounting Platform',
      description: 'Your accounting dashboard overview',
      priority: 'high',
      prefetch: true,
      preload: ['accounting/Dashboard'],
      bundle: 'dashboard',
    }
  ),
  
  // Accounting Pages
  'accounting/Dashboard': createLazyPage(
    () => import('@/features/accounting/pages/Dashboard'),
    {
      title: 'Accounting Dashboard - Laravel Accounting Platform',
      description: 'Comprehensive accounting overview and metrics',
      priority: 'high',
      prefetch: true,
      preload: ['accounting/Accounts/Index', 'accounting/Transactions/Index'],
      bundle: 'accounting',
    }
  ),
  
  'accounting/Accounts/Index': createLazyPage(
    () => import('@/features/accounting/pages/Accounts/Index'),
    {
      title: 'Chart of Accounts - Laravel Accounting Platform',
      description: 'Manage your chart of accounts',
      priority: 'high',
      preload: ['accounting/Accounts/Create'],
      bundle: 'accounting',
    }
  ),
  
  'accounting/Accounts/Create': createLazyPage(
    () => import('@/features/accounting/pages/Accounts/Create'),
    {
      title: 'Create Account - Laravel Accounting Platform',
      description: 'Add a new account to your chart of accounts',
      priority: 'medium',
      bundle: 'accounting',
    }
  ),
  
  'accounting/Accounts/Show': createLazyPage(
    () => import('@/features/accounting/pages/Accounts/Show'),
    {
      title: 'Account Details - Laravel Accounting Platform',
      description: 'View account details and transactions',
      priority: 'medium',
      bundle: 'accounting',
    }
  ),
  
  'accounting/Transactions/Index': createLazyPage(
    () => import('@/features/accounting/pages/Transactions/Index'),
    {
      title: 'Transactions - Laravel Accounting Platform',
      description: 'View and manage your transactions',
      priority: 'high',
      bundle: 'accounting',
    }
  ),
  
  'accounting/JournalEntries/Index': createLazyPage(
    () => import('@/features/accounting/pages/JournalEntries/Index'),
    {
      title: 'Journal Entries - Laravel Accounting Platform',
      description: 'Manage your journal entries',
      priority: 'medium',
      bundle: 'accounting',
    }
  ),
  
  // Inventory Pages
  'inventory/Dashboard': createLazyPage(
    () => import('@/features/inventory/pages/Dashboard'),
    {
      title: 'Inventory Dashboard - Laravel Accounting Platform',
      description: 'Inventory management overview',
      priority: 'medium',
      bundle: 'inventory',
    }
  ),
  
  'inventory/ProductDetail': createLazyPage(
    () => import('@/features/inventory/pages/ProductDetail'),
    {
      title: 'Product Details - Laravel Accounting Platform',
      description: 'View product inventory details',
      priority: 'medium',
      bundle: 'inventory',
    }
  ),
  
  // Organization Pages
  'organization/Index': createLazyPage(
    () => import('@/features/organization/pages/Index'),
    {
      title: 'Organization Settings - Laravel Accounting Platform',
      description: 'Manage your organization settings',
      priority: 'low',
      bundle: 'organization',
    }
  ),
  
  // Sales Pages
  'sales/Dashboard': createLazyPage(
    () => import('@/features/sales/pages/Dashboard'),
    {
      title: 'Sales Dashboard - Laravel Accounting Platform',
      description: 'Sales performance and analytics',
      priority: 'medium',
      bundle: 'sales',
    }
  ),
  
  // Reporting Pages
  'reporting/Dashboard': createLazyPage(
    () => import('@/features/reporting/pages/Dashboard'),
    {
      title: 'Reports Dashboard - Laravel Accounting Platform',
      description: 'Financial reports and analytics',
      priority: 'medium',
      bundle: 'reporting',
    }
  ),
} as const;

// Type for page names
export type PageName = keyof typeof enhancedPageRegistry;

// Helper functions
export const getPageMetadata = (pageName: PageName): PageMetadata => {
  return enhancedPageRegistry[pageName]?.metadata || {};
};

export const getPageComponent = (pageName: PageName): PageRegistryEntry['component'] => {
  const entry = enhancedPageRegistry[pageName];
  if (!entry) {
    throw new Error(`Page "${pageName}" not found in registry`);
  }
  return entry.component;
};

export const isPageLoaded = (pageName: PageName): boolean => {
  return enhancedPageRegistry[pageName]?.loaded || false;
};

export const getPagesByBundle = (bundle: string): PageName[] => {
  return Object.keys(enhancedPageRegistry).filter(
    (pageName) => enhancedPageRegistry[pageName as PageName].metadata.bundle === bundle
  ) as PageName[];
};

export const getHighPriorityPages = (): PageName[] => {
  return Object.keys(enhancedPageRegistry).filter(
    (pageName) => enhancedPageRegistry[pageName as PageName].metadata.priority === 'high'
  ) as PageName[];
};

export const getPrefetchPages = (): PageName[] => {
  return Object.keys(enhancedPageRegistry).filter(
    (pageName) => enhancedPageRegistry[pageName as PageName].metadata.prefetch === true
  ) as PageName[];
};
