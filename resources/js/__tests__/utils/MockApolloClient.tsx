/**
 * Testing Utilities for Rematch + React.lazy Architecture
 * Provides utilities for testing components with Rematch store and lazy loading
 */

import React, { ReactElement, Suspense } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { init } from '@rematch/PATTERNS';
import { models } from '../../shared/stores';
import { vi } from 'vitest';

// Mock Apollo Client for testing
export const mockApolloClient = {
  query: vi.fn(),
  mutate: vi.fn(),
  watchQuery: vi.fn(),
  readQuery: vi.fn(),
  writeQuery: vi.fn(),
  cache: {
    readQuery: vi.fn(),
    writeQuery: vi.fn(),
    evict: vi.fn(),
    gc: vi.fn(),
    modify: vi.fn(),
    identify: vi.fn(),
  },
};

// Mock GraphQL operations
export const mockGraphQLOperations = {
  getAccounts: vi.fn(),
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
  deleteAccount: vi.fn(),
  getTransactions: vi.fn(),
  getJournalEntries: vi.fn(),
  createJournalEntry: vi.fn(),
};

// Create test store with initial state
export const createTestStore = (initialState?: any) => {
  return init({
    models: models as any,
    redux: {
      initialState: initialState as any,
    },
  });
};

// Test wrapper component with providers
interface TestWrapperProps {
  children: React.ReactNode;
  initialState?: any;
  store?: ReturnType<typeof createTestStore>;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  initialState,
  store: providedStore 
}) => {
  const store = providedStore || createTestStore(initialState);
  
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          {children}
        </Suspense>
      </BrowserRouter>
    </Provider>
  );
};

// Custom render function with providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: {
    initialState?: any;
    store?: ReturnType<typeof createTestStore>;
    renderOptions?: Omit<RenderOptions, 'wrapper'>;
  }
) => {
  const { initialState, store, renderOptions } = options || {};
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestWrapper initialState={initialState} store={store}>
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock lazy component for testing
export const createMockLazyComponent = (name: string, props?: any) => {
  const MockComponent = (componentProps: any) => (
    <div data-testid={`mock-${name.toLowerCase()}`} {...componentProps}>
      Mock {name} Component
      {props && <pre>{JSON.stringify(props, null, 2)}</pre>}
    </div>
  );
  
  MockComponent.displayName = `Mock${name}`;
  return MockComponent;
};

// Utility to wait for lazy components to load
export const waitForLazyComponent = async (testId: string) => {
  const { screen } = await import('@testing-library/react');
  return screen.findByTestId(testId);
};

// Mock store actions for testing
export const createMockStoreActions = () => ({
  app: {
    setLoading: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    setTheme: vi.fn(),
    setLanguage: vi.fn(),
  },
  auth: {
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    clearAuth: vi.fn(),
  },
  accounting: {
    fetchAccounts: vi.fn(),
    createAccount: vi.fn(),
    updateAccountData: vi.fn(),
    deleteAccount: vi.fn(),
    setSelectedAccount: vi.fn(),
    fetchTransactions: vi.fn(),
    setSelectedTransaction: vi.fn(),
    fetchJournalEntries: vi.fn(),
    setSelectedJournalEntry: vi.fn(),
    updateFilters: vi.fn(),
    resetFilters: vi.fn(),
    setCurrentView: vi.fn(),
    clearError: vi.fn(),
    initializeAccounting: vi.fn(),
  },
});

// Test data factories
export const createMockAccount = (overrides = {}) => ({
  id: '1',
  code: '1000',
  name: 'Test Account',
  type: 'asset' as const,
  subtype: 'current',
  balance: 1000,
  isActive: true,
  description: 'Test account description',
  taxCode: 'TAX001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockTransaction = (overrides = {}) => ({
  id: '1',
  date: new Date().toISOString(),
  reference: 'TXN001',
  description: 'Test transaction',
  amount: 100,
  type: 'debit' as const,
  accountId: '1',
  account: createMockAccount(),
  journalEntryId: '1',
  reconciled: false,
  tags: ['test'],
  attachments: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockJournalEntry = (overrides = {}) => ({
  id: '1',
  date: new Date().toISOString(),
  reference: 'JE001',
  description: 'Test journal entry',
  totalAmount: 200,
  status: 'draft' as const,
  transactions: [createMockTransaction()],
  attachments: [],
  notes: 'Test notes',
  createdBy: 'user1',
  approvedBy: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Mock initial states
export const mockInitialStates = {
  app: {
    loading: false,
    error: null,
    theme: 'light' as const,
    language: 'en',
    notifications: [],
  },
  auth: {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null,
  },
  accounting: {
    accounts: [],
    transactions: [],
    journalEntries: [],
    selectedAccount: null,
    selectedTransaction: null,
    selectedJournalEntry: null,
    accountsLoading: false,
    transactionsLoading: false,
    journalEntriesLoading: false,
    error: null,
    filters: {
      searchTerm: '',
      accountTypes: [],
      dateRange: null,
      status: null,
      reconciled: null,
    },
    currentView: 'accounts' as const,
  },
};

// Utility to create authenticated test state
export const createAuthenticatedState = (userOverrides = {}) => ({
  ...mockInitialStates,
  auth: {
    ...mockInitialStates.auth,
    isAuthenticated: true,
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      permissions: ['view_accounts', 'create_accounts', 'edit_accounts'],
      ...userOverrides,
    },
    token: 'mock-jwt-token',
  },
});

// Performance testing utilities
export const measureLazyLoadTime = async (importFn: () => Promise<any>) => {
  const start = performance.now();
  await importFn();
  const end = performance.now();
  return end - start;
};

// Mock intersection observer for lazy loading tests
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

// Cleanup utilities
export const cleanupMocks = () => {
  vi.clearAllMocks();
  // Reset any global mocks
};

export default {
  renderWithProviders,
  createTestStore,
  createMockLazyComponent,
  waitForLazyComponent,
  createMockStoreActions,
  createMockAccount,
  createMockTransaction,
  createMockJournalEntry,
  mockInitialStates,
  createAuthenticatedState,
  measureLazyLoadTime,
  mockIntersectionObserver,
  cleanupMocks,
};
