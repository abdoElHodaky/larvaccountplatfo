<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Route Configuration
    |--------------------------------------------------------------------------
    |
    | Controls the HTTP route that your GraphQL server responds to.
    | You may set `route` => false, to disable the default route
    | registration and take full control.
    |
    */

    'route' => [
        /*
         * The URI the endpoint responds to, e.g. mydomain.com/graphql.
         */
        'uri' => '/graphql',

        /*
         * Lighthouse creates a named route for convenient URL generation and redirects.
         */
        'name' => 'graphql',

        /*
         * Beware that middleware defined here runs before the GraphQL execution phase,
         * make sure to return spec-compliant responses in case an error is thrown.
         */
        'middleware' => [
            \Nuwave\Lighthouse\Support\Http\Middleware\AcceptJson::class,
            'auth:sanctum', // Enable Sanctum authentication for GraphQL
            \App\Http\Middleware\GraphQLRateLimit::class, // Rate limiting for GraphQL
        ],

        /*
         * The `prefix` and `domain` configuration options are optional.
         */
        // 'prefix' => '',
        // 'domain' => '',
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guard
    |--------------------------------------------------------------------------
    |
    | The guard to use for authenticating GraphQL requests, if needed.
    | This setting is used when you use the @auth directive.
    |
    */

    'guard' => 'sanctum',

    /*
    |--------------------------------------------------------------------------
    | Schema Declaration
    |--------------------------------------------------------------------------
    |
    | This is a path that points to where your GraphQL schema is located
    | relative to the application's root folder. You may also use the
    | `artisan lighthouse:print-schema` command to output the final schema.
    |
    */

    'schema' => [
        /*
         * Path to your .graphql files or a glob pattern to load multiple files.
         */
        'register' => base_path('graphql/schema.graphql'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Schema Cache
    |--------------------------------------------------------------------------
    |
    | A large schema can be expensive to parse on every request. Enable caching
    | to optimize performance of large schemas.
    |
    */

    'cache' => [
        /*
         * Setting to true enables schema caching.
         */
        'enable' => env('LIGHTHOUSE_CACHE_ENABLE', env('APP_ENV') !== 'local'),

        /*
         * Allowed values:
         * - "default": uses the default cache store defined in your app
         * - "array": uses the array cache driver
         * - null: uses the array cache driver
         */
        'store' => env('LIGHTHOUSE_CACHE_STORE', 'default'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Namespaces
    |--------------------------------------------------------------------------
    |
    | These are the default namespaces where Lighthouse looks for classes to
    | extend functionality of the schema. You may pass in either a string
    | or an array, they are tried in order and the first match is used.
    |
    */

    'namespaces' => [
        'models' => [
            'App\\Models',
            'App\\Features\\Inventory\\Models',
            'App\\Features\\Accounting\\Models',
            'App\\Features\\Dashboard\\Models',
        ],
        'queries' => [
            'App\\GraphQL\\Queries',
            'App\\Features\\Inventory\\GraphQL\\Queries',
            'App\\Features\\Accounting\\GraphQL\\Queries',
            'App\\Features\\Dashboard\\GraphQL\\Queries',
        ],
        'mutations' => [
            'App\\GraphQL\\Mutations',
            'App\\Features\\Inventory\\GraphQL\\Mutations',
            'App\\Features\\Accounting\\GraphQL\\Mutations',
            'App\\Features\\Dashboard\\GraphQL\\Mutations',
        ],
        'subscriptions' => [
            'App\\GraphQL\\Subscriptions',
            'App\\Features\\Inventory\\GraphQL\\Subscriptions',
            'App\\Features\\Accounting\\GraphQL\\Subscriptions',
            'App\\Features\\Dashboard\\GraphQL\\Subscriptions',
        ],
        'interfaces' => [
            'App\\GraphQL\\Interfaces',
        ],
        'unions' => [
            'App\\GraphQL\\Unions',
        ],
        'scalars' => [
            'App\\GraphQL\\Scalars',
        ],
        'directives' => [
            'App\\GraphQL\\Directives',
        ],
        'validators' => [
            'App\\GraphQL\\Validators',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Security
    |--------------------------------------------------------------------------
    |
    | Control how Lighthouse handles security related query validation.
    | Read more at https://lighthouse-php.com/master/security/security.html
    |
    */

    'security' => [
        'max_query_complexity' => \GraphQL\Validator\Rules\QueryComplexity::DISABLED,
        'max_query_depth' => \GraphQL\Validator\Rules\QueryDepth::DISABLED,
        'disable_introspection' => \GraphQL\Validator\Rules\DisableIntrospection::DISABLED,
    ],

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    |
    | Lighthouse handles pagination in the @paginate directive.
    | Here you can specify the default pagination values.
    |
    */

    'pagination' => [
        /*
         * Allow clients to query paginated lists without specifying the amount of items.
         * Setting this to `null` denies the field unless the amount is explicitly specified.
         */
        'default_count' => 15,

        /*
         * Limit the maximum amount of items that clients can request from paginated lists.
         * Setting this to `null` means the count is unrestricted.
         */
        'max_count' => 100,
    ],

    /*
    |--------------------------------------------------------------------------
    | Debug
    |--------------------------------------------------------------------------
    |
    | Control the debug level as described in https://lighthouse-php.com/master/getting-started/configuration.html
    |
    */

    'debug' => env('LIGHTHOUSE_DEBUG', \GraphQL\Error\DebugFlag::INCLUDE_DEBUG_MESSAGE | \GraphQL\Error\DebugFlag::INCLUDE_TRACE),

    /*
    |--------------------------------------------------------------------------
    | Error Handlers
    |--------------------------------------------------------------------------
    |
    | Register error handlers that receive the Errors that occur during execution and
    | handle them. You may use this to log, filter or format the errors.
    | The classes must implement \Nuwave\Lighthouse\Execution\ErrorHandler
    |
    */

    'error_handlers' => [
        \Nuwave\Lighthouse\Execution\AuthenticationErrorHandler::class,
        \Nuwave\Lighthouse\Execution\AuthorizationErrorHandler::class,
        \Nuwave\Lighthouse\Execution\ValidationErrorHandler::class,
        \Nuwave\Lighthouse\Execution\ReportingErrorHandler::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Extensions
    |--------------------------------------------------------------------------
    |
    | Register extension classes that extend Lighthouse with additional functionality.
    |
    */

    'extensions' => [
        // \Nuwave\Lighthouse\Extensions\TracingExtension::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Subscriptions
    |--------------------------------------------------------------------------
    |
    | Lighthouse can handle Subscriptions with either Pusher or Redis.
    | Here you can define the broadcaster and storage configuration.
    |
    */

    'subscriptions' => [
        /*
         * Determines if broadcasts should be queued by default.
         */
        'queue_broadcasts' => env('LIGHTHOUSE_QUEUE_BROADCASTS', true),

        /*
         * Determines the queue to use for broadcasting queue jobs.
         */
        'broadcasts_queue_name' => env('LIGHTHOUSE_BROADCASTS_QUEUE_NAME'),

        /*
         * Default subscription storage.
         * Any Laravel supported cache driver is available here.
         */
        'storage' => env('LIGHTHOUSE_SUBSCRIPTION_STORAGE', 'redis'),

        /*
         * Default subscription broadcaster.
         */
        'broadcaster' => env('LIGHTHOUSE_SUBSCRIPTION_BROADCASTER', 'pusher'),

        /*
         * Subscription broadcasting drivers with config.
         */
        'broadcasters' => [
            'log' => [
                'driver' => 'log',
            ],
            'pusher' => [
                'driver' => 'pusher',
                'routes' => \Nuwave\Lighthouse\Subscriptions\Subscriber\AuthorizeSubscriber::class.'@authorize',
                'connection' => 'pusher',
            ],
            'redis' => [
                'driver' => 'redis',
                'connection' => env('LIGHTHOUSE_REDIS_CONNECTION', 'default'),
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Defer
    |--------------------------------------------------------------------------
    |
    | Configuration for the experimental @defer directive.
    | This feature allows clients to receive parts of the query results as soon as they are ready.
    |
    */

    'defer' => [
        /*
         * Maximum number of nested fields that can be deferred in a single query.
         * Once reached, remaining fields will be resolved synchronously.
         * 0 means unlimited.
         */
        'max_nested_fields' => 0,

        /*
         * Maximum execution time for deferred queries in seconds.
         * Once reached, remaining fields will be resolved synchronously.
         * 0 means unlimited.
         */
        'max_execution_ms' => 0,
    ],
];
