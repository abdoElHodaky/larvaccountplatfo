import React from 'react';

/**
 * Progressive Web App Utilities
 * Performance-optimized PWA functionality for mobile support
 */

export interface PWAInstallPrompt {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWACapabilities {
    isInstallable: boolean;
    isInstalled: boolean;
    isOnline: boolean;
    hasNotificationPermission: boolean;
    hasLocationPermission: boolean;
    supportsPushNotifications: boolean;
    supportsBackgroundSync: boolean;
    supportsOfflineStorage: boolean;
}

/**
 * PWA Manager Class
 * Handles PWA installation, notifications, and offline capabilities
 */
export class PWAManager {
    private static instance: PWAManager;
    private installPrompt: PWAInstallPrompt | null = null;
    private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
    private onlineStatusCallbacks: Array<(isOnline: boolean) => void> = [];
    private installCallbacks: Array<(canInstall: boolean) => void> = [];

    private constructor() {
        this.initializeEventListeners();
    }

    public static getInstance(): PWAManager {
        if (!PWAManager.instance) {
            PWAManager.instance = new PWAManager();
        }
        return PWAManager.instance;
    }

    /**
     * Initialize PWA event listeners
     */
    private initializeEventListeners(): void {
        // Listen for install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e as any;
            this.notifyInstallCallbacks(true);
        });

        // Listen for app installed
        window.addEventListener('appinstalled', () => {
            this.installPrompt = null;
            this.notifyInstallCallbacks(false);
        });

        // Listen for online/offline status
        window.addEventListener('online', () => {
            this.notifyOnlineStatusCallbacks(true);
        });

        window.addEventListener('offline', () => {
            this.notifyOnlineStatusCallbacks(false);
        });
    }

    /**
     * Register service worker
     */
    public async registerServiceWorker(swPath: string = '/sw.js'): Promise<boolean> {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return false;
        }

        try {
            this.serviceWorkerRegistration = await navigator.serviceWorker.register(swPath);
            console.log('Service Worker registered successfully');
            return true;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    }

    /**
     * Check if app can be installed
     */
    public canInstall(): boolean {
        return this.installPrompt !== null;
    }

    /**
     * Prompt user to install the app
     */
    public async promptInstall(): Promise<boolean> {
        if (!this.installPrompt) {
            return false;
        }

        try {
            await this.installPrompt.prompt();
            const choiceResult = await this.installPrompt.userChoice;

            if (choiceResult.outcome === 'accepted') {
                this.installPrompt = null;
                return true;
            }

            return false;
        } catch (error) {
            console.error('Install prompt failed:', error);
            return false;
        }
    }

    /**
     * Check if app is installed
     */
    public isInstalled(): boolean {
        // Check if running in standalone mode
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true
        );
    }

    /**
     * Get PWA capabilities
     */
    public getCapabilities(): PWACapabilities {
        return {
            isInstallable: this.canInstall(),
            isInstalled: this.isInstalled(),
            isOnline: navigator.onLine,
            hasNotificationPermission: Notification.permission === 'granted',
            hasLocationPermission: false, // Would need to check geolocation permission
            supportsPushNotifications: 'PushManager' in window,
            supportsBackgroundSync:
                'serviceWorker' in navigator &&
                'sync' in window.ServiceWorkerRegistration.prototype,
            supportsOfflineStorage: 'caches' in window && 'indexedDB' in window,
        };
    }

    /**
     * Request notification permission
     */
    public async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    /**
     * Show notification
     */
    public async showNotification(
        title: string,
        options: NotificationOptions = {}
    ): Promise<boolean> {
        if (!(await this.requestNotificationPermission())) {
            return false;
        }

        try {
            if (this.serviceWorkerRegistration) {
                await this.serviceWorkerRegistration.showNotification(title, {
                    icon: '/icon-192x192.png',
                    badge: '/icon-72x72.png',
                    ...options,
                });
            } else {
                new Notification(title, {
                    icon: '/icon-192x192.png',
                    ...options,
                });
            }
            return true;
        } catch (error) {
            console.error('Failed to show notification:', error);
            return false;
        }
    }

    /**
     * Subscribe to push notifications
     */
    public async subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
        if (!this.serviceWorkerRegistration || !('PushManager' in window)) {
            return null;
        }

        try {
            const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
            });

            return subscription;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            return null;
        }
    }

    /**
     * Cache resources for offline use
     */
    public async cacheResources(
        resources: string[],
        cacheName: string = 'app-cache'
    ): Promise<boolean> {
        if (!('caches' in window)) {
            return false;
        }

        try {
            const cache = await caches.open(cacheName);
            await cache.addAll(resources);
            return true;
        } catch (error) {
            console.error('Failed to cache resources:', error);
            return false;
        }
    }

    /**
     * Clear cache
     */
    public async clearCache(cacheName?: string): Promise<boolean> {
        if (!('caches' in window)) {
            return false;
        }

        try {
            if (cacheName) {
                await caches.delete(cacheName);
            } else {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map((name) => caches.delete(name)));
            }
            return true;
        } catch (error) {
            console.error('Failed to clear cache:', error);
            return false;
        }
    }

    /**
     * Add online status listener
     */
    public onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
        this.onlineStatusCallbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.onlineStatusCallbacks.indexOf(callback);
            if (index > -1) {
                this.onlineStatusCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Add install status listener
     */
    public onInstallStatusChange(callback: (canInstall: boolean) => void): () => void {
        this.installCallbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.installCallbacks.indexOf(callback);
            if (index > -1) {
                this.installCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Notify online status callbacks
     */
    private notifyOnlineStatusCallbacks(isOnline: boolean): void {
        this.onlineStatusCallbacks.forEach((callback) => callback(isOnline));
    }

    /**
     * Notify install callbacks
     */
    private notifyInstallCallbacks(canInstall: boolean): void {
        this.installCallbacks.forEach((callback) => callback(canInstall));
    }

    /**
     * Convert VAPID key to Uint8Array
     */
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
}

/**
 * React Hook for PWA functionality
 */
export function usePWA() {
    const [capabilities, setCapabilities] = React.useState<PWACapabilities>(() =>
        PWAManager.getInstance().getCapabilities()
    );

    React.useEffect(() => {
        const pwaManager = PWAManager.getInstance();

        const unsubscribeOnline = pwaManager.onOnlineStatusChange((isOnline) => {
            setCapabilities((prev) => ({ ...prev, isOnline }));
        });

        const unsubscribeInstall = pwaManager.onInstallStatusChange((isInstallable) => {
            setCapabilities((prev) => ({ ...prev, isInstallable }));
        });

        return () => {
            unsubscribeOnline();
            unsubscribeInstall();
        };
    }, []);

    const install = React.useCallback(async () => {
        return await PWAManager.getInstance().promptInstall();
    }, []);

    const showNotification = React.useCallback(
        async (title: string, options?: NotificationOptions) => {
            return await PWAManager.getInstance().showNotification(title, options);
        },
        []
    );

    return {
        capabilities,
        install,
        showNotification,
        pwaManager: PWAManager.getInstance(),
    };
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance();

export default PWAManager;
