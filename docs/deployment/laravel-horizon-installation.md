# Laravel Horizon Installation & Setup Guide

## Installation Commands

```bash
# Install Laravel Horizon
composer require laravel/horizon

# Publish Horizon assets and configuration
php artisan horizon:install

# Publish Horizon configuration
php artisan vendor:publish --provider="Laravel\Horizon\HorizonServiceProvider"

# Create Horizon tables (if using database for metrics)
php artisan migrate

# Start Horizon (development)
php artisan horizon

# Start Horizon (production with supervisor)
php artisan horizon:supervisor
```

## Environment Configuration

Add to `.env`:
```env
# Queue Configuration
QUEUE_CONNECTION=redis
REDIS_CLIENT=predis

# Redis Configuration for Queues
REDIS_QUEUE_HOST=127.0.0.1
REDIS_QUEUE_PASSWORD=null
REDIS_QUEUE_PORT=6379
REDIS_QUEUE_DB=1

# Horizon Configuration
HORIZON_DOMAIN=localhost
HORIZON_PATH=horizon
HORIZON_REDIS_CONNECTION=horizon
HORIZON_PREFIX=horizon:

# Multi-tenant Queue Configuration
HORIZON_TENANT_ISOLATION=true
HORIZON_TENANT_PREFIX=tenant
HORIZON_DEFAULT_QUEUE=default

# Queue Performance Monitoring
HORIZON_PERFORMANCE_MONITORING=true
HORIZON_TELESCOPE_INTEGRATION=true
HORIZON_REVERB_BROADCASTING=true

# Production Configuration
HORIZON_SUPERVISOR_MEMORY=512
HORIZON_SUPERVISOR_TIMEOUT=60
HORIZON_SUPERVISOR_TRIES=3
HORIZON_SUPERVISOR_NICE=0
```

## Redis Configuration

Add to `config/database.php` connections:
```php
'redis' => [
    'client' => env('REDIS_CLIENT', 'predis'),
    
    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
    ],

    'default' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_DB', '0'),
    ],

    'cache' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_CACHE_DB', '1'),
    ],

    'horizon' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_QUEUE_HOST', '127.0.0.1'),
        'password' => env('REDIS_QUEUE_PASSWORD'),
        'port' => env('REDIS_QUEUE_PORT', '6379'),
        'database' => env('REDIS_QUEUE_DB', '2'),
        'options' => [
            'prefix' => env('HORIZON_PREFIX', 'horizon:'),
        ],
    ],
],
```

## Queue Configuration

Update `config/queue.php`:
```php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'horizon',
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => 90,
        'block_for' => null,
        'after_commit' => false,
    ],
],
```

## Supervisor Configuration (Production)

Create `/etc/supervisor/conf.d/horizon.conf`:
```ini
[program:horizon]
process_name=%(program_name)s
command=php /path/to/your/project/artisan horizon
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/path/to/your/project/storage/logs/horizon.log
stopwaitsecs=3600
```

## Multi-Tenant Considerations

- Each tenant will have isolated queue processing
- Queue naming: `tenant_{tenant_id}_{queue_name}`
- Tenant-specific job authorization and data isolation
- Performance monitoring per tenant
- Failed job management with tenant context
