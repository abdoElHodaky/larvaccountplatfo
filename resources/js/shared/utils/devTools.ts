/**
 * Development Tools
 * Debugging and monitoring utilities for development environment
 */

import { performanceMonitor } from './performanceMonitor';
import { persistenceUtils } from '../stores/persistence';
import type { RootState } from '../stores';

// Development tools interface
interface DevTools {
  performance: typeof performanceMonitor;
  persistence: typeof persistenceUtils;
  store: {
    getState: () => RootState | null;
    dispatch: any;
    subscribe: (listener: () => void) => () => void;
  };
  lazy: {
    preloadAll: () => Promise<void>;
    clearCache: () => void;
    getLoadedComponents: () => string[];
  };
  bundle: {
    analyze: () => void;
    getChunkInfo: () => any;
  };
  debug: {
    enableVerboseLogging: () => void;
    disableVerboseLogging: () => void;
    logStateChanges: boolean;
    logLazyLoading: boolean;
    logPerformance: boolean;
  };
}

// Global state for dev tools
let globalStore: any = null;
let verboseLogging = false;
const stateChangeListeners: (() => void)[] = [];

// Component loading tracking
const loadedComponents = new Set<string>();
const componentLoadPromises = new Map<string, Promise<any>>();

// Development logger
const devLogger = {
  log: (category: string, message: string, data?: any) => {
    if (verboseLogging) {
      console.log(`[DevTools:${category}]`, message, data || '');
    }
  },
  
  warn: (category: string, message: string, data?: any) => {
    console.warn(`[DevTools:${category}]`, message, data || '');
  },
  
  error: (category: string, message: string, data?: any) => {
    console.error(`[DevTools:${category}]`, message, data || '');
  },
};

// Store utilities
const storeUtils = {
  getState: (): RootState | null => {
    return globalStore?.getState() || null;
  },
  
  dispatch: null as any,
  
  subscribe: (listener: () => void) => {
    stateChangeListeners.push(listener);
    return () => {
      const index = stateChangeListeners.indexOf(listener);
      if (index > -1) {
        stateChangeListeners.splice(index, 1);
      }
    };
  },
  
  setStore: (store: any) => {
    globalStore = store;
    storeUtils.dispatch = store.dispatch;
    
    // Subscribe to state changes for logging
    store.subscribe(() => {
      if (devTools.debug.logStateChanges) {
        devLogger.log('Store', 'State changed', store.getState());
      }
      
      // Notify listeners
      stateChangeListeners.forEach(listener => listener());
    });
  },
};

// Lazy loading utilities
const lazyUtils = {
  preloadAll: async (): Promise<void> => {
    devLogger.log('Lazy', 'Preloading all components...');
    
    const componentImports = [
      () => import('../../features/accounting/components/organisms/ChartOfAccounts'),
      () => import('../../features/accounting/pages/Accounts'),
      () => import('../../features/dashboard/pages/Dashboard'),
      () => import('../../features/auth/pages/Login'),
      () => import('../../features/auth/pages/Register'),
      // Add more component imports as needed
    ];
    
    const startTime = performance.now();
    
    try {
      await Promise.all(componentImports.map(importFn => importFn()));
      const endTime = performance.now();
      
      devLogger.log('Lazy', `All components preloaded in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      devLogger.error('Lazy', 'Failed to preload components', error);
    }
  },
  
  clearCache: (): void => {
    // Clear module cache (this is a simplified approach)
    devLogger.log('Lazy', 'Clearing component cache...');
    loadedComponents.clear();
    componentLoadPromises.clear();
  },
  
  getLoadedComponents: (): string[] => {
    return Array.from(loadedComponents);
  },
  
  trackComponentLoad: (componentName: string, loadPromise: Promise<any>) => {
    loadedComponents.add(componentName);
    componentLoadPromises.set(componentName, loadPromise);
    
    if (devTools.debug.logLazyLoading) {
      devLogger.log('Lazy', `Loading component: ${componentName}`);
    }
    
    loadPromise
      .then(() => {
        if (devTools.debug.logLazyLoading) {
          devLogger.log('Lazy', `Component loaded: ${componentName}`);
        }
      })
      .catch((error) => {
        devLogger.error('Lazy', `Failed to load component: ${componentName}`, error);
      });
  },
};

// Bundle analysis utilities
const bundleUtils = {
  analyze: (): void => {
    devLogger.log('Bundle', 'Analyzing bundle...');
    
    // Get performance navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      
      console.table({
        'Total Load Time': `${loadTime.toFixed(2)}ms`,
        'DOM Content Loaded': `${domContentLoaded.toFixed(2)}ms`,
        'DNS Lookup': `${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`,
        'TCP Connection': `${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`,
        'Request/Response': `${(navigation.responseEnd - navigation.requestStart).toFixed(2)}ms`,
      });
    }
    
    // Get resource timing
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const cssResources = resources.filter(r => r.name.includes('.css'));
    
    devLogger.log('Bundle', `Loaded ${jsResources.length} JS files, ${cssResources.length} CSS files`);
    
    // Log largest resources
    const largestResources = resources
      .sort((a, b) => (b as any).transferSize - (a as any).transferSize)
      .slice(0, 10);
    
    console.table(largestResources.map(r => ({
      name: r.name.split('/').pop(),
      size: `${((r as any).transferSize / 1024).toFixed(2)}KB`,
      duration: `${r.duration.toFixed(2)}ms`,
    })));
  },
  
  getChunkInfo: (): any => {
    // This would typically require webpack bundle analyzer integration
    // For now, return basic info
    return {
      loadedChunks: loadedComponents.size,
      totalComponents: componentLoadPromises.size,
      cacheHitRate: performanceMonitor.getStats().lazyLoad.cacheHitRate,
    };
  },
};

// Debug configuration
const debugConfig = {
  logStateChanges: false,
  logLazyLoading: false,
  logPerformance: false,
  
  enableVerboseLogging: () => {
    verboseLogging = true;
    debugConfig.logStateChanges = true;
    debugConfig.logLazyLoading = true;
    debugConfig.logPerformance = true;
    
    devLogger.log('Debug', 'Verbose logging enabled');
    
    // Subscribe to performance events
    performanceMonitor.subscribe((metric) => {
      if (debugConfig.logPerformance) {
        devLogger.log('Performance', `Metric: ${metric.name}`, {
          duration: metric.duration,
          metadata: metric.metadata,
        });
      }
    });
  },
  
  disableVerboseLogging: () => {
    verboseLogging = false;
    debugConfig.logStateChanges = false;
    debugConfig.logLazyLoading = false;
    debugConfig.logPerformance = false;
    
    devLogger.log('Debug', 'Verbose logging disabled');
  },
};

// Main dev tools object
export const devTools: DevTools = {
  performance: performanceMonitor,
  persistence: persistenceUtils,
  store: storeUtils,
  lazy: lazyUtils,
  bundle: bundleUtils,
  debug: debugConfig,
};

// Initialize dev tools in development
if (process.env.NODE_ENV === 'development') {
  // Add to window for global access
  (window as any).__devTools = devTools;
  
  // Add helpful console messages
  console.log(
    '%c🛠️ DevTools Available',
    'color: #10B981; font-weight: bold; font-size: 14px;',
    '\nAccess via window.__devTools or devTools import'
  );
  
  console.log(
    '%cAvailable commands:',
    'color: #6B7280; font-weight: bold;',
    `
    __devTools.debug.enableVerboseLogging() - Enable detailed logging
    __devTools.performance.getStats() - Get performance statistics
    __devTools.lazy.preloadAll() - Preload all lazy components
    __devTools.bundle.analyze() - Analyze bundle performance
    __devTools.persistence.clearAll() - Clear all persisted data
    `
  );
  
  // Auto-enable some debugging in development
  if (localStorage.getItem('devtools-verbose') === 'true') {
    debugConfig.enableVerboseLogging();
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+D to toggle verbose logging
    if (event.ctrlKey && event.shiftKey && event.key === 'D') {
      event.preventDefault();
      if (verboseLogging) {
        debugConfig.disableVerboseLogging();
        localStorage.setItem('devtools-verbose', 'false');
      } else {
        debugConfig.enableVerboseLogging();
        localStorage.setItem('devtools-verbose', 'true');
      }
    }
    
    // Ctrl+Shift+P to show performance stats
    if (event.ctrlKey && event.shiftKey && event.key === 'P') {
      event.preventDefault();
      console.table(performanceMonitor.getStats());
    }
    
    // Ctrl+Shift+L to preload all components
    if (event.ctrlKey && event.shiftKey && event.key === 'L') {
      event.preventDefault();
      lazyUtils.preloadAll();
    }
  });
}

// Export utilities for use in components
export const useDevTools = () => {
  return {
    logComponentMount: (componentName: string) => {
      if (debugConfig.logStateChanges) {
        devLogger.log('Component', `Mounted: ${componentName}`);
      }
    },
    
    logComponentUnmount: (componentName: string) => {
      if (debugConfig.logStateChanges) {
        devLogger.log('Component', `Unmounted: ${componentName}`);
      }
    },
    
    trackLazyLoad: (componentName: string, loadPromise: Promise<any>) => {
      lazyUtils.trackComponentLoad(componentName, loadPromise);
    },
    
    measureRender: (componentName: string, renderFn: () => void) => {
      if (debugConfig.logPerformance) {
        const startTime = performance.now();
        renderFn();
        const endTime = performance.now();
        devLogger.log('Performance', `Render time for ${componentName}: ${(endTime - startTime).toFixed(2)}ms`);
      } else {
        renderFn();
      }
    },
  };
};

// Export store setter for initialization
export const setDevToolsStore = (store: any) => {
  storeUtils.setStore(store);
};

export default devTools;
