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
  
  // Google Analytics gtag function
  declare function gtag(command: string, targetId: string, config?: any): void;
  
  // Test globals (Jest/Vitest)
  declare function beforeEach(fn: () => void | Promise<void>): void;
  
  // Window interface extensions
  interface Window {
    FORGE_DEPLOYMENT?: boolean;
    gtag?: (command: string, targetId: string, config?: any) => void;
  }
  
  // ImportMeta interface extensions
  interface ImportMeta {
    env: Record<string, string>;
    glob: (pattern: string, options?: any) => Record<string, any>;
  }
}

export {};
