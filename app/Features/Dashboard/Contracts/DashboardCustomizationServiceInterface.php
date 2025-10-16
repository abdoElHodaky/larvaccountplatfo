<?php

namespace App\Features\Dashboard\Contracts;

interface DashboardCustomizationServiceInterface
{
    /**
     * Get dashboard layout configuration
     */
    public function getDashboardLayout(int $organizationId, int $userId): array;

    /**
     * Update dashboard layout
     */
    public function updateDashboardLayout(int $organizationId, int $userId, array $layout): bool;

    /**
     * Get available dashboard themes
     */
    public function getAvailableThemes(): array;

    /**
     * Apply dashboard theme
     */
    public function applyTheme(int $organizationId, int $userId, string $theme): bool;

    /**
     * Get dashboard preferences
     */
    public function getDashboardPreferences(int $organizationId, int $userId): array;

    /**
     * Update dashboard preferences
     */
    public function updateDashboardPreferences(int $organizationId, int $userId, array $preferences): bool;

    /**
     * Reset dashboard to default layout
     */
    public function resetToDefaultLayout(int $organizationId, int $userId): bool;
}

