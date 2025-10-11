<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Horizon Domain
    |--------------------------------------------------------------------------
    |
    | This is the subdomain where Horizon will be accessible from. If this
    | setting is null, Horizon will reside under the same domain as the
    | application. Otherwise, this value will serve as the subdomain.
    |
    */

    'domain' => env('HORIZON_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Path
    |--------------------------------------------------------------------------
    |
    | This is the URI path where Horizon will be accessible from. Feel free
    | to change this path to anything you like. Note that the URI will not
    | affect the paths of its internal API that aren't exposed to users.
    |
    */

    'path' => env('HORIZON_PATH', 'horizon'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Connection
    |--------------------------------------------------------------------------
    |
    | This is the name of the Redis connection where Horizon will store the
    | meta information required for it to function. It includes the list
    | of supervisors, failed jobs, job metrics, and other information.
    |
    */

    'use' => env('HORIZON_REDIS_CONNECTION', 'default'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Prefix
    |--------------------------------------------------------------------------
    |
    | This prefix will be used when storing all Horizon data in Redis. You
    | may modify the prefix when you are running multiple installations
    | of Horizon on the same server so that they don't have problems.
    |
    */

    'prefix' => env('HORIZON_PREFIX', 'horizon:'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Route Middleware
    |--------------------------------------------------------------------------
    |
    | These middleware will get attached to every Horizon route, giving you
    | the chance to add your own middleware to this list or change any of
    | the existing middleware. Or, you can simply stick with this list.
    |
    */

    'middleware' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Queue Wait Time Thresholds
    |--------------------------------------------------------------------------
    |
    | This option allows you to configure when the LongWaitDetected event
    | will be fired. Every connection / queue combination may have its
    | own, unique threshold (in seconds) before this event is fired.
    |
    */

    'waits' => [
        'redis:default' => 60,
        'redis:critical' => 30,
        'redis:emails' => 120,
        'redis:reports' => 300,
        'redis:broadcasts' => 30,
    ],

    /*
    |--------------------------------------------------------------------------
    | Job Trimming Times
    |--------------------------------------------------------------------------
    |
    | Here you can configure for how long (in minutes) you desire Horizon to
    | persist the recent and failed jobs. Typically, recent jobs are kept
    | for one hour while all failed jobs are stored for an entire week.
    |
    */

    'trim' => [
        'recent' => 60,
        'pending' => 60,
        'completed' => 60,
        'recent_failed' => 10080,
        'failed' => 10080,
        'monitored' => 10080,
    ],

    /*
    |--------------------------------------------------------------------------
    | Silenced Jobs
    |--------------------------------------------------------------------------
    |
    | Silencing a job will instruct Horizon to not place the job in the list
    | of completed jobs within the Horizon dashboard. This setting may be
    | used to fully remove any noisy jobs from the completed jobs list.
    |
    */

    'silenced' => [
        // App\Jobs\ExampleJob::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Metrics
    |--------------------------------------------------------------------------
    |
    | Here you can configure how many snapshots should be kept to display in
    | the metrics graph. This will get used in combination with every
    | supervisor's "tries" configuration to determine the limit.
    |
    */

    'metrics' => [
        'trim_snapshots' => [
            'job' => 24,
            'queue' => 24,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Fast Termination
    |--------------------------------------------------------------------------
    |
    | When this option is enabled, Horizon's "terminate" command will not
    | wait on all of the workers to terminate unless the --wait option
    | is provided. Fast termination can shorten deployment delay by
    | allowing a new instance of Horizon to start while the last
    | instance will continue to terminate each of its workers.
    |
    */

    'fast_termination' => false,

    /*
    |--------------------------------------------------------------------------
    | Memory Limit (MB)
    |--------------------------------------------------------------------------
    |
    | This value describes the maximum amount of memory the Horizon master
    | supervisor may consume before it is terminated and restarted. For
    | configuring these limits on your workers, see the next section.
    |
    */

    'memory_limit' => 64,

    /*
    |--------------------------------------------------------------------------
    | Queue Worker Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may define the queue worker settings used by your application
    | in all environments. These supervisors and their settings are used by
    | Horizon when starting the queue workers for your application.
    |
    */

    'defaults' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'maxProcesses' => 1,
            'maxTime' => 0,
            'maxJobs' => 0,
            'memory' => 128,
            'tries' => 1,
            'timeout' => 60,
            'nice' => 0,
        ],
    ],

    'environments' => [
        'production' => [
            'supervisor-1' => [
                'connection' => 'redis',
                'queue' => ['default', 'critical', 'emails', 'reports'],
                'balance' => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses' => 10,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 512,
                'tries' => 3,
                'timeout' => 60,
                'nice' => 0,
            ],
            'supervisor-broadcasts' => [
                'connection' => 'redis',
                'queue' => ['broadcasts'],
                'balance' => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses' => 5,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 256,
                'tries' => 2,
                'timeout' => 30,
                'nice' => 0,
            ],
            'supervisor-tenant-processing' => [
                'connection' => 'redis',
                'queue' => ['tenant-processing', 'tenant-reports'],
                'balance' => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses' => 8,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 512,
                'tries' => 3,
                'timeout' => 120,
                'nice' => 0,
            ],
        ],

        // Laravel Forge optimized configuration
        'forge' => [
            'supervisor-main' => [
                'connection' => 'redis',
                'queue' => ['default', 'critical', 'emails', 'reports'],
                'balance' => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses' => 6,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 256,
                'tries' => 3,
                'timeout' => 60,
                'nice' => 0,
            ],
            'supervisor-broadcasts' => [
                'connection' => 'redis',
                'queue' => ['broadcasts'],
                'balance' => 'simple',
                'autoScalingStrategy' => 'simple',
                'maxProcesses' => 2,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 128,
                'tries' => 2,
                'timeout' => 30,
                'nice' => 0,
            ],
        ],

        // Laravel Cloud simplified configuration
        'cloud' => [
            'supervisor-simple' => [
                'connection' => 'redis',
                'queue' => ['default', 'emails'],
                'balance' => 'simple',
                'autoScalingStrategy' => 'simple',
                'maxProcesses' => 3,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 128,
                'tries' => 2,
                'timeout' => 60,
                'nice' => 0,
            ],
        ],

        'local' => [
            'supervisor-1' => [
                'connection' => 'redis',
                'queue' => ['default', 'critical', 'emails', 'reports', 'broadcasts'],
                'balance' => 'simple',
                'autoScalingStrategy' => 'simple',
                'maxProcesses' => 3,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 128,
                'tries' => 1,
                'timeout' => 60,
                'nice' => 0,
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Multi-Tenant Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for multi-tenant queue processing. This allows
    | tenant-specific queue isolation and processing.
    |
    */

    'multi_tenant' => [
        'enabled' => env('HORIZON_TENANT_ISOLATION', true),
        'tenant_prefix' => env('HORIZON_TENANT_PREFIX', 'tenant'),
        'tenant_resolver' => \Modules\Shared\Services\TenantResolver::class,
        'queue_naming' => [
            'pattern' => 'tenant_{tenant_id}_{queue_name}',
            'default_queues' => ['default', 'critical', 'emails', 'reports', 'broadcasts'],
        ],
        'tenant_supervisors' => [
            'enabled' => true,
            'max_tenants_per_supervisor' => 10,
            'supervisor_naming' => 'supervisor-tenant-{tenant_group}',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Monitoring Integration
    |--------------------------------------------------------------------------
    |
    | Configuration for integrating Horizon with the performance monitoring
    | system and other monitoring tools.
    |
    */

    'performance_monitoring' => [
        'enabled' => env('HORIZON_PERFORMANCE_MONITORING', true),
        'performance_monitor' => \Modules\Shared\Services\PerformanceMonitor::class,
        'telescope_integration' => env('HORIZON_TELESCOPE_INTEGRATION', true),
        'reverb_broadcasting' => env('HORIZON_REVERB_BROADCASTING', true),
        'metrics' => [
            'job_processing_time' => true,
            'queue_wait_time' => true,
            'memory_usage' => true,
            'failed_job_rate' => true,
            'throughput' => true,
        ],
        'alerts' => [
            'long_wait_threshold' => 300, // 5 minutes
            'high_failure_rate' => 0.1, // 10%
            'memory_threshold' => 0.8, // 80% of limit
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Queue Job Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for different types of queue jobs and their processing
    | requirements.
    |
    */

    'job_types' => [
        'domain_events' => [
            'queue' => 'default',
            'timeout' => 60,
            'tries' => 3,
            'backoff' => [10, 30, 60],
        ],
        'broadcasts' => [
            'queue' => 'broadcasts',
            'timeout' => 30,
            'tries' => 2,
            'backoff' => [5, 15],
        ],
        'reports' => [
            'queue' => 'reports',
            'timeout' => 300,
            'tries' => 2,
            'backoff' => [60, 180],
        ],
        'emails' => [
            'queue' => 'emails',
            'timeout' => 120,
            'tries' => 3,
            'backoff' => [30, 60, 120],
        ],
        'critical' => [
            'queue' => 'critical',
            'timeout' => 30,
            'tries' => 5,
            'backoff' => [5, 10, 20, 40, 80],
        ],
    ],

];
