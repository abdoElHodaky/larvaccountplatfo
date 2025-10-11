/**
 * Page Template - Phase 6 Unified Design System
 * 
 * A standardized page template that provides consistent layout,
 * navigation, and structure for all Inertia.js pages.
 */

import React from 'react';
import { Head } from '@inertiajs/react';
import { Container } from '../layout/Container';
import { cn } from '@/shared/utils/cn';

export interface PageTemplateProps {
  /** Page title for document head */
  title: string;
  /** Page description for SEO */
  description?: string;
  /** Page header content */
  header?: React.ReactNode;
  /** Page sidebar content */
  sidebar?: React.ReactNode;
  /** Main page content */
  children: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Whether to show the page header */
  showHeader?: boolean;
  /** Whether to show the sidebar */
  showSidebar?: boolean;
  /** Container size */
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Custom page classes */
  className?: string;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** Page actions (buttons, etc.) */
  actions?: React.ReactNode;
  /** Breadcrumb navigation */
  breadcrumbs?: React.ReactNode;
}

export const PageTemplate: React.FC<PageTemplateProps> = ({
  title,
  description,
  header,
  sidebar,
  children,
  footer,
  showHeader = true,
  showSidebar = false,
  containerSize = 'xl',
  className,
  loading = false,
  error = null,
  actions,
  breadcrumbs,
}) => {
  const pageClasses = cn(
    'min-h-screen bg-gray-50 dark:bg-gray-900',
    className
  );

  const mainClasses = cn(
    'flex-1',
    showSidebar && 'lg:pl-64'
  );

  const contentClasses = cn(
    'py-6',
    loading && 'opacity-50 pointer-events-none'
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
      </Head>

      <div className={pageClasses}>
        {/* Sidebar */}
        {showSidebar && sidebar && (
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg lg:block hidden">
            <div className="flex flex-col h-full">
              {sidebar}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={mainClasses}>
          {/* Page Header */}
          {showHeader && (
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
              <Container size={containerSize}>
                <div className="py-4">
                  {/* Breadcrumbs */}
                  {breadcrumbs && (
                    <div className="mb-4">
                      {breadcrumbs}
                    </div>
                  )}

                  {/* Header Content */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {header || (
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {title}
                          </h1>
                          {description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Page Actions */}
                    {actions && (
                      <div className="flex items-center space-x-3">
                        {actions}
                      </div>
                    )}
                  </div>
                </div>
              </Container>
            </header>
          )}

          {/* Page Content */}
          <main className={contentClasses}>
            <Container size={containerSize}>
              {/* Error State */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Loading...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content */}
              {children}
            </Container>
          </main>

          {/* Page Footer */}
          {footer && (
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <Container size={containerSize}>
                <div className="py-4">
                  {footer}
                </div>
              </Container>
            </footer>
          )}
        </div>
      </div>
    </>
  );
};
