<?php

namespace Modules\Reporting\Models;

use Modules\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinancialReport extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'report_type',
        'report_name',
        'period_type',
        'start_date',
        'end_date',
        'comparison_start_date',
        'comparison_end_date',
        'currency',
        'status',
        'data',
        'metadata',
        'generated_by',
        'generated_at',
        'file_path',
        'file_size',
        'export_format',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'comparison_start_date' => 'date',
        'comparison_end_date' => 'date',
        'generated_at' => 'datetime',
        'data' => 'array',
        'metadata' => 'array',
        'file_size' => 'integer',
    ];

    protected $dates = [
        'start_date',
        'end_date',
        'comparison_start_date',
        'comparison_end_date',
        'generated_at',
        'deleted_at',
    ];

    /**
     * Report types
     */
    const TYPE_BALANCE_SHEET = 'balance_sheet';
    const TYPE_INCOME_STATEMENT = 'income_statement';
    const TYPE_CASH_FLOW = 'cash_flow';
    const TYPE_TRIAL_BALANCE = 'trial_balance';
    const TYPE_GENERAL_LEDGER = 'general_ledger';
    const TYPE_ACCOUNT_AGING = 'account_aging';
    const TYPE_CUSTOM = 'custom';

    /**
     * Period types
     */
    const PERIOD_MONTHLY = 'monthly';
    const PERIOD_QUARTERLY = 'quarterly';
    const PERIOD_YEARLY = 'yearly';
    const PERIOD_CUSTOM = 'custom';

    /**
     * Report statuses
     */
    const STATUS_PENDING = 'pending';
    const STATUS_GENERATING = 'generating';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    /**
     * Export formats
     */
    const FORMAT_PDF = 'pdf';
    const FORMAT_EXCEL = 'excel';
    const FORMAT_CSV = 'csv';
    const FORMAT_JSON = 'json';

    /**
     * Get the organization this report belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\Organization::class);
    }

    /**
     * Get the user who generated this report
     */
    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\User::class, 'generated_by');
    }

    /**
     * Get report schedules for this report
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(ReportSchedule::class);
    }

    /**
     * Scope for specific report type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('report_type', $type);
    }

    /**
     * Scope for specific status
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('start_date', [$startDate, $endDate]);
    }

    /**
     * Scope for completed reports
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Check if report is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if report is pending
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if report is generating
     */
    public function isGenerating(): bool
    {
        return $this->status === self::STATUS_GENERATING;
    }

    /**
     * Check if report failed
     */
    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Mark report as generating
     */
    public function markAsGenerating(): void
    {
        $this->update(['status' => self::STATUS_GENERATING]);
    }

    /**
     * Mark report as completed
     */
    public function markAsCompleted(array $data = [], array $metadata = []): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'data' => $data,
            'metadata' => $metadata,
            'generated_at' => now(),
        ]);
    }

    /**
     * Mark report as failed
     */
    public function markAsFailed(string $error = null): void
    {
        $metadata = $this->metadata ?? [];
        if ($error) {
            $metadata['error'] = $error;
            $metadata['failed_at'] = now()->toISOString();
        }

        $this->update([
            'status' => self::STATUS_FAILED,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Get formatted period
     */
    public function getFormattedPeriodAttribute(): string
    {
        if ($this->period_type === self::PERIOD_CUSTOM) {
            return $this->start_date->format('M j, Y') . ' - ' . $this->end_date->format('M j, Y');
        }

        switch ($this->period_type) {
            case self::PERIOD_MONTHLY:
                return $this->start_date->format('F Y');
            case self::PERIOD_QUARTERLY:
                $quarter = ceil($this->start_date->month / 3);
                return 'Q' . $quarter . ' ' . $this->start_date->year;
            case self::PERIOD_YEARLY:
                return $this->start_date->year;
            default:
                return $this->start_date->format('M j, Y') . ' - ' . $this->end_date->format('M j, Y');
        }
    }

    /**
     * Get formatted file size
     */
    public function getFormattedFileSizeAttribute(): string
    {
        if (!$this->file_size) {
            return 'N/A';
        }

        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Get report type display name
     */
    public function getTypeDisplayNameAttribute(): string
    {
        $types = [
            self::TYPE_BALANCE_SHEET => 'Balance Sheet',
            self::TYPE_INCOME_STATEMENT => 'Income Statement',
            self::TYPE_CASH_FLOW => 'Cash Flow Statement',
            self::TYPE_TRIAL_BALANCE => 'Trial Balance',
            self::TYPE_GENERAL_LEDGER => 'General Ledger',
            self::TYPE_ACCOUNT_AGING => 'Account Aging',
            self::TYPE_CUSTOM => 'Custom Report',
        ];

        return $types[$this->report_type] ?? $this->report_type;
    }

    /**
     * Get available report types
     */
    public static function getReportTypes(): array
    {
        return [
            self::TYPE_BALANCE_SHEET => 'Balance Sheet',
            self::TYPE_INCOME_STATEMENT => 'Income Statement',
            self::TYPE_CASH_FLOW => 'Cash Flow Statement',
            self::TYPE_TRIAL_BALANCE => 'Trial Balance',
            self::TYPE_GENERAL_LEDGER => 'General Ledger',
            self::TYPE_ACCOUNT_AGING => 'Account Aging',
            self::TYPE_CUSTOM => 'Custom Report',
        ];
    }

    /**
     * Get available period types
     */
    public static function getPeriodTypes(): array
    {
        return [
            self::PERIOD_MONTHLY => 'Monthly',
            self::PERIOD_QUARTERLY => 'Quarterly',
            self::PERIOD_YEARLY => 'Yearly',
            self::PERIOD_CUSTOM => 'Custom Period',
        ];
    }

    /**
     * Get available export formats
     */
    public static function getExportFormats(): array
    {
        return [
            self::FORMAT_PDF => 'PDF',
            self::FORMAT_EXCEL => 'Excel',
            self::FORMAT_CSV => 'CSV',
            self::FORMAT_JSON => 'JSON',
        ];
    }

    /**
     * Get available statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING => 'Pending',
            self::STATUS_GENERATING => 'Generating',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_FAILED => 'Failed',
        ];
    }

    /**
     * Generate report filename
     */
    public function generateFilename(): string
    {
        $type = str_replace('_', '-', $this->report_type);
        $period = $this->formatted_period;
        $timestamp = now()->format('Y-m-d-H-i-s');
        
        return "{$type}-{$period}-{$timestamp}";
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($report) {
            if (!$report->status) {
                $report->status = self::STATUS_PENDING;
            }

            if (!$report->currency) {
                $report->currency = $report->organization->currency ?? 'USD';
            }
        });
    }
}

