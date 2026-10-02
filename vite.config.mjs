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
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        checker({
            typescript: true,
            overlay: { initialIsOpen: true, position: 'tr' },
        }),
        chunkSplitPlugin({
            strategy: 'default',
            customSplitting: {
                // --- Vendor chunks (order matters: most specific first) ---
                'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
                'chakra': [
                    /@chakra-ui/,
                    /@emotion/,
                    /@popperjs/,
                    /framer-motion/,   // Chakra peer — keep them together
                ],
                'charts': [/chart\.js/, /react-chartjs-2/],
                'ui': [/@headlessui/, /@heroicons/],
                'inertia': [/@inertiajs/],
                'utils': [/lodash/, /date-fns/, /axios/, /ziggy/],
            },
            customChunk: (args) => {
                const { file, moduleId, root } = args;

                // Split every feature into its own chunk
                const feature = file.match(/\/features\/([^/]+)\//);
                if (feature) return `feature-${feature[1]}`;

                // Split every Inertia page into its own chunk,
                // so each route only downloads what it renders
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
        // NOTE: rollupOptions.output.manualChunks removed entirely —
        // chunkSplitPlugin owns splitting now. Keeping both causes conflicts.
        rollupOptions: {
            output: {
                chunkFileNames: 'js/[name]-[hash].js',
                entryFileNames: 'js/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
        chunkSizeWarningLimit: 600, // tighter budget now that splitting is granular
        sourcemap: process.env.NODE_ENV === 'development',
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
