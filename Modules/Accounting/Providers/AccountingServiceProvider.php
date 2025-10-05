<?php

namespace Modules\Accounting\Providers;

use Modules\Shared\Providers\ModuleServiceProvider;
use Modules\Accounting\Services\ChartOfAccountsService;
use Modules\Accounting\Services\DoubleEntryService;

class AccountingServiceProvider extends ModuleServiceProvider
{
    /**
     * The module name.
     */
    protected $moduleName = 'Accounting';

    /**
     * The module path.
     */
    protected $modulePath = __DIR__ . '/..';

    /**
     * The module namespace.
     */
    protected $moduleNamespace = 'Modules\\Accounting';

    /**
     * Module configuration files to load.
     */
    protected $configFiles = [
        'accounting' => 'Config/accounting.php',
    ];

    /**
     * Module migration paths.
     */
    protected $migrationPaths = [
        'Database/Migrations',
    ];

    /**
     * Module view paths.
     */
    protected $viewPaths = [
        'accounting' => 'Resources/views',
    ];

    /**
     * Module translation paths.
     */
    protected $translationPaths = [
        'accounting' => 'Resources/lang',
    ];

    /**
     * Module route files.
     */
    protected $routeFiles = [
        'Routes/web.php',
        'Routes/api.php',
    ];

    /**
     * Module service bindings.
     */
    protected $bindings = [
        //
    ];

    /**
     * Module singleton bindings.
     */
    protected $singletons = [
        ChartOfAccountsService::class => ChartOfAccountsService::class,
        DoubleEntryService::class => DoubleEntryService::class,
    ];

    /**
     * Module commands.
     */
    protected $commands = [
        //
    ];

    /**
     * Module policies.
     */
    protected $policies = [
        \Modules\Accounting\Models\Account::class => \Modules\Accounting\Policies\AccountPolicy::class,
        \Modules\Accounting\Models\JournalEntry::class => \Modules\Accounting\Policies\JournalEntryPolicy::class,
        \Modules\Accounting\Models\Transaction::class => \Modules\Accounting\Policies\TransactionPolicy::class,
    ];

    /**
     * Module observers.
     */
    protected $observers = [
        //
    ];

    /**
     * Module event listeners.
     */
    protected $listeners = [
        'tenant.created' => [
            \Modules\Accounting\Listeners\CreateDefaultChartOfAccounts::class,
        ],
    ];

    /**
     * Boot module-specific logic.
     */
    protected function bootModule(): void
    {
        // Register module services with inter-module bus
        if ($this->app->bound(\Modules\Shared\Services\InterModuleBus::class)) {
            $bus = $this->app->make(\Modules\Shared\Services\InterModuleBus::class);
            
            $bus->registerService('Accounting', 'ChartOfAccounts', $this->app->make(ChartOfAccountsService::class));
            $bus->registerService('Accounting', 'DoubleEntry', $this->app->make(DoubleEntryService::class));
        }

        // Listen for organization creation to set up default chart of accounts
        $this->app['events']->listen('organization.created', function ($organization) {
            $chartService = $this->app->make(ChartOfAccountsService::class);
            $chartService->createDefaultChartOfAccounts($organization);
        });
    }

    /**
     * Get module dependencies.
     */
    public function getDependencies(): array
    {
        return ['Organization', 'Shared'];
    }

    /**
     * Get module version.
     */
    public function getVersion(): string
    {
        return '1.0.0';
    }

    /**
     * Get module description.
     */
    public function getDescription(): string
    {
        return 'Core accounting module with chart of accounts, double-entry bookkeeping, and journal entries';
    }

    /**
     * Get module author.
     */
    public function getAuthor(): string
    {
        return 'Laravel Accounting Platform';
    }

    /**
     * Check if module is tenant-aware.
     */
    protected function isTenantAware(): bool
    {
        return true;
    }

    /**
     * Get supported database strategies for this module.
     */
    protected function getSupportedDatabaseStrategies(): array
    {
        return ['shared', 'dedicated', 'clustered'];
    }
}

