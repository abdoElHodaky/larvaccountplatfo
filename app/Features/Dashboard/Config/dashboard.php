<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Dashboard Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration options for the Dashboard module
    |
    */

    'cache' => [
        'default_ttl' => env('DASHBOARD_CACHE_TTL', 300), // 5 minutes
        'widget_data_ttl' => env('DASHBOARD_WIDGET_CACHE_TTL', 300),
        'analytics_ttl' => env('DASHBOARD_ANALYTICS_CACHE_TTL', 600), // 10 minutes
        'preferences_ttl' => env('DASHBOARD_PREFERENCES_CACHE_TTL', 3600), // 1 hour
        'tags' => [
            'widgets',
            'analytics',
            'layouts',
            'preferences',
        ],
    ],

    'widgets' => [
        'max_per_dashboard' => env('DASHBOARD_MAX_WIDGETS', 20),
        'default_refresh_interval' => env('DASHBOARD_DEFAULT_REFRESH', 300),
        'min_refresh_interval' => env('DASHBOARD_MIN_REFRESH', 30),
        'max_refresh_interval' => env('DASHBOARD_MAX_REFRESH', 3600),
        
        'types' => [
            'financial_summary' => [
                'enabled' => true,
                'max_instances' => 3,
                'default_size' => 'medium',
                'cache_ttl' => 300,
            ],
            'revenue_chart' => [
                'enabled' => true,
                'max_instances' => 2,
                'default_size' => 'large',
                'cache_ttl' => 600,
            ],
            'expense_chart' => [
                'enabled' => true,
                'max_instances' => 2,
                'default_size' => 'large',
                'cache_ttl' => 600,
            ],
            'cash_flow' => [
                'enabled' => true,
                'max_instances' => 1,
                'default_size' => 'large',
                'cache_ttl' => 300,
            ],
            'budget_overview' => [
                'enabled' => true,
                'max_instances' => 2,
                'default_size' => 'medium',
                'cache_ttl' => 900,
            ],
            'kpi_metrics' => [
                'enabled' => true,
                'max_instances' => 3,
                'default_size' => 'medium',
                'cache_ttl' => 600,
            ],
            'recent_activity' => [
                'enabled' => true,
                'max_instances' => 2,
                'default_size' => 'small',
                'cache_ttl' => 60,
            ],
            'alerts' => [
                'enabled' => true,
                'max_instances' => 1,
                'default_size' => 'small',
                'cache_ttl' => 30,
            ],
        ],
    ],

    'themes' => [
        'default' => [
            'name' => 'Default',
            'primary_color' => '#3B82F6',
            'secondary_color' => '#6B7280',
            'background_color' => '#F9FAFB',
            'text_color' => '#111827',
            'card_background' => '#FFFFFF',
            'border_color' => '#E5E7EB',
        ],
        'dark' => [
            'name' => 'Dark Mode',
            'primary_color' => '#3B82F6',
            'secondary_color' => '#9CA3AF',
            'background_color' => '#111827',
            'text_color' => '#F9FAFB',
            'card_background' => '#1F2937',
            'border_color' => '#374151',
        ],
        'corporate' => [
            'name' => 'Corporate',
            'primary_color' => '#1E40AF',
            'secondary_color' => '#64748B',
            'background_color' => '#F8FAFC',
            'text_color' => '#0F172A',
            'card_background' => '#FFFFFF',
            'border_color' => '#CBD5E1',
        ],
        'minimal' => [
            'name' => 'Minimal',
            'primary_color' => '#059669',
            'secondary_color' => '#6B7280',
            'background_color' => '#FFFFFF',
            'text_color' => '#111827',
            'card_background' => '#F9FAFB',
            'border_color' => '#F3F4F6',
        ],
        'vibrant' => [
            'name' => 'Vibrant',
            'primary_color' => '#7C3AED',
            'secondary_color' => '#EC4899',
            'background_color' => '#FEFBFF',
            'text_color' => '#1F2937',
            'card_background' => '#FFFFFF',
            'border_color' => '#E5E7EB',
        ],
    ],

    'layout' => [
        'default_grid_columns' => 12,
        'default_grid_rows' => 'auto',
        'max_grid_columns' => 24,
        'responsive_breakpoints' => [
            'xs' => 0,
            'sm' => 576,
            'md' => 768,
            'lg' => 992,
            'xl' => 1200,
            'xxl' => 1400,
        ],
    ],

    'analytics' => [
        'cache_ttl' => env('DASHBOARD_ANALYTICS_CACHE_TTL', 600),
        'trend_analysis_periods' => [
            'last_3_months' => 3,
            'last_6_months' => 6,
            'last_12_months' => 12,
            'last_24_months' => 24,
        ],
        'kpi_thresholds' => [
            'gross_margin' => ['good' => 0.4, 'warning' => 0.2],
            'net_profit_margin' => ['good' => 0.15, 'warning' => 0.05],
            'current_ratio' => ['good' => 2.0, 'warning' => 1.0],
            'debt_to_equity' => ['good' => 0.5, 'warning' => 1.0],
        ],
    ],

    'export' => [
        'formats' => ['pdf', 'excel', 'csv', 'json'],
        'max_file_size' => env('DASHBOARD_MAX_EXPORT_SIZE', 104857600), // 100MB
        'storage_disk' => env('DASHBOARD_EXPORT_DISK', 'local'),
        'storage_path' => 'exports/dashboard',
        'cleanup_after_days' => env('DASHBOARD_EXPORT_CLEANUP_DAYS', 7),
        
        'templates' => [
            'executive_summary' => [
                'name' => 'Executive Summary',
                'sections' => ['key_metrics', 'financial_highlights', 'performance_summary'],
                'max_pages' => 3,
            ],
            'financial_analysis' => [
                'name' => 'Financial Analysis',
                'sections' => ['income_statement', 'balance_sheet', 'cash_flow', 'ratio_analysis'],
                'max_pages' => 10,
            ],
            'performance_metrics' => [
                'name' => 'Performance Metrics',
                'sections' => ['kpi_summary', 'performance_trends', 'benchmarking'],
                'max_pages' => 5,
            ],
        ],
    ],

    'performance' => [
        'slow_widget_threshold' => env('DASHBOARD_SLOW_WIDGET_MS', 1000), // 1 second
        'cache_hit_target' => env('DASHBOARD_CACHE_HIT_TARGET', 0.8), // 80%
        'max_concurrent_renders' => env('DASHBOARD_MAX_CONCURRENT_RENDERS', 10),
        'monitoring_enabled' => env('DASHBOARD_MONITORING_ENABLED', true),
    ],

    'security' => [
        'rate_limiting' => [
            'enabled' => env('DASHBOARD_RATE_LIMITING', true),
            'max_requests_per_minute' => env('DASHBOARD_MAX_REQUESTS_PER_MINUTE', 60),
        ],
        'data_retention_days' => env('DASHBOARD_DATA_RETENTION_DAYS', 90),
        'audit_logging' => env('DASHBOARD_AUDIT_LOGGING', true),
    ],

    'features' => [
        'real_time_updates' => env('DASHBOARD_REAL_TIME_UPDATES', false),
        'widget_recommendations' => env('DASHBOARD_WIDGET_RECOMMENDATIONS', true),
        'advanced_analytics' => env('DASHBOARD_ADVANCED_ANALYTICS', true),
        'custom_themes' => env('DASHBOARD_CUSTOM_THEMES', true),
        'export_scheduling' => env('DASHBOARD_EXPORT_SCHEDULING', false),
    ],
];

