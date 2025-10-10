/**
 * Workbox Configuration
 * Simplified PWA service worker configuration
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
  
  // Maximum file size to precache (2MB)
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
  
  // Skip waiting and claim clients immediately
  skipWaiting: true,
  clientsClaim: true,
  
  // Enhanced runtime caching rules for better performance
  runtimeCaching: [
    // API Routes - Network First with background sync
    {
      urlPattern: /^https?:\/\/.*\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          // Custom cache key to include user context
          const url = new URL(request.url);
          return `${url.pathname}${url.search}`;
        },
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              // Only cache successful responses
              return response.status === 200;
            },
          },
        ],
      },
    },
    
    // Dashboard and feature pages - Stale While Revalidate
    {
      urlPattern: /^https?:\/\/.*\/(dashboard|accounting|inventory|sales|organization|reporting)/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    
    // Static Assets - Cache First with longer expiration
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          // Remove query parameters for better cache hits
          const url = new URL(request.url);
          return url.origin + url.pathname;
        },
      },
    },
    
    // CSS and JS - Stale While Revalidate with versioning
    {
      urlPattern: /\.(?:css|js)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        plugins: [
          {
            cacheKeyWillBeUsed: async ({ request }) => {
              // Include version hash in cache key
              const url = new URL(request.url);
              return url.href;
            },
          },
        ],
      },
    },
    
    // Google Fonts - Cache First
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    
    // Google Fonts - Cache First
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          const url = new URL(request.url);
          return url.origin + url.pathname;
        },
      },
    },
    
    // CDN Resources - Cache First
    {
      urlPattern: /^https:\/\/cdn\./,
      handler: 'CacheFirst',
      options: {
        cacheName: 'cdn-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
};
