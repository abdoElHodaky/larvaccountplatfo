<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Tenant Management
        $schedule->command('tenant:cleanup-expired')
                 ->daily()
                 ->at('02:00')
                 ->withoutOverlapping()
                 ->runInBackground();

        $schedule->command('tenant:promote-eligible')
                 ->hourly()
                 ->withoutOverlapping()
                 ->runInBackground();

        $schedule->command('tenant:backup-databases')
                 ->daily()
                 ->at('03:00')
                 ->withoutOverlapping()
                 ->runInBackground();

        // Financial Reports
        $schedule->command('reports:generate-scheduled')
                 ->everyFiveMinutes()
                 ->withoutOverlapping()
                 ->runInBackground();

        $schedule->command('reports:cleanup-old')
                 ->daily()
                 ->at('04:00')
                 ->withoutOverlapping();

        // Security & Audit
        $schedule->command('security:analyze-threats')
                 ->everyTenMinutes()
                 ->withoutOverlapping()
                 ->runInBackground();

        $schedule->command('audit:cleanup-old-logs')
                 ->weekly()
                 ->sundays()
                 ->at('05:00')
                 ->withoutOverlapping();

        // Integration Sync
        $schedule->command('integration:sync-all')
                 ->everyThirtyMinutes()
                 ->withoutOverlapping()
                 ->runInBackground();

        $schedule->command('integration:retry-failed')
                 ->hourly()
                 ->withoutOverlapping()
                 ->runInBackground();

        // Inventory Management
        $schedule->command('inventory:check-low-stock')
                 ->hourly()
                 ->withoutOverlapping()
                 ->runInBackground();

        $schedule->command('inventory:update-valuations')
                 ->daily()
                 ->at('06:00')
                 ->withoutOverlapping()
                 ->runInBackground();

        // Cache Management
        $schedule->command('cache:prune-stale')
                 ->hourly()
                 ->withoutOverlapping();

        // Queue Management
        $schedule->command('queue:prune-batches --hours=48')
                 ->daily()
                 ->at('07:00');

        $schedule->command('queue:prune-failed --hours=168')
                 ->weekly()
                 ->sundays()
                 ->at('08:00');

        // System Maintenance
        $schedule->command('system:health-check')
                 ->everyFiveMinutes()
                 ->withoutOverlapping()
                 ->runInBackground();

        $schedule->command('system:optimize-performance')
                 ->daily()
                 ->at('01:00')
                 ->withoutOverlapping();

        // Module Management
        $schedule->command('module:sync-services')
                 ->everyTenMinutes()
                 ->withoutOverlapping()
                 ->runInBackground();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
