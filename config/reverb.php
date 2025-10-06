<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Reverb Server
    |--------------------------------------------------------------------------
    |
    | This option controls the default Reverb server that will be used by the
    | framework. This should correspond to a server in the "servers" array.
    |
    */

    'default' => env('REVERB_SERVER', 'reverb'),

    /*
    |--------------------------------------------------------------------------
    | Reverb Servers
    |--------------------------------------------------------------------------
    |
    | Here you may define all of the Reverb servers for your application as
    | well as their drivers. You may even define multiple servers for the
    | same driver to allow for redundancy and load balancing.
    |
    */

    'servers' => [

        'reverb' => [
            'host' => env('REVERB_SERVER_HOST', '127.0.0.1'),
            'port' => env('REVERB_SERVER_PORT', 8080),
            'hostname' => env('REVERB_HOST'),
            'options' => [
                'tls' => [],
            ],
            'max_request_size' => env('REVERB_MAX_MESSAGE_SIZE', 10_000),
            'scaling' => [
                'enabled' => env('REVERB_SCALING_ENABLED', false),
                'channel' => env('REVERB_SCALING_CHANNEL', 'reverb'),
                'server' => [
                    'url' => env('REDIS_URL'),
                    'host' => env('REDIS_HOST', '127.0.0.1'),
                    'port' => env('REDIS_PORT', 6379),
                    'username' => env('REDIS_USERNAME'),
                    'password' => env('REDIS_PASSWORD'),
                    'database' => env('REDIS_DB', 0),
                ],
            ],
            'pulse' => [
                'enabled' => env('REVERB_PULSE_ENABLED', true),
                'interval' => env('REVERB_PULSE_INTERVAL', 60),
            ],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Reverb Applications
    |--------------------------------------------------------------------------
    |
    | Here you may define all of the Reverb applications. Typically, you will
    | only need to define one application, but you may define more if needed.
    |
    */

    'apps' => [

        [
            'app_id' => env('REVERB_APP_ID', 'local'),
            'app_key' => env('REVERB_APP_KEY', 'local-key'),
            'app_secret' => env('REVERB_APP_SECRET', 'local-secret'),
            'options' => [
                'host' => env('REVERB_HOST', 'localhost'),
                'port' => env('REVERB_PORT', 8080),
                'scheme' => env('REVERB_SCHEME', 'http'),
            ],
            'allowed_origins' => ['*'],
            'ping_interval' => env('REVERB_PING_INTERVAL', 30),
            'max_message_size' => env('REVERB_MAX_MESSAGE_SIZE', 10_000),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Multi-Tenant Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for multi-tenant real-time broadcasting. This allows
    | tenant-specific channel isolation and secure real-time communication.
    |
    */

    'multi_tenant' => [
        'enabled' => env('REVERB_TENANT_ISOLATION', true),
        'channel_prefix' => env('REVERB_TENANT_CHANNEL_PREFIX', 'tenant'),
        'tenant_resolver' => \Modules\Shared\Services\TenantResolver::class,
        'channel_authorization' => [
            'middleware' => ['auth', 'tenant'],
            'guard' => 'web',
        ],
        'presence_channels' => [
            'enabled' => true,
            'user_resolver' => \Modules\Shared\Services\UserResolver::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Monitoring Integration
    |--------------------------------------------------------------------------
    |
    | Configuration for integrating Reverb with the performance monitoring
    | system. This allows tracking WebSocket connections and broadcasting metrics.
    |
    */

    'performance_monitoring' => [
        'enabled' => env('REVERB_PERFORMANCE_MONITORING', true),
        'track_connections' => env('REVERB_TRACK_CONNECTIONS', true),
        'track_messages' => env('REVERB_TRACK_MESSAGES', true),
        'track_channels' => env('REVERB_TRACK_CHANNELS', true),
        'performance_monitor' => \Modules\Shared\Services\PerformanceMonitor::class,
        'telescope_integration' => env('REVERB_TELESCOPE_INTEGRATION', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Broadcasting Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Laravel's broadcasting system integration with Reverb.
    | This defines which events should be broadcast and how.
    |
    */

    'broadcasting' => [
        'domain_events' => [
            'enabled' => env('REVERB_BROADCAST_DOMAIN_EVENTS', true),
            'events' => [
                \Modules\Accounting\Events\AccountCreated::class,
                \Modules\Accounting\Events\AccountUpdated::class,
                \Modules\Accounting\Events\AccountDeleted::class,
                \Modules\Accounting\Events\BalanceChanged::class,
                \Modules\Accounting\Events\TrialBalanceGenerated::class,
            ],
            'channels' => [
                'account_updates' => 'tenant.{tenant_id}.accounts',
                'balance_updates' => 'tenant.{tenant_id}.balances',
                'trial_balance' => 'tenant.{tenant_id}.trial-balance',
            ],
        ],
        'performance_events' => [
            'enabled' => env('REVERB_BROADCAST_PERFORMANCE', true),
            'channels' => [
                'performance_metrics' => 'tenant.{tenant_id}.performance',
                'slow_operations' => 'tenant.{tenant_id}.slow-operations',
                'alerts' => 'tenant.{tenant_id}.alerts',
            ],
            'throttle' => [
                'enabled' => true,
                'max_per_minute' => 60,
            ],
        ],
        'collaboration' => [
            'enabled' => env('REVERB_COLLABORATION_FEATURES', true),
            'presence_channels' => [
                'accounting_workspace' => 'presence-tenant.{tenant_id}.workspace',
                'account_editing' => 'presence-tenant.{tenant_id}.account.{account_id}',
            ],
            'private_channels' => [
                'user_notifications' => 'private-tenant.{tenant_id}.user.{user_id}',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Configuration
    |--------------------------------------------------------------------------
    |
    | Security settings for WebSocket connections and channel authorization.
    |
    */

    'security' => [
        'rate_limiting' => [
            'enabled' => env('REVERB_RATE_LIMITING', true),
            'max_connections_per_ip' => env('REVERB_MAX_CONNECTIONS_PER_IP', 100),
            'max_messages_per_minute' => env('REVERB_MAX_MESSAGES_PER_MINUTE', 1000),
        ],
        'channel_authorization' => [
            'cache_ttl' => env('REVERB_AUTH_CACHE_TTL', 300), // 5 minutes
            'strict_tenant_isolation' => env('REVERB_STRICT_TENANT_ISOLATION', true),
        ],
        'cors' => [
            'allowed_origins' => explode(',', env('REVERB_ALLOWED_ORIGINS', '*')),
            'allowed_methods' => ['GET', 'POST'],
            'allowed_headers' => ['Content-Type', 'Authorization', 'X-Tenant-ID'],
        ],
    ],

];
