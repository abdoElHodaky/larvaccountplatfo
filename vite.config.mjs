import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/App.tsx',
            ],
            refresh: true,
        }),
        react(),
        checker({
            typescript: true, // tsc checking in overlay & terminal
            overlay: {
                initialIsOpen: true,
                position: 'tr',
            },
        }),
        chunkSplitPlugin({
            strategy: 'default',
            customSplitting: {
                // Order matters: first match wins — most specific first
                'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
                'chakra': [/@chakra-ui/, /@emotion/, /@popperjs/, /framer-motion/],
                'charts': [/chart\.js/, /react-chartjs-2/],
                'ui': [/@headlessui/, /@heroicons/],
                'inertia': [/@inertiajs/],
                'forms': [/react-hook-form/, /zod/, /hookform/],
                'data': [/@tanstack\/react-query/],
                'utils': [/lodash-es/, /date-fns/, /axios/, /ziggy/],
            },
            customChunk: ({ file }) => {
                // Every feature in its own chunk
                const feature = file.match(/\/features\/([^/]+)\//);
                if (feature) return `feature-${feature[1]}`;

                // Every Inertia page in its own chunk — each route
                // downloads only what it renders
                const page = file.match(/\/Pages\/([^/]+?)(\.tsx|\.ts|\/)/);
                if (page) return `page-${page[1].replace(/\//g, '-')}`;

                return null;
            },
        }),
    ],

    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
            '@/Components': resolve(__dirname, 'resources/js/Components'),
            '@/Layouts': resolve(__dirname, 'resources/js/Layouts'),
            '@/Pages': resolve(__dirname, 'resources/js/Pages'),
            '@/Providers': resolve(__dirname, 'resources/js/Providers'),
            '@/theme': resolve(__dirname, 'resources/js/theme'),
            '@/shared': resolve(__dirname, 'resources/js/shared'),
            '@/features': resolve(__dirname, 'resources/js/features'),
            '@/app': resolve(__dirname, 'resources/js/app'),
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },

    define: {
        global: 'globalThis',
    },

    server: {
        host: '0.0.0.0',
        port: 5173,
        hmr: { host: 'localhost' },
    },

    build: {
        //target: 'esnext', // smaller output than es2020; revert if you need safari14
        // No manualChunks here — chunkSplitPlugin owns splitting.
        // Defining both causes conflicts.
        rollupOptions: {
            output: {
                chunkFileNames: 'js/[name]-[hash].js',
                entryFileNames: 'js/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
        chunkSizeWarningLimit: 600,
        sourcemap: process.env.NODE_ENV === 'development',
    },

    optimizeDeps: {
        // dev-only pre-bundling; no effect on production chunk composition
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
