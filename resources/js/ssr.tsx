import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { AppProviders } from './shared/providers/AppProviders';

const appName = process.env.VITE_APP_NAME || 'Laravel Accounting Platform';

createServer((page) =>
  createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
      resolvePageComponent(
        `./features/${name}.tsx`,
        import.meta.glob('./features/**/*.tsx'),
      ),
    setup: ({ App, props }) => (
      <AppProviders>
        <App {...props} />
      </AppProviders>
    ),
  }),
);
