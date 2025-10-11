import '../css/app.css';
import './bootstrap';

import { createRoot } from 'react-dom/client';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: any) => void;
  }
}
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import AppProviders from './app/providers/AppProviders';
import { routePreloader } from './shared/utils/routeBasedLazyLoading';
import { MobileOptimizationManager } from './shared/utils/mobileOptimization';
import { PWAEnhancementManager } from './shared/utils/pwaEnhancements';
import { PerformanceAnalyticsDashboard } from './shared/utils/performanceAnalytics';

const appName = (import.meta as any).env?.VITE_APP_NAME || 'Laravel Accounting Platform';

// Enhanced page resolver with Phase 6 optimizations
const resolvePageWithEnhancements = async (name: string) => {
  // Import enhanced page registry
  const { getPageComponent, getPageMetadata } = await import('@/shared/services/inertia/PageRegistry');
  
  try {
    // Get page component from enhanced registry
    const pageComponent = getPageComponent(name as any);
    const metadata = getPageMetadata(name as any);
    
    // Load the component
    const component = await pageComponent();
    
    // Preload related pages based on metadata
    if (metadata.preload) {
      setTimeout(() => {
        metadata.preload?.forEach(async (preloadPage) => {
          try {
            const preloadComponent = getPageComponent(preloadPage as any);
            preloadComponent(); // Start loading but don't await
          } catch (error) {
            console.warn(`Failed to preload page: ${preloadPage}`, error);
          }
        });
      }, 100);
    }
    
    return component;
  } catch (error) {
    // Fallback to original resolver
    console.warn(`Enhanced resolver failed for ${name}, falling back to original`, error);
    const pages = (import.meta as any).glob('./features/**/*.tsx');
    return await resolvePageComponent(`./features/${name}.tsx`, pages);
  }
};

// Performance monitoring
const performanceObserver = {
  measurePageLoad: (pageName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        // Log performance metrics
        console.log(`Page load time for ${pageName}: ${loadTime.toFixed(2)}ms`);
        
        // Send to analytics if available
        if (window.gtag) {
          window.gtag('event', 'page_load_time', {
            event_category: 'Performance',
            event_label: pageName,
            value: Math.round(loadTime),
          });
        }
      };
    }
    return () => {};
  },
  
  measureCoreWebVitals: () => {
    if (typeof window !== 'undefined' && 'web-vitals' in window) {
      // This would be implemented with web-vitals library
      // import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
    }
  }
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: resolvePageWithEnhancements,
    setup({ el, App, props }) {
        const root = createRoot(el);
        const pageName = props.initialPage?.component || 'unknown';
        const endMeasurement = performanceObserver.measurePageLoad(pageName);

        root.render(
            <AppProviders>
                <App {...props} />
            </AppProviders>
        );
        
        // End performance measurement after render
        setTimeout(endMeasurement, 0);
        
        // Initialize Core Web Vitals monitoring
        performanceObserver.measureCoreWebVitals();
        
        // Initialize Phase 3 enhancements
        initializePhase3Enhancements();
    },
    progress: {
        color: '#0066cc',
        showSpinner: true,
        // Enhanced progress bar configuration
        delay: 250,
        includeCSS: true,
    },
});

// Service Worker registration for caching
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Preload critical resources
if (typeof window !== 'undefined') {
  // Font and image preloading functionality can be added here when needed
  
  // Add resource hints for better performance
  const addResourceHints = () => {
    // DNS prefetch for external resources
    const dnsPrefetch = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = href;
      document.head.appendChild(link);
    };
    
    // Preconnect to critical origins
    const preconnect = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      document.head.appendChild(link);
    };
    
    // Add common resource hints
    dnsPrefetch('//fonts.googleapis.com');
    dnsPrefetch('//fonts.gstatic.com');
    preconnect('//fonts.googleapis.com');
    preconnect('//fonts.gstatic.com');
  };
  
  // Initialize resource hints
  addResourceHints();
  
  // Initialize route preloading
  if (routePreloader && typeof routePreloader.initialize === 'function') {
    routePreloader.initialize();
  }
}

/**
 * Initialize Phase 3: Feature Enhancements
 * Mobile optimization, PWA features, and performance analytics
 */
function initializePhase3Enhancements(): void {
    // Initialize mobile optimizations
    MobileOptimizationManager.initialize();
    
    // Initialize PWA enhancements
    PWAEnhancementManager.initialize(
        process.env.VITE_VAPID_PUBLIC_KEY // Optional VAPID key for push notifications
    );
    
    // Initialize performance analytics dashboard
    PerformanceAnalyticsDashboard.getInstance().initialize();
    
    // Log Phase 3 initialization
    console.log('🚀 Phase 3: Feature Enhancements initialized');
    console.log('📱 Mobile optimization active');
    console.log('🎯 PWA features enabled');
    console.log('📊 Performance analytics running');
}
