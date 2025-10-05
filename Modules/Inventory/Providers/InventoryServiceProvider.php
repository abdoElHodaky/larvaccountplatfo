<?php

namespace Modules\Inventory\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Modules\Inventory\Services\InventoryService;
use Modules\Inventory\Events\StockLevelUpdated;
use Modules\Inventory\Events\LowStockAlert;
use Modules\Inventory\Events\InventoryMovementCreated;
use Modules\Inventory\Listeners\UpdateAccountingOnInventoryMovement;
use Modules\Inventory\Listeners\SendLowStockNotification;
use Modules\Inventory\Listeners\ClearInventoryCache;

class InventoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register services
        $this->app->singleton(InventoryService::class, function ($app) {
            return new InventoryService();
        });

        // Register module configuration
        $this->mergeConfigFrom(
            __DIR__ . '/../Config/inventory.php',
            'inventory'
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/../Routes/web.php');
        $this->loadRoutesFrom(__DIR__ . '/../Routes/api.php');

        // Register event listeners
        $this->registerEventListeners();

        // Register scheduled jobs
        $this->registerScheduledJobs();

        // Register broadcasting channels
        $this->registerBroadcastingChannels();

        // Register observers
        $this->registerObservers();
    }

    /**
     * Register event listeners
     */
    protected function registerEventListeners(): void
    {
        // Inventory movement events
        Event::listen(
            InventoryMovementCreated::class,
            UpdateAccountingOnInventoryMovement::class
        );

        Event::listen(
            InventoryMovementCreated::class,
            ClearInventoryCache::class
        );

        // Stock level events
        Event::listen(
            StockLevelUpdated::class,
            ClearInventoryCache::class
        );

        // Low stock alerts
        Event::listen(
            LowStockAlert::class,
            SendLowStockNotification::class
        );

        // Clear cache when accounting data changes
        Event::listen('accounting.journal_entry.posted', function ($event) {
            \Cache::tags(['inventory', "org_{$event->journalEntry->organization_id}"])->flush();
        });

        Event::listen('accounting.journal_entry.reversed', function ($event) {
            \Cache::tags(['inventory', "org_{$event->journalEntry->organization_id}"])->flush();
        });
    }

    /**
     * Register scheduled jobs
     */
    protected function registerScheduledJobs(): void
    {
        // Register scheduled jobs in the console kernel
        $this->app->booted(function () {
            $schedule = $this->app->make(\Illuminate\Console\Scheduling\Schedule::class);

            // Check for low stock alerts every hour
            $schedule->job(new \Modules\Inventory\Jobs\CheckLowStockAlerts())
                    ->hourly()
                    ->name('inventory.check_low_stock_alerts')
                    ->withoutOverlapping();

            // Generate automatic reorder suggestions daily
            $schedule->job(new \Modules\Inventory\Jobs\GenerateReorderSuggestions())
                    ->daily()
                    ->at('09:00')
                    ->name('inventory.generate_reorder_suggestions')
                    ->withoutOverlapping();

            // Clean up old stock movements (older than 2 years) monthly
            $schedule->job(new \Modules\Inventory\Jobs\CleanupOldStockMovements())
                    ->monthly()
                    ->name('inventory.cleanup_old_movements')
                    ->withoutOverlapping();

            // Update inventory valuations daily
            $schedule->job(new \Modules\Inventory\Jobs\UpdateInventoryValuations())
                    ->daily()
                    ->at('02:00')
                    ->name('inventory.update_valuations')
                    ->withoutOverlapping();
        });
    }

    /**
     * Register broadcasting channels
     */
    protected function registerBroadcastingChannels(): void
    {
        // Register private channels for real-time inventory updates
        \Broadcast::channel('organization.{organizationId}.inventory', function ($user, $organizationId) {
            // Check if user belongs to the organization
            return $user->organization_id == $organizationId;
        });

        \Broadcast::channel('organization.{organizationId}.product.{productId}', function ($user, $organizationId, $productId) {
            // Check if user belongs to the organization
            return $user->organization_id == $organizationId;
        });

        \Broadcast::channel('organization.{organizationId}.warehouse.{warehouseId}', function ($user, $organizationId, $warehouseId) {
            // Check if user belongs to the organization
            return $user->organization_id == $organizationId;
        });

        \Broadcast::channel('organization.{organizationId}.alerts', function ($user, $organizationId) {
            // Check if user belongs to the organization and has permission to receive alerts
            return $user->organization_id == $organizationId && $user->can('receive_inventory_alerts');
        });

        \Broadcast::channel('organization.{organizationId}.inventory.alerts', function ($user, $organizationId) {
            // Check if user belongs to the organization and has inventory permissions
            return $user->organization_id == $organizationId && $user->can('view_inventory');
        });
    }

    /**
     * Register model observers
     */
    protected function registerObservers(): void
    {
        // Register observers for automatic cache clearing and event broadcasting
        \Modules\Inventory\Models\Product::observe(\Modules\Inventory\Observers\ProductObserver::class);
        \Modules\Inventory\Models\StockLevel::observe(\Modules\Inventory\Observers\StockLevelObserver::class);
        \Modules\Inventory\Models\StockMovement::observe(\Modules\Inventory\Observers\StockMovementObserver::class);
        \Modules\Inventory\Models\PurchaseOrder::observe(\Modules\Inventory\Observers\PurchaseOrderObserver::class);
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [
            InventoryService::class,
        ];
    }
}

