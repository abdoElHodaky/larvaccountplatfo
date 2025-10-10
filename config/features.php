<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Feature Flags Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains feature flags that control which features are enabled
    | in different deployment environments. This allows for simplified cloud
    | deployments while maintaining full functionality for enterprise setups.
    |
    */

    'multi_region' => env('FEATURE_MULTI_REGION', false),
    'database_sharding' => env('FEATURE_DATABASE_SHARDING', false),
    'advanced_reporting' => env('FEATURE_ADVANCED_REPORTING', true),
    'real_time_collaboration' => env('FEATURE_REAL_TIME_COLLABORATION', true),
    'mobile_app' => env('FEATURE_MOBILE_APP', true),
    'octane' => env('FEATURE_OCTANE', true),
    'horizon' => env('FEATURE_HORIZON', true),
    'telescope' => env('FEATURE_TELESCOPE', false),
    'pwa' => env('FEATURE_PWA', true),
    'offline_support' => env('FEATURE_OFFLINE_SUPPORT', false),
    'push_notifications' => env('FEATURE_PUSH_NOTIFICATIONS', false),
    'multi_currency' => env('FEATURE_MULTI_CURRENCY', true),
    'inventory_management' => env('FEATURE_INVENTORY_MANAGEMENT', true),
    'integration_services' => env('FEATURE_INTEGRATION_SERVICES', true),
    'backup_automation' => env('FEATURE_BACKUP_AUTOMATION', true),
    'performance_monitoring' => env('FEATURE_PERFORMANCE_MONITORING', true),
    'audit_logging' => env('FEATURE_AUDIT_LOGGING', true),
    'tenant_auto_promotion' => env('FEATURE_TENANT_AUTO_PROMOTION', false),
    'real_time_stock_updates' => env('FEATURE_REAL_TIME_STOCK_UPDATES', false),
    'real_time_financial_updates' => env('FEATURE_REAL_TIME_FINANCIAL_UPDATES', true),
    'report_scheduling' => env('FEATURE_REPORT_SCHEDULING', true),
    'email_reports' => env('FEATURE_EMAIL_REPORTS', true),
    'api_rate_limiting' => env('FEATURE_API_RATE_LIMITING', true),
    'two_factor_auth' => env('FEATURE_TWO_FACTOR_AUTH', true),
    'role_based_permissions' => env('FEATURE_ROLE_BASED_PERMISSIONS', true),
    'data_export' => env('FEATURE_DATA_EXPORT', true),
    'bulk_operations' => env('FEATURE_BULK_OPERATIONS', true),
    'advanced_search' => env('FEATURE_ADVANCED_SEARCH', true),
    'custom_fields' => env('FEATURE_CUSTOM_FIELDS', true),
    'workflow_automation' => env('FEATURE_WORKFLOW_AUTOMATION', false),
    'third_party_integrations' => env('FEATURE_THIRD_PARTY_INTEGRATIONS', true),

    /*
    |--------------------------------------------------------------------------
    | Deployment Profiles
    |--------------------------------------------------------------------------
    |
    | Pre-configured feature sets for different deployment scenarios
    |
    */

    'profiles' => [
        'cloud' => [
            'multi_region' => false,
            'database_sharding' => false,
            'advanced_reporting' => false,
            'real_time_collaboration' => false,
            'mobile_app' => false,
            'octane' => false,
            'horizon' => false,
            'pwa' => false,
            'offline_support' => false,
            'push_notifications' => false,
            'multi_currency' => false,
            'inventory_management' => true,
            'integration_services' => false,
            'backup_automation' => true,
            'performance_monitoring' => false,
            'tenant_auto_promotion' => false,
            'real_time_stock_updates' => false,
            'workflow_automation' => false,
        ],

        'forge' => [
            'multi_region' => false,
            'database_sharding' => false,
            'advanced_reporting' => true,
            'real_time_collaboration' => false,
            'mobile_app' => false,
            'octane' => false,
            'horizon' => true,
            'pwa' => true,
            'offline_support' => false,
            'push_notifications' => false,
            'multi_currency' => false,
            'inventory_management' => true,
            'integration_services' => true,
            'backup_automation' => true,
            'performance_monitoring' => true,
            'tenant_auto_promotion' => false,
            'real_time_stock_updates' => false,
            'workflow_automation' => false,
        ],

        'enterprise' => [
            'multi_region' => true,
            'database_sharding' => true,
            'advanced_reporting' => true,
            'real_time_collaboration' => true,
            'mobile_app' => true,
            'octane' => true,
            'horizon' => true,
            'pwa' => true,
            'offline_support' => true,
            'push_notifications' => true,
            'multi_currency' => true,
            'inventory_management' => true,
            'integration_services' => true,
            'backup_automation' => true,
            'performance_monitoring' => true,
            'tenant_auto_promotion' => true,
            'real_time_stock_updates' => true,
            'workflow_automation' => true,
        ],
    ],
];
