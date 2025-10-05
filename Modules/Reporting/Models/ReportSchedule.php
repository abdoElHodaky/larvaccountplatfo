<?php

namespace Modules\Reporting\Models;

use Modules\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportSchedule extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'financial_report_id',
        'name',
        'description',
        'frequency',
        'frequency_config',
        'recipients',
        'export_formats',
        'is_active',
        'next_run_at',
        'last_run_at',
        'created_by',
        'settings',
    ];

    protected $casts = [
        'frequency_config' => 'array',
        'recipients' => 'array',
        'export_formats' => 'array',
        'is_active' => 'boolean',
        'next_run_at' => 'datetime',
        'last_run_at' => 'datetime',
        'settings' => 'array',
    ];

    protected $dates = [
        'next_run_at',
        'last_run_at',
        'deleted_at',
    ];

    /**
     * Frequency types
     */
    const FREQUENCY_DAILY = 'daily';
    const FREQUENCY_WEEKLY = 'weekly';
    const FREQUENCY_MONTHLY = 'monthly';
    const FREQUENCY_QUARTERLY = 'quarterly';
    const FREQUENCY_YEARLY = 'yearly';

    /**
     * Get the organization this schedule belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\Organization::class);
    }

    /**
     * Get the financial report template
     */
    public function financialReport(): BelongsTo
    {
        return $this->belongsTo(FinancialReport::class);
    }

    /**
     * Get the user who created this schedule
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\User::class, 'created_by');
    }

    /**
     * Get schedule executions
     */
    public function executions(): HasMany
    {
        return $this->hasMany(ReportExecution::class);
    }

    /**
     * Scope for active schedules
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for schedules due to run
     */
    public function scopeDueToRun($query)
    {
        return $query->where('is_active', true)
                    ->where('next_run_at', '<=', now());
    }

    /**
     * Scope by frequency
     */
    public function scopeByFrequency($query, string $frequency)
    {
        return $query->where('frequency', $frequency);
    }

    /**
     * Check if schedule is active
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Check if schedule is due to run
     */
    public function isDueToRun(): bool
    {
        return $this->is_active && $this->next_run_at <= now();
    }

    /**
     * Calculate next run time based on frequency
     */
    public function calculateNextRunTime(): \DateTime
    {
        $lastRun = $this->last_run_at ?: now();
        
        switch ($this->frequency) {
            case self::FREQUENCY_DAILY:
                return $lastRun->copy()->addDay();
                
            case self::FREQUENCY_WEEKLY:
                $dayOfWeek = $this->frequency_config['day_of_week'] ?? 1; // Monday
                return $lastRun->copy()->addWeek()->startOfWeek()->addDays($dayOfWeek - 1);
                
            case self::FREQUENCY_MONTHLY:
                $dayOfMonth = $this->frequency_config['day_of_month'] ?? 1;
                return $lastRun->copy()->addMonth()->startOfMonth()->addDays($dayOfMonth - 1);
                
            case self::FREQUENCY_QUARTERLY:
                $monthOfQuarter = $this->frequency_config['month_of_quarter'] ?? 1;
                $dayOfMonth = $this->frequency_config['day_of_month'] ?? 1;
                return $lastRun->copy()->addQuarter()
                    ->startOfQuarter()
                    ->addMonths($monthOfQuarter - 1)
                    ->startOfMonth()
                    ->addDays($dayOfMonth - 1);
                
            case self::FREQUENCY_YEARLY:
                $monthOfYear = $this->frequency_config['month_of_year'] ?? 1;
                $dayOfMonth = $this->frequency_config['day_of_month'] ?? 1;
                return $lastRun->copy()->addYear()
                    ->startOfYear()
                    ->addMonths($monthOfYear - 1)
                    ->startOfMonth()
                    ->addDays($dayOfMonth - 1);
                
            default:
                return $lastRun->copy()->addDay();
        }
    }

    /**
     * Update next run time
     */
    public function updateNextRunTime(): void
    {
        $this->update([
            'next_run_at' => $this->calculateNextRunTime(),
        ]);
    }

    /**
     * Mark as executed
     */
    public function markAsExecuted(): void
    {
        $this->update([
            'last_run_at' => now(),
            'next_run_at' => $this->calculateNextRunTime(),
        ]);
    }

    /**
     * Activate schedule
     */
    public function activate(): void
    {
        $this->update([
            'is_active' => true,
            'next_run_at' => $this->calculateNextRunTime(),
        ]);
    }

    /**
     * Deactivate schedule
     */
    public function deactivate(): void
    {
        $this->update([
            'is_active' => false,
            'next_run_at' => null,
        ]);
    }

    /**
     * Get frequency display name
     */
    public function getFrequencyDisplayNameAttribute(): string
    {
        $frequencies = [
            self::FREQUENCY_DAILY => 'Daily',
            self::FREQUENCY_WEEKLY => 'Weekly',
            self::FREQUENCY_MONTHLY => 'Monthly',
            self::FREQUENCY_QUARTERLY => 'Quarterly',
            self::FREQUENCY_YEARLY => 'Yearly',
        ];

        return $frequencies[$this->frequency] ?? $this->frequency;
    }

    /**
     * Get formatted next run time
     */
    public function getFormattedNextRunAttribute(): string
    {
        if (!$this->next_run_at) {
            return 'Not scheduled';
        }

        return $this->next_run_at->format('M j, Y g:i A');
    }

    /**
     * Get formatted last run time
     */
    public function getFormattedLastRunAttribute(): string
    {
        if (!$this->last_run_at) {
            return 'Never';
        }

        return $this->last_run_at->format('M j, Y g:i A');
    }

    /**
     * Get available frequencies
     */
    public static function getFrequencies(): array
    {
        return [
            self::FREQUENCY_DAILY => 'Daily',
            self::FREQUENCY_WEEKLY => 'Weekly',
            self::FREQUENCY_MONTHLY => 'Monthly',
            self::FREQUENCY_QUARTERLY => 'Quarterly',
            self::FREQUENCY_YEARLY => 'Yearly',
        ];
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($schedule) {
            if (!isset($schedule->is_active)) {
                $schedule->is_active = true;
            }

            if ($schedule->is_active && !$schedule->next_run_at) {
                $schedule->next_run_at = $schedule->calculateNextRunTime();
            }
        });
    }
}

