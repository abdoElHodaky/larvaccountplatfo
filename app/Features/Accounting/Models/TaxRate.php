<?php

namespace App\Features\Accounting\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaxRate extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'name',
        'code',
        'description',
        'tax_type',
        'rate',
        'is_compound',
        'is_active',
        'effective_from',
        'effective_to',
        'jurisdiction',
        'tax_authority',
        'reporting_code',
        'metadata',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'is_compound' => 'boolean',
        'is_active' => 'boolean',
        'effective_from' => 'date',
        'effective_to' => 'date',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Tax types
     */
    const TYPE_SALES_TAX = 'sales_tax';
    const TYPE_VAT = 'vat';
    const TYPE_GST = 'gst';
    const TYPE_INCOME_TAX = 'income_tax';
    const TYPE_PAYROLL_TAX = 'payroll_tax';
    const TYPE_PROPERTY_TAX = 'property_tax';
    const TYPE_EXCISE_TAX = 'excise_tax';
    const TYPE_CUSTOM_DUTY = 'custom_duty';
    const TYPE_OTHER = 'other';

    /**
     * Get transactions that use this tax rate
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'tax_rate_id');
    }

    /**
     * Scope for active tax rates
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                    ->where(function ($q) {
                        $q->whereNull('effective_from')
                          ->orWhere('effective_from', '<=', now());
                    })
                    ->where(function ($q) {
                        $q->whereNull('effective_to')
                          ->orWhere('effective_to', '>=', now());
                    });
    }

    /**
     * Scope for filtering by tax type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('tax_type', $type);
    }

    /**
     * Scope for filtering by jurisdiction
     */
    public function scopeByJurisdiction($query, $jurisdiction)
    {
        return $query->where('jurisdiction', $jurisdiction);
    }

    /**
     * Scope for effective on a specific date
     */
    public function scopeEffectiveOn($query, $date)
    {
        return $query->where(function ($q) use ($date) {
            $q->whereNull('effective_from')
              ->orWhere('effective_from', '<=', $date);
        })->where(function ($q) use ($date) {
            $q->whereNull('effective_to')
              ->orWhere('effective_to', '>=', $date);
        });
    }

    /**
     * Calculate tax amount for a given base amount
     */
    public function calculateTaxAmount(float $baseAmount): float
    {
        return $baseAmount * ($this->rate / 100);
    }

    /**
     * Calculate total amount including tax
     */
    public function calculateTotalWithTax(float $baseAmount): float
    {
        return $baseAmount + $this->calculateTaxAmount($baseAmount);
    }

    /**
     * Calculate base amount from total amount including tax
     */
    public function calculateBaseFromTotal(float $totalAmount): float
    {
        return $totalAmount / (1 + ($this->rate / 100));
    }

    /**
     * Check if tax rate is currently effective
     */
    public function isCurrentlyEffective(): bool
    {
        $now = now()->toDateString();
        
        $effectiveFrom = $this->effective_from ? $this->effective_from->toDateString() : null;
        $effectiveTo = $this->effective_to ? $this->effective_to->toDateString() : null;
        
        return $this->is_active &&
               (!$effectiveFrom || $effectiveFrom <= $now) &&
               (!$effectiveTo || $effectiveTo >= $now);
    }

    /**
     * Get formatted tax type
     */
    public function getFormattedTypeAttribute(): string
    {
        return match ($this->tax_type) {
            self::TYPE_SALES_TAX => 'Sales Tax',
            self::TYPE_VAT => 'Value Added Tax (VAT)',
            self::TYPE_GST => 'Goods and Services Tax (GST)',
            self::TYPE_INCOME_TAX => 'Income Tax',
            self::TYPE_PAYROLL_TAX => 'Payroll Tax',
            self::TYPE_PROPERTY_TAX => 'Property Tax',
            self::TYPE_EXCISE_TAX => 'Excise Tax',
            self::TYPE_CUSTOM_DUTY => 'Custom Duty',
            self::TYPE_OTHER => 'Other Tax',
            default => 'Unknown Tax Type',
        };
    }

    /**
     * Get formatted rate as percentage
     */
    public function getFormattedRateAttribute(): string
    {
        return number_format($this->rate, 2) . '%';
    }

    /**
     * Get display name with rate
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->name . ' (' . $this->formatted_rate . ')';
    }

    /**
     * Activate the tax rate
     */
    public function activate(): bool
    {
        $this->is_active = true;
        return $this->save();
    }

    /**
     * Deactivate the tax rate
     */
    public function deactivate(): bool
    {
        $this->is_active = false;
        return $this->save();
    }

    /**
     * Set effective period
     */
    public function setEffectivePeriod($from, $to = null): bool
    {
        $this->effective_from = $from;
        $this->effective_to = $to;
        return $this->save();
    }

    /**
     * Get tax calculation details
     */
    public function getTaxCalculationDetails(float $baseAmount): array
    {
        $taxAmount = $this->calculateTaxAmount($baseAmount);
        $totalAmount = $baseAmount + $taxAmount;

        return [
            'base_amount' => $baseAmount,
            'tax_rate' => $this->rate,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'tax_rate_name' => $this->name,
            'tax_type' => $this->tax_type,
            'is_compound' => $this->is_compound,
        ];
    }
}
