<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],

        // Tenant Events
        'App\Events\TenantCreated' => [
            'App\Listeners\SetupTenantDatabase',
            'App\Listeners\SendTenantWelcomeEmail',
        ],

        'App\Events\TenantUpdated' => [
            'App\Listeners\UpdateTenantConfiguration',
        ],

        'App\Events\TenantDeleted' => [
            'App\Listeners\CleanupTenantData',
        ],

        // User Events
        'App\Events\UserInvited' => [
            'App\Listeners\SendUserInvitation',
        ],

        'App\Events\UserJoinedTenant' => [
            'App\Listeners\SetupUserPermissions',
            'App\Listeners\LogUserActivity',
        ],

        // Security Events
        'App\Events\SuspiciousActivity' => [
            'App\Listeners\LogSecurityEvent',
            'App\Listeners\NotifySecurityTeam',
        ],

        'App\Events\LoginAttemptFailed' => [
            'App\Listeners\TrackFailedLogin',
        ],

        // Module Events
        'App\Events\ModuleEnabled' => [
            'App\Listeners\SetupModuleConfiguration',
        ],

        'App\Events\ModuleDisabled' => [
            'App\Listeners\CleanupModuleData',
        ],

        // Financial Events
        'App\Events\TransactionCreated' => [
            'App\Listeners\UpdateAccountBalances',
            'App\Listeners\TriggerReportGeneration',
        ],

        'App\Events\ReportGenerated' => [
            'App\Listeners\NotifyReportSubscribers',
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
