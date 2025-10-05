<?php

namespace Modules\Reporting\Providers;

use Modules\Shared\Providers\ModuleServiceProvider;
use Modules\Reporting\Services\FinancialReportingService;
use Modules\Reporting\Services\AnalyticsService;
use Modules\Reporting\Services\ReportExportService;
use Modules\Reporting\Jobs\GenerateScheduledReports;

class ReportingServiceProvider extends ModuleServiceProvider
{
    /**
     * The module name.
     */
    protected $moduleName = 'Reporting';

    /**
     * The module path.
     */
    protected $modulePath = __DIR__ . '/..';

    /**
     * The module namespace.
     */
    protected $moduleNamespace = 'Modules\\Reporting';

    /**
     * Module configuration files to load.
     */
    protected $configFiles = [
        'reporting' => 'Config/reporting.php',
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
        'reporting' => 'Resources/views',
    ];

    /**
     * Module translation paths.
     */
    protected $translationPaths = [
        'reporting' => 'Resources/lang',
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
        FinancialReportingService::class => FinancialReportingService::class,
        AnalyticsService::class => AnalyticsService::class,
        ReportExportService::class => ReportExportService::class,
    ];

    /**
     * Module commands.
     */
    protected $commands = [
        \Modules\Reporting\Console\Commands\GenerateReportsCommand::class,
        \Modules\Reporting\Console\Commands\CleanupOldReportsCommand::class,
    ];

    /**
     * Module policies.
     */
    protected $policies = [
        \Modules\Reporting\Models\FinancialReport::class => \Modules\Reporting\Policies\FinancialReportPolicy::class,
        \Modules\Reporting\Models\ReportSchedule::class => \Modules\Reporting\Policies\ReportSchedulePolicy::class,
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
        'accounting.transaction.posted' => [
            \Modules\Reporting\Listeners\ClearReportCache::class,
        ],
        'accounting.journal_entry.posted' => [
            \Modules\Reporting\Listeners\ClearReportCache::class,
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
            
            $bus->registerService('Reporting', 'FinancialReporting', $this->app->make(FinancialReportingService::class));
            $bus->registerService('Reporting', 'Analytics', $this->app->make(AnalyticsService::class));
            $bus->registerService('Reporting', 'ReportExport', $this->app->make(ReportExportService::class));
        }

        // Schedule report generation job
        $this->app->booted(function () {
            $schedule = $this->app->make(\Illuminate\Console\Scheduling\Schedule::class);
            
            // Run every hour to check for scheduled reports
            $schedule->job(new GenerateScheduledReports)->hourly();
            
            // Clean up old reports daily at 2 AM
            $schedule->command('reports:cleanup')->dailyAt('02:00');
        });

        // Listen for accounting events to clear cache
        $this->app['events']->listen('accounting.transaction.created', function ($transaction) {
            $this->clearReportCache($transaction->organization_id);
        });

        $this->app['events']->listen('accounting.journal_entry.posted', function ($journalEntry) {
            $this->clearReportCache($journalEntry->organization_id);
        });
    }

    /**
     * Get module dependencies.
     */
    public function getDependencies(): array
    {
        return ['Accounting', 'Organization', 'Shared'];
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
        return 'Financial reporting and analytics module with Balance Sheet, Income Statement, Cash Flow, and advanced analytics';
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

    /**
     * Clear report cache for organization
     */
    protected function clearReportCache(int $organizationId): void
    {
        try {
            $organization = \Modules\Shared\Models\Organization::find($organizationId);
            if ($organization) {
                $reportingService = $this->app->make(FinancialReportingService::class);
                $reportingService->clearReportCache($organization);
            }
        } catch (\Exception $e) {
            // Log error but don't fail the transaction
            \Log::warning('Failed to clear report cache for organization ' . $organizationId . ': ' . $e->getMessage());
        }
    }
}

