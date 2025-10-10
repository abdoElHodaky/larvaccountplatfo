<?php

namespace App\Features\Dashboard\Services;

use App\Features\Accounting\Services\AccountingService;
use App\Features\Accounting\Services\BudgetService;
use App\Features\Accounting\Services\TaxService;
use App\Features\Accounting\Services\ForecastingService;
use App\Features\Accounting\Models\Account;
use App\Features\Accounting\Models\Transaction;
use App\Features\Accounting\Models\Budget;
use App\Features\Accounting\Models\FinancialForecast;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdvancedDashboardService
{
    protected AccountingService $accountingService;
    protected BudgetService $budgetService;
    protected TaxService $taxService;
    protected ForecastingService $forecastingService;

    public function __construct(
        AccountingService $accountingService,
        BudgetService $budgetService,
        TaxService $taxService,
        ForecastingService $forecastingService
    ) {
        $this->accountingService = $accountingService;
        $this->budgetService = $budgetService;
        $this->taxService = $taxService;
        $this->forecastingService = $forecastingService;
    }

    /**
     * Get comprehensive dashboard overview
     */
    public function getDashboardOverview(int $organizationId): array
    {
        $cacheKey = "dashboard_overview_{$organizationId}";
        
        return Cache::remember($cacheKey, 300, function () use ($organizationId) {
            return [
                'financial_summary' => $this->getFinancialSummary($organizationId),
                'performance_metrics' => $this->getPerformanceMetrics($organizationId),
                'budget_overview' => $this->getBudgetOverview($organizationId),
                'forecast_insights' => $this->getForecastInsights($organizationId),
                'tax_summary' => $this->getTaxSummary($organizationId),
                'recent_activity' => $this->getRecentActivity($organizationId),
                'alerts_notifications' => $this->getAlertsAndNotifications($organizationId),
                'quick_stats' => $this->getQuickStats($organizationId),
            ];
        });
    }

    /**
     * Get financial summary with key metrics
     */
    public function getFinancialSummary(int $organizationId): array
    {
        $currentMonth = Carbon::now();
        $previousMonth = Carbon::now()->subMonth();
        $currentYear = Carbon::now()->year;

        // Current month financial data
        $currentMonthData = $this->getFinancialDataForPeriod(
            $organizationId,
            $currentMonth->startOfMonth(),
            $currentMonth->endOfMonth()
        );

        // Previous month for comparison
        $previousMonthData = $this->getFinancialDataForPeriod(
            $organizationId,
            $previousMonth->startOfMonth(),
            $previousMonth->endOfMonth()
        );

        // Year-to-date data
        $ytdData = $this->getFinancialDataForPeriod(
            $organizationId,
            Carbon::create($currentYear, 1, 1),
            Carbon::now()
        );

        return [
            'current_month' => [
                'revenue' => $currentMonthData['revenue'],
                'expenses' => $currentMonthData['expenses'],
                'net_income' => $currentMonthData['revenue'] - $currentMonthData['expenses'],
                'gross_margin' => $currentMonthData['revenue'] > 0 
                    ? (($currentMonthData['revenue'] - $currentMonthData['cogs']) / $currentMonthData['revenue']) * 100 
                    : 0,
            ],
            'previous_month' => [
                'revenue' => $previousMonthData['revenue'],
                'expenses' => $previousMonthData['expenses'],
                'net_income' => $previousMonthData['revenue'] - $previousMonthData['expenses'],
            ],
            'year_to_date' => [
                'revenue' => $ytdData['revenue'],
                'expenses' => $ytdData['expenses'],
                'net_income' => $ytdData['revenue'] - $ytdData['expenses'],
                'average_monthly_revenue' => $ytdData['revenue'] / $currentMonth->month,
            ],
            'growth_rates' => [
                'revenue_mom' => $this->calculateGrowthRate($previousMonthData['revenue'], $currentMonthData['revenue']),
                'expenses_mom' => $this->calculateGrowthRate($previousMonthData['expenses'], $currentMonthData['expenses']),
                'net_income_mom' => $this->calculateGrowthRate(
                    $previousMonthData['revenue'] - $previousMonthData['expenses'],
                    $currentMonthData['revenue'] - $currentMonthData['expenses']
                ),
            ],
        ];
    }

    /**
     * Get performance metrics and KPIs
     */
    public function getPerformanceMetrics(int $organizationId): array
    {
        $currentMonth = Carbon::now();
        $last12Months = Carbon::now()->subMonths(12);

        // Cash flow metrics
        $cashFlow = $this->getCashFlowMetrics($organizationId, $last12Months, $currentMonth);
        
        // Profitability metrics
        $profitability = $this->getProfitabilityMetrics($organizationId, $currentMonth);
        
        // Efficiency metrics
        $efficiency = $this->getEfficiencyMetrics($organizationId, $currentMonth);

        return [
            'cash_flow' => $cashFlow,
            'profitability' => $profitability,
            'efficiency' => $efficiency,
            'financial_ratios' => $this->getFinancialRatios($organizationId),
            'trend_analysis' => $this->getTrendAnalysis($organizationId, $last12Months, $currentMonth),
        ];
    }

    /**
     * Get budget overview with variance analysis
     */
    public function getBudgetOverview(int $organizationId): array
    {
        $budgetDashboard = $this->budgetService->getBudgetDashboard($organizationId);
        $budgetAlerts = $this->budgetService->getBudgetAlerts($organizationId);

        // Get active budgets with performance
        $activeBudgets = Budget::where('organization_id', $organizationId)
                              ->where('status', 'active')
                              ->with('lineItems')
                              ->get();

        $budgetPerformance = [];
        foreach ($activeBudgets as $budget) {
            $performance = $this->budgetService->getBudgetPerformance($budget);
            $budgetPerformance[] = [
                'budget_id' => $budget->id,
                'budget_name' => $budget->name,
                'utilization' => $budget->getUtilizationPercentage(),
                'variance' => $performance['overall_variance'],
                'status' => $budget->isOverBudget() ? 'over_budget' : 'on_track',
            ];
        }

        return [
            'summary' => $budgetDashboard['summary'],
            'active_budgets' => $budgetPerformance,
            'alerts' => $budgetAlerts,
            'utilization_by_type' => $budgetDashboard['utilization_by_type'],
            'top_variances' => $this->getTopBudgetVariances($organizationId),
        ];
    }

    /**
     * Get forecast insights and predictions
     */
    public function getForecastInsights(int $organizationId): array
    {
        $forecastDashboard = $this->forecastingService->getForecastDashboard($organizationId);
        
        // Get next 3 months forecast
        $nextQuarter = $this->getNextQuarterForecast($organizationId);
        
        // Get forecast accuracy for completed periods
        $forecastAccuracy = $this->getForecastAccuracyMetrics($organizationId);

        return [
            'summary' => $forecastDashboard['summary'],
            'next_quarter' => $nextQuarter,
            'accuracy_metrics' => $forecastAccuracy,
            'forecasts_by_type' => $forecastDashboard['by_type'],
            'confidence_levels' => $this->getForecastConfidenceLevels($organizationId),
        ];
    }

    /**
     * Get tax summary and compliance status
     */
    public function getTaxSummary(int $organizationId): array
    {
        $currentQuarter = $this->getCurrentQuarter();
        $taxSummary = $this->taxService->getTaxSummary(
            $organizationId,
            $currentQuarter['start'],
            $currentQuarter['end']
        );

        $taxLiability = $this->taxService->calculateTaxLiability(
            $organizationId,
            $currentQuarter['start'],
            $currentQuarter['end']
        );

        return [
            'current_quarter' => $taxSummary,
            'tax_liability' => $taxLiability,
            'compliance_status' => $this->getTaxComplianceStatus($organizationId),
            'upcoming_deadlines' => $this->getUpcomingTaxDeadlines($organizationId),
        ];
    }

    /**
     * Get recent activity across all modules
     */
    public function getRecentActivity(int $organizationId, int $limit = 20): array
    {
        $activities = [];

        // Recent transactions
        $recentTransactions = Transaction::where('organization_id', $organizationId)
                                        ->orderBy('created_at', 'desc')
                                        ->limit($limit / 2)
                                        ->get();

        foreach ($recentTransactions as $transaction) {
            $activities[] = [
                'type' => 'transaction',
                'title' => "Transaction {$transaction->reference}",
                'description' => $transaction->description,
                'amount' => $transaction->total_amount,
                'status' => $transaction->status,
                'timestamp' => $transaction->created_at,
                'icon' => 'transaction',
                'color' => $this->getStatusColor($transaction->status),
            ];
        }

        // Recent budget activities
        $recentBudgets = Budget::where('organization_id', $organizationId)
                              ->orderBy('updated_at', 'desc')
                              ->limit($limit / 4)
                              ->get();

        foreach ($recentBudgets as $budget) {
            $activities[] = [
                'type' => 'budget',
                'title' => "Budget: {$budget->name}",
                'description' => "Status: {$budget->status}",
                'amount' => $budget->total_amount,
                'status' => $budget->status,
                'timestamp' => $budget->updated_at,
                'icon' => 'budget',
                'color' => $this->getStatusColor($budget->status),
            ];
        }

        // Sort by timestamp and limit
        usort($activities, function ($a, $b) {
            return $b['timestamp'] <=> $a['timestamp'];
        });

        return array_slice($activities, 0, $limit);
    }

    /**
     * Get alerts and notifications
     */
    public function getAlertsAndNotifications(int $organizationId): array
    {
        $alerts = [];

        // Budget alerts
        $budgetAlerts = $this->budgetService->getBudgetAlerts($organizationId);
        foreach ($budgetAlerts as $alert) {
            $alerts[] = [
                'type' => 'budget',
                'severity' => $alert['severity'],
                'title' => 'Budget Alert',
                'message' => $alert['message'],
                'action_required' => true,
                'timestamp' => Carbon::now(),
            ];
        }

        // Cash flow alerts
        $cashFlowAlerts = $this->getCashFlowAlerts($organizationId);
        $alerts = array_merge($alerts, $cashFlowAlerts);

        // Tax compliance alerts
        $taxAlerts = $this->getTaxComplianceAlerts($organizationId);
        $alerts = array_merge($alerts, $taxAlerts);

        // Sort by severity and timestamp
        usort($alerts, function ($a, $b) {
            $severityOrder = ['high' => 3, 'medium' => 2, 'low' => 1];
            $aSeverity = $severityOrder[$a['severity']] ?? 0;
            $bSeverity = $severityOrder[$b['severity']] ?? 0;
            
            if ($aSeverity === $bSeverity) {
                return $b['timestamp'] <=> $a['timestamp'];
            }
            
            return $bSeverity <=> $aSeverity;
        });

        return array_slice($alerts, 0, 10); // Limit to 10 most important alerts
    }

    /**
     * Get quick stats for dashboard widgets
     */
    public function getQuickStats(int $organizationId): array
    {
        $currentMonth = Carbon::now();
        
        return [
            'total_accounts' => Account::where('organization_id', $organizationId)->count(),
            'active_budgets' => Budget::where('organization_id', $organizationId)
                                     ->where('status', 'active')
                                     ->count(),
            'pending_transactions' => Transaction::where('organization_id', $organizationId)
                                                ->where('status', 'pending')
                                                ->count(),
            'monthly_transactions' => Transaction::where('organization_id', $organizationId)
                                                ->whereMonth('transaction_date', $currentMonth->month)
                                                ->whereYear('transaction_date', $currentMonth->year)
                                                ->count(),
            'cash_balance' => $this->getCurrentCashBalance($organizationId),
            'accounts_receivable' => $this->getAccountsReceivableBalance($organizationId),
            'accounts_payable' => $this->getAccountsPayableBalance($organizationId),
        ];
    }

    /**
     * Get financial data for a specific period
     */
    private function getFinancialDataForPeriod(int $organizationId, Carbon $startDate, Carbon $endDate): array
    {
        $transactions = Transaction::where('organization_id', $organizationId)
                                  ->whereBetween('transaction_date', [$startDate, $endDate])
                                  ->where('status', 'posted')
                                  ->with('journalEntries.account')
                                  ->get();

        $revenue = 0;
        $expenses = 0;
        $cogs = 0;

        foreach ($transactions as $transaction) {
            foreach ($transaction->journalEntries as $entry) {
                $account = $entry->account;
                $amount = abs($entry->amount);

                switch ($account->type) {
                    case 'revenue':
                        $revenue += $amount;
                        break;
                    case 'expense':
                        if ($account->subtype === 'cogs') {
                            $cogs += $amount;
                        } else {
                            $expenses += $amount;
                        }
                        break;
                }
            }
        }

        return [
            'revenue' => $revenue,
            'expenses' => $expenses,
            'cogs' => $cogs,
        ];
    }

    /**
     * Calculate growth rate between two values
     */
    private function calculateGrowthRate(float $oldValue, float $newValue): float
    {
        if ($oldValue == 0) {
            return $newValue > 0 ? 100 : 0;
        }

        return (($newValue - $oldValue) / $oldValue) * 100;
    }

    /**
     * Get cash flow metrics
     */
    private function getCashFlowMetrics(int $organizationId, Carbon $startDate, Carbon $endDate): array
    {
        // Implementation for cash flow metrics
        return [
            'operating_cash_flow' => 0,
            'investing_cash_flow' => 0,
            'financing_cash_flow' => 0,
            'net_cash_flow' => 0,
            'cash_flow_trend' => 'positive', // positive, negative, stable
        ];
    }

    /**
     * Get profitability metrics
     */
    private function getProfitabilityMetrics(int $organizationId, Carbon $period): array
    {
        return [
            'gross_profit_margin' => 0,
            'net_profit_margin' => 0,
            'operating_margin' => 0,
            'return_on_assets' => 0,
            'return_on_equity' => 0,
        ];
    }

    /**
     * Get efficiency metrics
     */
    private function getEfficiencyMetrics(int $organizationId, Carbon $period): array
    {
        return [
            'asset_turnover' => 0,
            'inventory_turnover' => 0,
            'receivables_turnover' => 0,
            'payables_turnover' => 0,
        ];
    }

    /**
     * Get financial ratios
     */
    private function getFinancialRatios(int $organizationId): array
    {
        return [
            'current_ratio' => 0,
            'quick_ratio' => 0,
            'debt_to_equity' => 0,
            'debt_to_assets' => 0,
        ];
    }

    /**
     * Get trend analysis
     */
    private function getTrendAnalysis(int $organizationId, Carbon $startDate, Carbon $endDate): array
    {
        return [
            'revenue_trend' => 'increasing',
            'expense_trend' => 'stable',
            'profit_trend' => 'increasing',
            'cash_trend' => 'stable',
        ];
    }

    /**
     * Get current quarter dates
     */
    private function getCurrentQuarter(): array
    {
        $now = Carbon::now();
        $quarter = ceil($now->month / 3);
        
        $startMonth = ($quarter - 1) * 3 + 1;
        $endMonth = $quarter * 3;
        
        return [
            'start' => Carbon::create($now->year, $startMonth, 1)->startOfMonth(),
            'end' => Carbon::create($now->year, $endMonth, 1)->endOfMonth(),
        ];
    }

    /**
     * Get status color for UI
     */
    private function getStatusColor(string $status): string
    {
        return match ($status) {
            'posted', 'active', 'approved' => 'green',
            'pending', 'draft' => 'yellow',
            'cancelled', 'rejected' => 'red',
            default => 'gray',
        };
    }

    /**
     * Helper methods for specific metrics (simplified implementations)
     */
    private function getTopBudgetVariances(int $organizationId): array { return []; }
    private function getNextQuarterForecast(int $organizationId): array { return []; }
    private function getForecastAccuracyMetrics(int $organizationId): array { return []; }
    private function getForecastConfidenceLevels(int $organizationId): array { return []; }
    private function getTaxComplianceStatus(int $organizationId): array { return []; }
    private function getUpcomingTaxDeadlines(int $organizationId): array { return []; }
    private function getCashFlowAlerts(int $organizationId): array { return []; }
    private function getTaxComplianceAlerts(int $organizationId): array { return []; }
    private function getCurrentCashBalance(int $organizationId): float { return 0; }
    private function getAccountsReceivableBalance(int $organizationId): float { return 0; }
    private function getAccountsPayableBalance(int $organizationId): float { return 0; }
}
