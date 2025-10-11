import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.tsx',
            ],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
            '@/Components': resolve(__dirname, 'resources/js/Components'),
            '@/Layouts': resolve(__dirname, 'resources/js/Layouts'),
            '@/Pages': resolve(__dirname, 'resources/js/Pages'),
            '@/Providers': resolve(__dirname, 'resources/js/Providers'),
            '@/theme': resolve(__dirname, 'resources/js/theme'),
            // New consolidated structure
            '@/shared': resolve(__dirname, 'resources/js/shared'),
            '@/features': resolve(__dirname, 'resources/js/features'),
            '@/app': resolve(__dirname, 'resources/js/app'),
        },
    },
    define: {
        global: 'globalThis',
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        hmr: {
            host: 'localhost',
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Core vendor chunks - optimized for better caching
                    if (id.includes('node_modules')) {
                        // React core - most stable, cache-friendly
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'react-vendor';
                        }
                        // Inertia.js - Laravel integration
                        if (id.includes('@inertiajs/react')) {
                            return 'inertia-vendor';
                        }
                        // UI libraries - separate for potential future consolidation
                        if (id.includes('@headlessui/react') || id.includes('@heroicons/react')) {
                            return 'headless-ui';
                        }
                        // Chakra UI - separate chunk for potential removal
                        if (id.includes('@chakra-ui/react') || id.includes('@emotion/react') || id.includes('@emotion/styled')) {
                            return 'chakra-ui';
                        }
                        // Animation library
                        if (id.includes('framer-motion')) {
                            return 'animation';
                        }
                        // Chart libraries
                        if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('recharts')) {
                            return 'charts';
                        }
                        // State management
                        if (id.includes('@rematch') || id.includes('react-redux') || id.includes('@apollo/client')) {
                            return 'state-management';
                        }
                        // Utilities and smaller libraries
                        if (id.includes('date-fns') || id.includes('axios') || id.includes('socket.io-client')) {
                            return 'utilities';
                        }
                        // Default vendor chunk for remaining dependencies
                        return 'vendor-misc';
                    }
                    
                    // Shared components - separate chunk for reusability
                    if (id.includes('/shared/components/')) {
                        return 'shared-components';
                    }
                    
                    // Shared services and utilities
                    if (id.includes('/shared/services/') || id.includes('/shared/utils/')) {
                        return 'shared-services';
                    }
                    
                    // Feature-based chunks - optimized for lazy loading
                    if (id.includes('/features/accounting/')) {
                        // Split large accounting feature into sub-chunks
                        if (id.includes('/pages/')) {
                            return 'accounting-pages';
                        }
                        if (id.includes('/components/organisms/')) {
                            return 'accounting-components';
                        }
                        return 'accounting-core';
                    }
                    if (id.includes('/features/dashboard/')) {
                        return 'dashboard';
                    }
                    if (id.includes('/features/inventory/')) {
                        return 'inventory';
                    }
                    if (id.includes('/features/sales/')) {
                        return 'sales';
                    }
                    if (id.includes('/features/auth/')) {
                        return 'auth';
                    }
                    if (id.includes('/features/organization/')) {
                        return 'organization';
                    }
                    if (id.includes('/features/reporting/')) {
                        return 'reporting';
                    }
                },
                // Optimize chunk naming for better caching
                chunkFileNames: (chunkInfo) => {
                    const facadeModuleId = chunkInfo.facadeModuleId
                        ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '')
                        : 'chunk';
                    return `js/[name]-[hash].js`;
                },
                entryFileNames: 'js/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
        chunkSizeWarningLimit: 1000,
        // Enable source maps for better debugging
        sourcemap: process.env.NODE_ENV === 'development',
        // Optimize for production
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: process.env.NODE_ENV === 'production',
                drop_debugger: process.env.NODE_ENV === 'production',
            },
        },
    },
    optimizeDeps: {
        include: [
            // Core React dependencies
            'react',
            'react-dom',
            'react/jsx-runtime',
            
            // Laravel integration
            '@inertiajs/react',
            
            // UI libraries - optimize most used components
            '@headlessui/react',
            '@heroicons/react/24/outline',
            '@heroicons/react/24/solid',
            
            // State management
            'react-redux',
            '@rematch/core',
            '@apollo/client',
            
            // Charts and visualization
            'chart.js',
            'react-chartjs-2',
            'recharts',
            
            // Utilities
            'date-fns',
            'axios',
            
            // Animation
            'framer-motion',
        ],
        // Exclude Chakra UI from pre-bundling to prepare for removal
        exclude: [
            '@chakra-ui/react',
            '@emotion/react',
            '@emotion/styled',
        ],
    },
});
