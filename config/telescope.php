<?php

use Laravel\Telescope\Http\Middleware\Authorize;
use Laravel\Telescope\Watchers;

return [

    /*
    |--------------------------------------------------------------------------
    | Telescope Domain
    |--------------------------------------------------------------------------
    |
    | This is the subdomain where Telescope will be accessible from. If this
    | setting is null, Telescope will reside under the same domain as the
    | application. Otherwise, this value will serve as the subdomain.
    |
    */

    'domain' => env('TELESCOPE_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | Telescope Path
    |--------------------------------------------------------------------------
    |
    | This is the URI path where Telescope will be accessible from. Feel free
    | to change this path to anything you like. Note that the URI will not
    | affect the paths of its internal API that aren't exposed to users.
    |
    */

    'path' => env('TELESCOPE_PATH', 'telescope'),

    /*
    |--------------------------------------------------------------------------
    | Telescope Storage Driver
    |--------------------------------------------------------------------------
    |
    | This configuration options determines the storage driver that will
    | be used to store Telescope's data. In addition, you may set any
    | custom options as needed by the particular driver you choose.
    |
    */

    'driver' => env('TELESCOPE_DRIVER', 'database'),

    'storage' => [
        'database' => [
            'connection' => env('DB_CONNECTION', 'mysql'),
            'chunk' => 1000,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Telescope Master Switch
    |--------------------------------------------------------------------------
    |
    | This option may be used to disable all Telescope watchers regardless
    | of their individual configuration, which simply provides a single
    | and convenient way to enable or disable Telescope data storage.
    |
    */

    'enabled' => env('TELESCOPE_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Telescope Route Middleware
    |--------------------------------------------------------------------------
    |
    | These middleware will get attached to every Telescope route, giving you
    | the chance to add your own middleware to this list or change any of
    | the existing middleware. Or, you can simply stick with this list.
    |
    */

    'middleware' => [
        'web',
        Authorize::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed / Ignored Paths & Commands
    |--------------------------------------------------------------------------
    |
    | The following array lists the URI paths and Artisan commands that will
    | not be watched by Telescope. In addition to this list, some Laravel
    | commands, like migrations and queue commands, are always ignored.
    |
    */

    'only_paths' => [
        // 'api/*',
    ],

    'ignore_paths' => [
        'nova-api*',
        'telescope*',
        'vendor/telescope*',
    ],

    'ignore_commands' => [
        //
    ],

    /*
    |--------------------------------------------------------------------------
    | Telescope Watchers
    |--------------------------------------------------------------------------
    |
    | The following array lists the "watchers" that will be registered with
    | Telescope. The watchers gather application information when a request
    | is handled. Feel free to customize this list based on your needs.
    |
    */

    'watchers' => [
        Watchers\BatchWatcher::class => env('TELESCOPE_BATCH_WATCHER', true),

        Watchers\CacheWatcher::class => [
            'enabled' => env('TELESCOPE_CACHE_WATCHER', true),
        ],

        Watchers\CommandWatcher::class => [
            'enabled' => env('TELESCOPE_COMMAND_WATCHER', true),
            'ignore' => [
                'telescope:*',
                'queue:*',
            ],
        ],

        Watchers\DumpWatcher::class => [
            'enabled' => env('TELESCOPE_DUMP_WATCHER', true),
            'always' => env('TELESCOPE_DUMP_WATCHER_ALWAYS', false),
        ],

        Watchers\EventWatcher::class => [
            'enabled' => env('TELESCOPE_EVENT_WATCHER', true),
            'ignore' => [
                // Ignore noisy events
                'Illuminate\Database\Events\QueryExecuted',
                'Illuminate\Log\Events\MessageLogged',
            ],
        ],

        Watchers\ExceptionWatcher::class => env('TELESCOPE_EXCEPTION_WATCHER', true),
        Watchers\GateWatcher::class => env('TELESCOPE_GATE_WATCHER', true),
        Watchers\JobWatcher::class => env('TELESCOPE_JOB_WATCHER', true),
        Watchers\LogWatcher::class => env('TELESCOPE_LOG_WATCHER', true),
        Watchers\MailWatcher::class => env('TELESCOPE_MAIL_WATCHER', true),

        Watchers\ModelWatcher::class => [
            'enabled' => env('TELESCOPE_MODEL_WATCHER', true),
            'events' => ['eloquent.*'],
        ],

        Watchers\NotificationWatcher::class => env('TELESCOPE_NOTIFICATION_WATCHER', true),

        Watchers\QueryWatcher::class => [
            'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
            'ignore_packages' => true,
            'ignore_paths' => [
                'telescope*',
            ],
            'slow' => env('TELESCOPE_SLOW_QUERY_THRESHOLD', 100), // milliseconds
        ],

        Watchers\RedisWatcher::class => env('TELESCOPE_REDIS_WATCHER', true),

        Watchers\RequestWatcher::class => [
            'enabled' => env('TELESCOPE_REQUEST_WATCHER', true),
            'size_limit' => env('TELESCOPE_RESPONSE_SIZE_LIMIT', 64),
            'ignore_http_methods' => [],
            'ignore_status_codes' => [],
        ],

        Watchers\ScheduleWatcher::class => env('TELESCOPE_SCHEDULE_WATCHER', true),
        Watchers\ViewWatcher::class => env('TELESCOPE_VIEW_WATCHER', true),

        // Custom Watchers for Laravel Accounting Platform
        \Modules\Shared\Telescope\Watchers\DomainEventWatcher::class => [
            'enabled' => env('TELESCOPE_DOMAIN_EVENT_WATCHER', true),
        ],

        \Modules\Shared\Telescope\Watchers\TenantWatcher::class => [
            'enabled' => env('TELESCOPE_TENANT_WATCHER', true),
        ],

        \Modules\Shared\Telescope\Watchers\PerformanceWatcher::class => [
            'enabled' => env('TELESCOPE_PERFORMANCE_WATCHER', true),
            'slow_threshold' => env('TELESCOPE_SLOW_OPERATION_THRESHOLD', 1000), // milliseconds
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Telescope Avatar Provider
    |--------------------------------------------------------------------------
    |
    | This configuration option determines the avatar provider that will be
    | used to retrieve avatar images for users in Telescope. By default,
    | Gravatar will be used to retrieve avatar images for users.
    |
    */

    'avatar' => 'gravatar',

    /*
    |--------------------------------------------------------------------------
    | Telescope Pruning
    |--------------------------------------------------------------------------
    |
    | Here you may configure how long Telescope should retain entries. By
    | default, Telescope will keep entries for 24 hours. You may also
    | configure the maximum number of entries to keep in the database.
    |
    */

    'prune' => [
        'hours' => env('TELESCOPE_PRUNE_HOURS', 24),
        'keep' => env('TELESCOPE_PRUNE_KEEP', 10000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Multi-Tenant Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration specific to multi-tenant monitoring with Telescope.
    | This allows tenant-specific data isolation and performance tracking.
    |
    */

    'multi_tenant' => [
        'enabled' => env('TELESCOPE_MULTI_TENANT', true),
        'tenant_column' => 'tenant_id',
        'isolate_data' => env('TELESCOPE_ISOLATE_TENANT_DATA', true),
        'tenant_resolver' => \Modules\Shared\Services\TenantResolver::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Monitoring Integration
    |--------------------------------------------------------------------------
    |
    | Configuration for integrating Telescope with the custom performance
    | monitoring system. This allows hybrid monitoring capabilities.
    |
    */

    'performance_integration' => [
        'enabled' => env('TELESCOPE_PERFORMANCE_INTEGRATION', true),
        'custom_monitor' => \Modules\Shared\Services\PerformanceMonitor::class,
        'sync_metrics' => env('TELESCOPE_SYNC_CUSTOM_METRICS', true),
        'aggregate_data' => env('TELESCOPE_AGGREGATE_PERFORMANCE_DATA', true),
    ],
];
