# Laravel Reverb Installation & Setup Guide

## Installation Commands

```bash
# Install Laravel Reverb
composer require laravel/reverb

# Install Laravel Reverb (if using Laravel 11+)
php artisan install:broadcasting

# Publish Reverb configuration
php artisan vendor:publish --provider="Laravel\Reverb\ReverbServiceProvider"

# Install Laravel Echo and Pusher JS for frontend
npm install --save laravel-echo pusher-js

# Run Reverb server (development)
php artisan reverb:start

# Run Reverb server (production with SSL)
php artisan reverb:start --host=0.0.0.0 --port=8080 --hostname=your-domain.com
```

## Environment Configuration

Add to `.env`:
```env
# Broadcasting Configuration
BROADCAST_DRIVER=reverb
REVERB_APP_ID=local
REVERB_APP_KEY=local-key
REVERB_APP_SECRET=local-secret
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http

# For production with SSL
# REVERB_SCHEME=https

# Reverb Server Configuration
REVERB_SERVER_HOST=127.0.0.1
REVERB_SERVER_PORT=8080
REVERB_MAX_CONNECTIONS=10000
REVERB_MAX_MESSAGE_SIZE=10000

# Multi-tenant Broadcasting
REVERB_TENANT_ISOLATION=true
REVERB_TENANT_CHANNEL_PREFIX=tenant
```

## Frontend Configuration

Add to `resources/js/bootstrap.js`:
```javascript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    // Multi-tenant configuration
    auth: {
        headers: {
            'X-Tenant-ID': window.tenantId || 'default',
        },
    },
});
```

Add to `.env` (frontend):
```env
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

## Multi-Tenant Considerations

- Each tenant will have isolated channels
- Channel naming: `tenant.{tenant_id}.{channel_name}`
- Authentication middleware for tenant verification
- Presence channels for multi-user collaboration per tenant
- Private channels for sensitive financial data
