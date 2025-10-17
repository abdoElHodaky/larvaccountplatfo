/**
 * PWA Service Worker Helper
 * Manages service worker registration and PWA functionality
 */

import { log } from '../../shared/utils/logger';

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ServiceWorkerStatus {
  supported: boolean;
  registered: boolean;
  installing: boolean;
  waiting: boolean;
  active: boolean;
  updateAvailable: boolean;
}

export interface PWACapabilities {
  installable: boolean;
  standalone: boolean;
  fullscreen: boolean;
  notifications: boolean;
  backgroundSync: boolean;
  pushMessaging: boolean;
}

class PWAServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private installPrompt: PWAInstallPrompt | null = null;
  private updateCallbacks: Array<() => void> = [];
  private installCallbacks: Array<() => void> = [];

  /**
   * Initialize service worker and PWA features
   */
  async initialize(): Promise<void> {
    try {
      if (!this.isServiceWorkerSupported()) {
        log.warn('Service Worker not supported', {}, 'PWA');
        return;
      }

      await this.registerServiceWorker();
      this.setupInstallPrompt();
      this.setupUpdateHandling();
      this.setupNotifications();
      
      log.info('PWA Service Worker initialized', {}, 'PWA');
    } catch (error) {
      log.error('Failed to initialize PWA Service Worker', error, 'PWA');
    }
  }

  /**
   * Check if service worker is supported
   */
  isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      log.info('Service Worker registered', { scope: this.registration.scope }, 'PWA');

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              this.notifyUpdateAvailable();
            }
          });
        }
      });

    } catch (error) {
      log.error('Service Worker registration failed', error, 'PWA');
      throw error;
    }
  }

  /**
   * Setup install prompt handling
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as any;
      this.notifyInstallAvailable();
      log.info('PWA install prompt available', {}, 'PWA');
    });

    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      log.info('PWA installed successfully', {}, 'PWA');
    });
  }

  /**
   * Setup update handling
   */
  private setupUpdateHandling(): void {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  /**
   * Setup notification permissions
   */
  private async setupNotifications(): Promise<void> {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      try {
        const permission = await Notification.requestPermission();
        log.info('Notification permission:', { permission }, 'PWA');
      } catch (error) {
        log.error('Failed to request notification permission', error, 'PWA');
      }
    }
  }

  /**
   * Get service worker status
   */
  getStatus(): ServiceWorkerStatus {
    const registration = this.registration;
    
    return {
      supported: this.isServiceWorkerSupported(),
      registered: !!registration,
      installing: !!registration?.installing,
      waiting: !!registration?.waiting,
      active: !!registration?.active,
      updateAvailable: !!registration?.waiting,
    };
  }

  /**
   * Get PWA capabilities
   */
  getCapabilities(): PWACapabilities {
    return {
      installable: !!this.installPrompt,
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      fullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
      notifications: 'Notification' in window && Notification.permission === 'granted',
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      pushMessaging: 'serviceWorker' in navigator && 'PushManager' in window,
    };
  }

  /**
   * Install PWA
   */
  async installPWA(): Promise<boolean> {
    if (!this.installPrompt) {
      log.warn('No install prompt available', {}, 'PWA');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        log.info('PWA installation accepted', {}, 'PWA');
        this.installPrompt = null;
        return true;
      } else {
        log.info('PWA installation dismissed', {}, 'PWA');
        return false;
      }
    } catch (error) {
      log.error('PWA installation failed', error, 'PWA');
      return false;
    }
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      throw new Error('No service worker registration found');
    }

    try {
      await this.registration.update();
      
      if (this.registration.waiting) {
        // Tell the waiting service worker to skip waiting
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      log.info('Service Worker update initiated', {}, 'PWA');
    } catch (error) {
      log.error('Service Worker update failed', error, 'PWA');
      throw error;
    }
  }

  /**
   * Cache dashboard data
   */
  async cacheDashboardData(): Promise<void> {
    if (!this.registration?.active) {
      log.warn('No active service worker for caching', {}, 'PWA');
      return;
    }

    try {
      this.registration.active.postMessage({ type: 'CACHE_DASHBOARD' });
      log.info('Dashboard caching requested', {}, 'PWA');
    } catch (error) {
      log.error('Failed to request dashboard caching', error, 'PWA');
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('No service worker registration found');
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.getVapidPublicKey(),
      });

      log.info('Push notification subscription created', {}, 'PWA');
      return subscription;
    } catch (error) {
      log.error('Push notification subscription failed', error, 'PWA');
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        log.info('Push notification unsubscribed', {}, 'PWA');
        return true;
      }
      return false;
    } catch (error) {
      log.error('Push notification unsubscribe failed', error, 'PWA');
      return false;
    }
  }

  /**
   * Register background sync
   */
  async registerBackgroundSync(tag: string): Promise<void> {
    if (!this.registration) {
      throw new Error('No service worker registration found');
    }

    try {
      await (this.registration as any).sync.register(tag);
      log.info('Background sync registered', { tag }, 'PWA');
    } catch (error) {
      log.error('Background sync registration failed', error, 'PWA');
      throw error;
    }
  }

  /**
   * Add update callback
   */
  onUpdateAvailable(callback: () => void): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Add install callback
   */
  onInstallAvailable(callback: () => void): void {
    this.installCallbacks.push(callback);
  }

  /**
   * Remove update callback
   */
  removeUpdateCallback(callback: () => void): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  /**
   * Remove install callback
   */
  removeInstallCallback(callback: () => void): void {
    const index = this.installCallbacks.indexOf(callback);
    if (index > -1) {
      this.installCallbacks.splice(index, 1);
    }
  }

  /**
   * Notify update available
   */
  private notifyUpdateAvailable(): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        log.error('Update callback failed', error, 'PWA');
      }
    });
  }

  /**
   * Notify install available
   */
  private notifyInstallAvailable(): void {
    this.installCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        log.error('Install callback failed', error, 'PWA');
      }
    });
  }

  /**
   * Get VAPID public key (should be configured in environment)
   */
  private getVapidPublicKey(): string {
    // This should be configured in your environment
    return process.env.VITE_VAPID_PUBLIC_KEY || '';
  }

  /**
   * Check if running in standalone mode
   */
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Check if PWA is installable
   */
  isInstallable(): boolean {
    return !!this.installPrompt;
  }

  /**
   * Get installation status
   */
  getInstallationStatus(): 'not-installable' | 'installable' | 'installed' {
    if (this.isStandalone()) {
      return 'installed';
    }
    if (this.isInstallable()) {
      return 'installable';
    }
    return 'not-installable';
  }
}

// Create and export singleton instance
export const pwaServiceWorker = new PWAServiceWorkerManager();

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  pwaServiceWorker.initialize().catch(error => {
    log.error('PWA Service Worker auto-initialization failed', error, 'PWA');
  });
}
