/**
 * Advanced Component Patterns
 * Compound components, render props, and advanced patterns for reusable UI
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, ReactElement } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

// Compound Component Pattern - Modal
interface ModalContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal compound components must be used within Modal');
  }
  return context;
};

interface ModalProps {
  children: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

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

const ModalTrigger = ({ children, asChild = false }: { children: ReactNode; asChild?: boolean }) => {
  const { open } = useModalContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e: any) => {
        children.props.onClick?.(e);
        open();
      },
    });
  }

  return (
    <button
      onClick={open}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {children}
    </button>
  );
};

const ModalContent = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const { isOpen, close } = useModalContext();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={close}
        />

        {/* Modal panel */}
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

const ModalHeader = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${className}`}>
    <div className="sm:flex sm:items-start">
      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {children}
        </h3>
      </div>
    </div>
  </div>
);

const ModalBody = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`px-4 pb-4 sm:px-6 sm:pb-4 ${className}`}>
    {children}
  </div>
);

const ModalFooter = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${className}`}>
    {children}
  </div>
);

const ModalClose = ({ children, asChild = false }: { children: ReactNode; asChild?: boolean }) => {
  const { close } = useModalContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e: any) => {
        children.props.onClick?.(e);
        close();
      },
    });
  }

  return (
    <button
      onClick={close}
      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
    >
      {children}
    </button>
  );
};

// Attach compound components
Modal.Trigger = ModalTrigger;
Modal.Content = ModalContent;
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Close = ModalClose;

// Render Props Pattern - Data Fetcher
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

const DataFetcher = <T,>({ url, children, onSuccess, onError }: DataFetcherProps<T>) => {
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

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return <>{children({ data, loading, error, refetch: fetchData })}</>;
};

// Higher-Order Component Pattern - With Loading
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

// Compound Component Pattern - Tabs
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within Tabs');
  }
  return context;
};

interface TabsProps {
  children: ReactNode;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
}

const Tabs = ({ children, defaultTab, onTabChange }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || '');

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  }, [onTabChange]);

  const value = { activeTab, setActiveTab: handleTabChange };

  return (
    <TabsContext.Provider value={value}>
      <div className="w-full">
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`flex space-x-1 rounded-xl bg-blue-900/20 p-1 ${className}`}>
    {children}
  </div>
);

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

const TabsTrigger = ({ value, children, className = '' }: TabsTriggerProps) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60 ${
        isActive
          ? 'bg-white text-blue-700 shadow'
          : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
      } ${className}`}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

const TabsContent = ({ value, children, className = '' }: TabsContentProps) => {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <div className={`rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${className}`}>
      {children}
    </div>
  );
};

// Attach compound components
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

// Render Props Pattern - Toggle
interface ToggleProps {
  children: (state: {
    isOn: boolean;
    toggle: () => void;
    turnOn: () => void;
    turnOff: () => void;
  }) => ReactNode;
  defaultOn?: boolean;
  onToggle?: (isOn: boolean) => void;
}

const Toggle = ({ children, defaultOn = false, onToggle }: ToggleProps) => {
  const [isOn, setIsOn] = useState(defaultOn);

  const toggle = useCallback(() => {
    const newState = !isOn;
    setIsOn(newState);
    onToggle?.(newState);
  }, [isOn, onToggle]);

  const turnOn = useCallback(() => {
    setIsOn(true);
    onToggle?.(true);
  }, [onToggle]);

  const turnOff = useCallback(() => {
    setIsOn(false);
    onToggle?.(false);
  }, [onToggle]);

  return <>{children({ isOn, toggle, turnOn, turnOff })}</>;
};

// Provider Pattern - Theme
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

// Compound Component with Error Boundary
const SafeModal = ({ children, ...props }: ModalProps) => (
  <ErrorBoundary
    fallback={
      <div className="p-4 text-center">
        <p className="text-red-600">Failed to load modal content</p>
      </div>
    }
  >
    <Modal {...props}>
      {children}
    </Modal>
  </ErrorBoundary>
);

// Export all patterns
export {
  Modal,
  SafeModal,
  DataFetcher,
  withLoading,
  Tabs,
  Toggle,
  ThemeProvider,
  useTheme,
};

// Example usage components for documentation
export const ExampleUsage = {
  Modal: () => (
    <Modal>
      <Modal.Trigger>Open Modal</Modal.Trigger>
      <Modal.Content>
        <Modal.Header>Confirm Action</Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to proceed?</p>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>Cancel</Modal.Close>
          <Modal.Close asChild>
            <button className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
              Delete
            </button>
          </Modal.Close>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),

  DataFetcher: () => (
    <DataFetcher<{ name: string; id: number }> url="/api/user">
      {({ data, loading, error, refetch }) => (
        <div>
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-600">Error: {error}</p>}
          {data && <p>Hello, {data.name}!</p>}
          <button onClick={refetch}>Refresh</button>
        </div>
      )}
    </DataFetcher>
  ),

  Tabs: () => (
    <Tabs defaultTab="tab1">
      <Tabs.List>
        <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
        <Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="tab1">Content for Tab 1</Tabs.Content>
      <Tabs.Content value="tab2">Content for Tab 2</Tabs.Content>
      <Tabs.Content value="tab3">Content for Tab 3</Tabs.Content>
    </Tabs>
  ),

  Toggle: () => (
    <Toggle>
      {({ isOn, toggle }) => (
        <button
          onClick={toggle}
          className={`px-4 py-2 rounded ${
            isOn ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'
          }`}
        >
          {isOn ? 'ON' : 'OFF'}
        </button>
      )}
    </Toggle>
  ),
};
