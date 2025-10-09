/**
 * Lazy Routes Configuration
 * Route-based code splitting with React.lazy and Rematch integration
 */

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useRematchStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Lazy-loaded page components
const DashboardPage = React.lazy(() => import('../../features/dashboard/pages/Dashboard'));
const AccountsPage = React.lazy(() => import('../../features/accounting/pages/Accounts'));
const TransactionsPage = React.lazy(() => import('../../features/accounting/pages/Transactions'));
const JournalEntriesPage = React.lazy(() => import('../../features/accounting/pages/JournalEntries'));
const LoginPage = React.lazy(() => import('../../features/auth/pages/Login'));
const RegisterPage = React.lazy(() => import('../../features/auth/pages/Register'));

// Route-specific loading components
const RouteLoadingFallback: React.FC<{ routeName: string }> = ({ routeName }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Loading {routeName}...</p>
    </div>
  </div>
);

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route wrapper (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Route configuration with lazy loading
export const LazyRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Suspense fallback={<RouteLoadingFallback routeName="Login" />}>
              <LoginPage />
            </Suspense>
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Suspense fallback={<RouteLoadingFallback routeName="Register" />}>
              <RegisterPage />
            </Suspense>
          </PublicRoute>
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback routeName="Dashboard" />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />

      {/* Accounting Routes */}
      <Route 
        path="/accounting/accounts" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback routeName="Chart of Accounts" />}>
              <AccountsPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/accounting/transactions" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback routeName="Transactions" />}>
              <TransactionsPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/accounting/journal-entries" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback routeName="Journal Entries" />}>
              <JournalEntriesPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />

      {/* Default redirects */}
      <Route path="/accounting" element={<Navigate to="/accounting/accounts" replace />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 Route */}
      <Route 
        path="*" 
        element={
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900">404</h1>
              <p className="mt-2 text-gray-600">Page not found</p>
              <button 
                onClick={() => window.history.back()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          </div>
        } 
      />
    </Routes>
  );
};

// Route preloading utilities
export const preloadRoutes = {
  dashboard: () => import('../../features/dashboard/pages/Dashboard'),
  accounts: () => import('../../features/accounting/pages/Accounts'),
  transactions: () => import('../../features/accounting/pages/Transactions'),
  journalEntries: () => import('../../features/accounting/pages/JournalEntries'),
  login: () => import('../../features/auth/pages/Login'),
  register: () => import('../../features/auth/pages/Register'),
};

// Preload routes based on user role/permissions
export const preloadByUserRole = (userRole: string, permissions: string[]) => {
  // Always preload dashboard for authenticated users
  preloadRoutes.dashboard();
  
  // Preload accounting routes if user has accounting permissions
  if (permissions.includes('view_accounts')) {
    preloadRoutes.accounts();
  }
  
  if (permissions.includes('view_transactions')) {
    preloadRoutes.transactions();
  }
  
  if (permissions.includes('view_journal_entries')) {
    preloadRoutes.journalEntries();
  }
};

// Preload routes on hover (for navigation links)
export const preloadOnHover = (routeName: keyof typeof preloadRoutes) => {
  return {
    onMouseEnter: () => {
      preloadRoutes[routeName]();
    },
  };
};

export default LazyRoutes;
