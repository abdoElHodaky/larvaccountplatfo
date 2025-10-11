<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

class FeatureFlag
{
    /**
     * Check if a feature is enabled
     */
    public static function enabled(string $feature): bool
    {
        return Config::get("features.{$feature}", false);
    }

    /**
     * Check if a feature is disabled
     */
    public static function disabled(string $feature): bool
    {
        return ! static::enabled($feature);
    }

    /**
     * Get all enabled features
     */
    public static function getEnabledFeatures(): array
    {
        $features = Config::get('features', []);
        unset($features['profiles']); // Remove profiles from the list

        return array_filter($features, function ($value) {
            return $value === true;
        });
    }

    /**
     * Get all disabled features
     */
    public static function getDisabledFeatures(): array
    {
        $features = Config::get('features', []);
        unset($features['profiles']); // Remove profiles from the list

        return array_filter($features, function ($value) {
            return $value === false;
        });
    }

    /**
     * Apply a deployment profile
     */
    public static function applyProfile(string $profile): void
    {
        $profileConfig = Config::get("features.profiles.{$profile}");

        if (! $profileConfig) {
            throw new \InvalidArgumentException("Profile '{$profile}' not found");
        }

        foreach ($profileConfig as $feature => $enabled) {
            Config::set("features.{$feature}", $enabled);
        }

        // Clear any cached feature flags
        Cache::tags(['features'])->flush();
    }

    /**
     * Get the current deployment profile based on environment
     */
    public static function getCurrentProfile(): string
    {
        $env = config('app.env');

        // Detect deployment type based on URL or environment variables
        if (str_contains(config('app.url'), 'laravel.cloud')) {
            return 'cloud';
        }

        if (env('FORGE_DEPLOYMENT', false)) {
            return 'forge';
        }

        if ($env === 'production') {
            return 'enterprise';
        }

        return 'enterprise'; // Default to full features for development
    }

    /**
     * Auto-apply profile based on current environment
     */
    public static function autoApplyProfile(): void
    {
        $profile = static::getCurrentProfile();
        static::applyProfile($profile);
    }

    /**
     * Check if database sharding should be used
     */
    public static function shouldUseSharding(): bool
    {
        return static::enabled('database_sharding');
    }

    /**
     * Check if multi-region support should be enabled
     */
    public static function shouldUseMultiRegion(): bool
    {
        return static::enabled('multi_region');
    }

    /**
     * Check if Octane should be used
     */
    public static function shouldUseOctane(): bool
    {
        return static::enabled('octane');
    }

    /**
     * Check if Horizon should be used
     */
    public static function shouldUseHorizon(): bool
    {
        return static::enabled('horizon');
    }

    /**
     * Check if PWA features should be enabled
     */
    public static function shouldUsePWA(): bool
    {
        return static::enabled('pwa');
    }

    /**
     * Check if real-time collaboration should be enabled
     */
    public static function shouldUseRealTimeCollaboration(): bool
    {
        return static::enabled('real_time_collaboration');
    }

    /**
     * Check if advanced reporting should be enabled
     */
    public static function shouldUseAdvancedReporting(): bool
    {
        return static::enabled('advanced_reporting');
    }

    /**
     * Check if mobile app features should be enabled
     */
    public static function shouldUseMobileApp(): bool
    {
        return static::enabled('mobile_app');
    }

    /**
     * Get feature status for frontend
     */
    public static function getFrontendFeatures(): array
    {
        return [
            'pwa' => static::enabled('pwa'),
            'offlineSupport' => static::enabled('offline_support'),
            'pushNotifications' => static::enabled('push_notifications'),
            'realTimeCollaboration' => static::enabled('real_time_collaboration'),
            'advancedReporting' => static::enabled('advanced_reporting'),
            'mobileApp' => static::enabled('mobile_app'),
            'multiCurrency' => static::enabled('multi_currency'),
            'inventoryManagement' => static::enabled('inventory_management'),
            'integrationServices' => static::enabled('integration_services'),
            'performanceMonitoring' => static::enabled('performance_monitoring'),
            'realTimeStockUpdates' => static::enabled('real_time_stock_updates'),
            'realTimeFinancialUpdates' => static::enabled('real_time_financial_updates'),
            'reportScheduling' => static::enabled('report_scheduling'),
            'emailReports' => static::enabled('email_reports'),
            'twoFactorAuth' => static::enabled('two_factor_auth'),
            'dataExport' => static::enabled('data_export'),
            'bulkOperations' => static::enabled('bulk_operations'),
            'advancedSearch' => static::enabled('advanced_search'),
            'customFields' => static::enabled('custom_fields'),
            'workflowAutomation' => static::enabled('workflow_automation'),
            'thirdPartyIntegrations' => static::enabled('third_party_integrations'),
        ];
    }

    /**
     * Cache feature flags for performance
     */
    public static function cacheFeatures(): void
    {
        $features = static::getFrontendFeatures();
        Cache::tags(['features'])->put('frontend_features', $features, 3600);
    }

    /**
     * Get cached feature flags
     */
    public static function getCachedFeatures(): array
    {
        return Cache::tags(['features'])->get('frontend_features', []);
    }
}
