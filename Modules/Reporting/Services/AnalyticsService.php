<?php

namespace Modules\Reporting\Services;

use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\Transaction;
use Modules\Accounting\Models\JournalEntry;
use Modules\Shared\Models\Organization;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AnalyticsService
{
    /**
     * Get comprehensive dashboard analytics
     */
    public function getDashboardAnalytics(Organization $organization, Carbon $startDate = null, Carbon $endDate = null): array
    {
        $startDate = $startDate ?: now()->startOfMonth();
        $endDate = $endDate ?: now()->endOfMonth();
        
        $cacheKey = "dashboard_analytics_{$organization->id}_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, 1800, function () use ($organization, $startDate, $endDate) {
            return [
                'financial_overview' => $this->getFinancialOverview($organization, $startDate, $endDate),
                'revenue_analytics' => $this->getRevenueAnalytics($organization, $startDate, $endDate),
                'expense_analytics' => $this->getExpenseAnalytics($organization, $startDate, $endDate),
                'cash_flow_analytics' => $this->getCashFlowAnalytics($organization, $startDate, $endDate),
                'account_analytics' => $this->getAccountAnalytics($organization),
                'transaction_analytics' => $this->getTransactionAnalytics($organization, $startDate, $endDate),
                'trends' => $this->getTrendAnalytics($organization, $startDate, $endDate),
                'kpis' => $this->getKeyPerformanceIndicators($organization, $startDate, $endDate),
            ];
        });
    }

    /**
     * Get financial overview metrics
     */
    public function getFinancialOverview(Organization $organization, Carbon $startDate, Carbon $endDate): array
    {
        $currentPeriodRevenue = $this->getTotalRevenue($organization, $startDate, $endDate);
        $currentPeriodExpenses = $this->getTotalExpenses($organization, $startDate, $endDate);
        $netIncome = $currentPeriodRevenue - $currentPeriodExpenses;
        
        // Previous period comparison
        $previousStart = $startDate->copy()->subDays($endDate->diffInDays($startDate) + 1);
        $previousEnd = $startDate->copy()->subDay();
        
        $previousRevenue = $this->getTotalRevenue($organization, $previousStart, $previousEnd);
        $previousExpenses = $this->getTotalExpenses($organization, $previousStart, $previousEnd);
        $previousNetIncome = $previousRevenue - $previousExpenses;

        return [
            'current_period' => [
                'revenue' => $currentPeriodRevenue,
                'expenses' => $currentPeriodExpenses,
                'net_income' => $netIncome,
                'profit_margin' => $currentPeriodRevenue > 0 ? ($netIncome / $currentPeriodRevenue) * 100 : 0,
            ],
            'previous_period' => [
                'revenue' => $previousRevenue,
                'expenses' => $previousExpenses,
                'net_income' => $previousNetIncome,
                'profit_margin' => $previousRevenue > 0 ? ($previousNetIncome / $previousRevenue) * 100 : 0,
            ],
            'variance' => [
                'revenue' => $currentPeriodRevenue - $previousRevenue,
                'expenses' => $currentPeriodExpenses - $previousExpenses,
                'net_income' => $netIncome - $previousNetIncome,
                'revenue_growth' => $previousRevenue > 0 ? (($currentPeriodRevenue - $previousRevenue) / $previousRevenue) * 100 : 0,
            ],
            'balance_sheet_summary' => $this->getBalanceSheetSummary($organization, $endDate),
        ];
    }

    /**
     * Get revenue analytics
     */
    public function getRevenueAnalytics(Organization $organization, Carbon $startDate, Carbon $endDate): array
    {
        $revenueAccounts = Account::where('organization_id', $organization->id)
            ->where('type', Account::TYPE_REVENUE)
            ->where('is_active', true)
            ->get();

        $revenueByAccount = [];
        $totalRevenue = 0;

        foreach ($revenueAccounts as $account) {
            $amount = $this->getAccountBalanceForPeriod($account, $startDate, $endDate);
            if ($amount > 0) {
                $revenueByAccount[] = [
                    'account' => $account,
                    'amount' => $amount,
                    'percentage' => 0, // Will be calculated after total
                ];
                $totalRevenue += $amount;
            }
        }

        // Calculate percentages
        foreach ($revenueByAccount as &$item) {
            $item['percentage'] = $totalRevenue > 0 ? ($item['amount'] / $totalRevenue) * 100 : 0;
        }

        return [
            'total_revenue' => $totalRevenue,
            'revenue_by_account' => $revenueByAccount,
            'daily_revenue' => $this->getDailyRevenue($organization, $startDate, $endDate),
            'monthly_revenue_trend' => $this->getMonthlyRevenueTrend($organization, $endDate),
            'revenue_growth_rate' => $this->getRevenueGrowthRate($organization, $startDate, $endDate),
        ];
    }

    /**
     * Get expense analytics
     */
    public function getExpenseAnalytics(Organization $organization, Carbon $startDate, Carbon $endDate): array
    {
        $expenseAccounts = Account::where('organization_id', $organization->id)
            ->where('type', Account::TYPE_EXPENSE)
            ->where('is_active', true)
            ->get();

        $expensesByCategory = [];
        $totalExpenses = 0;

        foreach ($expenseAccounts as $account) {
            $amount = $this->getAccountBalanceForPeriod($account, $startDate, $endDate);
            if ($amount > 0) {
                $category = $account->subtype;
                
                if (!isset($expensesByCategory[$category])) {
                    $expensesByCategory[$category] = [
                        'category' => $category,
                        'accounts' => [],
                        'total' => 0,
                        'percentage' => 0,
                    ];
                }

                $expensesByCategory[$category]['accounts'][] = [
                    'account' => $account,
                    'amount' => $amount,
                ];
                $expensesByCategory[$category]['total'] += $amount;
                $totalExpenses += $amount;
            }
        }

        // Calculate percentages
        foreach ($expensesByCategory as &$category) {
            $category['percentage'] = $totalExpenses > 0 ? ($category['total'] / $totalExpenses) * 100 : 0;
        }

        return [
            'total_expenses' => $totalExpenses,
            'expenses_by_category' => array_values($expensesByCategory),
            'daily_expenses' => $this->getDailyExpenses($organization, $startDate, $endDate),
            'top_expense_accounts' => $this->getTopExpenseAccounts($organization, $startDate, $endDate, 10),
            'expense_trend' => $this->getExpenseTrend($organization, $endDate),
        ];
    }

    /**
     * Get cash flow analytics
     */
    public function getCashFlowAnalytics(Organization $organization, Carbon $startDate, Carbon $endDate): array
    {
        $cashAccounts = $this->getCashAccounts($organization);
        $beginningCash = $this->getCashBalance($organization, $startDate->copy()->subDay());
        $endingCash = $this->getCashBalance($organization, $endDate);
        $netCashFlow = $endingCash - $beginningCash;

        return [
            'beginning_cash' => $beginningCash,
            'ending_cash' => $endingCash,
            'net_cash_flow' => $netCashFlow,
            'cash_flow_trend' => $this->getCashFlowTrend($organization, $startDate, $endDate),
            'cash_by_account' => $this->getCashByAccount($organization, $endDate),
            'burn_rate' => $this->getCashBurnRate($organization, $startDate, $endDate),
            'runway_months' => $this->getCashRunwayMonths($organization, $endDate),
        ];
    }

    /**
     * Get account analytics
     */
    public function getAccountAnalytics(Organization $organization): array
    {
        return [
            'total_accounts' => Account::where('organization_id', $organization->id)->count(),
            'active_accounts' => Account::where('organization_id', $organization->id)->where('is_active', true)->count(),
            'accounts_by_type' => $this->getAccountsByType($organization),
            'accounts_with_zero_balance' => $this->getAccountsWithZeroBalance($organization),
            'recently_created_accounts' => $this->getRecentlyCreatedAccounts($organization, 30),
        ];
    }

    /**
     * Get transaction analytics
     */
    public function getTransactionAnalytics(Organization $organization, Carbon $startDate, Carbon $endDate): array
    {
        $totalTransactions = Transaction::where('organization_id', $organization->id)
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->count();

        $totalJournalEntries = JournalEntry::where('organization_id', $organization->id)
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->count();

        return [
            'total_transactions' => $totalTransactions,
            'total_journal_entries' => $totalJournalEntries,
            'average_transactions_per_day' => $totalTransactions / max(1, $endDate->diffInDays($startDate) + 1),
            'transactions_by_day' => $this->getTransactionsByDay($organization, $startDate, $endDate),
            'largest_transactions' => $this->getLargestTransactions($organization, $startDate, $endDate, 10),
            'transaction_volume_trend' => $this->getTransactionVolumeTrend($organization, $endDate),
        ];
    }

    /**
     * Get trend analytics
     */
    public function getTrendAnalytics(Organization $organization, Carbon $startDate, Carbon $endDate): array
    {
        return [
            'revenue_trend' => $this->getMonthlyRevenueTrend($organization, $endDate, 12),
            'expense_trend' => $this->getMonthlyExpenseTrend($organization, $endDate, 12),
            'profit_trend' => $this->getMonthlyProfitTrend($organization, $endDate, 12),
            'cash_trend' => $this->getMonthlyCashTrend($organization, $endDate, 12),
        ];
    }

    /**
     * Get key performance indicators
     */
    public function getKeyPerformanceIndicators(Organization $organization, Carbon $startDate, Carbon $endDate): array
    {
        $revenue = $this->getTotalRevenue($organization, $startDate, $endDate);
        $expenses = $this->getTotalExpenses($organization, $startDate, $endDate);
        $netIncome = $revenue - $expenses;
        $totalAssets = $this->getTotalAssets($organization, $endDate);
        $totalEquity = $this->getTotalEquity($organization, $endDate);

        return [
            'profit_margin' => $revenue > 0 ? ($netIncome / $revenue) * 100 : 0,
            'return_on_assets' => $totalAssets > 0 ? ($netIncome / $totalAssets) * 100 : 0,
            'return_on_equity' => $totalEquity > 0 ? ($netIncome / $totalEquity) * 100 : 0,
            'expense_ratio' => $revenue > 0 ? ($expenses / $revenue) * 100 : 0,
            'current_ratio' => $this->getCurrentRatio($organization, $endDate),
            'quick_ratio' => $this->getQuickRatio($organization, $endDate),
            'debt_to_equity' => $this->getDebtToEquityRatio($organization, $endDate),
            'working_capital' => $this->getWorkingCapital($organization, $endDate),
        ];
    }

    /**
     * Helper methods for calculations
     */
    protected function getTotalRevenue(Organization $organization, Carbon $startDate, Carbon $endDate): float
    {
        return Transaction::join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('accounts.organization_id', $organization->id)
            ->where('accounts.type', Account::TYPE_REVENUE)
            ->whereBetween('transactions.transaction_date', [$startDate, $endDate])
            ->sum(DB::raw('transactions.credit_amount - transactions.debit_amount'));
    }

    protected function getTotalExpenses(Organization $organization, Carbon $startDate, Carbon $endDate): float
    {
        return Transaction::join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('accounts.organization_id', $organization->id)
            ->where('accounts.type', Account::TYPE_EXPENSE)
            ->whereBetween('transactions.transaction_date', [$startDate, $endDate])
            ->sum(DB::raw('transactions.debit_amount - transactions.credit_amount'));
    }

    protected function getTotalAssets(Organization $organization, Carbon $asOfDate): float
    {
        return Transaction::join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('accounts.organization_id', $organization->id)
            ->where('accounts.type', Account::TYPE_ASSET)
            ->where('transactions.transaction_date', '<=', $asOfDate)
            ->sum(DB::raw('transactions.debit_amount - transactions.credit_amount'));
    }

    protected function getTotalEquity(Organization $organization, Carbon $asOfDate): float
    {
        return Transaction::join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('accounts.organization_id', $organization->id)
            ->where('accounts.type', Account::TYPE_EQUITY)
            ->where('transactions.transaction_date', '<=', $asOfDate)
            ->sum(DB::raw('transactions.credit_amount - transactions.debit_amount'));
    }

    protected function getAccountBalanceForPeriod(Account $account, Carbon $startDate, Carbon $endDate): float
    {
        return Transaction::where('account_id', $account->id)
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum(DB::raw('debit_amount - credit_amount'));
    }

    protected function getCashBalance(Organization $organization, Carbon $asOfDate): float
    {
        $cashAccounts = $this->getCashAccounts($organization);
        $totalCash = 0;

        foreach ($cashAccounts as $account) {
            $balance = Transaction::where('account_id', $account->id)
                ->where('transaction_date', '<=', $asOfDate)
                ->sum(DB::raw('debit_amount - credit_amount'));
            $totalCash += $balance;
        }

        return $totalCash;
    }

    protected function getCashAccounts(Organization $organization)
    {
        return Account::where('organization_id', $organization->id)
            ->where('type', Account::TYPE_ASSET)
            ->where(function ($query) {
                $query->where('name', 'LIKE', '%cash%')
                      ->orWhere('name', 'LIKE', '%bank%')
                      ->orWhere('subtype', Account::SUBTYPE_CURRENT_ASSET);
            })
            ->get();
    }

    protected function getDailyRevenue(Organization $organization, Carbon $startDate, Carbon $endDate): array
    {
        return Transaction::join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('accounts.organization_id', $organization->id)
            ->where('accounts.type', Account::TYPE_REVENUE)
            ->whereBetween('transactions.transaction_date', [$startDate, $endDate])
            ->selectRaw('DATE(transaction_date) as date, SUM(credit_amount - debit_amount) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    protected function getMonthlyRevenueTrend(Organization $organization, Carbon $endDate, int $months = 6): array
    {
        $startDate = $endDate->copy()->subMonths($months - 1)->startOfMonth();
        
        return Transaction::join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('accounts.organization_id', $organization->id)
            ->where('accounts.type', Account::TYPE_REVENUE)
            ->whereBetween('transactions.transaction_date', [$startDate, $endDate])
            ->selectRaw('YEAR(transaction_date) as year, MONTH(transaction_date) as month, SUM(credit_amount - debit_amount) as revenue')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'period' => Carbon::create($item->year, $item->month)->format('M Y'),
                    'revenue' => $item->revenue,
                ];
            })
            ->toArray();
    }

    protected function getBalanceSheetSummary(Organization $organization, Carbon $asOfDate): array
    {
        return [
            'total_assets' => $this->getTotalAssets($organization, $asOfDate),
            'total_liabilities' => $this->getTotalLiabilities($organization, $asOfDate),
            'total_equity' => $this->getTotalEquity($organization, $asOfDate),
        ];
    }

    protected function getTotalLiabilities(Organization $organization, Carbon $asOfDate): float
    {
        return Transaction::join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('accounts.organization_id', $organization->id)
            ->where('accounts.type', Account::TYPE_LIABILITY)
            ->where('transactions.transaction_date', '<=', $asOfDate)
            ->sum(DB::raw('transactions.credit_amount - transactions.debit_amount'));
    }

    protected function getCurrentRatio(Organization $organization, Carbon $asOfDate): float
    {
        $currentAssets = Transaction::join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('accounts.organization_id', $organization->id)
            ->where('accounts.type', Account::TYPE_ASSET)
            ->where('accounts.subtype', Account::SUBTYPE_CURRENT_ASSET)
            ->where('transactions.transaction_date', '<=', $asOfDate)
            ->sum(DB::raw('transactions.debit_amount - transactions.credit_amount'));

        $currentLiabilities = Transaction::join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('accounts.organization_id', $organization->id)
            ->where('accounts.type', Account::TYPE_LIABILITY)
            ->where('accounts.subtype', Account::SUBTYPE_CURRENT_LIABILITY)
            ->where('transactions.transaction_date', '<=', $asOfDate)
            ->sum(DB::raw('transactions.credit_amount - transactions.debit_amount'));

        return $currentLiabilities > 0 ? $currentAssets / $currentLiabilities : 0;
    }

    protected function getQuickRatio(Organization $organization, Carbon $asOfDate): float
    {
        // Quick assets = Current assets - Inventory
        $currentAssets = $this->getCurrentRatio($organization, $asOfDate) * $this->getCurrentLiabilities($organization, $asOfDate);
        $inventory = $this->getInventoryBalance($organization, $asOfDate);
        $quickAssets = $currentAssets - $inventory;
        
        $currentLiabilities = $this->getCurrentLiabilities($organization, $asOfDate);
        
        return $currentLiabilities > 0 ? $quickAssets / $currentLiabilities : 0;
    }

    protected function getCurrentLiabilities(Organization $organization, Carbon $asOfDate): float
    {
        return Transaction::join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('accounts.organization_id', $organization->id)
            ->where('accounts.type', Account::TYPE_LIABILITY)
            ->where('accounts.subtype', Account::SUBTYPE_CURRENT_LIABILITY)
            ->where('transactions.transaction_date', '<=', $asOfDate)
            ->sum(DB::raw('transactions.credit_amount - transactions.debit_amount'));
    }

    protected function getInventoryBalance(Organization $organization, Carbon $asOfDate): float
    {
        return Transaction::join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('accounts.organization_id', $organization->id)
            ->where('accounts.type', Account::TYPE_ASSET)
            ->where('accounts.name', 'LIKE', '%inventory%')
            ->where('transactions.transaction_date', '<=', $asOfDate)
            ->sum(DB::raw('transactions.debit_amount - transactions.credit_amount'));
    }

    protected function getDebtToEquityRatio(Organization $organization, Carbon $asOfDate): float
    {
        $totalLiabilities = $this->getTotalLiabilities($organization, $asOfDate);
        $totalEquity = $this->getTotalEquity($organization, $asOfDate);
        
        return $totalEquity > 0 ? $totalLiabilities / $totalEquity : 0;
    }

    protected function getWorkingCapital(Organization $organization, Carbon $asOfDate): float
    {
        $currentAssets = Transaction::join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('accounts.organization_id', $organization->id)
            ->where('accounts.type', Account::TYPE_ASSET)
            ->where('accounts.subtype', Account::SUBTYPE_CURRENT_ASSET)
            ->where('transactions.transaction_date', '<=', $asOfDate)
            ->sum(DB::raw('transactions.debit_amount - transactions.credit_amount'));

        $currentLiabilities = $this->getCurrentLiabilities($organization, $asOfDate);
        
        return $currentAssets - $currentLiabilities;
    }

    // Additional helper methods would be implemented here...
    // For brevity, I'm including the key ones above
}

