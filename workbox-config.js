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
  
  // Simplified runtime caching rules
  runtimeCaching: [
    // API Routes - Network First
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
      },
    },
    
    // Static Assets - Cache First
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
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
          maxEntries: 150,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
  ],
};
