import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/App.tsx',
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
            'ziggy-js': resolve(__dirname,'vendor/tightenco/ziggy'),
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
                    // Core vendor chunks
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'vendor';
                        }
                        if (id.includes('@inertiajs/react')) {
                            return 'inertia';
                        }
                        if (id.includes('@headlessui/react') || id.includes('@heroicons/react')) {
                            return 'ui';
                        }
                        if (id.includes('@chakra-ui/react') || id.includes('@emotion/react') || id.includes('@emotion/styled')) {
                            return 'chakra';
                        }
                        if (id.includes('framer-motion')) {
                            return 'motion';
                        }
                        if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
                            return 'charts';
                        }
                        if (id.includes('lodash') || id.includes('date-fns') || id.includes('axios')) {
                            return 'utils';
                        }
                        return 'vendor';
                    }
                    
                    // Feature chunks for better code splitting
                    if (id.includes('/features/accounting/')) {
                        return 'feature-accounting';
                    }
                    if (id.includes('/features/dashboard/')) {
                        return 'feature-dashboard';
                    }
                    if (id.includes('/features/inventory/')) {
                        return 'feature-inventory';
                    }
                    if (id.includes('/features/sales/')) {
                        return 'feature-sales';
                    }
                    if (id.includes('/features/auth/')) {
                        return 'feature-auth';
                    }
                    if (id.includes('/features/organization/')) {
                        return 'feature-organization';
                    }
                    if (id.includes('/features/reporting/')) {
                        return 'feature-reporting';
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
            'react',
            'react-dom',
            '@inertiajs/react',
            '@headlessui/react',
            '@heroicons/react/24/outline',
            '@heroicons/react/24/solid',
            '@chakra-ui/react',
            '@emotion/react',
            '@emotion/styled',
            'framer-motion',
            'chart.js',
            'react-chartjs-2',
        ],
    },
});
