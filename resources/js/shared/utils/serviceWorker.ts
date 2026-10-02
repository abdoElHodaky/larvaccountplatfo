/**
 * Service Worker Registration and Management
 * PWA features, offline support, and caching strategies.
 */

// ---------------------------------------------------------------------------
// Types & environment helpers
// ---------------------------------------------------------------------------

/**
 * `process.env.PUBLIC_URL` is a CRA convention; in Vite/plain browser builds
 * `process` does not exist, so it is declared optional and read defensively.
 */
declare const process: { env: { PUBLIC_URL?: string } } | undefined;

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
};

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface SyncCapableRegistration extends ServiceWorkerRegistration {
  sync?: { register(tag: string): Promise<void> };
}

interface PendingRequest {
  url: string;
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
  timestamp: number;
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

function getPublicUrl(): string {
  return typeof process !== 'undefined' ? (process.env.PUBLIC_URL ?? '') : '';
}

// ---------------------------------------------------------------------------
// Cache Management
// ---------------------------------------------------------------------------

const CACHE_NAMES = {
  STATIC: 'accounting-app-static-v1',
  DYNAMIC: 'accounting-app-dynamic-v1',
  API: 'accounting-app-api-v1',
} as const;

type CacheName = typeof CACHE_NAMES[keyof typeof CACHE_NAMES];

export class CacheManager {
  private static readonly CACHE_NAMES = CACHE_NAMES;

  /** Delete any caches not in the current version set (call from sw activate) */
  static async clearOldCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    const currentCaches = Object.values(CacheManager.CACHE_NAMES);

    await Promise.all(
      cacheNames
        .filter((cacheName): boolean => !currentCaches.includes(cacheName as CacheName))
        .map((cacheName) => caches.delete(cacheName))
    );
  }

  /** Approximate per-cache storage usage in bytes */
  static async getCacheSize(): Promise<Record<string, number>> {
    const sizes: Record<string, number> = {};

    for (const [name, cacheName] of Object.entries(CacheManager.CACHE_NAMES)) {
      try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        let totalSize = 0;

        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            totalSize += (await response.blob()).size;
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

  /** Clear one named cache, or every cache when no name is given */
  static async clearCache(cacheName?: string): Promise<void> {
    if (cacheName) {
      await caches.delete(cacheName);
      return;
    }

    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/** Register the service worker and wire lifecycle callbacks */
export function register(config?: Config): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const publicUrl = new URL(getPublicUrl(), window.location.href);
  if (publicUrl.origin !== window.location.origin) {
    // Service worker cannot be served from a different origin.
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = `${getPublicUrl()}/sw.js`;

    if (isLocalhost) {
      checkValidServiceWorker(swUrl, config);
      void navigator.serviceWorker.ready.then(() => {
        console.log('This web app is being served cache-first by a service worker.');
      });
    } else {
      void registerValidSW(swUrl, config);
    }
  });

  window.addEventListener('online', () => {
    console.log('App is online');
    config?.onOnline?.();
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
    config?.onOffline?.();
  });
}

async function registerValidSW(swUrl: string, config?: Config): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register(swUrl);

    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (installingWorker == null) {
        return;
      }

      installingWorker.onstatechange = () => {
        if (installingWorker.state !== 'installed') {
          return;
        }

        if (navigator.serviceWorker.controller) {
          console.log(
            'New content is available and will be used when all tabs for this page are closed.'
          );
          config?.onUpdate?.(registration);
        } else {
          console.log('Content is cached for offline use.');
          config?.onSuccess?.(registration);
        }
      };
    };
  } catch (error) {
    console.error('Error during service worker registration:', error);
  }
}

async function checkValidServiceWorker(swUrl: string, config?: Config): Promise<void> {
  try {
    const response = await fetch(swUrl, {
      headers: { 'Service-Worker': 'script' },
    });
    const contentType = response.headers.get('content-type');

    if (
      response.status === 404 ||
      (contentType != null && !contentType.includes('javascript'))
    ) {
      // Stale/invalid worker from a previous deploy — drop it and reload.
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      window.location.reload();
    } else {
      await registerValidSW(swUrl, config);
    }
  } catch {
    console.log('No internet connection found. App is running in offline mode.');
  }
}

/** Unregister the active service worker */
export function unregister(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  void navigator.serviceWorker.ready
    .then((registration) => registration.unregister())
    .catch((error: unknown) => console.error('Service worker unregister failed:', error));
}

/** Check for a newer service worker version */
export function updateServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  void navigator.serviceWorker.ready
    .then((registration) => registration.update())
    .catch((error: unknown) => console.error('Service worker update failed:', error));
}

/** Tell a waiting service worker to activate immediately */
export function skipWaiting(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  void navigator.serviceWorker.ready
    .then((registration) => {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    })
    .catch((error: unknown) => console.error('Skip-waiting message failed:', error));
}

// ---------------------------------------------------------------------------
// Standalone / installability checks
// ---------------------------------------------------------------------------

/** Check if the app is running in standalone mode (installed PWA) */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

/** Check if the browser fires beforeinstallprompt (i.e. supports install prompts) */
export function canInstall(): boolean {
  return 'beforeinstallprompt' in window;
}

// ---------------------------------------------------------------------------
// PWA Install Manager
// ---------------------------------------------------------------------------

export class PWAInstallManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installCallbacks: Array<(canInstall: boolean) => void> = [];

  constructor() {
    this.setupInstallPrompt();
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.notifyCallbacks(true);
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
      this.notifyCallbacks(false);
    });
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  /** Subscribe to install-availability changes; returns an unsubscribe function */
  public onInstallAvailable(callback: (canInstall: boolean) => void): () => void {
    this.installCallbacks.push(callback);
    callback(this.canInstall());

    return () => {
      const index = this.installCallbacks.indexOf(callback);
      if (index > -1) {
        this.installCallbacks.splice(index, 1);
      }
    };
  }

  /** Show the native install prompt; resolves to true when accepted */
  public async promptInstall(): Promise<boolean> {
    const prompt = this.deferredPrompt;
    if (!prompt) {
      return false;
    }

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      console.log(
        outcome === 'accepted'
          ? 'User accepted the install prompt'
          : 'User dismissed the install prompt'
      );
      return outcome === 'accepted';
    } finally {
      // The native prompt is single-use regardless of the outcome.
      this.deferredPrompt = null;
      this.notifyCallbacks(false);
    }
  }

  private notifyCallbacks(canInstall: boolean): void {
    this.installCallbacks.forEach((callback) => callback(canInstall));
  }
}

export const pwaInstallManager = new PWAInstallManager();

// ---------------------------------------------------------------------------
// Background Sync Manager
// ---------------------------------------------------------------------------

export class BackgroundSyncManager {
  private static readonly SYNC_TAG = 'accounting-background-sync';
  private static readonly STORAGE_KEY = 'pendingRequests';
  private pendingRequests: PendingRequest[] = [];

  constructor() {
    this.loadPendingRequests();
  }

  /** Queue a request for replay when connectivity returns */
  public addRequest(
    url: string,
    method: string,
    body?: unknown,
    headers?: Record<string, string>
  ): void {
    this.pendingRequests.push({ url, method, body, headers, timestamp: Date.now() });
    this.savePendingRequests();

    const syncSupported =
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype;

    if (syncSupported) {
      void navigator.serviceWorker.ready
        .then((registration) =>
          (registration as SyncCapableRegistration).sync?.register(
            BackgroundSyncManager.SYNC_TAG
          )
        )
        .catch((error: unknown) =>
          console.error('Background sync registration failed:', error)
        );
    } else {
      // Fallback: try to flush the queue immediately.
      void this.syncPendingRequests().catch((error: unknown) =>
        console.error('Immediate sync failed:', error)
      );
    }
  }

  /** Replay queued requests; failures stay queued for the next attempt */
  public async syncPendingRequests(): Promise<void> {
    const requests = [...this.pendingRequests];
    this.pendingRequests = [];
    this.savePendingRequests();

    for (const request of requests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          body: request.body != null ? JSON.stringify(request.body) : undefined,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers,
          },
        });

        if (!response.ok) {
          this.pendingRequests.push(request);
        }
      } catch (error) {
        console.error('Error syncing request:', error);
        this.pendingRequests.push(request);
      }
    }

    this.savePendingRequests();
  }

  public getPendingRequestsCount(): number {
    return this.pendingRequests.length;
  }

  public clearPendingRequests(): void {
    this.pendingRequests = [];
    this.savePendingRequests();
  }

  private loadPendingRequests(): void {
    const stored = localStorage.getItem(BackgroundSyncManager.STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      this.pendingRequests = JSON.parse(stored) as PendingRequest[];
    } catch (error) {
      console.error('Error loading pending requests:', error);
      this.pendingRequests = [];
    }
  }

  private savePendingRequests(): void {
    localStorage.setItem(
      BackgroundSyncManager.STORAGE_KEY,
      JSON.stringify(this.pendingRequests)
    );
  }
}

export const backgroundSyncManager = new BackgroundSyncManager();

// ---------------------------------------------------------------------------
// Network Status Manager
// ---------------------------------------------------------------------------

export class NetworkStatusManager {
  private isOnline: boolean = navigator.onLine;
  private callbacks: Array<(isOnline: boolean) => void> = [];

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyCallbacks();
      // Flush the offline queue when connectivity returns.
      void backgroundSyncManager.syncPendingRequests().catch((error: unknown) =>
        console.error('Background sync on reconnect failed:', error)
      );
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyCallbacks();
    });
  }

  /** Subscribe to connectivity changes; returns an unsubscribe function */
  public onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.callbacks.push(callback);
    callback(this.isOnline);

    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach((callback) => callback(this.isOnline));
  }
}

export const networkStatusManager = new NetworkStatusManager();

// ---------------------------------------------------------------------------
// Push Notification Manager
// ---------------------------------------------------------------------------

export class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;

  public async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
    } catch (error) {
      console.error('Service worker registration not available:', error);
    }
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    return Notification.requestPermission();
  }

  public async subscribe(vapidPublicKey: string): Promise<PushSubscription> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error('Service worker not available');
    }

    return this.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  public async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    const subscription = await this.registration.pushManager.getSubscription();
    return subscription ? subscription.unsubscribe() : false;
  }

  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const uint8Array = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      uint8Array[i] = rawData.charCodeAt(i);
    }
    return uint8Array.buffer;
  }
}

export const pushNotificationManager = new PushNotificationManager();

// ---------------------------------------------------------------------------
// Default export (convenience aggregate)
// ---------------------------------------------------------------------------

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