<?php

namespace App\Features\Accounting\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ForecastLineItem extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'financial_forecast_id',
        'account_id',
        'period_start',
        'period_end',
        'forecasted_amount',
        'actual_amount',
        'growth_rate',
        'seasonality_factor',
        'confidence_level',
        'methodology',
        'assumptions',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'forecasted_amount' => 'decimal:2',
        'actual_amount' => 'decimal:2',
        'growth_rate' => 'decimal:4',
        'seasonality_factor' => 'decimal:4',
        'confidence_level' => 'decimal:2',
        'assumptions' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the financial forecast that owns the line item
     */
    public function financialForecast(): BelongsTo
    {
        return $this->belongsTo(FinancialForecast::class);
    }

    /**
     * Get the account associated with the line item
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Scope for filtering by period
     */
    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('period_start', [$startDate, $endDate])
              ->orWhereBetween('period_end', [$startDate, $endDate])
              ->orWhere(function ($q2) use ($startDate, $endDate) {
                  $q2->where('period_start', '<=', $startDate)
                     ->where('period_end', '>=', $endDate);
              });
        });
    }

    /**
     * Scope for filtering by account type
     */
    public function scopeByAccountType($query, $accountType)
    {
        return $query->whereHas('account', function ($q) use ($accountType) {
            $q->where('type', $accountType);
        });
    }

    /**
     * Calculate variance between forecasted and actual amounts
     */
    public function calculateVariance(): array
    {
        $variance = $this->actual_amount - $this->forecasted_amount;
        $variancePercent = $this->forecasted_amount > 0 ? ($variance / $this->forecasted_amount) * 100 : 0;
        $accuracy = $this->forecasted_amount > 0 ? (1 - abs($variance) / $this->forecasted_amount) * 100 : 0;

        return [
            'forecasted' => $this->forecasted_amount,
            'actual' => $this->actual_amount,
            'variance' => $variance,
            'variance_percent' => $variancePercent,
            'accuracy' => max(0, $accuracy),
            'status' => $variance > 0 ? 'over_forecast' : ($variance < 0 ? 'under_forecast' : 'on_forecast'),
        ];
    }

    /**
     * Apply growth rate to calculate forecasted amount
     */
    public function applyGrowthRate(float $baseAmount): float
    {
        return $baseAmount * (1 + ($this->growth_rate / 100));
    }

    /**
     * Apply seasonality factor to forecasted amount
     */
    public function applySeasonalityFactor(float $baseAmount): float
    {
        return $baseAmount * $this->seasonality_factor;
    }

    /**
     * Calculate forecasted amount with all factors
     */
    public function calculateForecastedAmount(float $baseAmount): float
    {
        $amount = $baseAmount;
        
        // Apply growth rate
        if ($this->growth_rate) {
            $amount = $this->applyGrowthRate($amount);
        }
        
        // Apply seasonality factor
        if ($this->seasonality_factor && $this->seasonality_factor != 1.0) {
            $amount = $this->applySeasonalityFactor($amount);
        }
        
        return $amount;
    }

    /**
     * Update actual amount and calculate variance
     */
    public function updateActualAmount(float $amount): array
    {
        $this->actual_amount = $amount;
        $this->save();
        
        return $this->calculateVariance();
    }

    /**
     * Get forecast accuracy percentage
     */
    public function getAccuracyPercentage(): float
    {
        if ($this->forecasted_amount == 0) {
            return 0;
        }
        
        $variance = abs($this->actual_amount - $this->forecasted_amount);
        return max(0, (1 - ($variance / $this->forecasted_amount)) * 100);
    }

    /**
     * Check if forecast is within acceptable variance threshold
     */
    public function isWithinVarianceThreshold(float $thresholdPercent = 10.0): bool
    {
        $variance = $this->calculateVariance();
        return abs($variance['variance_percent']) <= $thresholdPercent;
    }

    /**
     * Get period duration in days
     */
    public function getPeriodDurationAttribute(): int
    {
        return $this->period_start->diffInDays($this->period_end) + 1;
    }

    /**
     * Get daily average forecasted amount
     */
    public function getDailyAverageAttribute(): float
    {
        $duration = $this->period_duration;
        return $duration > 0 ? $this->forecasted_amount / $duration : 0;
    }

    /**
     * Get forecast confidence level description
     */
    public function getConfidenceLevelDescriptionAttribute(): string
    {
        if ($this->confidence_level >= 90) {
            return 'Very High Confidence';
        } elseif ($this->confidence_level >= 80) {
            return 'High Confidence';
        } elseif ($this->confidence_level >= 70) {
            return 'Medium Confidence';
        } elseif ($this->confidence_level >= 60) {
            return 'Low Confidence';
        } else {
            return 'Very Low Confidence';
        }
    }

    /**
     * Get variance status color for UI
     */
    public function getVarianceStatusColorAttribute(): string
    {
        $variance = $this->calculateVariance();
        
        return match ($variance['status']) {
            'over_forecast' => 'green',
            'under_forecast' => 'red',
            'on_forecast' => 'blue',
            default => 'gray',
        };
    }

    /**
     * Generate forecast scenarios for this line item
     */
    public function generateScenarios(): array
    {
        $base = $this->forecasted_amount;
        
        return [
            'optimistic' => [
                'amount' => $base * 1.15,
                'description' => '15% above forecast',
                'probability' => 25,
            ],
            'base' => [
                'amount' => $base,
                'description' => 'Base forecast',
                'probability' => 50,
            ],
            'pessimistic' => [
                'amount' => $base * 0.85,
                'description' => '15% below forecast',
                'probability' => 25,
            ],
        ];
    }

    /**
     * Get historical data for comparison
     */
    public function getHistoricalComparison(int $years = 3): array
    {
        $historicalData = [];
        $currentYear = $this->period_start->year;
        
        for ($i = 1; $i <= $years; $i++) {
            $year = $currentYear - $i;
            $startDate = $this->period_start->copy()->year($year);
            $endDate = $this->period_end->copy()->year($year);
            
            $amount = JournalEntry::where('account_id', $this->account_id)
                                 ->whereHas('transaction', function ($query) use ($startDate, $endDate) {
                                     $query->whereBetween('transaction_date', [$startDate, $endDate])
                                          ->where('status', Transaction::STATUS_POSTED);
                                 })
                                 ->sum('amount');
            
            $historicalData[] = [
                'year' => $year,
                'amount' => $amount,
                'period_start' => $startDate,
                'period_end' => $endDate,
            ];
        }
        
        return $historicalData;
    }
}
