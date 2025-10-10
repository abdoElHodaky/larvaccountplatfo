<?php

namespace App\Providers;

use App\Services\FeatureFlag;
use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        parent::boot();

        // Only configure Horizon if it's enabled for this deployment
        if (!FeatureFlag::shouldUseHorizon()) {
            return;
        }

        // Configure Horizon dashboard access
        Horizon::routeSlackNotificationsTo(
            config('services.slack.horizon_webhook'),
            '#alerts'
        );

        Horizon::routeEmailNotificationsTo(
            config('mail.horizon.to', 'admin@example.com')
        );

        // Configure Horizon environment based on deployment type
        $this->configureEnvironment();
    }

    /**
     * Configure the Horizon dashboard authorization.
     */
    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user = null) {
            // In local environment, allow all access
            if (app()->environment('local')) {
                return true;
            }

            // For cloud deployment, disable Horizon dashboard
            if (FeatureFlag::getCurrentProfile() === 'cloud') {
                return false;
            }

            // For production/forge, require authentication and admin role
            return $user && in_array($user->email, [
                'admin@example.com',
                // Add your admin emails here
            ]);
        });
    }

    /**
     * Configure Horizon environment based on deployment profile
     */
    protected function configureEnvironment(): void
    {
        $profile = FeatureFlag::getCurrentProfile();
        
        // Set the appropriate environment configuration
        switch ($profile) {
            case 'cloud':
                // Cloud deployment uses minimal queue configuration
                config(['horizon.environments.production' => config('horizon.environments.cloud')]);
                break;
                
            case 'forge':
                // Forge deployment uses optimized configuration
                config(['horizon.environments.production' => config('horizon.environments.forge')]);
                break;
                
            default:
                // Enterprise deployment uses full configuration
                // Keep the default production configuration
                break;
        }

        // Configure memory limits based on deployment
        $this->configureMemoryLimits($profile);
        
        // Configure queue wait times based on deployment
        $this->configureWaitTimes($profile);
    }

    /**
     * Configure memory limits based on deployment profile
     */
    protected function configureMemoryLimits(string $profile): void
    {
        $memoryLimits = [
            'cloud' => 64,
            'forge' => 128,
            'enterprise' => 256,
        ];

        config(['horizon.memory_limit' => $memoryLimits[$profile] ?? 128]);
    }

    /**
     * Configure queue wait times based on deployment profile
     */
    protected function configureWaitTimes(string $profile): void
    {
        $waitTimes = [
            'cloud' => [
                'redis:default' => 120,
                'redis:emails' => 180,
            ],
            'forge' => [
                'redis:default' => 60,
                'redis:critical' => 30,
                'redis:emails' => 120,
                'redis:reports' => 300,
                'redis:broadcasts' => 30,
            ],
            'enterprise' => [
                'redis:default' => 60,
                'redis:critical' => 30,
                'redis:emails' => 120,
                'redis:reports' => 300,
                'redis:broadcasts' => 30,
                'redis:tenant-processing' => 180,
                'redis:tenant-reports' => 600,
            ],
        ];

        config(['horizon.waits' => $waitTimes[$profile] ?? $waitTimes['forge']]);
    }

    /**
     * Register any application services.
     */
    public function register(): void
    {
        parent::register();

        // Only register Horizon if it's enabled
        if (!FeatureFlag::shouldUseHorizon()) {
            return;
        }

        // Configure Horizon based on deployment environment
        $this->configureHorizonForDeployment();
    }

    /**
     * Configure Horizon settings for specific deployment environments
     */
    protected function configureHorizonForDeployment(): void
    {
        $profile = FeatureFlag::getCurrentProfile();

        // Configure Horizon path based on deployment
        if ($profile === 'forge') {
            config(['horizon.path' => env('HORIZON_PATH', 'admin/horizon')]);
        } elseif ($profile === 'cloud') {
            // Disable Horizon dashboard for cloud deployment
            config(['horizon.path' => null]);
        }

        // Configure Redis connection
        config(['horizon.use' => env('HORIZON_REDIS_CONNECTION', 'default')]);

        // Configure fast termination for production deployments
        if (app()->environment('production')) {
            config(['horizon.fast_termination' => true]);
        }
    }
}
