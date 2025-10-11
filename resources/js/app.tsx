import '../css/app.css';
import './bootstrap';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { AppProviders } from './shared/providers/AppProviders';

const appName = (import.meta as any).env?.VITE_APP_NAME || 'Laravel Accounting Platform';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./features/${name}.tsx`,
            (import.meta as any).glob('./features/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <AppProviders>
                <App {...props} />
            </AppProviders>
        );
    },
    progress: {
        color: '#0066cc',
        showSpinner: true,
    },
});
