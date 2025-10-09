/**
 * Service Worker Registration and Management
 * PWA features, offline support, and caching strategies
 */

// Check if service workers are supported
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
};

// Register service worker
export function register(config?: Config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service worker.'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }

  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('App is online');
    config?.onOnline?.();
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
    config?.onOffline?.();
  });
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log(
                'New content is available and will be used when all tabs for this page are closed.'
              );
              config?.onUpdate?.(registration);
            } else {
              console.log('Content is cached for offline use.');
              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

// Unregister service worker
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Update service worker
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
}

// Skip waiting and activate new service worker
export function skipWaiting() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }
}

// Check if app is running in standalone mode (PWA)
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// Check if app can be installed (PWA)
export function canInstall(): boolean {
  return 'beforeinstallprompt' in window;
}

// PWA Install Manager
class PWAInstallManager {
  private deferredPrompt: any = null;
  private installCallbacks: Array<(canInstall: boolean) => void> = [];

  constructor() {
    this.setupInstallPrompt();
  }

  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notifyCallbacks(true);
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
      this.notifyCallbacks(false);
    });
  }

  private notifyCallbacks(canInstall: boolean) {
    this.installCallbacks.forEach(callback => callback(canInstall));
  }

  public onInstallAvailable(callback: (canInstall: boolean) => void) {
    this.installCallbacks.push(callback);
    // Immediately call with current state
    callback(this.deferredPrompt !== null);
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      this.deferredPrompt = null;
      return true;
    } else {
      console.log('User dismissed the install prompt');
      return false;
    }
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null;
  }
}

export const pwaInstallManager = new PWAInstallManager();

// Cache Management
export class CacheManager {
  private static readonly CACHE_NAMES = {
    STATIC: 'accounting-app-static-v1',
    DYNAMIC: 'accounting-app-dynamic-v1',
    API: 'accounting-app-api-v1',
  };

  static async clearOldCaches() {
    const cacheNames = await caches.keys();
    const currentCaches = Object.values(this.CACHE_NAMES);
    
    const deletePromises = cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => caches.delete(cacheName));
    
    await Promise.all(deletePromises);
  }

  static async getCacheSize(): Promise<{ [key: string]: number }> {
    const sizes: { [key: string]: number } = {};
    
    for (const [name, cacheName] of Object.entries(this.CACHE_NAMES)) {
      try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        let totalSize = 0;
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
        
        sizes[name] = totalSize;
      } catch (error) {
        console.error(`Error calculating cache size for ${name}:`, error);
        sizes[name] = 0;
      }
    }
    
    return sizes;
  }

  static async clearCache(cacheName?: string) {
    if (cacheName) {
      await caches.delete(cacheName);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  }
}

// Background Sync Manager
export class BackgroundSyncManager {
  private static readonly SYNC_TAG = 'accounting-background-sync';
  private pendingRequests: Array<{
    url: string;
    method: string;
    body?: any;
    headers?: any;
    timestamp: number;
  }> = [];

  constructor() {
    this.loadPendingRequests();
  }

  private loadPendingRequests() {
    const stored = localStorage.getItem('pendingRequests');
    if (stored) {
      try {
        this.pendingRequests = JSON.parse(stored);
      } catch (error) {
        console.error('Error loading pending requests:', error);
        this.pendingRequests = [];
      }
    }
  }

  private savePendingRequests() {
    localStorage.setItem('pendingRequests', JSON.stringify(this.pendingRequests));
  }

  public addRequest(url: string, method: string, body?: any, headers?: any) {
    this.pendingRequests.push({
      url,
      method,
      body,
      headers,
      timestamp: Date.now(),
    });
    this.savePendingRequests();

    // Register background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        return registration.sync.register(BackgroundSyncManager.SYNC_TAG);
      });
    } else {
      // Fallback: try to sync immediately
      this.syncPendingRequests();
    }
  }

  public async syncPendingRequests(): Promise<void> {
    const requests = [...this.pendingRequests];
    this.pendingRequests = [];
    this.savePendingRequests();

    for (const request of requests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          body: request.body ? JSON.stringify(request.body) : undefined,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers,
          },
        });

        if (!response.ok) {
          // Re-add failed request
          this.pendingRequests.push(request);
        }
      } catch (error) {
        console.error('Error syncing request:', error);
        // Re-add failed request
        this.pendingRequests.push(request);
      }
    }

    this.savePendingRequests();
  }

  public getPendingRequestsCount(): number {
    return this.pendingRequests.length;
  }

  public clearPendingRequests() {
    this.pendingRequests = [];
    this.savePendingRequests();
  }
}

export const backgroundSyncManager = new BackgroundSyncManager();

// Network Status Manager
export class NetworkStatusManager {
  private isOnline: boolean = navigator.onLine;
  private callbacks: Array<(isOnline: boolean) => void> = [];

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyCallbacks();
      // Trigger background sync when coming online
      backgroundSyncManager.syncPendingRequests();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyCallbacks();
    });
  }

  private notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.isOnline));
  }

  public onStatusChange(callback: (isOnline: boolean) => void) {
    this.callbacks.push(callback);
    // Immediately call with current status
    callback(this.isOnline);
  }

  public getStatus(): boolean {
    return this.isOnline;
  }
}

export const networkStatusManager = new NetworkStatusManager();

// Push Notification Manager
export class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;

  public async initialize() {
    if ('serviceWorker' in navigator) {
      this.registration = await navigator.serviceWorker.ready;
    }
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    return await Notification.requestPermission();
  }

  public async subscribe(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error('Service worker not available');
    }

    const subscription = await this.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
    });

    return subscription;
  }

  public async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    const subscription = await this.registration.pushManager.getSubscription();
    if (subscription) {
      return await subscription.unsubscribe();
    }

    return false;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pushNotificationManager = new PushNotificationManager();

export default {
  register,
  unregister,
  updateServiceWorker,
  skipWaiting,
  isStandalone,
  canInstall,
  pwaInstallManager,
  CacheManager,
  backgroundSyncManager,
  networkStatusManager,
  pushNotificationManager,
};

