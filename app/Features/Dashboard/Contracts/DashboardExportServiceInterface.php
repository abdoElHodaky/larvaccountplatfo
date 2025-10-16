<?php

namespace App\Features\Dashboard\Contracts;

interface DashboardExportServiceInterface
{
    /**
     * Export dashboard data to PDF
     */
    public function exportToPdf(int $organizationId, array $options = []): string;

    /**
     * Export dashboard data to Excel
     */
    public function exportToExcel(int $organizationId, array $options = []): string;

    /**
     * Export dashboard data to CSV
     */
    public function exportToCsv(int $organizationId, array $options = []): string;

    /**
     * Generate dashboard report
     */
    public function generateReport(int $organizationId, string $reportType, array $options = []): array;

    /**
     * Schedule dashboard report
     */
    public function scheduleReport(int $organizationId, string $reportType, array $schedule): bool;

    /**
     * Get available export formats
     */
    public function getAvailableExportFormats(): array;

    /**
     * Get report templates
     */
    public function getReportTemplates(): array;
}

