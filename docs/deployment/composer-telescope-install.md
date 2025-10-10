# Laravel Telescope Installation Guide

## Installation Commands

```bash
# Install Laravel Telescope
composer require laravel/telescope

# Publish Telescope assets and configuration
php artisan telescope:install

# Run migrations to create Telescope tables
php artisan migrate

# Publish Telescope configuration (optional, for customization)
php artisan vendor:publish --tag=telescope-config
```

## Environment Configuration

Add to `.env`:
```env
# Telescope Configuration
TELESCOPE_ENABLED=true
TELESCOPE_DRIVER=database
TELESCOPE_QUEUE_WATCHER=true
TELESCOPE_CACHE_WATCHER=true
TELESCOPE_DUMP_WATCHER=true
TELESCOPE_EVENT_WATCHER=true
TELESCOPE_EXCEPTION_WATCHER=true
TELESCOPE_JOB_WATCHER=true
TELESCOPE_LOG_WATCHER=true
TELESCOPE_MAIL_WATCHER=true
TELESCOPE_MODEL_WATCHER=true
TELESCOPE_NOTIFICATION_WATCHER=true
TELESCOPE_QUERY_WATCHER=true
TELESCOPE_REDIS_WATCHER=true
TELESCOPE_REQUEST_WATCHER=true
TELESCOPE_GATE_WATCHER=true
TELESCOPE_SCHEDULE_WATCHER=true
TELESCOPE_VIEW_WATCHER=true

# Telescope Pruning (keep data for 24 hours in development)
TELESCOPE_PRUNE_HOURS=24
```

## Multi-Tenant Configuration Notes

- Telescope data will need tenant isolation
- Custom watchers may be needed for domain-specific monitoring
- Performance impact should be monitored in production
