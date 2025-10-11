/**
 * Progressive Web App (PWA) Enhancements
 * Provides advanced PWA features including background sync, push notifications,
 * app shortcuts, and offline capabilities
 */

// PWA Installation and Management
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

/**
 * PWA Installation Manager
 */
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
            this.installPrompt = e as any;
            this.notifyInstallListeners(true);
        });

        window.addEventListener('appinstalled', () => {
            this.installPrompt = null;
            this.notifyInstallListeners(false);
            this.trackInstallation();
        });
    }

    /**
     * Check if PWA can be installed
     */
    canInstall(): boolean {
        return this.installPrompt !== null;
    }

    /**
     * Trigger PWA installation
     */
    async install(): Promise<boolean> {
        if (!this.installPrompt) {
            return false;
        }

        try {
            await this.installPrompt.prompt();
            const choiceResult = await this.installPrompt.userChoice;

            if (choiceResult.outcome === 'accepted') {
                this.trackInstallationAttempt('accepted');
                return true;
            } else {
                this.trackInstallationAttempt('dismissed');
                return false;
            }
        } catch (error) {
            console.error('PWA installation failed:', error);
            return false;
        }
    }

    /**
     * Add listener for install availability changes
     */
    onInstallAvailable(callback: (canInstall: boolean) => void): () => void {
        this.installListeners.push(callback);

        // Immediately notify with current state
        callback(this.canInstall());

        // Return unsubscribe function
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
        // Track successful installation
        if (typeof gtag !== 'undefined') {
            gtag('event', 'pwa_installed', {
                event_category: 'PWA',
                event_label: 'installation_completed',
            });
        }
    }

    private trackInstallationAttempt(outcome: string): void {
        // Track installation attempt
        if (typeof gtag !== 'undefined') {
            gtag('event', 'pwa_install_prompt', {
                event_category: 'PWA',
                event_label: outcome,
            });
        }
    }
}

/**
 * Background Sync Manager
 */
export class BackgroundSyncManager {
    private static instance: BackgroundSyncManager;
    private syncTasks: Map<string, () => Promise<void>> = new Map();

    static getInstance(): BackgroundSyncManager {
        if (!BackgroundSyncManager.instance) {
            BackgroundSyncManager.instance = new BackgroundSyncManager();
        }
        return BackgroundSyncManager.instance;
    }

    /**
     * Register a background sync task
     */
    async registerSync(tag: string, task: () => Promise<void>): Promise<void> {
        this.syncTasks.set(tag, task);

        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register(tag);
            } catch (error) {
                console.error('Background sync registration failed:', error);
                // Fallback: execute task immediately
                await this.executeTask(tag);
            }
        } else {
            // Fallback: execute task immediately
            await this.executeTask(tag);
        }
    }

    /**
     * Execute a sync task
     */
    async executeTask(tag: string): Promise<void> {
        const task = this.syncTasks.get(tag);
        if (task) {
            try {
                await task();
                this.syncTasks.delete(tag);
            } catch (error) {
                console.error(`Background sync task ${tag} failed:`, error);
                throw error;
            }
        }
    }

    /**
     * Register common sync tasks
     */
    registerCommonTasks(): void {
        // Sync offline form submissions
        this.registerSync('form-submissions', async () => {
            const submissions = this.getOfflineSubmissions();
            for (const submission of submissions) {
                await this.submitForm(submission);
            }
            this.clearOfflineSubmissions();
        });

        // Sync cached data
        this.registerSync('data-sync', async () => {
            await this.syncCachedData();
        });

        // Sync user preferences
        this.registerSync('preferences-sync', async () => {
            await this.syncUserPreferences();
        });
    }

    private getOfflineSubmissions(): any[] {
        const stored = localStorage.getItem('offline_submissions');
        return stored ? JSON.parse(stored) : [];
    }

    private async submitForm(submission: any): Promise<void> {
        // Implementation would depend on your API structure
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
        // Sync any cached data that needs to be uploaded
        // Implementation would depend on your data structure
    }

    private async syncUserPreferences(): Promise<void> {
        // Sync user preferences to server
        // Implementation would depend on your preferences system
    }
}

/**
 * Push Notification Manager
 */
export class PushNotificationManager {
    private static instance: PushNotificationManager;
    private vapidPublicKey: string;

    static getInstance(vapidPublicKey?: string): PushNotificationManager {
        if (!PushNotificationManager.instance) {
            PushNotificationManager.instance = new PushNotificationManager(vapidPublicKey || '');
        }
        return PushNotificationManager.instance;
    }

    constructor(vapidPublicKey: string) {
        this.vapidPublicKey = vapidPublicKey;
    }

    /**
     * Request notification permission
     */
    async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            throw new Error('This browser does not support notifications');
        }

        const permission = await Notification.requestPermission();
        this.trackPermissionRequest(permission);
        return permission;
    }

    /**
     * Subscribe to push notifications
     */
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

            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);

            return subscription;
        } catch (error) {
            console.error('Push subscription failed:', error);
            return null;
        }
    }

    /**
     * Unsubscribe from push notifications
     */
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

    /**
     * Check if user is subscribed to push notifications
     */
    async isSubscribed(): Promise<boolean> {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            return subscription !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Show local notification
     */
    async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
        if (Notification.permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;

            const defaultOptions: NotificationOptions = {
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                },
                actions: [
                    {
                        action: 'view',
                        title: 'View',
                        icon: '/icon-view.png',
                    },
                    {
                        action: 'dismiss',
                        title: 'Dismiss',
                        icon: '/icon-dismiss.png',
                    },
                ],
            };

            await registration.showNotification(title, { ...defaultOptions, ...options });
        }
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
        // Send subscription to your server
        await fetch('/api/push-subscriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription),
        });
    }

    private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
        // Remove subscription from your server
        await fetch('/api/push-subscriptions', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
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

/**
 * App Shortcuts Manager
 */
export class AppShortcutsManager {
    /**
     * Register app shortcuts
     */
    static registerShortcuts(): void {
        if ('navigator' in window && 'setAppBadge' in navigator) {
            // Register keyboard shortcuts
            this.registerKeyboardShortcuts();
        }

        // Register web app shortcuts (defined in manifest.json)
        this.updateManifestShortcuts();
    }

    private static registerKeyboardShortcuts(): void {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + K for search
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                this.triggerSearch();
            }

            // Ctrl/Cmd + N for new item
            if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
                event.preventDefault();
                this.triggerNewItem();
            }

            // Ctrl/Cmd + D for dashboard
            if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
                event.preventDefault();
                this.navigateToDashboard();
            }
        });
    }

    private static updateManifestShortcuts(): void {
        // This would typically be handled by the manifest.json file
        // But we can dynamically update shortcuts if needed
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

        // Store shortcuts for potential dynamic updates
        localStorage.setItem('app_shortcuts', JSON.stringify(shortcuts));
    }

    private static triggerSearch(): void {
        // Trigger global search functionality
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
            searchInput.focus();
        }
    }

    private static triggerNewItem(): void {
        // Trigger new item creation
        const newButton = document.querySelector('[data-new-item]') as HTMLButtonElement;
        if (newButton) {
            newButton.click();
        }
    }

    private static navigateToDashboard(): void {
        // Navigate to dashboard
        if (window.location.pathname !== '/dashboard') {
            window.location.href = '/dashboard';
        }
    }
}

/**
 * Offline Capabilities Manager
 */
export class OfflineManager {
    private static instance: OfflineManager;
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

    /**
     * Check if app is online
     */
    getOnlineStatus(): boolean {
        return this.isOnline;
    }

    /**
     * Add listener for online status changes
     */
    onStatusChange(callback: (isOnline: boolean) => void): () => void {
        this.onlineListeners.push(callback);

        // Immediately notify with current state
        callback(this.isOnline);

        // Return unsubscribe function
        return () => {
            const index = this.onlineListeners.indexOf(callback);
            if (index > -1) {
                this.onlineListeners.splice(index, 1);
            }
        };
    }

    /**
     * Store data for offline use
     */
    storeOfflineData(key: string, data: any): void {
        try {
            const offlineData = this.getOfflineData();
            offlineData[key] = {
                data,
                timestamp: Date.now(),
            };
            localStorage.setItem('offline_data', JSON.stringify(offlineData));
        } catch (error) {
            console.error('Failed to store offline data:', error);
        }
    }

    /**
     * Retrieve offline data
     */
    getOfflineData(key?: string): any {
        try {
            const stored = localStorage.getItem('offline_data');
            const offlineData = stored ? JSON.parse(stored) : {};

            if (key) {
                return offlineData[key]?.data || null;
            }

            return offlineData;
        } catch (error) {
            console.error('Failed to retrieve offline data:', error);
            return key ? null : {};
        }
    }

    /**
     * Queue action for when online
     */
    queueForOnline(action: () => Promise<void>): void {
        if (this.isOnline) {
            action();
        } else {
            const queuedActions = this.getQueuedActions();
            queuedActions.push(action.toString());
            localStorage.setItem('queued_actions', JSON.stringify(queuedActions));
        }
    }

    private notifyListeners(isOnline: boolean): void {
        this.onlineListeners.forEach((listener) => listener(isOnline));
    }

    private handleOnlineStatus(): void {
        // Execute queued actions
        this.executeQueuedActions();

        // Sync background tasks
        BackgroundSyncManager.getInstance().registerCommonTasks();

        // Update UI
        document.documentElement.classList.remove('offline');
        document.documentElement.classList.add('online');
    }

    private handleOfflineStatus(): void {
        // Update UI
        document.documentElement.classList.remove('online');
        document.documentElement.classList.add('offline');

        // Show offline notification
        this.showOfflineNotification();
    }

    private executeQueuedActions(): void {
        const queuedActions = this.getQueuedActions();
        queuedActions.forEach((actionString) => {
            try {
                // Note: In a real implementation, you'd need a more sophisticated
                // way to serialize and deserialize functions
                const action = new Function('return ' + actionString)();
                action();
            } catch (error) {
                console.error('Failed to execute queued action:', error);
            }
        });

        // Clear queued actions
        localStorage.removeItem('queued_actions');
    }

    private getQueuedActions(): string[] {
        const stored = localStorage.getItem('queued_actions');
        return stored ? JSON.parse(stored) : [];
    }

    private showOfflineNotification(): void {
        // Show a subtle notification that the app is offline
        const notification = document.createElement('div');
        notification.className = 'offline-notification';
        notification.textContent = 'You are currently offline. Some features may be limited.';
        notification.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f59e0b;
      color: white;
      padding: 8px 16px;
      text-align: center;
      font-size: 14px;
      z-index: 9999;
    `;

        document.body.appendChild(notification);

        // Remove notification when back online
        const removeNotification = () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        };

        const unsubscribe = this.onStatusChange((isOnline) => {
            if (isOnline) {
                removeNotification();
                unsubscribe();
            }
        });
    }
}

/**
 * PWA Capabilities Detector
 */
export class PWACapabilitiesDetector {
    /**
     * Detect PWA capabilities
     */
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
            (window.navigator as any).standalone === true
        );
    }

    private static isStandalone(): boolean {
        return window.matchMedia('(display-mode: standalone)').matches;
    }

    private static supportsBackgroundSync(): boolean {
        return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
    }

    private static supportsPushNotifications(): boolean {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    }

    private static supportsWebShare(): boolean {
        return 'share' in navigator;
    }

    private static supportsFileSystemAccess(): boolean {
        return 'showOpenFilePicker' in window;
    }
}

/**
 * Main PWA Enhancement Manager
 */
export class PWAEnhancementManager {
    private static initialized = false;

    /**
     * Initialize all PWA enhancements
     */
    static async initialize(vapidPublicKey?: string): Promise<void> {
        if (this.initialized) return;

        // Initialize managers
        PWAInstallManager.getInstance();
        BackgroundSyncManager.getInstance().registerCommonTasks();

        if (vapidPublicKey) {
            PushNotificationManager.getInstance(vapidPublicKey);
        }

        OfflineManager.getInstance();
        AppShortcutsManager.registerShortcuts();

        // Add PWA-specific CSS classes
        const capabilities = PWACapabilitiesDetector.detectCapabilities();
        this.addPWAClasses(capabilities);

        this.initialized = true;
    }

    private static addPWAClasses(capabilities: PWACapabilities): void {
        const classes = [];

        if (capabilities.isInstalled) classes.push('pwa-installed');
        if (capabilities.isStandalone) classes.push('pwa-standalone');
        if (capabilities.supportsBackgroundSync) classes.push('supports-background-sync');
        if (capabilities.supportsPushNotifications) classes.push('supports-push-notifications');
        if (capabilities.supportsWebShare) classes.push('supports-web-share');
        if (capabilities.supportsFileSystemAccess) classes.push('supports-file-system-access');

        document.documentElement.classList.add(...classes);
    }

    /**
     * Get PWA capabilities
     */
    static getCapabilities(): PWACapabilities {
        return PWACapabilitiesDetector.detectCapabilities();
    }
}

// Export all managers and utilities
export {
  PWAInstallManager,
  BackgroundSyncManager,
  PushNotificationManager,
  AppShortcutsManager,
  OfflineManager,
  PWACapabilitiesDetector,
  PWAEnhancementManager,
};
