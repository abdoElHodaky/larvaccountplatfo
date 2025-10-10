<?php

namespace App\Features\Accounting\Services;

use App\Features\Accounting\Models\FinancialForecast;
use App\Features\Accounting\Models\ForecastLineItem;
use App\Features\Accounting\Models\Account;
use App\Features\Accounting\Models\Transaction;
use App\Features\Accounting\Models\JournalEntry;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class ForecastingService
{
    /**
     * Create a new financial forecast
     */
    public function createForecast(int $organizationId, array $data): FinancialForecast
    {
        return DB::transaction(function () use ($organizationId, $data) {
            $forecast = FinancialForecast::create([
                'organization_id' => $organizationId,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'forecast_type' => $data['forecast_type'],
                'period_type' => $data['period_type'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'base_year' => $data['base_year'] ?? now()->year - 1,
                'methodology' => $data['methodology'],
                'confidence_level' => $data['confidence_level'] ?? 75.0,
                'status' => FinancialForecast::STATUS_DRAFT,
                'created_by' => $data['created_by'],
                'assumptions' => $data['assumptions'] ?? [],
                'metadata' => $data['metadata'] ?? [],
            ]);

            // Create line items if provided
            if (!empty($data['line_items'])) {
                $this->createForecastLineItems($forecast, $data['line_items']);
            }

            $this->clearForecastCache($organizationId);
            
            return $forecast->load('lineItems.account');
        });
    }

    /**
     * Update an existing forecast
     */
    public function updateForecast(FinancialForecast $forecast, array $data): FinancialForecast
    {
        return DB::transaction(function () use ($forecast, $data) {
            $forecast->update([
                'name' => $data['name'] ?? $forecast->name,
                'description' => $data['description'] ?? $forecast->description,
                'forecast_type' => $data['forecast_type'] ?? $forecast->forecast_type,
                'period_type' => $data['period_type'] ?? $forecast->period_type,
                'start_date' => $data['start_date'] ?? $forecast->start_date,
                'end_date' => $data['end_date'] ?? $forecast->end_date,
                'base_year' => $data['base_year'] ?? $forecast->base_year,
                'methodology' => $data['methodology'] ?? $forecast->methodology,
                'confidence_level' => $data['confidence_level'] ?? $forecast->confidence_level,
                'assumptions' => array_merge($forecast->assumptions ?? [], $data['assumptions'] ?? []),
                'metadata' => array_merge($forecast->metadata ?? [], $data['metadata'] ?? []),
            ]);

            // Update line items if provided
            if (isset($data['line_items'])) {
                $this->updateForecastLineItems($forecast, $data['line_items']);
            }

            $this->clearForecastCache($forecast->organization_id);
            
            return $forecast->load('lineItems.account');
        });
    }

    /**
     * Generate forecast using historical trend analysis
     */
    public function generateHistoricalTrendForecast(
        int $organizationId,
        array $accountIds,
        Carbon $startDate,
        Carbon $endDate,
        int $historicalYears = 3
    ): array {
        $forecastData = [];
        
        foreach ($accountIds as $accountId) {
            $account = Account::find($accountId);
            if (!$account || $account->organization_id !== $organizationId) {
                continue;
            }

            // Get historical data
            $historicalData = $this->getHistoricalData($organizationId, $accountId, $historicalYears);
            
            // Calculate trend
            $trend = $this->calculateTrend($historicalData);
            
            // Generate forecast periods
            $periods = $this->generateForecastPeriods($startDate, $endDate, FinancialForecast::PERIOD_MONTHLY);
            
            foreach ($periods as $period) {
                $baseAmount = $this->getBaseAmountForPeriod($historicalData, $period);
                $forecastedAmount = $this->applyTrend($baseAmount, $trend, $period);
                
                $forecastData[] = [
                    'account_id' => $accountId,
                    'account_name' => $account->name,
                    'period_start' => $period['start'],
                    'period_end' => $period['end'],
                    'forecasted_amount' => $forecastedAmount,
                    'growth_rate' => $trend['growth_rate'],
                    'confidence_level' => $trend['confidence'],
                    'methodology' => FinancialForecast::METHOD_HISTORICAL_TREND,
                    'assumptions' => [
                        'historical_years' => $historicalYears,
                        'trend_direction' => $trend['direction'],
                        'seasonal_adjustment' => $trend['seasonal_factor'] ?? 1.0,
                    ],
                ];
            }
        }

        return $forecastData;
    }

    /**
     * Generate forecast using seasonal adjustment
     */
    public function generateSeasonalForecast(
        int $organizationId,
        array $accountIds,
        Carbon $startDate,
        Carbon $endDate,
        int $historicalYears = 3
    ): array {
        $forecastData = [];
        
        foreach ($accountIds as $accountId) {
            $account = Account::find($accountId);
            if (!$account || $account->organization_id !== $organizationId) {
                continue;
            }

            // Get monthly historical data for seasonality analysis
            $monthlyData = $this->getMonthlyHistoricalData($organizationId, $accountId, $historicalYears);
            
            // Calculate seasonal factors
            $seasonalFactors = $this->calculateSeasonalFactors($monthlyData);
            
            // Generate forecast periods
            $periods = $this->generateForecastPeriods($startDate, $endDate, FinancialForecast::PERIOD_MONTHLY);
            
            foreach ($periods as $period) {
                $month = $period['start']->month;
                $seasonalFactor = $seasonalFactors[$month] ?? 1.0;
                
                $baseAmount = $this->getAverageAmountForMonth($monthlyData, $month);
                $forecastedAmount = $baseAmount * $seasonalFactor;
                
                $forecastData[] = [
                    'account_id' => $accountId,
                    'account_name' => $account->name,
                    'period_start' => $period['start'],
                    'period_end' => $period['end'],
                    'forecasted_amount' => $forecastedAmount,
                    'seasonality_factor' => $seasonalFactor,
                    'confidence_level' => $this->calculateSeasonalConfidence($monthlyData, $month),
                    'methodology' => FinancialForecast::METHOD_SEASONAL_ADJUSTMENT,
                    'assumptions' => [
                        'historical_years' => $historicalYears,
                        'seasonal_pattern' => 'monthly',
                        'base_amount' => $baseAmount,
                    ],
                ];
            }
        }

        return $forecastData;
    }

    /**
     * Generate regression-based forecast
     */
    public function generateRegressionForecast(
        int $organizationId,
        array $accountIds,
        Carbon $startDate,
        Carbon $endDate,
        array $independentVariables = []
    ): array {
        $forecastData = [];
        
        foreach ($accountIds as $accountId) {
            $account = Account::find($accountId);
            if (!$account || $account->organization_id !== $organizationId) {
                continue;
            }

            // Get historical data with time series
            $historicalData = $this->getTimeSeriesData($organizationId, $accountId, 36); // 3 years monthly
            
            // Perform linear regression
            $regression = $this->performLinearRegression($historicalData);
            
            // Generate forecast periods
            $periods = $this->generateForecastPeriods($startDate, $endDate, FinancialForecast::PERIOD_MONTHLY);
            
            foreach ($periods as $index => $period) {
                $timeIndex = count($historicalData) + $index + 1;
                $forecastedAmount = $regression['intercept'] + ($regression['slope'] * $timeIndex);
                
                $forecastData[] = [
                    'account_id' => $accountId,
                    'account_name' => $account->name,
                    'period_start' => $period['start'],
                    'period_end' => $period['end'],
                    'forecasted_amount' => max(0, $forecastedAmount), // Ensure non-negative
                    'growth_rate' => $regression['slope'],
                    'confidence_level' => $regression['r_squared'] * 100,
                    'methodology' => FinancialForecast::METHOD_REGRESSION_ANALYSIS,
                    'assumptions' => [
                        'regression_equation' => "y = {$regression['intercept']} + {$regression['slope']}x",
                        'r_squared' => $regression['r_squared'],
                        'data_points' => count($historicalData),
                    ],
                ];
            }
        }

        return $forecastData;
    }

    /**
     * Create forecast line items
     */
    public function createForecastLineItems(FinancialForecast $forecast, array $lineItems): Collection
    {
        $createdItems = collect();

        foreach ($lineItems as $itemData) {
            $lineItem = ForecastLineItem::create([
                'organization_id' => $forecast->organization_id,
                'financial_forecast_id' => $forecast->id,
                'account_id' => $itemData['account_id'],
                'period_start' => $itemData['period_start'],
                'period_end' => $itemData['period_end'],
                'forecasted_amount' => $itemData['forecasted_amount'],
                'growth_rate' => $itemData['growth_rate'] ?? null,
                'seasonality_factor' => $itemData['seasonality_factor'] ?? null,
                'confidence_level' => $itemData['confidence_level'] ?? $forecast->confidence_level,
                'methodology' => $itemData['methodology'] ?? $forecast->methodology,
                'assumptions' => $itemData['assumptions'] ?? [],
                'notes' => $itemData['notes'] ?? null,
                'metadata' => $itemData['metadata'] ?? [],
            ]);

            $createdItems->push($lineItem);
        }

        return $createdItems;
    }

    /**
     * Update forecast line items
     */
    public function updateForecastLineItems(FinancialForecast $forecast, array $lineItems): Collection
    {
        $updatedItems = collect();

        // Delete existing line items not in the update
        $providedIds = collect($lineItems)->pluck('id')->filter();
        $forecast->lineItems()->whereNotIn('id', $providedIds)->delete();

        foreach ($lineItems as $itemData) {
            if (!empty($itemData['id'])) {
                // Update existing line item
                $lineItem = ForecastLineItem::find($itemData['id']);
                if ($lineItem && $lineItem->financial_forecast_id === $forecast->id) {
                    $lineItem->update([
                        'account_id' => $itemData['account_id'] ?? $lineItem->account_id,
                        'period_start' => $itemData['period_start'] ?? $lineItem->period_start,
                        'period_end' => $itemData['period_end'] ?? $lineItem->period_end,
                        'forecasted_amount' => $itemData['forecasted_amount'] ?? $lineItem->forecasted_amount,
                        'growth_rate' => $itemData['growth_rate'] ?? $lineItem->growth_rate,
                        'seasonality_factor' => $itemData['seasonality_factor'] ?? $lineItem->seasonality_factor,
                        'confidence_level' => $itemData['confidence_level'] ?? $lineItem->confidence_level,
                        'methodology' => $itemData['methodology'] ?? $lineItem->methodology,
                        'assumptions' => array_merge($lineItem->assumptions ?? [], $itemData['assumptions'] ?? []),
                        'notes' => $itemData['notes'] ?? $lineItem->notes,
                        'metadata' => array_merge($lineItem->metadata ?? [], $itemData['metadata'] ?? []),
                    ]);
                    $updatedItems->push($lineItem);
                }
            } else {
                // Create new line item
                $newItems = $this->createForecastLineItems($forecast, [$itemData]);
                $updatedItems = $updatedItems->merge($newItems);
            }
        }

        return $updatedItems;
    }

    /**
     * Get forecast accuracy analysis
     */
    public function getForecastAccuracy(FinancialForecast $forecast): array
    {
        return $forecast->calculateAccuracy();
    }

    /**
     * Get forecast dashboard
     */
    public function getForecastDashboard(int $organizationId): array
    {
        $cacheKey = "forecast_dashboard_{$organizationId}";
        
        return Cache::remember($cacheKey, 600, function () use ($organizationId) {
            $activeForecasts = FinancialForecast::where('organization_id', $organizationId)
                                              ->active()
                                              ->with('lineItems')
                                              ->get();

            $forecastSummary = $activeForecasts->map(function ($forecast) {
                $summary = $forecast->getSummary();
                $accuracy = $forecast->calculateAccuracy();
                
                return [
                    'id' => $forecast->id,
                    'name' => $forecast->name,
                    'type' => $forecast->forecast_type,
                    'methodology' => $forecast->methodology,
                    'period' => $forecast->start_date->format('M Y') . ' - ' . $forecast->end_date->format('M Y'),
                    'total_amount' => $summary['total_amount'],
                    'confidence_level' => $forecast->confidence_level,
                    'accuracy' => $accuracy['overall_accuracy'] ?? null,
                    'line_item_count' => $summary['line_item_count'],
                ];
            });

            return [
                'summary' => [
                    'total_forecasts' => $activeForecasts->count(),
                    'total_forecasted_amount' => $forecastSummary->sum('total_amount'),
                    'average_confidence' => $forecastSummary->avg('confidence_level'),
                    'average_accuracy' => $forecastSummary->whereNotNull('accuracy')->avg('accuracy'),
                ],
                'forecasts' => $forecastSummary,
                'by_type' => $activeForecasts->groupBy('forecast_type')->map(function ($forecasts, $type) {
                    return [
                        'count' => $forecasts->count(),
                        'total_amount' => $forecasts->sum(function ($f) { return $f->getSummary()['total_amount']; }),
                    ];
                }),
            ];
        });
    }

    /**
     * Get historical data for an account
     */
    private function getHistoricalData(int $organizationId, int $accountId, int $years): array
    {
        $data = [];
        $endDate = now();
        
        for ($i = 1; $i <= $years; $i++) {
            $yearStart = $endDate->copy()->subYears($i)->startOfYear();
            $yearEnd = $endDate->copy()->subYears($i)->endOfYear();
            
            $amount = JournalEntry::where('account_id', $accountId)
                                 ->whereHas('transaction', function ($query) use ($organizationId, $yearStart, $yearEnd) {
                                     $query->where('organization_id', $organizationId)
                                          ->whereBetween('transaction_date', [$yearStart, $yearEnd])
                                          ->where('status', Transaction::STATUS_POSTED);
                                 })
                                 ->sum('amount');
            
            $data[] = [
                'year' => $yearStart->year,
                'amount' => $amount,
                'start_date' => $yearStart,
                'end_date' => $yearEnd,
            ];
        }
        
        return array_reverse($data); // Oldest first
    }

    /**
     * Get monthly historical data
     */
    private function getMonthlyHistoricalData(int $organizationId, int $accountId, int $years): array
    {
        $data = [];
        $endDate = now();
        
        for ($i = 1; $i <= $years * 12; $i++) {
            $monthStart = $endDate->copy()->subMonths($i)->startOfMonth();
            $monthEnd = $endDate->copy()->subMonths($i)->endOfMonth();
            
            $amount = JournalEntry::where('account_id', $accountId)
                                 ->whereHas('transaction', function ($query) use ($organizationId, $monthStart, $monthEnd) {
                                     $query->where('organization_id', $organizationId)
                                          ->whereBetween('transaction_date', [$monthStart, $monthEnd])
                                          ->where('status', Transaction::STATUS_POSTED);
                                 })
                                 ->sum('amount');
            
            $data[] = [
                'year' => $monthStart->year,
                'month' => $monthStart->month,
                'amount' => $amount,
                'start_date' => $monthStart,
                'end_date' => $monthEnd,
            ];
        }
        
        return array_reverse($data); // Oldest first
    }

    /**
     * Calculate trend from historical data
     */
    private function calculateTrend(array $historicalData): array
    {
        if (count($historicalData) < 2) {
            return ['growth_rate' => 0, 'direction' => 'stable', 'confidence' => 50];
        }

        $amounts = array_column($historicalData, 'amount');
        $totalGrowth = 0;
        $validPeriods = 0;

        for ($i = 1; $i < count($amounts); $i++) {
            if ($amounts[$i - 1] > 0) {
                $growth = (($amounts[$i] - $amounts[$i - 1]) / $amounts[$i - 1]) * 100;
                $totalGrowth += $growth;
                $validPeriods++;
            }
        }

        $averageGrowth = $validPeriods > 0 ? $totalGrowth / $validPeriods : 0;
        
        return [
            'growth_rate' => $averageGrowth,
            'direction' => $averageGrowth > 1 ? 'increasing' : ($averageGrowth < -1 ? 'decreasing' : 'stable'),
            'confidence' => min(90, max(50, 70 + ($validPeriods * 5))), // Higher confidence with more data points
        ];
    }

    /**
     * Calculate seasonal factors
     */
    private function calculateSeasonalFactors(array $monthlyData): array
    {
        $monthlyTotals = array_fill(1, 12, 0);
        $monthlyCounts = array_fill(1, 12, 0);
        
        foreach ($monthlyData as $data) {
            $monthlyTotals[$data['month']] += $data['amount'];
            $monthlyCounts[$data['month']]++;
        }
        
        $monthlyAverages = [];
        $overallAverage = 0;
        $totalMonths = 0;
        
        for ($month = 1; $month <= 12; $month++) {
            if ($monthlyCounts[$month] > 0) {
                $monthlyAverages[$month] = $monthlyTotals[$month] / $monthlyCounts[$month];
                $overallAverage += $monthlyAverages[$month];
                $totalMonths++;
            } else {
                $monthlyAverages[$month] = 0;
            }
        }
        
        $overallAverage = $totalMonths > 0 ? $overallAverage / $totalMonths : 0;
        
        $seasonalFactors = [];
        for ($month = 1; $month <= 12; $month++) {
            $seasonalFactors[$month] = $overallAverage > 0 ? $monthlyAverages[$month] / $overallAverage : 1.0;
        }
        
        return $seasonalFactors;
    }

    /**
     * Generate forecast periods
     */
    private function generateForecastPeriods(Carbon $startDate, Carbon $endDate, string $periodType): array
    {
        $periods = [];
        $current = $startDate->copy();
        
        while ($current->lte($endDate)) {
            $periodEnd = match ($periodType) {
                FinancialForecast::PERIOD_MONTHLY => $current->copy()->endOfMonth(),
                FinancialForecast::PERIOD_QUARTERLY => $current->copy()->endOfQuarter(),
                FinancialForecast::PERIOD_YEARLY => $current->copy()->endOfYear(),
                default => $current->copy()->endOfMonth(),
            };
            
            if ($periodEnd->gt($endDate)) {
                $periodEnd = $endDate->copy();
            }
            
            $periods[] = [
                'start' => $current->copy(),
                'end' => $periodEnd->copy(),
            ];
            
            $current = match ($periodType) {
                FinancialForecast::PERIOD_MONTHLY => $current->addMonth()->startOfMonth(),
                FinancialForecast::PERIOD_QUARTERLY => $current->addQuarter()->startOfQuarter(),
                FinancialForecast::PERIOD_YEARLY => $current->addYear()->startOfYear(),
                default => $current->addMonth()->startOfMonth(),
            };
        }
        
        return $periods;
    }

    /**
     * Perform linear regression
     */
    private function performLinearRegression(array $data): array
    {
        $n = count($data);
        if ($n < 2) {
            return ['slope' => 0, 'intercept' => 0, 'r_squared' => 0];
        }

        $sumX = 0;
        $sumY = 0;
        $sumXY = 0;
        $sumXX = 0;
        $sumYY = 0;

        foreach ($data as $i => $point) {
            $x = $i + 1; // Time index
            $y = $point['amount'];
            
            $sumX += $x;
            $sumY += $y;
            $sumXY += $x * $y;
            $sumXX += $x * $x;
            $sumYY += $y * $y;
        }

        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumXX - $sumX * $sumX);
        $intercept = ($sumY - $slope * $sumX) / $n;
        
        // Calculate R-squared
        $meanY = $sumY / $n;
        $ssRes = 0;
        $ssTot = 0;
        
        foreach ($data as $i => $point) {
            $x = $i + 1;
            $y = $point['amount'];
            $predicted = $intercept + $slope * $x;
            
            $ssRes += pow($y - $predicted, 2);
            $ssTot += pow($y - $meanY, 2);
        }
        
        $rSquared = $ssTot > 0 ? 1 - ($ssRes / $ssTot) : 0;

        return [
            'slope' => $slope,
            'intercept' => $intercept,
            'r_squared' => max(0, $rSquared),
        ];
    }

    /**
     * Clear forecast cache
     */
    private function clearForecastCache(int $organizationId): void
    {
        Cache::forget("forecast_dashboard_{$organizationId}");
        Cache::tags(['forecasts', "org_{$organizationId}"])->flush();
    }
}
