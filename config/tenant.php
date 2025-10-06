<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Multi-Tenant Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains all configuration options for the multi-tenant
    | architecture of the Laravel Accounting Platform.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Performance Monitoring Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the performance monitoring system that tracks
    | domain service operations, event processing, and database operations.
    |
    */

    'monitoring' => [
        'metrics' => [
            'enabled' => env('PERFORMANCE_MONITORING_ENABLED', true),
            'buffer_size' => env('PERFORMANCE_METRICS_BUFFER_SIZE', 100),
            'slow_operation_threshold_ms' => env('SLOW_OPERATION_THRESHOLD_MS', 1000),
            'flush_interval_seconds' => env('METRICS_FLUSH_INTERVAL', 60),
        ],
        'storage' => [
            'driver' => env('METRICS_STORAGE_DRIVER', 'log'), // log, database, redis, influxdb
            'connection' => env('METRICS_DB_CONNECTION', 'default'),
            'table' => env('METRICS_TABLE', 'performance_metrics'),
        ],
        'alerts' => [
            'enabled' => env('PERFORMANCE_ALERTS_ENABLED', false),
            'slow_operation_threshold_ms' => env('ALERT_SLOW_OPERATION_THRESHOLD_MS', 5000),
            'error_rate_threshold' => env('ALERT_ERROR_RATE_THRESHOLD', 0.05), // 5%
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Database Strategies
    |--------------------------------------------------------------------------
    |
    | Define the available database strategies for tenant data isolation.
    | Each strategy has different performance and isolation characteristics.
    |
    */

    'database_strategies' => [
        'shared' => [
            'name' => 'Shared Database',
            'description' => 'Multiple tenants share the same database with tenant_id scoping',
            'connection_template' => 'shared_shard_{shard_id}',
            'max_tenants_per_shard' => env('TENANT_MAX_PER_SHARD', 1000),
            'auto_scaling' => true,
            'isolation_level' => 'application',
        ],

        'dedicated' => [
            'name' => 'Dedicated Database',
            'description' => 'Each tenant has its own dedicated database',
            'connection_template' => 'tenant_dedicated_{tenant_id}',
            'max_tenants_per_shard' => 1,
            'auto_scaling' => false,
            'isolation_level' => 'database',
        ],

        'hybrid' => [
            'name' => 'Hybrid Strategy',
            'description' => 'Combines shared and dedicated based on tenant tier',
            'connection_template' => 'tenant_hybrid_{strategy}_{id}',
            'tier_mapping' => [
                'basic' => 'shared',
                'premium' => 'shared',
                'enterprise' => 'dedicated',
            ],
            'isolation_level' => 'mixed',
        ],

        'regional' => [
            'name' => 'Regional Clusters',
            'description' => 'Tenants are distributed across regional database clusters',
            'connection_template' => 'regional_{region}_{shard_id}',
            'regions' => ['us-east', 'us-west', 'eu-west', 'ap-southeast'],
            'auto_region_assignment' => true,
            'isolation_level' => 'regional',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Database Strategy
    |--------------------------------------------------------------------------
    |
    | The default strategy to use when creating new tenants.
    |
    */

    'default_strategy' => env('TENANT_DEFAULT_STRATEGY', 'shared'),

    /*
    |--------------------------------------------------------------------------
    | Tenant Resolution
    |--------------------------------------------------------------------------
    |
    | Configuration for how tenants are identified and resolved from requests.
    |
    */

    'resolution' => [
        'methods' => [
            'subdomain' => [
                'enabled' => env('TENANT_SUBDOMAIN_ENABLED', true),
                'pattern' => '{subdomain}.'.env('APP_DOMAIN', 'localhost'),
                'priority' => 1,
            ],
            'domain' => [
                'enabled' => env('TENANT_DOMAIN_ENABLED', true),
                'priority' => 2,
            ],
            'header' => [
                'enabled' => env('TENANT_HEADER_ENABLED', false),
                'header_name' => 'X-Tenant-ID',
                'priority' => 3,
            ],
            'path' => [
                'enabled' => env('TENANT_PATH_ENABLED', false),
                'prefix' => 'tenant',
                'priority' => 4,
            ],
        ],

        'cache' => [
            'enabled' => env('TENANT_CACHE_ENABLED', true),
            'ttl' => env('TENANT_CACHE_TTL', 3600), // 1 hour
            'key_prefix' => 'tenant:',
        ],

        'fallback' => [
            'enabled' => env('TENANT_FALLBACK_ENABLED', false),
            'default_tenant_id' => env('TENANT_FALLBACK_ID'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Tenant Lifecycle
    |--------------------------------------------------------------------------
    |
    | Configuration for tenant creation, updates, and deletion processes.
    |
    */

    'lifecycle' => [
        'creation' => [
            'auto_setup_database' => true,
            'run_migrations' => true,
            'seed_default_data' => true,
            'setup_modules' => true,
            'send_welcome_email' => true,
            'default_modules' => ['Accounting', 'Organization'],
        ],

        'updates' => [
            'allow_strategy_change' => env('TENANT_ALLOW_STRATEGY_CHANGE', false),
            'require_approval' => env('TENANT_UPDATE_APPROVAL', true),
            'backup_before_change' => true,
        ],

        'deletion' => [
            'soft_delete' => true,
            'retention_period' => env('TENANT_RETENTION_DAYS', 90), // days
            'backup_before_delete' => true,
            'cleanup_files' => true,
            'notify_users' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance & Scaling
    |--------------------------------------------------------------------------
    |
    | Configuration for performance optimization and auto-scaling.
    |
    */

    'performance' => [
        'connection_pooling' => [
            'enabled' => env('TENANT_CONNECTION_POOLING', true),
            'max_connections_per_tenant' => env('TENANT_MAX_CONNECTIONS', 10),
            'idle_timeout' => env('TENANT_IDLE_TIMEOUT', 300), // seconds
        ],

        'query_optimization' => [
            'tenant_scoping' => true,
            'index_optimization' => true,
            'query_caching' => env('TENANT_QUERY_CACHE', true),
        ],

        'auto_scaling' => [
            'enabled' => env('TENANT_AUTO_SCALING', false),
            'metrics' => [
                'cpu_threshold' => 80,
                'memory_threshold' => 85,
                'connection_threshold' => 90,
            ],
            'scale_up_cooldown' => 300, // seconds
            'scale_down_cooldown' => 600, // seconds
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Security & Compliance
    |--------------------------------------------------------------------------
    |
    | Security settings for tenant data isolation and compliance.
    |
    */

    'security' => [
        'data_isolation' => [
            'strict_mode' => env('TENANT_STRICT_ISOLATION', true),
            'cross_tenant_queries' => false,
            'audit_access' => true,
            'encryption_at_rest' => env('TENANT_ENCRYPTION', false),
        ],

        'access_control' => [
            'require_tenant_context' => true,
            'validate_user_tenant' => true,
            'log_tenant_switches' => true,
            'max_concurrent_sessions' => env('TENANT_MAX_SESSIONS', 5),
        ],

        'compliance' => [
            'gdpr_enabled' => env('TENANT_GDPR_ENABLED', false),
            'data_retention_policy' => env('TENANT_DATA_RETENTION', 2555), // days (7 years)
            'audit_log_retention' => env('TENANT_AUDIT_RETENTION', 2555), // days
            'export_formats' => ['json', 'csv', 'xml'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Configuration
    |--------------------------------------------------------------------------
    |
    | Per-tenant module enablement and configuration.
    |
    */

    'modules' => [
        'available_modules' => [
            'Accounting' => [
                'name' => 'Accounting',
                'description' => 'Complete accounting and bookkeeping system',
                'tier_requirement' => 'basic',
                'dependencies' => ['Organization'],
            ],
            'Inventory' => [
                'name' => 'Inventory Management',
                'description' => 'Inventory tracking and management',
                'tier_requirement' => 'premium',
                'dependencies' => ['Accounting'],
            ],
            'Reporting' => [
                'name' => 'Advanced Reporting',
                'description' => 'Financial reports and analytics',
                'tier_requirement' => 'premium',
                'dependencies' => ['Accounting'],
            ],
            'Organization' => [
                'name' => 'Organization Management',
                'description' => 'Core organization and user management',
                'tier_requirement' => 'basic',
                'dependencies' => [],
            ],
        ],

        'tier_limits' => [
            'basic' => [
                'max_modules' => 3,
                'max_users' => 5,
                'max_transactions_per_month' => 1000,
            ],
            'premium' => [
                'max_modules' => 10,
                'max_users' => 25,
                'max_transactions_per_month' => 10000,
            ],
            'enterprise' => [
                'max_modules' => -1, // unlimited
                'max_users' => -1, // unlimited
                'max_transactions_per_month' => -1, // unlimited
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Monitoring & Logging
    |--------------------------------------------------------------------------
    |
    | Configuration for tenant-specific monitoring and logging.
    |
    */

    'monitoring' => [
        'metrics' => [
            'enabled' => env('TENANT_METRICS_ENABLED', true),
            'collection_interval' => env('TENANT_METRICS_INTERVAL', 60), // seconds
            'retention_period' => env('TENANT_METRICS_RETENTION', 30), // days
        ],

        'logging' => [
            'tenant_specific_logs' => env('TENANT_SPECIFIC_LOGS', true),
            'log_tenant_context' => true,
            'log_level' => env('TENANT_LOG_LEVEL', 'info'),
            'channels' => ['tenant', 'audit', 'security'],
        ],

        'alerts' => [
            'enabled' => env('TENANT_ALERTS_ENABLED', true),
            'thresholds' => [
                'high_cpu' => 90,
                'high_memory' => 95,
                'slow_queries' => 5000, // milliseconds
                'failed_logins' => 5,
            ],
            'notification_channels' => ['email', 'slack'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Integration with Laravel Jetstream
    |--------------------------------------------------------------------------
    |
    | Configuration for integrating multi-tenant features with Jetstream.
    |
    */

    'jetstream' => [
        'team_tenant_mapping' => [
            'enabled' => true,
            'auto_create_tenant_for_team' => env('JETSTREAM_AUTO_CREATE_TENANT', false),
            'team_tenant_relationship' => 'one_to_one', // or 'many_to_one'
        ],

        'user_tenant_access' => [
            'cross_tenant_access' => env('JETSTREAM_CROSS_TENANT_ACCESS', false),
            'tenant_switching' => env('JETSTREAM_TENANT_SWITCHING', true),
            'require_invitation' => env('JETSTREAM_REQUIRE_INVITATION', true),
        ],

        'api_tokens' => [
            'tenant_scoped' => true,
            'cross_tenant_tokens' => false,
            'token_abilities_per_tenant' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Integration with Laravel Horizon
    |--------------------------------------------------------------------------
    |
    | Configuration for tenant-aware queue processing.
    |
    */

    'horizon' => [
        'tenant_queues' => [
            'enabled' => true,
            'queue_naming_pattern' => 'tenant_{tenant_id}_{queue_name}',
            'default_queues' => ['default', 'emails', 'reports', 'broadcasts'],
        ],

        'supervisor_isolation' => [
            'enabled' => env('HORIZON_TENANT_ISOLATION', true),
            'supervisor_per_tenant' => env('HORIZON_SUPERVISOR_PER_TENANT', false),
            'shared_supervisors' => env('HORIZON_SHARED_SUPERVISORS', true),
        ],

        'job_processing' => [
            'tenant_context_injection' => true,
            'tenant_validation' => true,
            'cross_tenant_job_prevention' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Integration with Laravel Reverb
    |--------------------------------------------------------------------------
    |
    | Configuration for tenant-aware real-time broadcasting.
    |
    */

    'reverb' => [
        'channel_isolation' => [
            'enabled' => true,
            'channel_naming_pattern' => 'tenant.{tenant_id}.{channel_name}',
            'tenant_channel_authorization' => true,
        ],

        'presence_channels' => [
            'tenant_scoped' => true,
            'cross_tenant_presence' => false,
            'tenant_user_isolation' => true,
        ],

        'broadcasting' => [
            'tenant_context_required' => true,
            'auto_tenant_channel_prefix' => true,
            'tenant_specific_events' => true,
        ],
    ],

];
