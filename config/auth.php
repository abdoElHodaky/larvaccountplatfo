<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | This option controls the default authentication "guard" and password
    | reset options for your application. You may change these defaults
    | as required, but they're a perfect start for most applications.
    |
    */

    'defaults' => [
        'guard' => env('AUTH_GUARD', 'tenant_user'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Next, you may define every authentication guard for your application.
    | Of course, a great default configuration has been defined for you
    | here which uses session storage and the Eloquent user provider.
    |
    | All authentication drivers have a user provider. This defines how the
    | users are actually retrieved out of your database or other storage
    | mechanisms used by this application to persist your user's data.
    |
    | Supported: "session"
    |
    */

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],

        // Global User Guard - For landlord authentication
        'global_user' => [
            'driver' => 'global_user',
            'provider' => 'global_users',
        ],

        // Tenant User Guard - For tenant-specific authentication
        'tenant_user' => [
            'driver' => 'tenant_user',
            'provider' => 'tenant_users',
        ],

        // API Guards for token-based authentication
        'api_global' => [
            'driver' => 'sanctum',
            'provider' => 'global_users',
        ],

        'api_tenant' => [
            'driver' => 'sanctum',
            'provider' => 'tenant_users',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | All authentication drivers have a user provider. This defines how the
    | users are actually retrieved out of your database or other storage
    | mechanisms used by this application to persist your user's data.
    |
    | If you have multiple user tables or models you may configure multiple
    | sources which represent each model / table. These sources may then
    | be assigned to any extra authentication guards you have defined.
    |
    | Supported: "database", "eloquent", "hybrid"
    |
    */

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],

        // Global Users Provider - For landlord authentication
        'global_users' => [
            'driver' => 'hybrid',
            'model' => App\Models\GlobalUser::class,
            'global_model' => App\Models\GlobalUser::class,
        ],

        // Tenant Users Provider - For tenant-specific authentication
        'tenant_users' => [
            'driver' => 'hybrid',
            'model' => Modules\Shared\Models\User::class,
            'global_model' => App\Models\GlobalUser::class,
        ],

        // Database providers for password resets
        'users_database' => [
            'driver' => 'database',
            'table' => 'users',
        ],

        'global_users_database' => [
            'driver' => 'database',
            'table' => 'global_users',
            'connection' => 'landlord',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    |
    | You may specify multiple password reset configurations if you have more
    | than one user table or model in the application and you want to have
    | separate password reset settings based on the specific user types.
    |
    | The expire time is the number of minutes that each reset token will be
    | considered valid. This security feature keeps tokens short-lived so
    | they have less time to be guessed. You may change this as needed.
    |
    */

    'passwords' => [
        'users' => [
            'provider' => 'tenant_users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],

        'global_users' => [
            'provider' => 'global_users',
            'table' => 'password_reset_tokens',
            'connection' => 'landlord',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    |
    | Here you may define the amount of seconds before a password confirmation
    | times out and the user is prompted to re-enter their password via the
    | confirmation screen. By default, the timeout lasts for three hours.
    |
    */

    'password_timeout' => 10800,

    /*
    |--------------------------------------------------------------------------
    | Multi-Tenant Authentication Settings
    |--------------------------------------------------------------------------
    |
    | These settings control the behavior of the multi-tenant authentication
    | system, including session management, context switching, and security.
    |
    */

    'multi_tenant' => [
        // Session settings
        'session' => [
            'lifetime' => env('SESSION_LIFETIME', 120),
            'expire_on_close' => false,
            'encrypt' => false,
            'files' => storage_path('framework/sessions'),
            'connection' => null,
            'table' => 'sessions',
            'store' => null,
            'lottery' => [2, 100],
            'cookie' => env('SESSION_COOKIE', 'laravel_session'),
            'path' => '/',
            'domain' => env('SESSION_DOMAIN', null),
            'secure' => env('SESSION_SECURE_COOKIE', false),
            'http_only' => true,
            'same_site' => 'lax',
        ],

        // Context switching settings
        'context_switching' => [
            'enabled' => true,
            'auto_switch' => true,
            'preserve_session' => true,
        ],

        // Security settings
        'security' => [
            'verify_tenant_ownership' => true,
            'logout_on_tenant_mismatch' => true,
            'require_email_verification' => env('AUTH_REQUIRE_EMAIL_VERIFICATION', false),
            'password_reset_expiry' => 60, // minutes
        ],

        // Rate limiting
        'rate_limiting' => [
            'login_attempts' => [
                'max_attempts' => 5,
                'decay_minutes' => 15,
            ],
            'password_reset_attempts' => [
                'max_attempts' => 3,
                'decay_minutes' => 60,
            ],
        ],
    ],

];

