<?php

namespace App\Features\Dashboard\Contracts;

interface DashboardAnalyticsServiceInterface
{
    /**
     * Get comprehensive dashboard overview
     */
    public function getDashboardOverview(int $organizationId): array;

    /**
     * Get financial summary data
     */
    public function getFinancialSummary(int $organizationId): array;

    /**
     * Get performance metrics
     */
    public function getPerformanceMetrics(int $organizationId): array;

    /**
     * Get budget overview
     */
    public function getBudgetOverview(int $organizationId): array;

    /**
     * Get forecast insights
     */
    public function getForecastInsights(int $organizationId): array;

    /**
     * Get tax summary
     */
    public function getTaxSummary(int $organizationId): array;

    /**
     * Get trend analysis
     */
    public function getTrendAnalysis(int $organizationId, array $options = []): array;
}

