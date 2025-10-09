# 🧩 Component Patterns Guide

> **Modern React patterns for scalable and maintainable components**

## 📋 Table of Contents

- [Overview](#overview)
- [Compound Components](#compound-components)
- [Render Props Pattern](#render-props-pattern)
- [Higher-Order Components](#higher-order-components)
- [Context Providers](#context-providers)
- [Custom Hooks](#custom-hooks)
- [Error Boundaries](#error-boundaries)
- [Performance Patterns](#performance-patterns)
- [Best Practices](#best-practices)

## 🎯 Overview

The Laravel Account Platform uses advanced React patterns to create reusable, composable, and maintainable components. These patterns provide flexibility while maintaining consistency across the application.

### **Pattern Benefits**

- **🧩 Composability**: Components can be combined in flexible ways
- **🔄 Reusability**: Patterns can be applied across different features
- **🎯 Separation of Concerns**: Logic and presentation are clearly separated
- **🛡️ Type Safety**: Full TypeScript support for all patterns
- **⚡ Performance**: Optimized for React's rendering behavior

## 🏗️ Compound Components

Compound components allow you to create components that work together to form a complete UI pattern.

### **Modal System**

```typescript
// Usage
<Modal>
  <Modal.Trigger>Open Modal</Modal.Trigger>
  <Modal.Content>
    <Modal.Header>Confirm Action</Modal.Header>
    <Modal.Body>
      <p>Are you sure you want to delete this account?</p>
    </Modal.Body>
    <Modal.Footer>
      <Modal.Close>Cancel</Modal.Close>
      <Modal.Close asChild>
        <button className="danger">Delete</button>
      </Modal.Close>
    </Modal.Footer>
  </Modal.Content>
</Modal>
```

### **Implementation**

```typescript
// Modal Context
interface ModalContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

// Main Modal Component
const Modal = ({ children, defaultOpen = false, onOpenChange }: ModalProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);

  const close = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const value = { isOpen, open, close };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

// Compound Components
const ModalTrigger = ({ children, asChild = false }: ModalTriggerProps) => {
  const { open } = useModalContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e: any) => {
        children.props.onClick?.(e);
        open();
      },
    });
  }

  return <button onClick={open}>{children}</button>;
};

// Attach compound components
Modal.Trigger = ModalTrigger;
Modal.Content = ModalContent;
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Close = ModalClose;
```

### **Tabs System**

```typescript
// Usage
<Tabs defaultTab="overview">
  <Tabs.List>
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="transactions">Transactions</Tabs.Trigger>
    <Tabs.Trigger value="reports">Reports</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">
    <AccountOverview />
  </Tabs.Content>
  <Tabs.Content value="transactions">
    <TransactionsList />
  </Tabs.Content>
  <Tabs.Content value="reports">
    <ReportsPanel />
  </Tabs.Content>
</Tabs>
```

### **Benefits of Compound Components**

- **Flexible Composition**: Components can be arranged in different ways
- **Implicit State Sharing**: Context provides shared state automatically
- **Type Safety**: TypeScript ensures correct usage
- **Accessibility**: Built-in ARIA attributes and keyboard navigation

## 🎭 Render Props Pattern

Render props provide a way to share code between components using a prop whose value is a function.

### **Data Fetcher**

```typescript
// Usage
<DataFetcher<Account[]> url="/api/accounts">
  {({ data, loading, error, refetch }) => (
    <div>
      {loading && <LoadingSpinner />}
      {error && (
        <ErrorMessage 
          error={error} 
          onRetry={refetch}
        />
      )}
      {data && (
        <AccountsList 
          accounts={data}
          onRefresh={refetch}
        />
      )}
    </div>
  )}
</DataFetcher>
```

### **Implementation**

```typescript
interface DataFetcherProps<T> {
  url: string;
  children: (state: {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
  }) => ReactNode;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

const DataFetcher = <T,>({ 
  url, 
  children, 
  onSuccess, 
  onError 
}: DataFetcherProps<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      onSuccess?.(result);
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [url, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return <>{children({ data, loading, error, refetch: fetchData })}</>;
};
```

### **Toggle Pattern**

```typescript
// Usage
<Toggle defaultOn={false}>
  {({ isOn, toggle, turnOn, turnOff }) => (
    <div>
      <button onClick={toggle}>
        {isOn ? 'Turn Off' : 'Turn On'}
      </button>
      <div className={`feature ${isOn ? 'active' : 'inactive'}`}>
        Feature is {isOn ? 'enabled' : 'disabled'}
      </div>
    </div>
  )}
</Toggle>
```

### **Benefits of Render Props**

- **Maximum Flexibility**: Complete control over rendering
- **Logic Reuse**: Share stateful logic between components
- **Type Safety**: Generic types ensure type safety
- **Testability**: Easy to test logic separately from UI

## 🎨 Higher-Order Components

HOCs are functions that take a component and return a new component with additional functionality.

### **withLoading HOC**

```typescript
// Usage
const AccountsListWithLoading = withLoading(AccountsList);

<AccountsListWithLoading 
  loading={isLoading}
  loadingComponent={<AccountsListSkeleton />}
  accounts={accounts}
/>
```

### **Implementation**

```typescript
interface WithLoadingProps {
  loading?: boolean;
  loadingComponent?: ReactNode;
}

const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithLoadingComponent: React.FC<P & WithLoadingProps> = ({
    loading = false,
    loadingComponent,
    ...props
  }) => {
    if (loading) {
      return (
        loadingComponent || (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )
      );
    }

    return <WrappedComponent {...(props as P)} />;
  };

  WithLoadingComponent.displayName = `withLoading(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithLoadingComponent;
};
```

### **withErrorBoundary HOC**

```typescript
// Usage
const SafeAccountForm = withErrorBoundary(AccountForm, {
  fallback: <div>Error loading account form</div>,
  onError: (error) => console.error('Account form error:', error)
});
```

### **Implementation**

```typescript
interface WithErrorBoundaryOptions {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) => {
  const WithErrorBoundaryComponent: React.FC<P> = (props) => (
    <ErrorBoundary
      fallback={options.fallback}
      onError={options.onError}
    >
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithErrorBoundaryComponent;
};
```

### **Benefits of HOCs**

- **Cross-Cutting Concerns**: Handle common functionality across components
- **Composition**: Multiple HOCs can be composed together
- **Reusability**: Same HOC can be applied to different components
- **Separation**: Keep component logic focused on presentation

## 🌐 Context Providers

Context providers manage global or feature-specific state that needs to be shared across components.

### **Theme Provider**

```typescript
// Usage
<ThemeProvider defaultTheme="light">
  <App />
</ThemeProvider>

// In components
const MyComponent = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <div className={theme === 'dark' ? 'dark' : 'light'}>
      <button onClick={toggleTheme}>
        Switch to {theme === 'light' ? 'dark' : 'light'} mode
      </button>
    </div>
  );
};
```

### **Implementation**

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark';
}

const ThemeProvider = ({ children, defaultTheme = 'light' }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultTheme);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const value = { theme, toggleTheme, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      <div className={theme === 'dark' ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
```

### **Feature Context Provider**

```typescript
// Accounting Context
interface AccountingContextType {
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account | null) => void;
  filters: AccountingFilters;
  updateFilters: (filters: Partial<AccountingFilters>) => void;
}

const AccountingContext = createContext<AccountingContextType | null>(null);

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within AccountingProvider');
  }
  return context;
};

const AccountingProvider = ({ children }: { children: ReactNode }) => {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [filters, setFilters] = useState<AccountingFilters>(defaultFilters);

  const updateFilters = useCallback((newFilters: Partial<AccountingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const value = {
    selectedAccount,
    setSelectedAccount,
    filters,
    updateFilters,
  };

  return (
    <AccountingContext.Provider value={value}>
      {children}
    </AccountingContext.Provider>
  );
};
```

## 🪝 Custom Hooks

Custom hooks encapsulate stateful logic that can be reused across components.

### **useLocalStorage Hook**

```typescript
// Usage
const useAccountPreferences = () => {
  const [preferences, setPreferences] = useLocalStorage('account-preferences', {
    sortBy: 'name',
    showInactive: false,
    pageSize: 25,
  });

  return { preferences, setPreferences };
};
```

### **Implementation**

```typescript
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}
```

### **useDebounce Hook**

```typescript
// Usage
const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Perform search
      searchAccounts(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search accounts..."
    />
  );
};
```

### **Implementation**

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### **useAsync Hook**

```typescript
// Usage
const AccountDetails = ({ accountId }: { accountId: string }) => {
  const { data: account, loading, error, execute } = useAsync(
    () => accountingApi.getAccount(accountId),
    [accountId]
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={execute} />;
  if (!account) return <div>Account not found</div>;

  return <AccountDetailsView account={account} />;
};
```

### **Implementation**

```typescript
interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
    } catch (error: any) {
      setState({ data: null, loading: false, error: error.message || 'An error occurred' });
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, execute };
}
```

## 🛡️ Error Boundaries

Error boundaries catch JavaScript errors anywhere in the component tree and display fallback UI.

### **Generic Error Boundary**

```typescript
// Usage
<ErrorBoundary
  fallback={<div>Something went wrong</div>}
  onError={(error, errorInfo) => {
    console.error('Error caught by boundary:', error);
    // Send to error reporting service
  }}
>
  <MyComponent />
</ErrorBoundary>
```

### **Implementation**

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            {this.state.error?.message}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### **Lazy Load Error Boundary**

```typescript
// Usage
<LazyLoadErrorBoundary
  componentName="AccountsPage"
  fallbackComponent={<AccountsPageSkeleton />}
>
  <Suspense fallback={<LoadingSpinner />}>
    <LazyAccountsPage />
  </Suspense>
</LazyLoadErrorBoundary>
```

## ⚡ Performance Patterns

### **Memoization Patterns**

```typescript
// Component memoization
const AccountListItem = memo<AccountListItemProps>(({ account, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(account);
  }, [account, onSelect]);

  const formattedBalance = useMemo(() => 
    formatCurrency(account.balance, account.currency),
    [account.balance, account.currency]
  );

  return (
    <div onClick={handleClick}>
      <span>{account.name}</span>
      <span>{formattedBalance}</span>
    </div>
  );
});

// List memoization
const AccountsList = memo<AccountsListProps>(({ accounts, onAccountSelect }) => {
  const sortedAccounts = useMemo(() => 
    accounts.sort((a, b) => a.name.localeCompare(b.name)),
    [accounts]
  );

  return (
    <div>
      {sortedAccounts.map(account => (
        <AccountListItem
          key={account.id}
          account={account}
          onSelect={onAccountSelect}
        />
      ))}
    </div>
  );
});
```

### **Lazy Loading Pattern**

```typescript
// Component lazy loading
const LazyAccountsPage = lazy(() => 
  import('../pages/AccountsPage').then(module => ({
    default: module.AccountsPage
  }))
);

// With preloading
const AccountsPageWithPreload = createLazyComponent(
  () => import('../pages/AccountsPage'),
  {
    preload: true,
    fallback: <AccountsPageSkeleton />
  }
);

// Usage with error boundary
<ErrorBoundary fallback={<ErrorPage />}>
  <Suspense fallback={<LoadingSpinner />}>
    <LazyAccountsPage />
  </Suspense>
</ErrorBoundary>
```

## 📋 Best Practices

### **1. Choose the Right Pattern**

- **Compound Components**: For complex UI patterns with multiple related parts
- **Render Props**: When you need maximum flexibility in rendering
- **HOCs**: For cross-cutting concerns and reusable functionality
- **Context**: For sharing state across multiple components
- **Custom Hooks**: For reusable stateful logic

### **2. TypeScript Integration**

```typescript
// Always provide proper types
interface ModalProps {
  children: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Use generics for reusable patterns
interface DataFetcherProps<T> {
  url: string;
  children: (state: DataFetcherState<T>) => ReactNode;
}

// Export types for consumers
export type { ModalProps, DataFetcherProps };
```

### **3. Performance Considerations**

```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => 
  expensiveCalculation(data), [data]
);

// Memoize event handlers
const handleClick = useCallback(() => {
  onItemClick(item.id);
}, [item.id, onItemClick]);

// Memoize components
const OptimizedComponent = memo(MyComponent);
```

### **4. Error Handling**

```typescript
// Always provide error boundaries
<ErrorBoundary>
  <FeatureComponent />
</ErrorBoundary>

// Handle async errors in custom hooks
const useAsyncWithErrorHandling = (asyncFn) => {
  const [error, setError] = useState(null);
  
  const execute = useCallback(async () => {
    try {
      setError(null);
      return await asyncFn();
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [asyncFn]);

  return { execute, error };
};
```

### **5. Testing Patterns**

```typescript
// Test compound components
test('Modal opens and closes correctly', () => {
  render(
    <Modal>
      <Modal.Trigger>Open</Modal.Trigger>
      <Modal.Content>
        <Modal.Header>Test</Modal.Header>
        <Modal.Close>Close</Modal.Close>
      </Modal.Content>
    </Modal>
  );

  fireEvent.click(screen.getByText('Open'));
  expect(screen.getByText('Test')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Close'));
  expect(screen.queryByText('Test')).not.toBeInTheDocument();
});

// Test render props
test('DataFetcher handles loading and error states', async () => {
  const mockFetch = jest.fn();
  
  render(
    <DataFetcher url="/api/test">
      {({ data, loading, error }) => (
        <div>
          {loading && <div>Loading...</div>}
          {error && <div>Error: {error}</div>}
          {data && <div>Data: {data}</div>}
        </div>
      )}
    </DataFetcher>
  );

  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

---

**These component patterns provide a solid foundation for building scalable, maintainable, and performant React applications. Each pattern serves specific use cases and can be combined to create powerful, flexible components.**
