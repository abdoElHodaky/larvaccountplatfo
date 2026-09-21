<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Octane Server
    |--------------------------------------------------------------------------
    |
    | This value determines the default "server" that will be used by Octane
    | when starting, restarting, or stopping your application server.
    | You are free to change this to any of the supported server types.
    |
    | Supported: "roadrunner", "swoole", "frankenphp"
    |
    */

    'server' => env('OCTANE_SERVER', 'roadrunner'),

    /*
    |--------------------------------------------------------------------------
    | Force HTTPS
    |--------------------------------------------------------------------------
    |
    | When this configuration value is set to "true", Octane will inform the
    | framework that all absolute URLs should be generated using the HTTPS
    | protocol. Otherwise your links may be generated using plain HTTP.
    |
    */

    'https' => env('OCTANE_HTTPS', false),

    /*
    |--------------------------------------------------------------------------
    | Octane Servers
    |--------------------------------------------------------------------------
    |
    | Here you may define how you wish Octane to start your application's web
    | servers. You are free to define as many servers as necessary and they
    | will be started sequentially when invoking the server start command.
    |
    */

    'servers' => [

        'frankenphp' => [
            'host' => env('OCTANE_HOST', '127.0.0.1'),
            'port' => env('OCTANE_PORT', 8000),
            'admin-port' => env('OCTANE_ADMIN_PORT', 2019),
            'workers' => env('OCTANE_WORKERS', 'auto'),
            'max-requests' => env('OCTANE_MAX_REQUESTS', 500),
            'caddyfile' => base_path('Caddyfile'),
            'https' => env('OCTANE_HTTPS', false),
            'http-redirect' => env('OCTANE_HTTP_REDIRECT', false),
            'http2' => env('OCTANE_HTTP2', false),
        ],

        'roadrunner' => [
            'host' => env('OCTANE_HOST', '127.0.0.1'),
            'port' => env('OCTANE_PORT', 8000),
            'rpc-host' => env('OCTANE_RPC_HOST', '127.0.0.1'),
            'rpc-port' => env('OCTANE_RPC_PORT', 6001),
            'workers' => env('OCTANE_WORKERS', 'auto'),
            'max-requests' => env('OCTANE_MAX_REQUESTS', 500),
            'rr-config' => base_path('.rr.yaml'),
        ],

        'swoole' => [
            'host' => env('OCTANE_HOST', '127.0.0.1'),
            'port' => env('OCTANE_PORT', 8000),
            'workers' => env('OCTANE_WORKERS', 'auto'),
            'task-workers' => env('OCTANE_TASK_WORKERS', 'auto'),
            'max-requests' => env('OCTANE_MAX_REQUESTS', 500),
            'public-path' => public_path(),
            'options' => [
                'log_file' => storage_path('logs/swoole_http.log'),
                'package_max_length' => 10 * 1024 * 1024,
            ],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Warm / Flush Bindings
    |--------------------------------------------------------------------------
    |
    | The bindings listed below will either be pre-warmed when a worker boots
    | or they will be flushed before every request. Flushing a binding will
    | force the container to resolve that binding again when requested.
    |
    */

    'warm' => [
        'auth',
        'auth.driver',
        'blade.compiler',
        'cache',
        'cache.store',
        'config',
        'db',
        'db.factory',
        'encrypter',
        'files',
        'hash',
        'hash.driver',
        'log',
        'mail.manager',
        'queue',
        'queue.connection',
        'redis',
        'redis.connection',
        'router',
        'session',
        'session.store',
        'translator',
        'url',
        'validator',
        'view',
        // Custom services for accounting platform
        'tenant.resolver',
        'performance.monitor',
        'websocket.manager',
    ],

    'flush' => [
        'auth.driver',
        'cache.store',
        'db',
        'db.factory',
        'queue.connection',
        'redis.connection',
        'session.store',
        // Tenant-specific services that need fresh state
        'current.tenant',
        'current.organization',
    ],

    /*
    |--------------------------------------------------------------------------
    | Octane Cache Table
    |--------------------------------------------------------------------------
    |
    | While using Octane, you may leverage the Octane cache, which is powered
    | by a table stored in memory. You may set the maximum number of rows
    | that will be stored in the table before the oldest are removed.
    |
    */

    'cache' => [
        'rows' => 1000,
    ],

    /*
    |--------------------------------------------------------------------------
    | Octane Listeners
    |--------------------------------------------------------------------------
    |
    | All of the event listeners for Octane's events are defined below. These
    | listeners are responsible for resetting your application's state so
    | that each request is handled as if it was a completely fresh request
    | to your application instead of a long-running process.
    |
    */

    'listeners' => [

        WorkerStarting::class => [
            EnsureUploadedFilesAreValid::class,
            EnsureUploadedFilesCanBeMoved::class,
        ],

        RequestReceived::class => [
            // Skip ALL Octane listeners during CLI (Artisan) commands to prevent facade issues
            php_sapi_name() === 'cli'
                ? []
                : [
                    \Laravel\Octane\Listeners\EnsureUploadedFilesAreValid::class,
                    \Laravel\Octane\Listeners\EnsureUploadedFilesCanBeMoved::class,
                    // Use dynamic facades resolution to prevent issues during early bootstrap
                    (function() {
                        try {
                            if (php_sapi_name() !== 'cli' && \Illuminate\Support\Facades\Facade::getFacadeApplication()) {
                                return \Laravel\Octane\Facades\Octane::prepareApplicationForNextOperation();
                            }
                        } catch (\Exception $e) {
                            // Ignore any facade-related errors during bootstrap
                        }
                        return []; // Return empty if facades not ready
                    })(),
                    (function() {
                        try {
                            if (php_sapi_name() !== 'cli' && \Illuminate\Support\Facades\Facade::getFacadeApplication()) {
                                return \Laravel\Octane\Facades\Octane::prepareApplicationForNextRequest();
                            }
                        } catch (\Exception $e) {
                            // Ignore any facade-related errors during bootstrap
                        }
                        return []; // Return empty if facades not ready
                    })(),
                    // Custom listeners for multi-tenant setup
                    FlushTenantContext::class,
                    SetupDatabaseConnection::class,
                ],
        ],

        RequestHandled::class => [
            // Custom cleanup for accounting platform
            CleanupTenantResources::class,
            LogPerformanceMetrics::class,
        ],

        RequestTerminated::class => [
            FlushTemporaryContainerInstances::class,
            // Custom termination handlers
            CleanupWebSocketConnections::class,
        ],

        TaskReceived::class => [
            // Skip ALL Octane listeners during CLI (Artisan) commands to prevent facade issues
            php_sapi_name() === 'cli'
                ? []
                : (function() {
                    try {
                        if (php_sapi_name() !== 'cli' && \Illuminate\Support\Facades\Facade::getFacadeApplication()) {
                            return \Laravel\Octane\Facades\Octane::prepareApplicationForNextOperation();
                        }
                    } catch (\Exception $e) {
                        // Ignore any facade-related errors during bootstrap
                    }
                    return []; // Return empty if facades not ready
                })(),
        ],

        TaskTerminated::class => [
            //
        ],

        TickReceived::class => [
            // Skip ALL Octane listeners during CLI (Artisan) commands to prevent facade issues
            php_sapi_name() === 'cli'
                ? []
                : (function() {
                    try {
                        if (php_sapi_name() !== 'cli' && \Illuminate\Support\Facades\Facade::getFacadeApplication()) {
                            return \Laravel\Octane\Facades\Octane::prepareApplicationForNextOperation();
                        }
                    } catch (\Exception $e) {
                        // Ignore any facade-related errors during bootstrap
                    }
                    return []; // Return empty if facades not ready
                })(),
        ],

        TickTerminated::class => [
            //
        ],

        OperationTerminated::class => [
            FlushArrayCache::class,
            FlushAuthenticationState::class,
            FlushBroadcastingState::class,
            FlushBusState::class,
            FlushCacheState::class,
            FlushConfigurationState::class,
            FlushCookieState::class,
            FlushDatabaseState::class,
            FlushEventState::class,
            FlushFilesystemState::class,
            FlushHashState::class,
            FlushLocalizationState::class,
            FlushLogState::class,
            FlushMailState::class,
            FlushNotificationState::class,
            FlushPipelineHubState::class,
            FlushQueueState::class,
            FlushRedisState::class,
            FlushRequestState::class,
            FlushRouterState::class,
            FlushSessionState::class,
            FlushValidationState::class,
            FlushViewState::class,
        ],

        WorkerErrorOccurred::class => [
            ReportException::class,
            StopWorkerIfNecessary::class,
        ],

        WorkerStopping::class => [
            //
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Warm / Flush Bindings
    |--------------------------------------------------------------------------
    |
    | The bindings listed below will either be pre-warmed when a worker boots
    | or they will be flushed before every request. Flushing a binding will
    | force the container to resolve that binding again when requested.
    |
    */

    'tables' => [
        'example:1000',
    ],

    /*
    |--------------------------------------------------------------------------
    | File Watching
    |--------------------------------------------------------------------------
    |
    | The following list of files and directories will be watched when using
    | the --watch option. If any of the files are changed, Octane will
    | automatically reload your application workers for you.
    |
    */

    'watch' => [
        'app',
        'bootstrap',
        'config',
        'database',
        'resources/**/*.php',
        'routes',
        '.env',
    ],

    /*
    |--------------------------------------------------------------------------
    | Garbage Collection Threshold
    |--------------------------------------------------------------------------
    |
    | When executing long-running tasks, memory leaks may be an issue. To
    | prevent this, Octane can restart workers before they consume too
    | much memory. You may specify the memory limit in megabytes.
    |
    */

    'garbage_collection' => [
        'threshold' => 50, // MB
    ],

    /*
    |--------------------------------------------------------------------------
    | Maximum Execution Time
    |--------------------------------------------------------------------------
    |
    | The following setting may be used to limit the maximum execution time
    | of a request being handled by Octane. You may specify this value in
    | seconds. A value of 0 indicates no limit.
    |
    */

    'max_execution_time' => 30,

];

// Import necessary classes
use App\Infrastructure\Performance\Listeners\CleanupTenantResources;
use App\Infrastructure\Performance\Listeners\CleanupWebSocketConnections;
use App\Infrastructure\Performance\Listeners\FlushTenantContext;
use App\Infrastructure\Performance\Listeners\LogPerformanceMetrics;
use App\Infrastructure\Performance\Listeners\SetupDatabaseConnection;
use Laravel\Octane\Events\OperationTerminated;
use Laravel\Octane\Events\RequestHandled;
use Laravel\Octane\Events\RequestReceived;
use Laravel\Octane\Events\RequestTerminated;
use Laravel\Octane\Events\TaskReceived;
use Laravel\Octane\Events\TaskTerminated;
use Laravel\Octane\Events\TickReceived;
use Laravel\Octane\Events\TickTerminated;
use Laravel\Octane\Events\WorkerErrorOccurred;
use Laravel\Octane\Events\WorkerStarting;
use Laravel\Octane\Events\WorkerStopping;
use Laravel\Octane\Facades\Octane;
use Laravel\Octane\Listeners\EnsureUploadedFilesAreValid;
use Laravel\Octane\Listeners\EnsureUploadedFilesCanBeMoved;
use Laravel\Octane\Listeners\FlushArrayCache;
use Laravel\Octane\Listeners\FlushAuthenticationState;
use Laravel\Octane\Listeners\FlushBroadcastingState;
use Laravel\Octane\Listeners\FlushBusState;
use Laravel\Octane\Listeners\FlushCacheState;
use Laravel\Octane\Listeners\FlushConfigurationState;
use Laravel\Octane\Listeners\FlushCookieState;
use Laravel\Octane\Listeners\FlushDatabaseState;
use Laravel\Octane\Listeners\FlushEventState;
use Laravel\Octane\Listeners\FlushFilesystemState;
use Laravel\Octane\Listeners\FlushHashState;
use Laravel\Octane\Listeners\FlushLocalizationState;
use Laravel\Octane\Listeners\FlushLogState;
use Laravel\Octane\Listeners\FlushMailState;
use Laravel\Octane\Listeners\FlushNotificationState;
use Laravel\Octane\Listeners\FlushPipelineHubState;
use Laravel\Octane\Listeners\FlushQueueState;
use Laravel\Octane\Listeners\FlushRedisState;
use Laravel\Octane\Listeners\FlushRequestState;
use Laravel\Octane\Listeners\FlushRouterState;
use Laravel\Octane\Listeners\FlushSessionState;
// Custom listeners for multi-tenant accounting platform
use Laravel\Octane\Listeners\FlushTemporaryContainerInstances;
use Laravel\Octane\Listeners\FlushValidationState;
use Laravel\Octane\Listeners\FlushViewState;
use Laravel\Octane\Listeners\ReportException;
use Laravel\Octane\Listeners\StopWorkerIfNecessary;
