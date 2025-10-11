import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { AppProviders } from './shared/providers/AppProviders';

const appName = process.env.VITE_APP_NAME || 'Laravel Accounting Platform';

// SSR Cache for improved performance
const ssrCache = new Map<string, { html: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000;

// Cache key generator
function generateCacheKey(page: any): string {
    const { component, props, url, version } = page;
    return `${component}-${url}-${version}-${JSON.stringify(props).slice(0, 100)}`;
}

// Cache cleanup
function cleanupCache() {
    if (ssrCache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(ssrCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Remove oldest 20% of entries
        const toRemove = Math.floor(entries.length * 0.2);
        for (let i = 0; i < toRemove; i++) {
            ssrCache.delete(entries[i][0]);
        }
    }
}

// Enhanced page resolver with preloading hints
const resolvePageWithPreload = (name: string) => {
    const component = resolvePageComponent(
        `./features/${name}.tsx`,
        import.meta.glob('./features/**/*.tsx')
    );

    // Add preload hints for likely next pages
    const preloadHints = getPreloadHints(name);

    return component.then((module) => ({
        ...module,
        preloadHints,
    }));
};

// Get preload hints based on current page
function getPreloadHints(pageName: string): string[] {
    const preloadMap: Record<string, string[]> = {
        'dashboard/Index': ['accounting/Dashboard', 'inventory/Dashboard', 'sales/Dashboard'],
        'accounting/Dashboard': ['accounting/Accounts/Index', 'accounting/Transactions/Index'],
        'inventory/Dashboard': ['inventory/Products/Index', 'inventory/Categories/Index'],
        'sales/Dashboard': ['sales/Orders/Index', 'sales/Customers/Index'],
    };

    return preloadMap[pageName] || [];
}

// Export the SSR function for Laravel to use
export default function render(page: any) {
    const cacheKey = generateCacheKey(page);
    const now = Date.now();

    // Check cache first
    const cached = ssrCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL) {
        return Promise.resolve(cached.html);
    }

    return createInertiaApp({
        page,
        render: (App) => {
            try {
                const html = ReactDOMServer.renderToString(App);

                // Cache the result
                ssrCache.set(cacheKey, { html, timestamp: now });
                cleanupCache();

                return html;
            } catch (error) {
                console.error('SSR Error:', error);
                // Fallback to basic rendering
                return ReactDOMServer.renderToString(App);
            }
        },
        title: (title) => `${title} - ${appName}`,
        resolve: resolvePageWithPreload,
        setup: ({ App, props }) => {
            // Add performance monitoring
            const startTime = performance.now();

            const WrappedApp = (
                <AppProviders>
                    <App {...props} />
                </AppProviders>
            );

            // Log SSR performance in development
            if (process.env.NODE_ENV === 'development') {
                const endTime = performance.now();
                console.log(
                    `SSR render time: ${(endTime - startTime).toFixed(2)}ms for ${page.component}`
                );
            }

            return WrappedApp;
        },
    });
}
