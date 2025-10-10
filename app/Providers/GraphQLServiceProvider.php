<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Nuwave\Lighthouse\LighthouseServiceProvider;

class GraphQLServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register Lighthouse service provider
        $this->app->register(LighthouseServiceProvider::class);

        // Register GraphQL resolvers
        $this->registerResolvers();

        // Register GraphQL directives
        $this->registerDirectives();
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Publish GraphQL configuration
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../../config/lighthouse.php' => config_path('lighthouse.php'),
            ], 'lighthouse-config');

            $this->publishes([
                __DIR__.'/../../graphql/schema.graphql' => base_path('graphql/schema.graphql'),
            ], 'lighthouse-schema');
        }

        // Register GraphQL middleware
        $this->registerMiddleware();

        // Register GraphQL subscriptions
        $this->registerSubscriptions();
    }

    /**
     * Register GraphQL resolvers
     */
    protected function registerResolvers(): void
    {
        // Inventory resolvers
        $this->app->bind(
            'App\Features\Inventory\GraphQL\Queries\InventoryDashboard',
            function ($app) {
                return new \App\Features\Inventory\GraphQL\Queries\InventoryDashboard(
                    $app->make(\App\Features\Inventory\Services\InventoryService::class)
                );
            }
        );

        $this->app->bind(
            'App\Features\Inventory\GraphQL\Queries\LowStockProducts',
            function ($app) {
                return new \App\Features\Inventory\GraphQL\Queries\LowStockProducts(
                    $app->make(\App\Features\Inventory\Services\InventoryService::class)
                );
            }
        );

        $this->app->bind(
            'App\Features\Inventory\GraphQL\Queries\OutOfStockProducts',
            function ($app) {
                return new \App\Features\Inventory\GraphQL\Queries\OutOfStockProducts(
                    $app->make(\App\Features\Inventory\Services\InventoryService::class)
                );
            }
        );

        $this->app->bind(
            'App\Features\Inventory\GraphQL\Mutations\UpdateStock',
            function ($app) {
                return new \App\Features\Inventory\GraphQL\Mutations\UpdateStock(
                    $app->make(\App\Features\Inventory\Services\InventoryService::class)
                );
            }
        );

        // Accounting resolvers
        $this->app->bind(
            'App\Features\Accounting\GraphQL\Queries\AccountingDashboard',
            function ($app) {
                return new \App\Features\Accounting\GraphQL\Queries\AccountingDashboard(
                    $app->make(\App\Features\Accounting\Services\AccountingService::class)
                );
            }
        );

        $this->app->bind(
            'App\Features\Accounting\GraphQL\Queries\BalanceSheet',
            function ($app) {
                return new \App\Features\Accounting\GraphQL\Queries\BalanceSheet(
                    $app->make(\App\Features\Accounting\Services\AccountingService::class)
                );
            }
        );

        $this->app->bind(
            'App\Features\Accounting\GraphQL\Queries\ProfitLoss',
            function ($app) {
                return new \App\Features\Accounting\GraphQL\Queries\ProfitLoss(
                    $app->make(\App\Features\Accounting\Services\AccountingService::class)
                );
            }
        );

        $this->app->bind(
            'App\Features\Accounting\GraphQL\Mutations\CreateJournalEntry',
            function ($app) {
                return new \App\Features\Accounting\GraphQL\Mutations\CreateJournalEntry(
                    $app->make(\App\Features\Accounting\Services\AccountingService::class)
                );
            }
        );
    }

    /**
     * Register custom GraphQL directives
     */
    protected function registerDirectives(): void
    {
        // Register custom directives here if needed
        // Example: $this->app->bind('App\GraphQL\Directives\CustomDirective');
    }

    /**
     * Register GraphQL middleware
     */
    protected function registerMiddleware(): void
    {
        // Register GraphQL-specific middleware
        $router = $this->app['router'];
        
        // Add tenant middleware to GraphQL routes
        $router->aliasMiddleware('graphql.tenant', \App\Http\Middleware\TenantMiddleware::class);
        $router->aliasMiddleware('graphql.auth', \App\Http\Middleware\Authenticate::class);
    }

    /**
     * Register GraphQL subscriptions
     */
    protected function registerSubscriptions(): void
    {
        // Register subscription handlers here if needed
        // Example: Real-time inventory updates, accounting notifications, etc.
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [
            'App\Features\Inventory\GraphQL\Queries\InventoryDashboard',
            'App\Features\Inventory\GraphQL\Queries\LowStockProducts',
            'App\Features\Inventory\GraphQL\Queries\OutOfStockProducts',
            'App\Features\Inventory\GraphQL\Mutations\UpdateStock',
            'App\Features\Accounting\GraphQL\Queries\AccountingDashboard',
            'App\Features\Accounting\GraphQL\Queries\BalanceSheet',
            'App\Features\Accounting\GraphQL\Queries\ProfitLoss',
            'App\Features\Accounting\GraphQL\Mutations\CreateJournalEntry',
        ];
    }
}
