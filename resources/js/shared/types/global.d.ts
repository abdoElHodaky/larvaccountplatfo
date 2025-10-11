// Global type declarations for the application

// Testing library jest-dom matchers
import '@testing-library/jest-dom';

// Browser API types that might not be available in all environments
declare global {
  // Notification API types
  type NotificationPermission = 'default' | 'denied' | 'granted';
  
  // Notification options interface
  interface NotificationOptions {
    body?: string;
    icon?: string;
    image?: string;
    badge?: string;
    sound?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
    renotify?: boolean;
    silent?: boolean;
    timestamp?: number;
    vibrate?: number | number[];
    actions?: NotificationAction[];
  }
  
  // Notification action interface
  interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
  }
  
  // Service Worker types
  interface ServiceWorkerRegistration {
    showNotification(title: string, options?: NotificationOptions): Promise<void>;
  }
  
  // Intersection Observer types
  interface IntersectionObserverEntry {
    boundingClientRect: DOMRectReadOnly;
    intersectionRatio: number;
    intersectionRect: DOMRectReadOnly;
    isIntersecting: boolean;
    rootBounds: DOMRectReadOnly | null;
    target: Element;
    time: number;
  }
  
  interface IntersectionObserverInit {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
  }
  
  type IntersectionObserverCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void;
  
  interface IntersectionObserver {
    readonly root: Element | null;
    readonly rootMargin: string;
    readonly thresholds: ReadonlyArray<number>;
    disconnect(): void;
    observe(target: Element): void;
    takeRecords(): IntersectionObserverEntry[];
    unobserve(target: Element): void;
  }
  
  // Performance Observer types
  interface PerformanceEntry {
    duration: number;
    entryType: string;
    name: string;
    startTime: number;
  }
  
  interface PerformanceObserverEntryList {
    getEntries(): PerformanceEntry[];
    getEntriesByName(name: string, type?: string): PerformanceEntry[];
    getEntriesByType(type: string): PerformanceEntry[];
  }
  
  type PerformanceObserverCallback = (list: PerformanceObserverEntryList, observer: PerformanceObserver) => void;
  
  interface PerformanceObserverInit {
    entryTypes?: string[];
    type?: string;
    buffered?: boolean;
  }
  
  interface PerformanceObserver {
    disconnect(): void;
    observe(options: PerformanceObserverInit): void;
    takeRecords(): PerformanceEntry[];
  }
  
  // Node.js types for timers and other Node.js APIs
  namespace NodeJS {
    interface Timeout {
      ref(): this;
      unref(): this;
    }
    
    interface Timer extends Timeout {}
  }
  
  // Laravel route helper (if available globally)
  declare function route(name: string, params?: any): string;
  
  // Make route available as a global variable
  const route: (name: string, params?: any) => string;
  
  // Window interface extensions
  interface Window {
    FORGE_DEPLOYMENT?: boolean;
    gtag?: (command: string, targetId: string, config?: any) => void;
  }
  
  // ImportMeta interface extensions
  interface ImportMeta {
    glob: (pattern: string, options?: { eager?: boolean }) => Record<string, any>;
  }
}

export {};
