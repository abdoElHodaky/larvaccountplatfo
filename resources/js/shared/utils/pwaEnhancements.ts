/**
 * Progressive Web App (PWA) Enhancements
 * Provides advanced PWA features including background sync, push notifications,
 * app shortcuts, and offline capabilities.
 */

// ---------------------------------------------------------------------------
// Global declarations
// ---------------------------------------------------------------------------

/** Google Analytics gtag global (loaded asynchronously by the analytics snippet). */
declare function gtag(
  command: 'event',
  eventName: string,
  params?: Record<string, unknown>
): void;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  supportsBackgroundSync: boolean;
  supportsPushNotifications: boolean;
  supportsWebShare: boolean;
  supportsFileSystemAccess: boolean;
}

interface OfflineSubmission {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: BodyInit;
}

interface QueuedAction {
  handler: string;
  payload?: unknown;
}

interface SyncCapableRegistration extends ServiceWorkerRegistration {
  sync?: { register(tag: string): Promise<void> };
}

// ---------------------------------------------------------------------------
// PWA Installation Manager
// ---------------------------------------------------------------------------

export class PWAInstallManager {
  private static instance: PWAInstallManager;
  private installPrompt: PWAInstallPrompt | null = null;
  private installListeners: Array<(canInstall: boolean) => void> = [];

  static getInstance(): PWAInstallManager {
    if (!PWAInstallManager.instance) {
      PWAInstallManager.instance = new PWAInstallManager();
    }
    return PWAInstallManager.instance;
  }

  constructor() {
    this.setupInstallPromptListener();
  }

  private setupInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as unknown as PWAInstallPrompt;
      this.notifyInstallListeners(true);
    });

    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      this.notifyInstallListeners(false);
      this.trackInstallation();
    });
  }

  /** Check if PWA can be installed */
  canInstall(): boolean {
    return this.installPrompt !== null;
  }

  /** Trigger PWA installation */
  async install(): Promise<boolean> {
    if (!this.installPrompt) {
      return false;
    }

    const prompt = this.installPrompt;

    try {
      await prompt.prompt();
      const choiceResult = await prompt.userChoice;

      // The native prompt can only be used once — discard it either way.
      this.installPrompt = null;
      this.notifyInstallListeners(false);

      this.trackInstallationAttempt(choiceResult.outcome);
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  }

  /** Add listener for install availability changes; returns an unsubscribe function */
  onInstallAvailable(callback: (canInstall: boolean) => void): () => void {
    this.installListeners.push(callback);
    callback(this.canInstall());

    return () => {
      const index = this.installListeners.indexOf(callback);
      if (index > -1) {
        this.installListeners.splice(index, 1);
      }
    };
  }

  private notifyInstallListeners(canInstall: boolean): void {
    this.installListeners.forEach((listener) => listener(canInstall));
  }

  private trackInstallation(): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_installed', {
        event_category: 'PWA',
        event_label: 'installation_completed',
      });
    }
  }

  private trackInstallationAttempt(outcome: 'accepted' | 'dismissed'): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_prompt', {
        event_category: 'PWA',
        event_label: outcome,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Background Sync Manager
// ---------------------------------------------------------------------------

export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager;
  private syncTasks = new Map<string, () => Promise<void>>();

  static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager();
    }
    return BackgroundSyncManager.instance;
  }

  /** Register a background sync task; falls back to immediate execution when unsupported */
  async registerSync(tag: string, task: () => Promise<void>): Promise<void> {
    this.syncTasks.set(tag, task);

    const registration = (await navigator.serviceWorker?.ready) as
      | SyncCapableRegistration
      | undefined;

    if (registration?.sync) {
      try {
        await registration.sync.register(tag);
        return;
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }

    // Fallback (or recovery): run the task right away.
    await this.executeTask(tag);
  }

  /** Execute a registered sync task */
  async executeTask(tag: string): Promise<void> {
    const task = this.syncTasks.get(tag);
    if (!task) {
      return;
    }

    try {
      await task();
      this.syncTasks.delete(tag);
    } catch (error) {
      console.error(`Background sync task ${tag} failed:`, error);
      throw error;
    }
  }

  /** Register common sync tasks (called when connectivity returns) */
  registerCommonTasks(): void {
    void this.registerSync('form-submissions', async () => {
      const submissions = this.getOfflineSubmissions();
      for (const submission of submissions) {
        await this.submitForm(submission);
      }
      this.clearOfflineSubmissions();
    });

    void this.registerSync('data-sync', () => this.syncCachedData());
    void this.registerSync('preferences-sync', () => this.syncUserPreferences());
  }

  private getOfflineSubmissions(): OfflineSubmission[] {
    const stored = localStorage.getItem('offline_submissions');
    return stored ? (JSON.parse(stored) as OfflineSubmission[]) : [];
  }

  private async submitForm(submission: OfflineSubmission): Promise<void> {
    const response = await fetch(submission.url, {
      method: submission.method,
      headers: submission.headers,
      body: submission.body,
    });

    if (!response.ok) {
      throw new Error(`Form submission failed: ${response.statusText}`);
    }
  }

  private clearOfflineSubmissions(): void {
    localStorage.removeItem('offline_submissions');
  }

  private async syncCachedData(): Promise<void> {
    // Upload any locally cached data that needs to reach the server.
    // Wire this to your data layer (e.g. outbox table / API sync endpoint).
    await Promise.resolve();
  }

  private async syncUserPreferences(): Promise<void> {
    // Push locally changed user preferences to the server.
    // Wire this to your preferences API.
    await Promise.resolve();
  }
}

// ---------------------------------------------------------------------------
// Push Notification Manager
// ---------------------------------------------------------------------------

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private vapidPublicKey: string;

  static getInstance(vapidPublicKey?: string): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager(vapidPublicKey ?? '');
    }
    return PushNotificationManager.instance;
  }

  constructor(vapidPublicKey: string) {
    this.vapidPublicKey = vapidPublicKey;
  }

  /** Request notification permission */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    this.trackPermissionRequest(permission);
    return permission;
  }

  /** Subscribe to push notifications */
  async subscribe(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      await this.sendSubscriptionToServer(subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  /** Unsubscribe from push notifications */
  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    }
  }

  /** Check if the user is subscribed to push notifications */
  async isSubscribed(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      return (await registration.pushManager.getSubscription()) !== null;
    } catch {
      return false;
    }
  }

  /** Show a local notification via the active service worker */
  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') {
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    const defaultOptions: NotificationOptions = {
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: { dateOfArrival: Date.now() },
      actions: [
        { action: 'view', title: 'View', icon: '/icon-view.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icon-dismiss.png' },
      ],
    };

    await registration.showNotification(title, { ...defaultOptions, ...options });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    await fetch('/api/push-subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    await fetch('/api/push-subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  }

  private trackPermissionRequest(permission: NotificationPermission): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'notification_permission', {
        event_category: 'PWA',
        event_label: permission,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// App Shortcuts Manager
// ---------------------------------------------------------------------------

export class AppShortcutsManager {
  /** Register keyboard shortcuts and persist manifest-style shortcut metadata */
  static registerShortcuts(): void {
    this.registerKeyboardShortcuts();
    this.updateManifestShortcuts();
  }

  private static registerKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'k':
          event.preventDefault();
          this.triggerSearch();
          break;
        case 'n':
          event.preventDefault();
          this.triggerNewItem();
          break;
        case 'd':
          event.preventDefault();
          this.navigateToDashboard();
          break;
      }
    });
  }

  private static updateManifestShortcuts(): void {
    // Canonical shortcuts live in manifest.json; this cached copy enables
    // dynamic UI (e.g. a "quick actions" menu) without a manifest re-fetch.
    const shortcuts = [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View main dashboard',
        url: '/dashboard',
        icons: [{ src: '/icon-dashboard.png', sizes: '96x96' }],
      },
      {
        name: 'New Transaction',
        short_name: 'New Transaction',
        description: 'Create new transaction',
        url: '/accounting/transactions/create',
        icons: [{ src: '/icon-transaction.png', sizes: '96x96' }],
      },
      {
        name: 'Reports',
        short_name: 'Reports',
        description: 'View financial reports',
        url: '/reporting',
        icons: [{ src: '/icon-reports.png', sizes: '96x96' }],
      },
    ];

    localStorage.setItem('app_shortcuts', JSON.stringify(shortcuts));
  }

  private static triggerSearch(): void {
    const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement | null;
    searchInput?.focus();
  }

  private static triggerNewItem(): void {
    const newButton = document.querySelector('[data-new-item]') as HTMLButtonElement | null;
    newButton?.click();
  }

  private static navigateToDashboard(): void {
    if (window.location.pathname !== '/dashboard') {
      window.location.href = '/dashboard';
    }
  }
}

// ---------------------------------------------------------------------------
// Offline Capabilities Manager
// ---------------------------------------------------------------------------

export class OfflineManager {
  private static instance: OfflineManager;
  private static actionHandlers = new Map<string, (payload?: unknown) => Promise<void>>();

  private isOnline: boolean = navigator.onLine;
  private onlineListeners: Array<(isOnline: boolean) => void> = [];

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  constructor() {
    this.setupOnlineListeners();
  }

  private setupOnlineListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
      this.handleOnlineStatus();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
      this.handleOfflineStatus();
    });
  }

  /** Check if the app is online */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /** Add listener for online status changes; returns an unsubscribe function */
  onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.onlineListeners.push(callback);
    callback(this.isOnline);

    return () => {
      const index = this.onlineListeners.indexOf(callback);
      if (index > -1) {
        this.onlineListeners.splice(index, 1);
      }
    };
  }

  /** Store data for offline use */
  storeOfflineData(key: string, data: unknown): void {
    try {
      const store = this.getOfflineStore();
      store[key] = { data, timestamp: Date.now() };
      localStorage.setItem('offline_data', JSON.stringify(store));
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  }

  /** Retrieve offline data (all entries, or a single key) */
  getOfflineData(key?: string): unknown {
    const store = this.getOfflineStore();
    return key ? (store[key]?.data ?? null) : store;
  }

  private getOfflineStore(): Record<string, { data: unknown; timestamp: number }> {
    try {
      const stored = localStorage.getItem('offline_data');
      return stored
        ? (JSON.parse(stored) as Record<string, { data: unknown; timestamp: number }>)
        : {};
    } catch (error) {
      console.error('Failed to retrieve offline data:', error);
      return {};
    }
  }

  /**
   * Register a named handler that queued offline actions can invoke.
   * Handlers are stored in memory; only the name + payload are persisted.
   */
  static registerActionHandler(name: string, handler: (payload?: unknown) => Promise<void>): void {
    OfflineManager.actionHandlers.set(name, handler);
  }

  /** Queue a named action (with optional serializable payload) for when connectivity returns */
  queueForOnline(handler: string, payload?: unknown): void {
    if (this.isOnline) {
      void this.executeAction(handler, payload);
      return;
    }

    const queued = this.getQueuedActions();
    queued.push({ handler, payload });
    localStorage.setItem('queued_actions', JSON.stringify(queued));
  }

  private notifyListeners(isOnline: boolean): void {
    this.onlineListeners.forEach((listener) => listener(isOnline));
  }

  private handleOnlineStatus(): void {
    void this.executeQueuedActions();
    BackgroundSyncManager.getInstance().registerCommonTasks();

    document.documentElement.classList.remove('offline');
    document.documentElement.classList.add('online');
  }

  private handleOfflineStatus(): void {
    document.documentElement.classList.remove('online');
    document.documentElement.classList.add('offline');
    this.showOfflineNotification();
  }

  private async executeAction(handler: string, payload?: unknown): Promise<void> {
    const fn = OfflineManager.actionHandlers.get(handler);
    if (!fn) {
      console.warn(`No handler registered for action "${handler}"`);
      return;
    }
    await fn(payload);
  }

  private async executeQueuedActions(): Promise<void> {
    const queued = this.getQueuedActions();
    localStorage.removeItem('queued_actions');

    for (const action of queued) {
      try {
        await this.executeAction(action.handler, action.payload);
      } catch (error) {
        console.error(`Failed to execute queued action "${action.handler}":`, error);
      }
    }
  }

  private getQueuedActions(): QueuedAction[] {
    const stored = localStorage.getItem('queued_actions');
    return stored ? (JSON.parse(stored) as QueuedAction[]) : [];
  }

  private showOfflineNotification(): void {
    const notification = document.createElement('div');
    notification.className = 'offline-notification';
    notification.textContent = 'You are currently offline. Some features may be limited.';
    notification.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'right: 0',
      'background: #f59e0b',
      'color: white',
      'padding: 8px 16px',
      'text-align: center',
      'font-size: 14px',
      'z-index: 9999',
    ].join(';');

    document.body.appendChild(notification);

    const unsubscribe = this.onStatusChange((online) => {
      if (online) {
        notification.remove();
        unsubscribe();
      }
    });
  }
}

// ---------------------------------------------------------------------------
// PWA Capabilities Detector
// ---------------------------------------------------------------------------

export class PWACapabilitiesDetector {
  /** Detect PWA capabilities */
  static detectCapabilities(): PWACapabilities {
    return {
      isInstallable: PWAInstallManager.getInstance().canInstall(),
      isInstalled: this.isInstalled(),
      isStandalone: this.isStandalone(),
      supportsBackgroundSync: this.supportsBackgroundSync(),
      supportsPushNotifications: this.supportsPushNotifications(),
      supportsWebShare: this.supportsWebShare(),
      supportsFileSystemAccess: this.supportsFileSystemAccess(),
    };
  }

  private static isInstalled(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    );
  }

  private static isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  private static supportsBackgroundSync(): boolean {
    return (
      'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    );
  }

  private static supportsPushNotifications(): boolean {
    return (
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    );
  }

  private static supportsWebShare(): boolean {
    return 'share' in navigator;
  }

  private static supportsFileSystemAccess(): boolean {
    return 'showOpenFilePicker' in window;
  }
}

// ---------------------------------------------------------------------------
// Main PWA Enhancement Manager
// ---------------------------------------------------------------------------

export class PWAEnhancementManager {
  private static initialized = false;

  /** Initialize all PWA enhancements (idempotent) */
  static async initialize(vapidPublicKey?: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    PWAInstallManager.getInstance();
    BackgroundSyncManager.getInstance().registerCommonTasks();

    if (vapidPublicKey) {
      PushNotificationManager.getInstance(vapidPublicKey);
    }

    OfflineManager.getInstance();
    AppShortcutsManager.registerShortcuts();

    this.addPWAClasses(PWACapabilitiesDetector.detectCapabilities());
    this.initialized = true;
  }

  private static addPWAClasses(capabilities: PWACapabilities): void {
    const classes: string[] = [];

    if (capabilities.isInstalled) classes.push('pwa-installed');
    if (capabilities.isStandalone) classes.push('pwa-standalone');
    if (capabilities.supportsBackgroundSync) classes.push('supports-background-sync');
    if (capabilities.supportsPushNotifications) classes.push('supports-push-notifications');
    if (capabilities.supportsWebShare) classes.push('supports-web-share');
    if (capabilities.supportsFileSystemAccess) classes.push('supports-file-system-access');

    document.documentElement.classList.add(...classes);
  }

  /** Get current PWA capabilities */
  static getCapabilities(): PWACapabilities {
    return PWACapabilitiesDetector.detectCapabilities();
  }
}
