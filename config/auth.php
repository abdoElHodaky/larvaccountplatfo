<?php

return [

    'defaults' => [
        'guard' => env('AUTH_GUARD', 'tenant_user'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'tenant_users'),
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],

        'global_user' => [
            'driver' => 'global_user',
            'provider' => 'global_users',
        ],

        'tenant_user' => [
            'driver' => 'tenant_user',
            'provider' => 'tenant_users',
        ],

        'api_global' => [
            'driver' => 'sanctum',
            'provider' => 'global_users',
        ],

        'api_tenant' => [
            'driver' => 'sanctum',
            'provider' => 'tenant_users',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => \App\Models\User::class,
        ],

        'global_users' => [
            'driver' => 'hybrid',
            'model' => \App\Models\GlobalUser::class,
            'global_model' => \App\Models\GlobalUser::class,
        ],

        'tenant_users' => [
            'driver' => 'hybrid',
            'model' => \Modules\Shared\Models\User::class,
            'global_model' => \App\Models\GlobalUser::class,
        ],

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

    'passwords' => [
        'tenant_users' => [
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

    'password_timeout' => 10800,

    'multi_tenant' => [
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

        'context_switching' => [
            'enabled' => true,
            'auto_switch' => true,
            'preserve_session' => true,
        ],

        'security' => [
            'verify_tenant_ownership' => true,
            'logout_on_tenant_mismatch' => true,
            'require_email_verification' => env('AUTH_REQUIRE_EMAIL_VERIFICATION', false),
            'password_reset_expiry' => 60,
        ],

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
