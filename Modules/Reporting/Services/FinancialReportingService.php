<?php

namespace Modules\Reporting\Services;

use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\Transaction;
use Modules\Shared\Models\Organization;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class FinancialReportingService
{
    /**
     * Generate Profit & Loss Statement
     */
    public function generateProfitLoss(Organization $organization, Carbon $startDate, Carbon $endDate, array $options = []): array
    {
        $cacheKey = "profit_loss_{$organization->id}_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, 3600, function () use ($organization, $startDate, $endDate, $options) {
            // Get revenue accounts
            $revenueAccounts = $this->getAccountBalances(
                $organization,
                Account::TYPE_REVENUE,
                $startDate,
                $endDate
            );

            // Get expense accounts
            $expenseAccounts = $this->getAccountBalances(
                $organization,
                Account::TYPE_EXPENSE,
                $startDate,
                $endDate
            );

            // Calculate totals
            $totalRevenue = $revenueAccounts->sum('balance');
            $totalExpenses = $expenseAccounts->sum('balance');
            $netIncome = $totalRevenue - $totalExpenses;

            // Group by subtypes
            $revenueBySubtype = $revenueAccounts->groupBy('subtype')->map(function ($accounts) {
                return [
                    'accounts' => $accounts,
                    'total' => $accounts->sum('balance'),
                ];
            });

            $expensesBySubtype = $expenseAccounts->groupBy('subtype')->map(function ($accounts) {
                return [
                    'accounts' => $accounts,
                    'total' => $accounts->sum('balance'),
                ];
            });

            return [
                'organization' => $organization,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'revenue' => [
                    'by_subtype' => $revenueBySubtype,
                    'total' => $totalRevenue,
                ],
                'expenses' => [
                    'by_subtype' => $expensesBySubtype,
                    'total' => $totalExpenses,
                ],
                'net_income' => $netIncome,
                'margins' => [
                    'gross_margin' => $totalRevenue > 0 ? (($totalRevenue - $this->getCostOfGoodsSold($organization, $startDate, $endDate)) / $totalRevenue) * 100 : 0,
                    'net_margin' => $totalRevenue > 0 ? ($netIncome / $totalRevenue) * 100 : 0,
                ],
                'generated_at' => now(),
            ];
        });
    }

    /**
     * Generate Balance Sheet
     */
    public function generateBalanceSheet(Organization $organization, Carbon $asOfDate, array $options = []): array
    {
        $cacheKey = "balance_sheet_{$organization->id}_{$asOfDate->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, 3600, function () use ($organization, $asOfDate, $options) {
            // Get asset accounts
            $assetAccounts = $this->getAccountBalances(
                $organization,
                Account::TYPE_ASSET,
                null,
                $asOfDate
            );

            // Get liability accounts
            $liabilityAccounts = $this->getAccountBalances(
                $organization,
                Account::TYPE_LIABILITY,
                null,
                $asOfDate
            );

            // Get equity accounts
            $equityAccounts = $this->getAccountBalances(
                $organization,
                Account::TYPE_EQUITY,
                null,
                $asOfDate
            );

            // Calculate retained earnings
            $retainedEarnings = $this->calculateRetainedEarnings($organization, $asOfDate);

            // Calculate totals
            $totalAssets = $assetAccounts->sum('balance');
            $totalLiabilities = $liabilityAccounts->sum('balance');
            $totalEquity = $equityAccounts->sum('balance') + $retainedEarnings;

            // Group by subtypes
            $assetsBySubtype = $assetAccounts->groupBy('subtype')->map(function ($accounts) {
                return [
                    'accounts' => $accounts,
                    'total' => $accounts->sum('balance'),
                ];
            });

            $liabilitiesBySubtype = $liabilityAccounts->groupBy('subtype')->map(function ($accounts) {
                return [
                    'accounts' => $accounts,
                    'total' => $accounts->sum('balance'),
                ];
            });

            $equityBySubtype = $equityAccounts->groupBy('subtype')->map(function ($accounts) {
                return [
                    'accounts' => $accounts,
                    'total' => $accounts->sum('balance'),
                ];
            });

            return [
                'organization' => $organization,
                'as_of_date' => $asOfDate,
                'assets' => [
                    'by_subtype' => $assetsBySubtype,
                    'total' => $totalAssets,
                ],
                'liabilities' => [
                    'by_subtype' => $liabilitiesBySubtype,
                    'total' => $totalLiabilities,
                ],
                'equity' => [
                    'by_subtype' => $equityBySubtype,
                    'retained_earnings' => $retainedEarnings,
                    'total' => $totalEquity,
                ],
                'totals' => [
                    'assets' => $totalAssets,
                    'liabilities_and_equity' => $totalLiabilities + $totalEquity,
                    'difference' => $totalAssets - ($totalLiabilities + $totalEquity),
                ],
                'ratios' => [
                    'debt_to_equity' => $totalEquity > 0 ? $totalLiabilities / $totalEquity : 0,
                    'current_ratio' => $this->calculateCurrentRatio($assetsBySubtype, $liabilitiesBySubtype),
                    'quick_ratio' => $this->calculateQuickRatio($assetsBySubtype, $liabilitiesBySubtype),
                ],
                'generated_at' => now(),
            ];
        });
    }

    /**
     * Generate Cash Flow Statement
     */
    public function generateCashFlow(Organization $organization, Carbon $startDate, Carbon $endDate, array $options = []): array
    {
        $cacheKey = "cash_flow_{$organization->id}_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, 3600, function () use ($organization, $startDate, $endDate, $options) {
            // Get cash accounts
            $cashAccounts = Account::where('organization_id', $organization->id)
                ->where('type', Account::TYPE_ASSET)
                ->where('subtype', 'cash')
                ->pluck('id');

            // Operating activities
            $operatingCashFlow = $this->calculateOperatingCashFlow($organization, $startDate, $endDate);
            
            // Investing activities
            $investingCashFlow = $this->calculateInvestingCashFlow($organization, $startDate, $endDate);
            
            // Financing activities
            $financingCashFlow = $this->calculateFinancingCashFlow($organization, $startDate, $endDate);

            // Net change in cash
            $netCashChange = $operatingCashFlow['total'] + $investingCashFlow['total'] + $financingCashFlow['total'];

            // Beginning and ending cash balances
            $beginningCash = $this->getCashBalance($organization, $startDate->copy()->subDay());
            $endingCash = $this->getCashBalance($organization, $endDate);

            return [
                'organization' => $organization,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'operating_activities' => $operatingCashFlow,
                'investing_activities' => $investingCashFlow,
                'financing_activities' => $financingCashFlow,
                'net_change_in_cash' => $netCashChange,
                'beginning_cash' => $beginningCash,
                'ending_cash' => $endingCash,
                'reconciliation' => [
                    'calculated_ending_cash' => $beginningCash + $netCashChange,
                    'actual_ending_cash' => $endingCash,
                    'difference' => $endingCash - ($beginningCash + $netCashChange),
                ],
                'generated_at' => now(),
            ];
        });
    }

    /**
     * Generate Trial Balance
     */
    public function generateTrialBalance(Organization $organization, Carbon $asOfDate, array $options = []): array
    {
        $cacheKey = "trial_balance_{$organization->id}_{$asOfDate->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, 1800, function () use ($organization, $asOfDate, $options) {
            $accounts = Account::where('organization_id', $organization->id)
                ->where('is_active', true)
                ->orderBy('code')
                ->orderBy('name')
                ->get();

            $trialBalance = [];
            $totalDebits = 0;
            $totalCredits = 0;

            foreach ($accounts as $account) {
                $balance = $this->getAccountBalance($account, null, $asOfDate);
                
                if ($balance != 0) {
                    $debitBalance = 0;
                    $creditBalance = 0;

                    // Determine if balance is debit or credit based on account type
                    if (in_array($account->type, [Account::TYPE_ASSET, Account::TYPE_EXPENSE])) {
                        $debitBalance = $balance > 0 ? $balance : 0;
                        $creditBalance = $balance < 0 ? abs($balance) : 0;
                    } else {
                        $creditBalance = $balance > 0 ? $balance : 0;
                        $debitBalance = $balance < 0 ? abs($balance) : 0;
                    }

                    $trialBalance[] = [
                        'account' => $account,
                        'debit_balance' => $debitBalance,
                        'credit_balance' => $creditBalance,
                    ];

                    $totalDebits += $debitBalance;
                    $totalCredits += $creditBalance;
                }
            }

            return [
                'organization' => $organization,
                'as_of_date' => $asOfDate,
                'accounts' => $trialBalance,
                'totals' => [
                    'debits' => $totalDebits,
                    'credits' => $totalCredits,
                    'difference' => $totalDebits - $totalCredits,
                    'is_balanced' => abs($totalDebits - $totalCredits) < 0.01,
                ],
                'generated_at' => now(),
            ];
        });
    }

    /**
     * Generate KPI Dashboard
     */
    public function generateKpiDashboard(Organization $organization, Carbon $startDate, Carbon $endDate): array
    {
        $cacheKey = "kpi_dashboard_{$organization->id}_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, 1800, function () use ($organization, $startDate, $endDate) {
            $profitLoss = $this->generateProfitLoss($organization, $startDate, $endDate);
            $balanceSheet = $this->generateBalanceSheet($organization, $endDate);
            
            // Previous period for comparison
            $previousStartDate = $startDate->copy()->subDays($startDate->diffInDays($endDate) + 1);
            $previousEndDate = $startDate->copy()->subDay();
            $previousProfitLoss = $this->generateProfitLoss($organization, $previousStartDate, $previousEndDate);

            // Calculate KPIs
            $revenue = $profitLoss['revenue']['total'];
            $expenses = $profitLoss['expenses']['total'];
            $netIncome = $profitLoss['net_income'];
            $totalAssets = $balanceSheet['assets']['total'];
            $totalLiabilities = $balanceSheet['liabilities']['total'];
            $totalEquity = $balanceSheet['equity']['total'];

            $previousRevenue = $previousProfitLoss['revenue']['total'];
            $previousNetIncome = $previousProfitLoss['net_income'];

            return [
                'organization' => $organization,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'financial_performance' => [
                    'revenue' => [
                        'current' => $revenue,
                        'previous' => $previousRevenue,
                        'growth' => $previousRevenue > 0 ? (($revenue - $previousRevenue) / $previousRevenue) * 100 : 0,
                    ],
                    'net_income' => [
                        'current' => $netIncome,
                        'previous' => $previousNetIncome,
                        'growth' => $previousNetIncome != 0 ? (($netIncome - $previousNetIncome) / abs($previousNetIncome)) * 100 : 0,
                    ],
                    'profit_margin' => $revenue > 0 ? ($netIncome / $revenue) * 100 : 0,
                    'expense_ratio' => $revenue > 0 ? ($expenses / $revenue) * 100 : 0,
                ],
                'financial_position' => [
                    'total_assets' => $totalAssets,
                    'total_liabilities' => $totalLiabilities,
                    'total_equity' => $totalEquity,
                    'debt_to_equity' => $totalEquity > 0 ? $totalLiabilities / $totalEquity : 0,
                    'equity_ratio' => $totalAssets > 0 ? ($totalEquity / $totalAssets) * 100 : 0,
                ],
                'liquidity' => [
                    'current_ratio' => $balanceSheet['ratios']['current_ratio'],
                    'quick_ratio' => $balanceSheet['ratios']['quick_ratio'],
                    'cash_balance' => $this->getCashBalance($organization, $endDate),
                ],
                'efficiency' => [
                    'asset_turnover' => $totalAssets > 0 ? $revenue / $totalAssets : 0,
                    'return_on_assets' => $totalAssets > 0 ? ($netIncome / $totalAssets) * 100 : 0,
                    'return_on_equity' => $totalEquity > 0 ? ($netIncome / $totalEquity) * 100 : 0,
                ],
                'generated_at' => now(),
            ];
        });
    }

    /**
     * Get account balances for a specific type and period
     */
    protected function getAccountBalances(Organization $organization, string $accountType, ?Carbon $startDate = null, ?Carbon $endDate = null): Collection
    {
        $accounts = Account::where('organization_id', $organization->id)
            ->where('type', $accountType)
            ->where('is_active', true)
            ->get();

        return $accounts->map(function ($account) use ($startDate, $endDate) {
            $balance = $this->getAccountBalance($account, $startDate, $endDate);
            
            return [
                'account' => $account,
                'balance' => $balance,
                'subtype' => $account->subtype,
            ];
        })->filter(function ($item) {
            return $item['balance'] != 0;
        });
    }

    /**
     * Get account balance for a specific period
     */
    protected function getAccountBalance(Account $account, ?Carbon $startDate = null, ?Carbon $endDate = null): float
    {
        $query = Transaction::where('account_id', $account->id)
            ->whereHas('journalEntry', function ($q) {
                $q->where('status', JournalEntry::STATUS_POSTED);
            });

        if ($startDate && $endDate) {
            // For P&L accounts, get balance for the period
            $query->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('entry_date', [$startDate, $endDate]);
            });
        } elseif ($endDate) {
            // For balance sheet accounts, get balance as of date
            $query->whereHas('journalEntry', function ($q) use ($endDate) {
                $q->where('entry_date', '<=', $endDate);
            });
        }

        $debits = $query->sum('debit_amount');
        $credits = $query->sum('credit_amount');

        // Return balance based on account type normal balance
        if (in_array($account->type, [Account::TYPE_ASSET, Account::TYPE_EXPENSE])) {
            return $debits - $credits;
        } else {
            return $credits - $debits;
        }
    }

    /**
     * Calculate retained earnings
     */
    protected function calculateRetainedEarnings(Organization $organization, Carbon $asOfDate): float
    {
        // Get all revenue and expense transactions up to the date
        $revenueBalance = $this->getAccountBalances($organization, Account::TYPE_REVENUE, null, $asOfDate)->sum('balance');
        $expenseBalance = $this->getAccountBalances($organization, Account::TYPE_EXPENSE, null, $asOfDate)->sum('balance');
        
        return $revenueBalance - $expenseBalance;
    }

    /**
     * Calculate current ratio
     */
    protected function calculateCurrentRatio(Collection $assets, Collection $liabilities): float
    {
        $currentAssets = $assets->filter(function ($item) {
            return in_array($item['accounts']->first()->subtype ?? '', ['cash', 'accounts_receivable', 'inventory', 'prepaid']);
        })->sum('total');

        $currentLiabilities = $liabilities->filter(function ($item) {
            return in_array($item['accounts']->first()->subtype ?? '', ['accounts_payable', 'accrued_liabilities', 'short_term_debt']);
        })->sum('total');

        return $currentLiabilities > 0 ? $currentAssets / $currentLiabilities : 0;
    }

    /**
     * Calculate quick ratio
     */
    protected function calculateQuickRatio(Collection $assets, Collection $liabilities): float
    {
        $quickAssets = $assets->filter(function ($item) {
            return in_array($item['accounts']->first()->subtype ?? '', ['cash', 'accounts_receivable']);
        })->sum('total');

        $currentLiabilities = $liabilities->filter(function ($item) {
            return in_array($item['accounts']->first()->subtype ?? '', ['accounts_payable', 'accrued_liabilities', 'short_term_debt']);
        })->sum('total');

        return $currentLiabilities > 0 ? $quickAssets / $currentLiabilities : 0;
    }

    /**
     * Get cash balance as of date
     */
    protected function getCashBalance(Organization $organization, Carbon $asOfDate): float
    {
        return $this->getAccountBalances($organization, Account::TYPE_ASSET, null, $asOfDate)
            ->filter(function ($item) {
                return $item['account']->subtype === 'cash';
            })
            ->sum('balance');
    }

    /**
     * Calculate operating cash flow
     */
    protected function calculateOperatingCashFlow(Organization $organization, Carbon $startDate, Carbon $endDate): array
    {
        // This is a simplified version - in practice, you'd need more detailed cash flow analysis
        $netIncome = $this->generateProfitLoss($organization, $startDate, $endDate)['net_income'];
        
        return [
            'net_income' => $netIncome,
            'adjustments' => [],
            'working_capital_changes' => [],
            'total' => $netIncome, // Simplified
        ];
    }

    /**
     * Calculate investing cash flow
     */
    protected function calculateInvestingCashFlow(Organization $organization, Carbon $startDate, Carbon $endDate): array
    {
        return [
            'capital_expenditures' => 0,
            'asset_sales' => 0,
            'investments' => 0,
            'total' => 0,
        ];
    }

    /**
     * Calculate financing cash flow
     */
    protected function calculateFinancingCashFlow(Organization $organization, Carbon $startDate, Carbon $endDate): array
    {
        return [
            'debt_proceeds' => 0,
            'debt_payments' => 0,
            'equity_proceeds' => 0,
            'dividends_paid' => 0,
            'total' => 0,
        ];
    }

    /**
     * Get cost of goods sold
     */
    protected function getCostOfGoodsSold(Organization $organization, Carbon $startDate, Carbon $endDate): float
    {
        return $this->getAccountBalances($organization, Account::TYPE_EXPENSE, $startDate, $endDate)
            ->filter(function ($item) {
                return $item['account']->subtype === 'cost_of_goods_sold';
            })
            ->sum('balance');
    }
}

