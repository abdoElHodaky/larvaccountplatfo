/**
 * Data Synchronization Service
 * Unified data layer combining Alova.js GraphQL and Socket.io real-time updates
 */

import { socketManager } from '../socket/socketManager';
import { clearCacheByPattern } from '../alova/alova.config';

interface CacheEntry {
    data: any;
    timestamp: number;
    ttl: number;
    subscribers: Set<(data: any) => void>;
}

interface SubscriptionOptions {
    realtime?: boolean;
    cacheTime?: number;
    staleTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
}

/**
 * Data Synchronization Service
 * Manages cache, subscriptions, and real-time updates
 */
class DataSyncService {
    private cache = new Map<string, CacheEntry>();
    private subscriptions = new Map<string, Set<(data: any) => void>>();
    private realtimeSubscriptions = new Map<string, () => void>();
    private backgroundRefreshInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.setupBackgroundRefresh();
        this.setupWindowFocusRefresh();
        this.setupReconnectRefresh();
    }

    /**
     * Subscribe to data updates with optional real-time sync
     */
    subscribe<T>(
        key: string,
        fetcher: () => Promise<T>,
        callback: (data: T) => void,
        options: SubscriptionOptions = {}
    ): () => void {
        const {
            realtime = false,
            cacheTime = 300000, // 5 minutes
            staleTime = 60000, // 1 minute
            refetchOnWindowFocus: _refetchOnWindowFocus = true,
            refetchOnReconnect: _refetchOnReconnect = true,
        } = options;

        // Add callback to subscriptions
        if (!this.subscriptions.has(key)) {
            this.subscriptions.set(key, new Set());
        }
        this.subscriptions.get(key)!.add(callback);

        // Setup cache entry if not exists
        if (!this.cache.has(key)) {
            this.cache.set(key, {
                data: null,
                timestamp: 0,
                ttl: cacheTime,
                subscribers: new Set(),
            });
        }

        const cacheEntry = this.cache.get(key)!;
        cacheEntry.subscribers.add(callback);

        // Setup real-time subscription if enabled
        if (realtime && !this.realtimeSubscriptions.has(key)) {
            this.setupRealtimeSubscription(key);
        }

        // Fetch data if cache is empty or stale
        const now = Date.now();
        const isStale = now - cacheEntry.timestamp > staleTime;
        const isEmpty = cacheEntry.data === null;

        if (isEmpty || isStale) {
            this.fetchAndCache(key, fetcher);
        } else {
            // Return cached data immediately
            callback(cacheEntry.data);
        }

        // Return unsubscribe function
        return () => {
            const callbacks = this.subscriptions.get(key);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.subscriptions.delete(key);
                    this.cleanupRealtimeSubscription(key);
                }
            }

            const entry = this.cache.get(key);
            if (entry) {
                entry.subscribers.delete(callback);
                if (entry.subscribers.size === 0) {
                    this.cache.delete(key);
                }
            }
        };
    }

    /**
     * Fetch data and update cache
     */
    private async fetchAndCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        try {
            console.log(`🔄 Fetching data for key: ${key}`);
            const data = await fetcher();

            const cacheEntry = this.cache.get(key);
            if (cacheEntry) {
                cacheEntry.data = data;
                cacheEntry.timestamp = Date.now();

                // Notify all subscribers
                cacheEntry.subscribers.forEach((callback) => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Error in subscriber callback for ${key}:`, error);
                    }
                });
            }

            console.log(`✅ Data cached for key: ${key}`);
            return data;
        } catch (error) {
            console.error(`❌ Failed to fetch data for key: ${key}`, error);
            throw error;
        }
    }

    /**
     * Setup real-time subscription for a key
     */
    private setupRealtimeSubscription(key: string): void {
        const eventName = `update:${key}`;

        const handleUpdate = (data: any) => {
            console.log(`📡 Real-time update for key: ${key}`, data);
            this.updateCache(key, data);
        };

        const unsubscribe = socketManager.on(eventName, handleUpdate);
        this.realtimeSubscriptions.set(key, unsubscribe);

        console.log(`🔔 Real-time subscription setup for: ${key}`);
    }

    /**
     * Cleanup real-time subscription
     */
    private cleanupRealtimeSubscription(key: string): void {
        const unsubscribe = this.realtimeSubscriptions.get(key);
        if (unsubscribe) {
            unsubscribe();
            this.realtimeSubscriptions.delete(key);
            console.log(`🔕 Real-time subscription cleaned up for: ${key}`);
        }
    }

    /**
     * Update cache and notify subscribers
     */
    updateCache(key: string, data: any): void {
        const cacheEntry = this.cache.get(key);
        if (cacheEntry) {
            cacheEntry.data = data;
            cacheEntry.timestamp = Date.now();

            // Notify all subscribers
            cacheEntry.subscribers.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in subscriber callback for ${key}:`, error);
                }
            });
        }
    }

    /**
     * Invalidate cache by key or pattern
     */
    invalidateCache(keyOrPattern: string): void {
        if (keyOrPattern.includes('*') || keyOrPattern.includes('?')) {
            // Pattern-based invalidation
            const regex = new RegExp(keyOrPattern.replace(/\*/g, '.*').replace(/\?/g, '.'));

            for (const [key] of this.cache) {
                if (regex.test(key)) {
                    this.cache.delete(key);
                    console.log(`🗑️ Cache invalidated for pattern match: ${key}`);
                }
            }

            // Also clear Alova cache
            clearCacheByPattern(keyOrPattern);
        } else {
            // Exact key invalidation
            this.cache.delete(keyOrPattern);
            console.log(`🗑️ Cache invalidated for key: ${keyOrPattern}`);
        }
    }

    /**
     * Prefetch data for better performance
     */
    async prefetch<T>(key: string, fetcher: () => Promise<T>, ttl: number = 300000): Promise<void> {
        if (!this.cache.has(key)) {
            this.cache.set(key, {
                data: null,
                timestamp: 0,
                ttl,
                subscribers: new Set(),
            });
        }

        try {
            await this.fetchAndCache(key, fetcher);
            console.log(`🚀 Data prefetched for key: ${key}`);
        } catch (error) {
            console.error(`❌ Failed to prefetch data for key: ${key}`, error);
        }
    }

    /**
     * Warm cache with multiple keys
     */
    async warmCache(
        entries: Array<{
            key: string;
            fetcher: () => Promise<any>;
            ttl?: number;
        }>
    ): Promise<void> {
        console.log(`🔥 Warming cache with ${entries.length} entries`);

        const promises = entries.map(async ({ key, fetcher, ttl = 300000 }) => {
            try {
                await this.prefetch(key, fetcher, ttl);
            } catch (error) {
                console.error(`Failed to warm cache for ${key}:`, error);
            }
        });

        await Promise.allSettled(promises);
        console.log(`✅ Cache warming completed`);
    }

    /**
     * Setup background refresh for stale entries
     */
    private setupBackgroundRefresh(): void {
        this.backgroundRefreshInterval = setInterval(() => {
            this.refreshStaleEntries();
        }, 60000); // Check every minute
    }

    /**
     * Refresh stale cache entries in background
     */
    private refreshStaleEntries(): void {
        const now = Date.now();
        let refreshCount = 0;

        for (const [key, entry] of this.cache) {
            const isStale = now - entry.timestamp > entry.ttl;
            const hasSubscribers = entry.subscribers.size > 0;

            if (isStale && hasSubscribers) {
                // We need a way to get the original fetcher
                // This would require storing fetchers with cache entries
                console.log(`⏰ Background refresh needed for stale key: ${key}`);
                refreshCount++;
            }
        }

        if (refreshCount > 0) {
            console.log(`🔄 Background refresh: ${refreshCount} stale entries found`);
        }
    }

    /**
     * Setup window focus refresh
     */
    private setupWindowFocusRefresh(): void {
        if (typeof window !== 'undefined') {
            window.addEventListener('focus', () => {
                console.log('🔍 Window focused - checking for stale data');
                this.refreshStaleEntries();
            });
        }
    }

    /**
     * Setup reconnect refresh
     */
    private setupReconnectRefresh(): void {
        socketManager.on('connect', () => {
            console.log('🔌 Socket reconnected - refreshing data');
            this.refreshStaleEntries();
        });
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        cacheSize: number;
        subscriptionCount: number;
        realtimeSubscriptionCount: number;
        entries: Array<{
            key: string;
            age: number;
            subscriberCount: number;
            hasRealtimeSubscription: boolean;
        }>;
    } {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            age: now - entry.timestamp,
            subscriberCount: entry.subscribers.size,
            hasRealtimeSubscription: this.realtimeSubscriptions.has(key),
        }));

        return {
            cacheSize: this.cache.size,
            subscriptionCount: this.subscriptions.size,
            realtimeSubscriptionCount: this.realtimeSubscriptions.size,
            entries,
        };
    }

    /**
     * Clear all caches and subscriptions
     */
    clearAll(): void {
        // Clear cache
        this.cache.clear();

        // Clear subscriptions
        this.subscriptions.clear();

        // Clear real-time subscriptions
        this.realtimeSubscriptions.forEach((unsubscribe) => unsubscribe());
        this.realtimeSubscriptions.clear();

        // Clear background refresh
        if (this.backgroundRefreshInterval) {
            clearInterval(this.backgroundRefreshInterval);
            this.backgroundRefreshInterval = null;
        }

        console.log('🧹 All data sync caches and subscriptions cleared');
    }

    /**
     * Destroy the service
     */
    destroy(): void {
        this.clearAll();
        console.log('💥 DataSyncService destroyed');
    }
}

// Export singleton instance
export const dataSyncService = new DataSyncService();

// Export types
export type { SubscriptionOptions };

// Cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        dataSyncService.destroy();
    });
}
