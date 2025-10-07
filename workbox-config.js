/**
 * Workbox Configuration
 * Comprehensive PWA service worker configuration
 */

module.exports = {
  // Source directory for the service worker
  globDirectory: 'public/',
  
  // Files to precache
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,svg,ico,woff,woff2,ttf,eot}',
  ],
  
  // Files to ignore
  globIgnores: [
    '**/node_modules/**/*',
    '**/*.map',
    '**/hot-update/**/*',
    '**/mix-manifest.json',
  ],
  
  // Service worker destination
  swDest: 'public/sw.js',
  
  // Service worker source template
  swSrc: 'resources/js/src/sw/service-worker.js',
  
  // Maximum file size to precache (2MB)
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
  
  // Skip waiting and claim clients immediately
  skipWaiting: true,
  clientsClaim: true,
  
  // Runtime caching rules
  runtimeCaching: [
    // API Routes - Network First with Background Sync
    {
      urlPattern: /^https?:\/\/.*\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          // Remove auth headers from cache key for better cache hits
          const url = new URL(request.url);
          return url.href;
        },
        plugins: [
          {
            cacheKeyWillBeUsed: async ({ request }) => {
              const url = new URL(request.url);
              // Remove timestamp parameters for better caching
              url.searchParams.delete('_t');
              url.searchParams.delete('timestamp');
              return url.href;
            },
          },
        ],
      },
    },
    
    // GraphQL Queries - Network First
    {
      urlPattern: /^https?:\/\/.*\/graphql$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'graphql-cache',
        networkTimeoutSeconds: 8,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 3 * 60, // 3 minutes
        },
      },
    },
    
    // Static Assets - Cache First
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    
    // Fonts - Cache First
    {
      urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts-cache',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    
    // CSS and JS - Stale While Revalidate
    {
      urlPattern: /\.(?:css|js)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    
    // HTML Pages - Network First with Fallback
    {
      urlPattern: /^https?:\/\/.*\/$|.*\.html$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    
    // External CDN Resources - Stale While Revalidate
    {
      urlPattern: /^https:\/\/cdn\.|^https:\/\/fonts\.|^https:\/\/unpkg\./,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'external-resources',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
  
  // Manifest transformations
  manifestTransforms: [
    (manifestEntries) => {
      // Filter out source maps and hot-update files
      const filteredEntries = manifestEntries.filter(entry => {
        return !entry.url.endsWith('.map') && 
               !entry.url.includes('hot-update');
      });
      
      return { manifest: filteredEntries };
    },
  ],
  
  // Additional configuration
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  // Include additional files in precache
  additionalManifestEntries: [
    { url: '/offline.html', revision: null },
    { url: '/manifest.json', revision: null },
  ],
};

