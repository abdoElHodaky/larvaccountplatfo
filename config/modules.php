<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Module Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration options for the modular architecture
    | of the Laravel application. It defines how modules are discovered,
    | loaded, and managed across different tenant database strategies.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Module Discovery
    |--------------------------------------------------------------------------
    |
    | These options control how modules are discovered and registered in the
    | application. The system can automatically discover modules from the
    | filesystem or use a predefined list.
    |
    */

    'discovery' => [
        'enabled' => env('MODULES_AUTO_DISCOVERY', true),
        'path' => base_path('Modules'),
        'cache_enabled' => env('MODULES_CACHE_ENABLED', true),
        'cache_ttl' => env('MODULES_CACHE_TTL', 3600), // seconds
        'cache_key' => 'modules.registry',
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Loading
    |--------------------------------------------------------------------------
    |
    | These settings control how modules are loaded and in what order.
    | Dependencies are automatically resolved and modules are loaded
    | in the correct order.
    |
    */

    'loading' => [
        'auto_load' => env('MODULES_AUTO_LOAD', true),
        'load_order' => 'dependencies', // 'dependencies' or 'alphabetical'
        'lazy_loading' => env('MODULES_LAZY_LOADING', false),
        'parallel_loading' => env('MODULES_PARALLEL_LOADING', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Database Strategy Support
    |--------------------------------------------------------------------------
    |
    | Configuration for how modules interact with different database
    | strategies (shared, dedicated, clustered). Modules can declare
    | which strategies they support.
    |
    */

    'database_strategies' => [
        'shared' => [
            'enabled' => true,
            'default_connection' => 'shared_shard_1',
            'shard_count' => 4,
            'load_balancing' => 'round_robin', // 'round_robin', 'hash', 'random'
        ],
        'dedicated' => [
            'enabled' => true,
            'auto_create' => true,
            'connection_template' => 'tenant_{tenant_id}',
        ],
        'clustered' => [
            'enabled' => true,
            'regions' => [
                'us-east-1' => 'cluster_us_east',
                'us-west-2' => 'cluster_us_west',
                'eu-west-1' => 'cluster_eu_west',
                'ap-southeast-1' => 'cluster_ap_southeast',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Inter-Module Communication
    |--------------------------------------------------------------------------
    |
    | Settings for the inter-module communication bus that allows modules
    | to communicate with each other in a decoupled manner.
    |
    */

    'communication' => [
        'bus_enabled' => true,
        'event_broadcasting' => true,
        'service_registry' => true,
        'message_queue' => env('MODULES_MESSAGE_QUEUE', false),
        'logging' => [
            'enabled' => env('MODULES_COMMUNICATION_LOGGING', true),
            'level' => env('MODULES_LOG_LEVEL', 'debug'),
            'max_history' => 1000,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Security
    |--------------------------------------------------------------------------
    |
    | Security settings for module loading and execution. These settings
    | help ensure that only trusted modules are loaded and executed.
    |
    */

    'security' => [
        'signature_verification' => env('MODULES_SIGNATURE_VERIFICATION', false),
        'allowed_namespaces' => [
            'Modules\\',
        ],
        'blocked_modules' => [],
        'sandbox_mode' => env('MODULES_SANDBOX_MODE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Performance
    |--------------------------------------------------------------------------
    |
    | Performance-related settings for module loading and execution.
    | These can help optimize the application's performance.
    |
    */

    'performance' => [
        'preload_modules' => env('MODULES_PRELOAD', []),
        'memory_limit' => env('MODULES_MEMORY_LIMIT', '256M'),
        'execution_timeout' => env('MODULES_EXECUTION_TIMEOUT', 30),
        'profiling' => env('MODULES_PROFILING', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Individual Module Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for individual modules. Each module can have its own
    | settings that override the global defaults.
    |
    */

    'modules' => [
        'Organization' => [
            'enabled' => true,
            'tenant_aware' => true,
            'database_strategies' => ['shared', 'dedicated', 'clustered'],
            'auto_load' => true,
            'dependencies' => [],
            'config' => [
                'features' => [
                    'advanced_reporting' => env('ORG_ADVANCED_REPORTING', false),
                    'bulk_operations' => env('ORG_BULK_OPERATIONS', true),
                    'export_import' => env('ORG_EXPORT_IMPORT', true),
                ],
                'limits' => [
                    'max_users_per_org' => env('ORG_MAX_USERS', 1000),
                    'max_organizations' => env('ORG_MAX_ORGANIZATIONS', null),
                ],
            ],
        ],

        'Shared' => [
            'enabled' => true,
            'tenant_aware' => false,
            'database_strategies' => ['shared', 'dedicated', 'clustered'],
            'auto_load' => true,
            'dependencies' => [],
            'config' => [
                'services' => [
                    'module_discovery' => true,
                    'inter_module_bus' => true,
                    'tenant_resolver' => true,
                ],
            ],
        ],

        // Add more modules as they are created
        'Accounting' => [
            'enabled' => env('ACCOUNTING_MODULE_ENABLED', true),
            'tenant_aware' => true,
            'database_strategies' => ['shared', 'dedicated', 'clustered'],
            'auto_load' => true,
            'dependencies' => ['Organization'],
        ],

        'Inventory' => [
            'enabled' => env('INVENTORY_MODULE_ENABLED', true),
            'tenant_aware' => true,
            'database_strategies' => ['shared', 'dedicated', 'clustered'],
            'auto_load' => true,
            'dependencies' => ['Organization'],
        ],

        'Reporting' => [
            'enabled' => env('REPORTING_MODULE_ENABLED', true),
            'tenant_aware' => true,
            'database_strategies' => ['shared', 'dedicated', 'clustered'],
            'auto_load' => true,
            'dependencies' => ['Organization', 'Accounting'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Development Settings
    |--------------------------------------------------------------------------
    |
    | Settings that are useful during development but should be disabled
    | in production environments.
    |
    */

    'development' => [
        'hot_reload' => env('MODULES_HOT_RELOAD', false),
        'debug_mode' => env('MODULES_DEBUG', false),
        'verbose_logging' => env('MODULES_VERBOSE_LOGGING', false),
        'module_generator' => env('MODULES_GENERATOR_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tenant-Specific Module Settings
    |--------------------------------------------------------------------------
    |
    | These settings allow for tenant-specific module configurations.
    | Different tenants can have different modules enabled or configured
    | differently based on their plan or requirements.
    |
    */

    'tenant_specific' => [
        'enabled' => true,
        'config_source' => 'database', // 'database', 'file', 'cache'
        'cache_tenant_configs' => true,
        'default_enabled_modules' => [
            'Organization',
            'Shared',
        ],
        'plan_based_modules' => [
            'basic' => [
                'Organization',
                'Shared',
            ],
            'professional' => [
                'Organization',
                'Shared',
                'Accounting',
            ],
            'enterprise' => [
                'Organization',
                'Shared',
                'Accounting',
                'Inventory',
                'Reporting',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Events
    |--------------------------------------------------------------------------
    |
    | Configuration for module lifecycle events. These events are fired
    | when modules are loaded, enabled, disabled, or unloaded.
    |
    */

    'events' => [
        'enabled' => true,
        'listeners' => [
            'module.loading' => [],
            'module.loaded' => [],
            'module.enabling' => [],
            'module.enabled' => [],
            'module.disabling' => [],
            'module.disabled' => [],
            'module.unloading' => [],
            'module.unloaded' => [],
        ],
    ],

];

