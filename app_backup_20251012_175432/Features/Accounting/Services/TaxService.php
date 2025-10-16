<?php

namespace App\Features\Accounting\Services;

use App\Features\Accounting\Models\TaxRate;
use App\Features\Accounting\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class TaxService
{
    /**
     * Create a new tax rate
     */
    public function createTaxRate(int $organizationId, array $data): TaxRate
    {
        return TaxRate::create([
            'organization_id' => $organizationId,
            'name' => $data['name'],
            'code' => $data['code'] ?? null,
            'description' => $data['description'] ?? null,
            'tax_type' => $data['tax_type'],
            'rate' => $data['rate'],
            'is_compound' => $data['is_compound'] ?? false,
            'is_active' => $data['is_active'] ?? true,
            'effective_from' => $data['effective_from'] ?? null,
            'effective_to' => $data['effective_to'] ?? null,
            'jurisdiction' => $data['jurisdiction'] ?? null,
            'tax_authority' => $data['tax_authority'] ?? null,
            'reporting_code' => $data['reporting_code'] ?? null,
            'metadata' => $data['metadata'] ?? [],
        ]);
    }

    /**
     * Update an existing tax rate
     */
    public function updateTaxRate(TaxRate $taxRate, array $data): TaxRate
    {
        $taxRate->update([
            'name' => $data['name'] ?? $taxRate->name,
            'code' => $data['code'] ?? $taxRate->code,
            'description' => $data['description'] ?? $taxRate->description,
            'tax_type' => $data['tax_type'] ?? $taxRate->tax_type,
            'rate' => $data['rate'] ?? $taxRate->rate,
            'is_compound' => $data['is_compound'] ?? $taxRate->is_compound,
            'is_active' => $data['is_active'] ?? $taxRate->is_active,
            'effective_from' => $data['effective_from'] ?? $taxRate->effective_from,
            'effective_to' => $data['effective_to'] ?? $taxRate->effective_to,
            'jurisdiction' => $data['jurisdiction'] ?? $taxRate->jurisdiction,
            'tax_authority' => $data['tax_authority'] ?? $taxRate->tax_authority,
            'reporting_code' => $data['reporting_code'] ?? $taxRate->reporting_code,
            'metadata' => array_merge($taxRate->metadata ?? [], $data['metadata'] ?? []),
        ]);

        $this->clearTaxCache($taxRate->organization_id);

        return $taxRate;
    }

    /**
     * Get active tax rates for an organization
     */
    public function getActiveTaxRates(int $organizationId, ?string $taxType = null): Collection
    {
        $cacheKey = "active_tax_rates_{$organizationId}".($taxType ? "_{$taxType}" : '');

        return Cache::remember($cacheKey, 3600, function () use ($organizationId, $taxType) {
            $query = TaxRate::where('organization_id', $organizationId)->active();

            if ($taxType) {
                $query->byType($taxType);
            }

            return $query->orderBy('name')->get();
        });
    }

    /**
     * Calculate tax for a transaction
     */
    public function calculateTax(float $baseAmount, array $taxRateIds, ?Carbon $date = null): array
    {
        $date = $date ?? now();
        $taxCalculations = [];
        $totalTaxAmount = 0;
        $compoundBase = $baseAmount;

        $taxRates = TaxRate::whereIn('id', $taxRateIds)
            ->effectiveOn($date)
            ->active()
            ->orderBy('is_compound')
            ->get();

        foreach ($taxRates as $taxRate) {
            $taxAmount = $taxRate->calculateTaxAmount($compoundBase);
            $totalTaxAmount += $taxAmount;

            $taxCalculations[] = [
                'tax_rate_id' => $taxRate->id,
                'tax_rate_name' => $taxRate->name,
                'tax_type' => $taxRate->tax_type,
                'rate' => $taxRate->rate,
                'base_amount' => $compoundBase,
                'tax_amount' => $taxAmount,
                'is_compound' => $taxRate->is_compound,
            ];

            // If compound tax, add this tax to the base for next calculation
            if ($taxRate->is_compound) {
                $compoundBase += $taxAmount;
            }
        }

        return [
            'base_amount' => $baseAmount,
            'total_tax_amount' => $totalTaxAmount,
            'total_amount' => $baseAmount + $totalTaxAmount,
            'tax_calculations' => $taxCalculations,
        ];
    }

    /**
     * Get tax summary for a period
     */
    public function getTaxSummary(int $organizationId, Carbon $startDate, Carbon $endDate): array
    {
        $cacheKey = "tax_summary_{$organizationId}_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}";

        return Cache::remember($cacheKey, 1800, function () use ($organizationId, $startDate, $endDate) {
            $transactions = Transaction::where('organization_id', $organizationId)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->where('status', Transaction::STATUS_POSTED)
                ->whereNotNull('tax_rate_id')
                ->with('taxRate')
                ->get();

            $taxSummary = [];
            $totalTaxCollected = 0;
            $totalTaxPaid = 0;

            foreach ($transactions as $transaction) {
                if (! $transaction->taxRate) {
                    continue;
                }

                $taxRateId = $transaction->tax_rate_id;
                $taxAmount = $transaction->tax_amount ?? 0;

                if (! isset($taxSummary[$taxRateId])) {
                    $taxSummary[$taxRateId] = [
                        'tax_rate_id' => $taxRateId,
                        'tax_rate_name' => $transaction->taxRate->name,
                        'tax_type' => $transaction->taxRate->tax_type,
                        'rate' => $transaction->taxRate->rate,
                        'jurisdiction' => $transaction->taxRate->jurisdiction,
                        'tax_collected' => 0,
                        'tax_paid' => 0,
                        'net_tax' => 0,
                        'transaction_count' => 0,
                    ];
                }

                // Determine if tax was collected (sales) or paid (purchases)
                if ($transaction->type === Transaction::TYPE_SALE || $transaction->type === Transaction::TYPE_INVOICE) {
                    $taxSummary[$taxRateId]['tax_collected'] += $taxAmount;
                    $totalTaxCollected += $taxAmount;
                } else {
                    $taxSummary[$taxRateId]['tax_paid'] += $taxAmount;
                    $totalTaxPaid += $taxAmount;
                }

                $taxSummary[$taxRateId]['net_tax'] = $taxSummary[$taxRateId]['tax_collected'] - $taxSummary[$taxRateId]['tax_paid'];
                $taxSummary[$taxRateId]['transaction_count']++;
            }

            return [
                'period' => [
                    'start' => $startDate->toDateString(),
                    'end' => $endDate->toDateString(),
                ],
                'summary' => [
                    'total_tax_collected' => $totalTaxCollected,
                    'total_tax_paid' => $totalTaxPaid,
                    'net_tax_liability' => $totalTaxCollected - $totalTaxPaid,
                    'total_transactions' => $transactions->count(),
                ],
                'by_tax_rate' => array_values($taxSummary),
            ];
        });
    }

    /**
     * Generate tax report
     */
    public function generateTaxReport(int $organizationId, Carbon $startDate, Carbon $endDate, ?string $taxType = null): array
    {
        $taxSummary = $this->getTaxSummary($organizationId, $startDate, $endDate);

        // Filter by tax type if specified
        if ($taxType) {
            $taxSummary['by_tax_rate'] = array_filter($taxSummary['by_tax_rate'], function ($item) use ($taxType) {
                return $item['tax_type'] === $taxType;
            });
        }

        // Get detailed transactions
        $query = Transaction::where('organization_id', $organizationId)
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->where('status', Transaction::STATUS_POSTED)
            ->whereNotNull('tax_rate_id')
            ->with(['taxRate', 'journalEntries.account']);

        if ($taxType) {
            $query->whereHas('taxRate', function ($q) use ($taxType) {
                $q->where('tax_type', $taxType);
            });
        }

        $transactions = $query->orderBy('transaction_date')->get();

        $detailedTransactions = $transactions->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'date' => $transaction->transaction_date->toDateString(),
                'reference' => $transaction->reference,
                'description' => $transaction->description,
                'type' => $transaction->type,
                'amount' => $transaction->amount,
                'tax_amount' => $transaction->tax_amount,
                'total_amount' => $transaction->total_amount,
                'tax_rate' => [
                    'id' => $transaction->taxRate->id,
                    'name' => $transaction->taxRate->name,
                    'rate' => $transaction->taxRate->rate,
                    'type' => $transaction->taxRate->tax_type,
                ],
            ];
        });

        return [
            'report_info' => [
                'organization_id' => $organizationId,
                'period' => [
                    'start' => $startDate->toDateString(),
                    'end' => $endDate->toDateString(),
                ],
                'tax_type_filter' => $taxType,
                'generated_at' => now()->toISOString(),
            ],
            'summary' => $taxSummary,
            'detailed_transactions' => $detailedTransactions,
        ];
    }

    /**
     * Calculate tax liability for a period
     */
    public function calculateTaxLiability(int $organizationId, Carbon $startDate, Carbon $endDate): array
    {
        $taxSummary = $this->getTaxSummary($organizationId, $startDate, $endDate);
        $liabilities = [];

        foreach ($taxSummary['by_tax_rate'] as $taxData) {
            $netTax = $taxData['net_tax'];

            if ($netTax > 0) {
                $liabilities[] = [
                    'tax_rate_id' => $taxData['tax_rate_id'],
                    'tax_rate_name' => $taxData['tax_rate_name'],
                    'tax_type' => $taxData['tax_type'],
                    'jurisdiction' => $taxData['jurisdiction'],
                    'amount_owed' => $netTax,
                    'due_date' => $this->calculateTaxDueDate($taxData['tax_type'], $endDate),
                    'status' => 'pending',
                ];
            } elseif ($netTax < 0) {
                $liabilities[] = [
                    'tax_rate_id' => $taxData['tax_rate_id'],
                    'tax_rate_name' => $taxData['tax_rate_name'],
                    'tax_type' => $taxData['tax_type'],
                    'jurisdiction' => $taxData['jurisdiction'],
                    'amount_owed' => 0,
                    'refund_due' => abs($netTax),
                    'status' => 'refund_pending',
                ];
            }
        }

        return [
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
            'total_liability' => collect($liabilities)->sum('amount_owed'),
            'total_refunds' => collect($liabilities)->sum('refund_due'),
            'liabilities' => $liabilities,
        ];
    }

    /**
     * Get tax rates effective on a specific date
     */
    public function getTaxRatesForDate(int $organizationId, Carbon $date, ?string $taxType = null): Collection
    {
        $query = TaxRate::where('organization_id', $organizationId)
            ->effectiveOn($date)
            ->active();

        if ($taxType) {
            $query->byType($taxType);
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Validate tax calculation
     */
    public function validateTaxCalculation(array $taxCalculation): array
    {
        $errors = [];

        if (empty($taxCalculation['tax_calculations'])) {
            $errors[] = 'No tax calculations provided';
        }

        $calculatedTotal = $taxCalculation['base_amount'];
        foreach ($taxCalculation['tax_calculations'] as $calc) {
            $calculatedTotal += $calc['tax_amount'];

            // Validate individual tax calculation
            $expectedTax = $calc['base_amount'] * ($calc['rate'] / 100);
            if (abs($calc['tax_amount'] - $expectedTax) > 0.01) {
                $errors[] = "Tax calculation error for {$calc['tax_rate_name']}: expected {$expectedTax}, got {$calc['tax_amount']}";
            }
        }

        if (abs($calculatedTotal - $taxCalculation['total_amount']) > 0.01) {
            $errors[] = "Total amount mismatch: expected {$calculatedTotal}, got {$taxCalculation['total_amount']}";
        }

        return [
            'is_valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Calculate tax due date based on tax type
     */
    private function calculateTaxDueDate(string $taxType, Carbon $periodEnd): Carbon
    {
        return match ($taxType) {
            TaxRate::TYPE_SALES_TAX, TaxRate::TYPE_VAT, TaxRate::TYPE_GST => $periodEnd->copy()->addMonth()->endOfMonth(),
            TaxRate::TYPE_INCOME_TAX => $periodEnd->copy()->addMonths(3)->endOfMonth(),
            TaxRate::TYPE_PAYROLL_TAX => $periodEnd->copy()->addDays(15),
            default => $periodEnd->copy()->addMonth()->endOfMonth(),
        };
    }

    /**
     * Clear tax cache
     */
    private function clearTaxCache(int $organizationId): void
    {
        Cache::tags(['taxes', "org_{$organizationId}"])->flush();
    }
}
