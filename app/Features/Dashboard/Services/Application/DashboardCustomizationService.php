<?php

namespace App\Features\Dashboard\Services\Application;

use App\Features\Dashboard\Contracts\DashboardCustomizationServiceInterface;
use App\Features\Dashboard\Models\DashboardLayout;
use App\Features\Dashboard\Models\DashboardPreference;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardCustomizationService implements DashboardCustomizationServiceInterface
{
    /**
     * Get dashboard layout configuration
     */
    public function getDashboardLayout(int $organizationId, int $userId): array
    {
        $cacheKey = "dashboard_layout_{$organizationId}_{$userId}";

        return Cache::remember($cacheKey, 300, function () use ($organizationId, $userId) {
            $layout = DashboardLayout::where('organization_id', $organizationId)
                ->where('user_id', $userId)
                ->first();

            if (!$layout) {
                return $this->getDefaultLayout();
            }

            return [
                'layout_id' => $layout->id,
                'grid_columns' => $layout->grid_columns ?? 12,
                'grid_rows' => $layout->grid_rows ?? 'auto',
                'widgets' => $layout->widget_positions ?? [],
                'theme' => $layout->theme ?? 'default',
                'sidebar_collapsed' => $layout->sidebar_collapsed ?? false,
                'header_visible' => $layout->header_visible ?? true,
                'footer_visible' => $layout->footer_visible ?? true,
                'custom_css' => $layout->custom_css ?? '',
                'responsive_breakpoints' => $layout->responsive_breakpoints ?? $this->getDefaultBreakpoints(),
                'last_modified' => $layout->updated_at,
            ];
        });
    }

    /**
     * Update dashboard layout
     */
    public function updateDashboardLayout(int $organizationId, int $userId, array $layout): bool
    {
        DB::beginTransaction();
        try {
            $existingLayout = DashboardLayout::where('organization_id', $organizationId)
                ->where('user_id', $userId)
                ->first();

            $layoutData = [
                'organization_id' => $organizationId,
                'user_id' => $userId,
                'grid_columns' => $layout['grid_columns'] ?? 12,
                'grid_rows' => $layout['grid_rows'] ?? 'auto',
                'widget_positions' => $layout['widgets'] ?? [],
                'theme' => $layout['theme'] ?? 'default',
                'sidebar_collapsed' => $layout['sidebar_collapsed'] ?? false,
                'header_visible' => $layout['header_visible'] ?? true,
                'footer_visible' => $layout['footer_visible'] ?? true,
                'custom_css' => $layout['custom_css'] ?? '',
                'responsive_breakpoints' => $layout['responsive_breakpoints'] ?? $this->getDefaultBreakpoints(),
            ];

            if ($existingLayout) {
                $existingLayout->update($layoutData);
            } else {
                DashboardLayout::create($layoutData);
            }

            DB::commit();

            // Clear cache
            $this->clearLayoutCache($organizationId, $userId);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get available dashboard themes
     */
    public function getAvailableThemes(): array
    {
        return [
            'default' => [
                'name' => 'Default',
                'description' => 'Clean and professional default theme',
                'primary_color' => '#3B82F6',
                'secondary_color' => '#6B7280',
                'background_color' => '#F9FAFB',
                'text_color' => '#111827',
                'card_background' => '#FFFFFF',
                'border_color' => '#E5E7EB',
                'preview_image' => '/themes/default-preview.png',
            ],
            'dark' => [
                'name' => 'Dark Mode',
                'description' => 'Modern dark theme for reduced eye strain',
                'primary_color' => '#3B82F6',
                'secondary_color' => '#9CA3AF',
                'background_color' => '#111827',
                'text_color' => '#F9FAFB',
                'card_background' => '#1F2937',
                'border_color' => '#374151',
                'preview_image' => '/themes/dark-preview.png',
            ],
            'corporate' => [
                'name' => 'Corporate',
                'description' => 'Professional corporate styling',
                'primary_color' => '#1E40AF',
                'secondary_color' => '#64748B',
                'background_color' => '#F8FAFC',
                'text_color' => '#0F172A',
                'card_background' => '#FFFFFF',
                'border_color' => '#CBD5E1',
                'preview_image' => '/themes/corporate-preview.png',
            ],
            'minimal' => [
                'name' => 'Minimal',
                'description' => 'Clean and minimalist design',
                'primary_color' => '#059669',
                'secondary_color' => '#6B7280',
                'background_color' => '#FFFFFF',
                'text_color' => '#111827',
                'card_background' => '#F9FAFB',
                'border_color' => '#F3F4F6',
                'preview_image' => '/themes/minimal-preview.png',
            ],
            'vibrant' => [
                'name' => 'Vibrant',
                'description' => 'Colorful and energetic theme',
                'primary_color' => '#7C3AED',
                'secondary_color' => '#EC4899',
                'background_color' => '#FEFBFF',
                'text_color' => '#1F2937',
                'card_background' => '#FFFFFF',
                'border_color' => '#E5E7EB',
                'preview_image' => '/themes/vibrant-preview.png',
            ],
        ];
    }

    /**
     * Apply dashboard theme
     */
    public function applyTheme(int $organizationId, int $userId, string $theme): bool
    {
        $availableThemes = $this->getAvailableThemes();
        
        if (!isset($availableThemes[$theme])) {
            throw new \InvalidArgumentException("Theme '{$theme}' is not available");
        }

        $layout = $this->getDashboardLayout($organizationId, $userId);
        $layout['theme'] = $theme;

        return $this->updateDashboardLayout($organizationId, $userId, $layout);
    }

    /**
     * Get dashboard preferences
     */
    public function getDashboardPreferences(int $organizationId, int $userId): array
    {
        $cacheKey = "dashboard_preferences_{$organizationId}_{$userId}";

        return Cache::remember($cacheKey, 600, function () use ($organizationId, $userId) {
            $preferences = DashboardPreference::where('organization_id', $organizationId)
                ->where('user_id', $userId)
                ->first();

            if (!$preferences) {
                return $this->getDefaultPreferences();
            }

            return [
                'auto_refresh' => $preferences->auto_refresh ?? true,
                'refresh_interval' => $preferences->refresh_interval ?? 300,
                'show_animations' => $preferences->show_animations ?? true,
                'compact_mode' => $preferences->compact_mode ?? false,
                'show_tooltips' => $preferences->show_tooltips ?? true,
                'currency_format' => $preferences->currency_format ?? 'USD',
                'date_format' => $preferences->date_format ?? 'MM/DD/YYYY',
                'time_format' => $preferences->time_format ?? '12h',
                'timezone' => $preferences->timezone ?? 'UTC',
                'language' => $preferences->language ?? 'en',
                'notifications' => [
                    'email_alerts' => $preferences->email_alerts ?? true,
                    'browser_notifications' => $preferences->browser_notifications ?? false,
                    'sound_alerts' => $preferences->sound_alerts ?? false,
                ],
                'privacy' => [
                    'share_analytics' => $preferences->share_analytics ?? false,
                    'track_usage' => $preferences->track_usage ?? true,
                ],
                'accessibility' => [
                    'high_contrast' => $preferences->high_contrast ?? false,
                    'large_text' => $preferences->large_text ?? false,
                    'reduced_motion' => $preferences->reduced_motion ?? false,
                    'screen_reader_support' => $preferences->screen_reader_support ?? false,
                ],
            ];
        });
    }

    /**
     * Update dashboard preferences
     */
    public function updateDashboardPreferences(int $organizationId, int $userId, array $preferences): bool
    {
        DB::beginTransaction();
        try {
            $existingPreferences = DashboardPreference::where('organization_id', $organizationId)
                ->where('user_id', $userId)
                ->first();

            $preferencesData = [
                'organization_id' => $organizationId,
                'user_id' => $userId,
                'auto_refresh' => $preferences['auto_refresh'] ?? true,
                'refresh_interval' => $preferences['refresh_interval'] ?? 300,
                'show_animations' => $preferences['show_animations'] ?? true,
                'compact_mode' => $preferences['compact_mode'] ?? false,
                'show_tooltips' => $preferences['show_tooltips'] ?? true,
                'currency_format' => $preferences['currency_format'] ?? 'USD',
                'date_format' => $preferences['date_format'] ?? 'MM/DD/YYYY',
                'time_format' => $preferences['time_format'] ?? '12h',
                'timezone' => $preferences['timezone'] ?? 'UTC',
                'language' => $preferences['language'] ?? 'en',
                'email_alerts' => $preferences['notifications']['email_alerts'] ?? true,
                'browser_notifications' => $preferences['notifications']['browser_notifications'] ?? false,
                'sound_alerts' => $preferences['notifications']['sound_alerts'] ?? false,
                'share_analytics' => $preferences['privacy']['share_analytics'] ?? false,
                'track_usage' => $preferences['privacy']['track_usage'] ?? true,
                'high_contrast' => $preferences['accessibility']['high_contrast'] ?? false,
                'large_text' => $preferences['accessibility']['large_text'] ?? false,
                'reduced_motion' => $preferences['accessibility']['reduced_motion'] ?? false,
                'screen_reader_support' => $preferences['accessibility']['screen_reader_support'] ?? false,
            ];

            if ($existingPreferences) {
                $existingPreferences->update($preferencesData);
            } else {
                DashboardPreference::create($preferencesData);
            }

            DB::commit();

            // Clear cache
            $this->clearPreferencesCache($organizationId, $userId);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Reset dashboard to default layout
     */
    public function resetToDefaultLayout(int $organizationId, int $userId): bool
    {
        DB::beginTransaction();
        try {
            // Delete existing layout
            DashboardLayout::where('organization_id', $organizationId)
                ->where('user_id', $userId)
                ->delete();

            // Create default layout
            $defaultLayout = $this->getDefaultLayout();
            $defaultLayout['organization_id'] = $organizationId;
            $defaultLayout['user_id'] = $userId;

            DashboardLayout::create($defaultLayout);

            DB::commit();

            // Clear cache
            $this->clearLayoutCache($organizationId, $userId);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get default layout configuration
     */
    protected function getDefaultLayout(): array
    {
        return [
            'grid_columns' => 12,
            'grid_rows' => 'auto',
            'widgets' => [
                [
                    'widget_id' => 'financial_summary',
                    'x' => 0,
                    'y' => 0,
                    'width' => 6,
                    'height' => 4,
                ],
                [
                    'widget_id' => 'revenue_chart',
                    'x' => 6,
                    'y' => 0,
                    'width' => 6,
                    'height' => 4,
                ],
                [
                    'widget_id' => 'expense_chart',
                    'x' => 0,
                    'y' => 4,
                    'width' => 8,
                    'height' => 4,
                ],
                [
                    'widget_id' => 'recent_activity',
                    'x' => 8,
                    'y' => 4,
                    'width' => 4,
                    'height' => 4,
                ],
            ],
            'theme' => 'default',
            'sidebar_collapsed' => false,
            'header_visible' => true,
            'footer_visible' => true,
            'custom_css' => '',
            'responsive_breakpoints' => $this->getDefaultBreakpoints(),
        ];
    }

    /**
     * Get default responsive breakpoints
     */
    protected function getDefaultBreakpoints(): array
    {
        return [
            'xs' => 0,
            'sm' => 576,
            'md' => 768,
            'lg' => 992,
            'xl' => 1200,
            'xxl' => 1400,
        ];
    }

    /**
     * Get default preferences
     */
    protected function getDefaultPreferences(): array
    {
        return [
            'auto_refresh' => true,
            'refresh_interval' => 300,
            'show_animations' => true,
            'compact_mode' => false,
            'show_tooltips' => true,
            'currency_format' => 'USD',
            'date_format' => 'MM/DD/YYYY',
            'time_format' => '12h',
            'timezone' => 'UTC',
            'language' => 'en',
            'notifications' => [
                'email_alerts' => true,
                'browser_notifications' => false,
                'sound_alerts' => false,
            ],
            'privacy' => [
                'share_analytics' => false,
                'track_usage' => true,
            ],
            'accessibility' => [
                'high_contrast' => false,
                'large_text' => false,
                'reduced_motion' => false,
                'screen_reader_support' => false,
            ],
        ];
    }

    /**
     * Clear layout cache
     */
    protected function clearLayoutCache(int $organizationId, int $userId): void
    {
        Cache::forget("dashboard_layout_{$organizationId}_{$userId}");
        Cache::tags(['dashboard_layouts', "org_{$organizationId}", "user_{$userId}"])->flush();
    }

    /**
     * Clear preferences cache
     */
    protected function clearPreferencesCache(int $organizationId, int $userId): void
    {
        Cache::forget("dashboard_preferences_{$organizationId}_{$userId}");
        Cache::tags(['dashboard_preferences', "org_{$organizationId}", "user_{$userId}"])->flush();
    }
}

