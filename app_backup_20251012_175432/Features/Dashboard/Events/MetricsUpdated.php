<?php

namespace App\Features\Dashboard\Events;

use App\Shared\Events\BroadcastableDomainEvent;

class MetricsUpdated extends BroadcastableDomainEvent
{
    public function __construct(
        public readonly array $metrics,
        public readonly int $organizationId,
        public readonly string $metricType = 'general'
    ) {
        parent::__construct(
            aggregateId: "metrics-{$organizationId}-{$metricType}",
            aggregateType: 'dashboard_metrics',
            eventType: 'metrics.updated',
            payload: [
                'metrics' => $metrics,
                'metric_type' => $metricType,
                'organization_id' => $organizationId,
                'updated_at' => now(),
            ],
            metadata: [
                'tenant_id' => $organizationId,
                'user_id' => auth()->id(),
            ]
        );
    }

    /**
     * Get the channels the event should broadcast on.
     */
    protected function getChannelNames(): array
    {
        return [
            'dashboard',
            "organization.{$this->organizationId}",
            "dashboard.{$this->organizationId}",
        ];
    }

    /**
     * Get additional data to broadcast with the event.
     */
    protected function getBroadcastData(): array
    {
        return [
            'metrics' => $this->formatMetrics(),
            'metric_type' => $this->metricType,
            'organization_id' => $this->organizationId,
            'timestamp' => now()->toISOString(),
            'summary' => $this->generateSummary(),
        ];
    }

    /**
     * Get private channel names.
     */
    protected function getPrivateChannels(): array
    {
        return [
            'dashboard',
            "organization.{$this->organizationId}",
            "dashboard.{$this->organizationId}",
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'dashboard:metrics_updated';
    }

    /**
     * Format metrics for broadcasting.
     */
    private function formatMetrics(): array
    {
        $formattedMetrics = [];

        foreach ($this->metrics as $key => $metric) {
            if (is_array($metric)) {
                $formattedMetrics[$key] = $metric;
            } else {
                $formattedMetrics[$key] = [
                    'value' => $metric,
                    'formatted_value' => $this->formatValue($key, $metric),
                    'updated_at' => now()->toISOString(),
                ];
            }
        }

        return $formattedMetrics;
    }

    /**
     * Format individual metric values.
     */
    private function formatValue(string $key, $value): string
    {
        // Format currency values
        if (str_contains($key, 'revenue') || str_contains($key, 'expense') || str_contains($key, 'income') || str_contains($key, 'balance')) {
            return '$'.number_format($value, 2);
        }

        // Format percentage values
        if (str_contains($key, 'percent') || str_contains($key, 'rate')) {
            return number_format($value, 2).'%';
        }

        // Format count values
        if (str_contains($key, 'count') || str_contains($key, 'total') || is_int($value)) {
            return number_format($value);
        }

        return (string) $value;
    }

    /**
     * Generate summary of metric changes.
     */
    private function generateSummary(): array
    {
        $summary = [
            'total_metrics' => count($this->metrics),
            'metric_type' => $this->metricType,
            'organization_id' => $this->organizationId,
            'updated_at' => now()->toISOString(),
        ];

        // Add specific summaries based on metric type
        switch ($this->metricType) {
            case 'accounting':
                $summary['financial_summary'] = $this->generateFinancialSummary();
                break;
            case 'inventory':
                $summary['inventory_summary'] = $this->generateInventorySummary();
                break;
            case 'general':
            default:
                $summary['general_summary'] = $this->generateGeneralSummary();
                break;
        }

        return $summary;
    }

    /**
     * Generate financial metrics summary.
     */
    private function generateFinancialSummary(): array
    {
        $summary = [];

        if (isset($this->metrics['total_revenue'])) {
            $summary['revenue'] = $this->metrics['total_revenue'];
        }

        if (isset($this->metrics['total_expenses'])) {
            $summary['expenses'] = $this->metrics['total_expenses'];
        }

        if (isset($this->metrics['net_income'])) {
            $summary['net_income'] = $this->metrics['net_income'];
        }

        if (isset($this->metrics['cash_flow'])) {
            $summary['cash_flow'] = $this->metrics['cash_flow'];
        }

        return $summary;
    }

    /**
     * Generate inventory metrics summary.
     */
    private function generateInventorySummary(): array
    {
        $summary = [];

        if (isset($this->metrics['total_products'])) {
            $summary['total_products'] = $this->metrics['total_products'];
        }

        if (isset($this->metrics['low_stock_items'])) {
            $summary['low_stock_items'] = $this->metrics['low_stock_items'];
        }

        if (isset($this->metrics['out_of_stock_items'])) {
            $summary['out_of_stock_items'] = $this->metrics['out_of_stock_items'];
        }

        if (isset($this->metrics['total_value'])) {
            $summary['total_value'] = $this->metrics['total_value'];
        }

        return $summary;
    }

    /**
     * Generate general metrics summary.
     */
    private function generateGeneralSummary(): array
    {
        return [
            'metrics_count' => count($this->metrics),
            'has_financial_data' => $this->hasFinancialMetrics(),
            'has_inventory_data' => $this->hasInventoryMetrics(),
        ];
    }

    /**
     * Check if metrics contain financial data.
     */
    private function hasFinancialMetrics(): bool
    {
        $financialKeys = ['revenue', 'expense', 'income', 'balance', 'cash'];

        foreach ($this->metrics as $key => $value) {
            foreach ($financialKeys as $financialKey) {
                if (str_contains(strtolower($key), $financialKey)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if metrics contain inventory data.
     */
    private function hasInventoryMetrics(): bool
    {
        $inventoryKeys = ['product', 'stock', 'inventory', 'item'];

        foreach ($this->metrics as $key => $value) {
            foreach ($inventoryKeys as $inventoryKey) {
                if (str_contains(strtolower($key), $inventoryKey)) {
                    return true;
                }
            }
        }

        return false;
    }
}
