<?php

namespace App\Features\Accounting\Services;

use App\Features\Accounting\Models\Budget;
use App\Features\Accounting\Models\BudgetLineItem;
use App\Features\Accounting\Models\Account;
use App\Features\Accounting\Models\Transaction;
use App\Features\Accounting\Models\JournalEntry;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BudgetService
{
    /**
     * Create a new budget
     */
    public function createBudget(int $organizationId, array $data): Budget
    {
        return DB::transaction(function () use ($organizationId, $data) {
            $budget = Budget::create([
                'organization_id' => $organizationId,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'budget_type' => $data['budget_type'],
                'period_type' => $data['period_type'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'status' => Budget::STATUS_DRAFT,
                'created_by' => $data['created_by'],
                'metadata' => $data['metadata'] ?? [],
            ]);

            // Create line items if provided
            if (!empty($data['line_items'])) {
                $this->createBudgetLineItems($budget, $data['line_items']);
            }

            $this->clearBudgetCache($organizationId);
            
            return $budget->load('lineItems.account');
        });
    }

    /**
     * Update an existing budget
     */
    public function updateBudget(Budget $budget, array $data): Budget
    {
        return DB::transaction(function () use ($budget, $data) {
            $budget->update([
                'name' => $data['name'] ?? $budget->name,
                'description' => $data['description'] ?? $budget->description,
                'budget_type' => $data['budget_type'] ?? $budget->budget_type,
                'period_type' => $data['period_type'] ?? $budget->period_type,
                'start_date' => $data['start_date'] ?? $budget->start_date,
                'end_date' => $data['end_date'] ?? $budget->end_date,
                'metadata' => array_merge($budget->metadata ?? [], $data['metadata'] ?? []),
            ]);

            // Update line items if provided
            if (isset($data['line_items'])) {
                $this->updateBudgetLineItems($budget, $data['line_items']);
            }

            $this->clearBudgetCache($budget->organization_id);
            
            return $budget->load('lineItems.account');
        });
    }

    /**
     * Create budget line items
     */
    public function createBudgetLineItems(Budget $budget, array $lineItems): Collection
    {
        $createdItems = collect();

        foreach ($lineItems as $itemData) {
            $lineItem = BudgetLineItem::create([
                'organization_id' => $budget->organization_id,
                'budget_id' => $budget->id,
                'account_id' => $itemData['account_id'],
                'category' => $itemData['category'],
                'description' => $itemData['description'] ?? null,
                'budgeted_amount' => $itemData['budgeted_amount'],
                'period_start' => $itemData['period_start'] ?? $budget->start_date,
                'period_end' => $itemData['period_end'] ?? $budget->end_date,
                'notes' => $itemData['notes'] ?? null,
                'metadata' => $itemData['metadata'] ?? [],
            ]);

            $createdItems->push($lineItem);
        }

        // Update budget total amount
        $budget->update(['total_amount' => $budget->calculateTotalAmount()]);

        return $createdItems;
    }

    /**
     * Update budget line items
     */
    public function updateBudgetLineItems(Budget $budget, array $lineItems): Collection
    {
        $updatedItems = collect();

        // Delete existing line items not in the update
        $providedIds = collect($lineItems)->pluck('id')->filter();
        $budget->lineItems()->whereNotIn('id', $providedIds)->delete();

        foreach ($lineItems as $itemData) {
            if (!empty($itemData['id'])) {
                // Update existing line item
                $lineItem = BudgetLineItem::find($itemData['id']);
                if ($lineItem && $lineItem->budget_id === $budget->id) {
                    $lineItem->update([
                        'account_id' => $itemData['account_id'] ?? $lineItem->account_id,
                        'category' => $itemData['category'] ?? $lineItem->category,
                        'description' => $itemData['description'] ?? $lineItem->description,
                        'budgeted_amount' => $itemData['budgeted_amount'] ?? $lineItem->budgeted_amount,
                        'period_start' => $itemData['period_start'] ?? $lineItem->period_start,
                        'period_end' => $itemData['period_end'] ?? $lineItem->period_end,
                        'notes' => $itemData['notes'] ?? $lineItem->notes,
                        'metadata' => array_merge($lineItem->metadata ?? [], $itemData['metadata'] ?? []),
                    ]);
                    $updatedItems->push($lineItem);
                }
            } else {
                // Create new line item
                $newItems = $this->createBudgetLineItems($budget, [$itemData]);
                $updatedItems = $updatedItems->merge($newItems);
            }
        }

        // Update budget total amount
        $budget->update(['total_amount' => $budget->calculateTotalAmount()]);

        return $updatedItems;
    }

    /**
     * Get budget performance analysis
     */
    public function getBudgetPerformance(Budget $budget): array
    {
        $lineItems = $budget->lineItems()->with('account')->get();
        $performance = [];

        foreach ($lineItems as $item) {
            // Get actual amounts from transactions
            $actualAmount = $this->getActualAmount(
                $budget->organization_id,
                $item->account_id,
                $item->period_start,
                $item->period_end
            );

            $item->update(['actual_amount' => $actualAmount]);
            $variance = $item->calculateVariance();

            $performance[] = [
                'line_item_id' => $item->id,
                'account_name' => $item->account->name,
                'account_code' => $item->account->code,
                'category' => $item->category,
                'budgeted_amount' => $item->budgeted_amount,
                'actual_amount' => $actualAmount,
                'variance' => $variance,
                'utilization_percentage' => $item->getUtilizationPercentage(),
            ];
        }

        $budgetVariance = $budget->calculateVariance();

        return [
            'budget_id' => $budget->id,
            'budget_name' => $budget->name,
            'period' => [
                'start' => $budget->start_date->toDateString(),
                'end' => $budget->end_date->toDateString(),
            ],
            'overall_variance' => $budgetVariance,
            'line_items' => $performance,
            'summary' => [
                'total_line_items' => count($performance),
                'over_budget_items' => collect($performance)->where('variance.status', 'over_budget')->count(),
                'under_budget_items' => collect($performance)->where('variance.status', 'under_budget')->count(),
                'on_budget_items' => collect($performance)->where('variance.status', 'on_budget')->count(),
            ],
        ];
    }

    /**
     * Get budget dashboard overview
     */
    public function getBudgetDashboard(int $organizationId): array
    {
        $cacheKey = "budget_dashboard_{$organizationId}";
        
        return Cache::remember($cacheKey, 300, function () use ($organizationId) {
            $activeBudgets = Budget::where('organization_id', $organizationId)
                                  ->active()
                                  ->with('lineItems')
                                  ->get();

            $totalBudgeted = $activeBudgets->sum(function ($budget) {
                return $budget->calculateTotalAmount();
            });

            $totalActual = $activeBudgets->sum(function ($budget) {
                return $budget->calculateActualAmount();
            });

            $overBudgetCount = $activeBudgets->filter(function ($budget) {
                return $budget->isOverBudget();
            })->count();

            // Budget utilization by type
            $utilizationByType = $activeBudgets->groupBy('budget_type')->map(function ($budgets, $type) {
                $budgeted = $budgets->sum(function ($budget) {
                    return $budget->calculateTotalAmount();
                });
                $actual = $budgets->sum(function ($budget) {
                    return $budget->calculateActualAmount();
                });
                
                return [
                    'budgeted' => $budgeted,
                    'actual' => $actual,
                    'utilization' => $budgeted > 0 ? ($actual / $budgeted) * 100 : 0,
                    'count' => $budgets->count(),
                ];
            });

            // Recent budget alerts
            $alerts = $this->getBudgetAlerts($organizationId);

            return [
                'summary' => [
                    'total_budgets' => $activeBudgets->count(),
                    'total_budgeted' => $totalBudgeted,
                    'total_actual' => $totalActual,
                    'overall_utilization' => $totalBudgeted > 0 ? ($totalActual / $totalBudgeted) * 100 : 0,
                    'over_budget_count' => $overBudgetCount,
                ],
                'utilization_by_type' => $utilizationByType,
                'alerts' => $alerts,
                'active_budgets' => $activeBudgets->map(function ($budget) {
                    return [
                        'id' => $budget->id,
                        'name' => $budget->name,
                        'type' => $budget->budget_type,
                        'period' => $budget->start_date->format('M Y') . ' - ' . $budget->end_date->format('M Y'),
                        'budgeted' => $budget->calculateTotalAmount(),
                        'actual' => $budget->calculateActualAmount(),
                        'utilization' => $budget->getUtilizationPercentage(),
                        'is_over_budget' => $budget->isOverBudget(),
                    ];
                }),
            ];
        });
    }

    /**
     * Get budget alerts
     */
    public function getBudgetAlerts(int $organizationId, float $thresholdPercent = 90.0): array
    {
        $alerts = [];
        
        $budgets = Budget::where('organization_id', $organizationId)
                        ->active()
                        ->with('lineItems.account')
                        ->get();

        foreach ($budgets as $budget) {
            $utilization = $budget->getUtilizationPercentage();
            
            if ($utilization >= 100) {
                $alerts[] = [
                    'type' => 'over_budget',
                    'severity' => 'high',
                    'budget_id' => $budget->id,
                    'budget_name' => $budget->name,
                    'message' => "Budget '{$budget->name}' is over budget at {$utilization}% utilization",
                    'utilization' => $utilization,
                ];
            } elseif ($utilization >= $thresholdPercent) {
                $alerts[] = [
                    'type' => 'approaching_limit',
                    'severity' => 'medium',
                    'budget_id' => $budget->id,
                    'budget_name' => $budget->name,
                    'message' => "Budget '{$budget->name}' is approaching limit at {$utilization}% utilization",
                    'utilization' => $utilization,
                ];
            }

            // Check individual line items
            foreach ($budget->lineItems as $lineItem) {
                $itemUtilization = $lineItem->getUtilizationPercentage();
                
                if ($itemUtilization >= 100) {
                    $alerts[] = [
                        'type' => 'line_item_over_budget',
                        'severity' => 'high',
                        'budget_id' => $budget->id,
                        'budget_name' => $budget->name,
                        'line_item_id' => $lineItem->id,
                        'account_name' => $lineItem->account->name,
                        'message' => "Budget line item '{$lineItem->account->name}' is over budget at {$itemUtilization}% utilization",
                        'utilization' => $itemUtilization,
                    ];
                }
            }
        }

        return $alerts;
    }

    /**
     * Generate budget from historical data
     */
    public function generateBudgetFromHistorical(
        int $organizationId,
        array $accountIds,
        Carbon $startDate,
        Carbon $endDate,
        float $growthRate = 0.0
    ): array {
        $budgetData = [];
        
        foreach ($accountIds as $accountId) {
            $account = Account::find($accountId);
            if (!$account || $account->organization_id !== $organizationId) {
                continue;
            }

            // Get historical data for the same period in previous year
            $historicalStart = $startDate->copy()->subYear();
            $historicalEnd = $endDate->copy()->subYear();
            
            $historicalAmount = $this->getActualAmount($organizationId, $accountId, $historicalStart, $historicalEnd);
            
            // Apply growth rate
            $budgetedAmount = $historicalAmount * (1 + ($growthRate / 100));
            
            $budgetData[] = [
                'account_id' => $accountId,
                'account_name' => $account->name,
                'category' => $this->getCategoryFromAccountType($account->type),
                'historical_amount' => $historicalAmount,
                'budgeted_amount' => $budgetedAmount,
                'growth_rate' => $growthRate,
                'period_start' => $startDate,
                'period_end' => $endDate,
            ];
        }

        return $budgetData;
    }

    /**
     * Get actual amount for an account in a period
     */
    private function getActualAmount(int $organizationId, int $accountId, $startDate, $endDate): float
    {
        return JournalEntry::where('account_id', $accountId)
                          ->whereHas('transaction', function ($query) use ($organizationId, $startDate, $endDate) {
                              $query->where('organization_id', $organizationId)
                                   ->whereBetween('transaction_date', [$startDate, $endDate])
                                   ->where('status', Transaction::STATUS_POSTED);
                          })
                          ->sum('amount');
    }

    /**
     * Get category from account type
     */
    private function getCategoryFromAccountType(string $accountType): string
    {
        return match ($accountType) {
            Account::TYPE_REVENUE => BudgetLineItem::CATEGORY_REVENUE,
            Account::TYPE_EXPENSE => BudgetLineItem::CATEGORY_EXPENSE,
            Account::TYPE_ASSET, Account::TYPE_LIABILITY, Account::TYPE_EQUITY => BudgetLineItem::CATEGORY_CAPITAL,
            default => BudgetLineItem::CATEGORY_OTHER,
        };
    }

    /**
     * Clear budget cache
     */
    private function clearBudgetCache(int $organizationId): void
    {
        Cache::forget("budget_dashboard_{$organizationId}");
        Cache::tags(['budgets', "org_{$organizationId}"])->flush();
    }
}
