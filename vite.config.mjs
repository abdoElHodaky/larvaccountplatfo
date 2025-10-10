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
                manualChunks: {
                    // Core vendor chunks
                    vendor: ['react', 'react-dom'],
                    inertia: ['@inertiajs/react'],
                    
                    // UI library chunks
                    ui: ['@headlessui/react', '@heroicons/react'],
                    chakra: ['@chakra-ui/react', '@emotion/react', '@emotion/styled'],
                    motion: ['framer-motion'],
                    
                    // Feature-specific chunks
                    charts: ['chart.js', 'react-chartjs-2'],
                    utils: ['lodash', 'date-fns', 'axios'],
                    
                    // Feature chunks for better code splitting
                    'feature-accounting': ['./resources/js/features/accounting'],
                    'feature-dashboard': ['./resources/js/features/dashboard'],
                    'feature-inventory': ['./resources/js/features/inventory'],
                    'feature-sales': ['./resources/js/features/sales'],
                    'feature-auth': ['./resources/js/features/auth'],
                    'feature-organization': ['./resources/js/features/organization'],
                    'feature-reporting': ['./resources/js/features/reporting'],
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
