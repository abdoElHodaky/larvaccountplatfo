<?php

namespace Modules\Organization\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Tenant;
use App\Policies\TenantPolicy;

class OrganizationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register module services
        $this->app->singleton('organization.module', function ($app) {
            return new \stdClass(); // Placeholder for module service
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Register policies
        Gate::policy(Tenant::class, TenantPolicy::class);

        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/../Routes/web.php');
        $this->loadRoutesFrom(__DIR__ . '/../Routes/api.php');

        // Load views (if any)
        $this->loadViewsFrom(__DIR__ . '/../Resources/views', 'organization');

        // Publish assets (if any)
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../Resources/assets' => public_path('modules/organization'),
            ], 'organization-assets');
        }

        // Register middleware
        $this->registerMiddleware();

        // Register custom validation rules
        $this->registerValidationRules();
    }

    /**
     * Register middleware.
     */
    protected function registerMiddleware(): void
    {
        $router = $this->app['router'];

        // Register tenant middleware if not already registered
        if (!$router->hasMiddlewareGroup('tenant')) {
            $router->aliasMiddleware('tenant', \App\Http\Middleware\TenantMiddleware::class);
        }
    }

    /**
     * Register custom validation rules.
     */
    protected function registerValidationRules(): void
    {
        // Custom validation rule for subdomain
        \Illuminate\Support\Facades\Validator::extend('valid_subdomain', function ($attribute, $value, $parameters, $validator) {
            // Check if subdomain is valid format
            if (!preg_match('/^[a-z0-9-]+$/', $value)) {
                return false;
            }

            // Check if subdomain is not reserved
            $reserved = [
                'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 
                'store', 'support', 'help', 'docs', 'status', 'cdn', 'assets',
                'static', 'media', 'files', 'download', 'upload', 'secure',
                'ssl', 'vpn', 'proxy', 'gateway', 'router', 'switch', 'hub',
                'server', 'host', 'domain', 'subdomain', 'dns', 'mx', 'ns',
                'cname', 'txt', 'srv', 'ptr', 'soa', 'aaaa', 'a', 'root',
                'localhost', 'test', 'testing', 'dev', 'development', 'staging',
                'production', 'prod', 'live', 'demo', 'sandbox', 'beta', 'alpha',
            ];

            return !in_array(strtolower($value), $reserved);
        });

        // Custom validation rule for fiscal year format
        \Illuminate\Support\Facades\Validator::extend('fiscal_year_format', function ($attribute, $value, $parameters, $validator) {
            return preg_match('/^\d{2}-\d{2}$/', $value) && 
                   checkdate(substr($value, 3, 2), substr($value, 0, 2), date('Y'));
        });

        // Custom validation rule for currency code
        \Illuminate\Support\Facades\Validator::extend('valid_currency', function ($attribute, $value, $parameters, $validator) {
            $validCurrencies = [
                'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 
                'INR', 'BRL', 'MXN', 'KRW', 'SGD', 'HKD', 'NOK', 'SEK',
                'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'TRY', 'ZAR', 'NZD',
            ];

            return in_array(strtoupper($value), $validCurrencies);
        });

        // Custom validation rule for timezone
        \Illuminate\Support\Facades\Validator::extend('valid_timezone', function ($attribute, $value, $parameters, $validator) {
            return in_array($value, timezone_identifiers_list());
        });
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [
            'organization.module',
        ];
    }
}
