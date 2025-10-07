import '../css/app.css';
import './bootstrap';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ChakraProvider from '@/Providers/ChakraProvider';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel Accounting Platform';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ChakraProvider>
                <App {...props} />
            </ChakraProvider>
        );
    },
    progress: {
        color: '#3b82f6',
        showSpinner: true,
    },
});
