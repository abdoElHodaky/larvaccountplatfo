<?php

namespace Modules\Reporting\Services;

use Modules\Reporting\Models\FinancialReport;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\Transaction;
use Modules\Shared\Models\Organization;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class FinancialReportingService
{
    /**
     * Generate Balance Sheet
     */
    public function generateBalanceSheet(
        Organization $organization,
        Carbon $asOfDate,
        string $currency = null,
        bool $includeComparison = false,
        Carbon $comparisonDate = null
    ): array {
        $currency = $currency ?: $organization->currency;
        $cacheKey = "balance_sheet_{$organization->id}_{$asOfDate->format('Y-m-d')}_{$currency}";
        
        return Cache::remember($cacheKey, 3600, function () use ($organization, $asOfDate, $currency, $includeComparison, $comparisonDate) {
            $balanceSheet = [
                'organization' => $organization,
                'as_of_date' => $asOfDate,
                'currency' => $currency,
                'assets' => $this->getAssetBalances($organization, $asOfDate, $currency),
                'liabilities' => $this->getLiabilityBalances($organization, $asOfDate, $currency),
                'equity' => $this->getEquityBalances($organization, $asOfDate, $currency),
            ];

            // Calculate totals
            $balanceSheet['total_assets'] = $this->calculateSectionTotal($balanceSheet['assets']);
            $balanceSheet['total_liabilities'] = $this->calculateSectionTotal($balanceSheet['liabilities']);
            $balanceSheet['total_equity'] = $this->calculateSectionTotal($balanceSheet['equity']);
            $balanceSheet['total_liabilities_equity'] = $balanceSheet['total_liabilities'] + $balanceSheet['total_equity'];

            // Verify balance sheet equation
            $balanceSheet['is_balanced'] = abs($balanceSheet['total_assets'] - $balanceSheet['total_liabilities_equity']) < 0.01;

            // Add comparison data if requested
            if ($includeComparison && $comparisonDate) {
                $balanceSheet['comparison'] = $this->generateBalanceSheet($organization, $comparisonDate, $currency, false);
                $balanceSheet['variance'] = $this->calculateBalanceSheetVariance($balanceSheet, $balanceSheet['comparison']);
            }

            return $balanceSheet;
        });
    }

    /**
     * Generate Income Statement (Profit & Loss)
     */
    public function generateIncomeStatement(
        Organization $organization,
        Carbon $startDate,
        Carbon $endDate,
        string $currency = null,
        bool $includeComparison = false,
        Carbon $comparisonStartDate = null,
        Carbon $comparisonEndDate = null
    ): array {
        $currency = $currency ?: $organization->currency;
        $cacheKey = "income_statement_{$organization->id}_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}_{$currency}";
        
        return Cache::remember($cacheKey, 1800, function () use ($organization, $startDate, $endDate, $currency, $includeComparison, $comparisonStartDate, $comparisonEndDate) {
            $incomeStatement = [
                'organization' => $organization,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'currency' => $currency,
                'revenue' => $this->getRevenueBalances($organization, $startDate, $endDate, $currency),
                'expenses' => $this->getExpenseBalances($organization, $startDate, $endDate, $currency),
            ];

            // Calculate totals and net income
            $incomeStatement['total_revenue'] = $this->calculateSectionTotal($incomeStatement['revenue']);
            $incomeStatement['total_expenses'] = $this->calculateSectionTotal($incomeStatement['expenses']);
            $incomeStatement['net_income'] = $incomeStatement['total_revenue'] - $incomeStatement['total_expenses'];

            // Calculate gross profit if COGS is present
            $cogs = $this->getCOGSBalance($organization, $startDate, $endDate, $currency);
            if ($cogs > 0) {
                $incomeStatement['cost_of_goods_sold'] = $cogs;
                $incomeStatement['gross_profit'] = $incomeStatement['total_revenue'] - $cogs;
                $incomeStatement['gross_profit_margin'] = $incomeStatement['total_revenue'] > 0 
                    ? ($incomeStatement['gross_profit'] / $incomeStatement['total_revenue']) * 100 
                    : 0;
            }

            // Add comparison data if requested
            if ($includeComparison && $comparisonStartDate && $comparisonEndDate) {
                $incomeStatement['comparison'] = $this->generateIncomeStatement(
                    $organization, 
                    $comparisonStartDate, 
                    $comparisonEndDate, 
                    $currency, 
                    false
                );
                $incomeStatement['variance'] = $this->calculateIncomeStatementVariance($incomeStatement, $incomeStatement['comparison']);
            }

            return $incomeStatement;
        });
    }

    /**
     * Generate Cash Flow Statement (Indirect Method)
     */
    public function generateCashFlowStatement(
        Organization $organization,
        Carbon $startDate,
        Carbon $endDate,
        string $currency = null
    ): array {
        $currency = $currency ?: $organization->currency;
        $cacheKey = "cash_flow_{$organization->id}_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}_{$currency}";
        
        return Cache::remember($cacheKey, 1800, function () use ($organization, $startDate, $endDate, $currency) {
            // Get net income from income statement
            $incomeStatement = $this->generateIncomeStatement($organization, $startDate, $endDate, $currency);
            $netIncome = $incomeStatement['net_income'];

            $cashFlow = [
                'organization' => $organization,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'currency' => $currency,
                'operating_activities' => $this->getOperatingCashFlow($organization, $startDate, $endDate, $currency, $netIncome),
                'investing_activities' => $this->getInvestingCashFlow($organization, $startDate, $endDate, $currency),
                'financing_activities' => $this->getFinancingCashFlow($organization, $startDate, $endDate, $currency),
            ];

            // Calculate totals
            $cashFlow['net_operating_cash_flow'] = $this->calculateSectionTotal($cashFlow['operating_activities']);
            $cashFlow['net_investing_cash_flow'] = $this->calculateSectionTotal($cashFlow['investing_activities']);
            $cashFlow['net_financing_cash_flow'] = $this->calculateSectionTotal($cashFlow['financing_activities']);
            
            $cashFlow['net_change_in_cash'] = $cashFlow['net_operating_cash_flow'] + 
                                            $cashFlow['net_investing_cash_flow'] + 
                                            $cashFlow['net_financing_cash_flow'];

            // Get beginning and ending cash balances
            $cashFlow['beginning_cash'] = $this->getCashBalance($organization, $startDate->copy()->subDay(), $currency);
            $cashFlow['ending_cash'] = $this->getCashBalance($organization, $endDate, $currency);
            
            // Verify cash flow reconciliation
            $calculatedEndingCash = $cashFlow['beginning_cash'] + $cashFlow['net_change_in_cash'];
            $cashFlow['is_reconciled'] = abs($calculatedEndingCash - $cashFlow['ending_cash']) < 0.01;

            return $cashFlow;
        });
    }

    /**
     * Generate Trial Balance
     */
    public function generateTrialBalance(
        Organization $organization,
        Carbon $asOfDate,
        string $currency = null,
        bool $includeZeroBalances = false
    ): array {
        $currency = $currency ?: $organization->currency;
        
        $accounts = Account::where('organization_id', $organization->id)
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        $trialBalance = [
            'organization' => $organization,
            'as_of_date' => $asOfDate,
            'currency' => $currency,
            'accounts' => [],
            'total_debits' => 0,
            'total_credits' => 0,
        ];

        foreach ($accounts as $account) {
            $balance = $this->getAccountBalance($account, $asOfDate, $currency);
            
            if (!$includeZeroBalances && abs($balance) < 0.01) {
                continue;
            }

            $debitBalance = 0;
            $creditBalance = 0;

            // Determine if balance should be shown as debit or credit
            if ($account->normal_balance === Account::BALANCE_DEBIT) {
                $debitBalance = $balance >= 0 ? $balance : 0;
                $creditBalance = $balance < 0 ? abs($balance) : 0;
            } else {
                $debitBalance = $balance < 0 ? abs($balance) : 0;
                $creditBalance = $balance >= 0 ? $balance : 0;
            }

            $trialBalance['accounts'][] = [
                'account' => $account,
                'balance' => $balance,
                'debit_balance' => $debitBalance,
                'credit_balance' => $creditBalance,
            ];

            $trialBalance['total_debits'] += $debitBalance;
            $trialBalance['total_credits'] += $creditBalance;
        }

        $trialBalance['is_balanced'] = abs($trialBalance['total_debits'] - $trialBalance['total_credits']) < 0.01;

        return $trialBalance;
    }

    /**
     * Get asset balances grouped by subtype
     */
    protected function getAssetBalances(Organization $organization, Carbon $asOfDate, string $currency): array
    {
        return $this->getAccountBalancesByType($organization, Account::TYPE_ASSET, $asOfDate, $currency);
    }

    /**
     * Get liability balances grouped by subtype
     */
    protected function getLiabilityBalances(Organization $organization, Carbon $asOfDate, string $currency): array
    {
        return $this->getAccountBalancesByType($organization, Account::TYPE_LIABILITY, $asOfDate, $currency);
    }

    /**
     * Get equity balances grouped by subtype
     */
    protected function getEquityBalances(Organization $organization, Carbon $asOfDate, string $currency): array
    {
        return $this->getAccountBalancesByType($organization, Account::TYPE_EQUITY, $asOfDate, $currency);
    }

    /**
     * Get revenue balances for period
     */
    protected function getRevenueBalances(Organization $organization, Carbon $startDate, Carbon $endDate, string $currency): array
    {
        return $this->getAccountBalancesByTypeForPeriod($organization, Account::TYPE_REVENUE, $startDate, $endDate, $currency);
    }

    /**
     * Get expense balances for period
     */
    protected function getExpenseBalances(Organization $organization, Carbon $startDate, Carbon $endDate, string $currency): array
    {
        return $this->getAccountBalancesByTypeForPeriod($organization, Account::TYPE_EXPENSE, $startDate, $endDate, $currency);
    }

    /**
     * Get account balances by type grouped by subtype
     */
    protected function getAccountBalancesByType(Organization $organization, string $type, Carbon $asOfDate, string $currency): array
    {
        $accounts = Account::where('organization_id', $organization->id)
            ->where('type', $type)
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        $balances = [];
        
        foreach ($accounts as $account) {
            $balance = $this->getAccountBalance($account, $asOfDate, $currency);
            
            if (abs($balance) < 0.01) {
                continue; // Skip zero balances
            }

            if (!isset($balances[$account->subtype])) {
                $balances[$account->subtype] = [
                    'subtype' => $account->subtype,
                    'accounts' => [],
                    'total' => 0,
                ];
            }

            $balances[$account->subtype]['accounts'][] = [
                'account' => $account,
                'balance' => $balance,
            ];
            
            $balances[$account->subtype]['total'] += $balance;
        }

        return array_values($balances);
    }

    /**
     * Get account balances by type for a period
     */
    protected function getAccountBalancesByTypeForPeriod(Organization $organization, string $type, Carbon $startDate, Carbon $endDate, string $currency): array
    {
        $accounts = Account::where('organization_id', $organization->id)
            ->where('type', $type)
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        $balances = [];
        
        foreach ($accounts as $account) {
            $balance = $this->getAccountBalanceForPeriod($account, $startDate, $endDate, $currency);
            
            if (abs($balance) < 0.01) {
                continue; // Skip zero balances
            }

            if (!isset($balances[$account->subtype])) {
                $balances[$account->subtype] = [
                    'subtype' => $account->subtype,
                    'accounts' => [],
                    'total' => 0,
                ];
            }

            $balances[$account->subtype]['accounts'][] = [
                'account' => $account,
                'balance' => $balance,
            ];
            
            $balances[$account->subtype]['total'] += $balance;
        }

        return array_values($balances);
    }

    /**
     * Get account balance as of a specific date
     */
    protected function getAccountBalance(Account $account, Carbon $asOfDate, string $currency): float
    {
        $balance = Transaction::where('account_id', $account->id)
            ->where('transaction_date', '<=', $asOfDate)
            ->sum(DB::raw('debit_amount - credit_amount'));

        // Convert to requested currency if needed
        if ($currency !== $account->currency) {
            $balance = $this->convertCurrency($balance, $account->currency, $currency, $asOfDate);
        }

        return (float) $balance;
    }

    /**
     * Get account balance for a specific period
     */
    protected function getAccountBalanceForPeriod(Account $account, Carbon $startDate, Carbon $endDate, string $currency): float
    {
        $balance = Transaction::where('account_id', $account->id)
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum(DB::raw('debit_amount - credit_amount'));

        // Convert to requested currency if needed
        if ($currency !== $account->currency) {
            $balance = $this->convertCurrency($balance, $account->currency, $currency, $endDate);
        }

        return (float) $balance;
    }

    /**
     * Get Cost of Goods Sold balance
     */
    protected function getCOGSBalance(Organization $organization, Carbon $startDate, Carbon $endDate, string $currency): float
    {
        $cogsAccounts = Account::where('organization_id', $organization->id)
            ->where('type', Account::TYPE_EXPENSE)
            ->where('name', 'LIKE', '%cost of goods sold%')
            ->orWhere('name', 'LIKE', '%cogs%')
            ->get();

        $totalCOGS = 0;
        foreach ($cogsAccounts as $account) {
            $totalCOGS += $this->getAccountBalanceForPeriod($account, $startDate, $endDate, $currency);
        }

        return $totalCOGS;
    }

    /**
     * Get cash balance
     */
    protected function getCashBalance(Organization $organization, Carbon $asOfDate, string $currency): float
    {
        $cashAccounts = Account::where('organization_id', $organization->id)
            ->where('type', Account::TYPE_ASSET)
            ->where(function ($query) {
                $query->where('name', 'LIKE', '%cash%')
                      ->orWhere('name', 'LIKE', '%bank%');
            })
            ->get();

        $totalCash = 0;
        foreach ($cashAccounts as $account) {
            $totalCash += $this->getAccountBalance($account, $asOfDate, $currency);
        }

        return $totalCash;
    }

    /**
     * Get operating cash flow (indirect method)
     */
    protected function getOperatingCashFlow(Organization $organization, Carbon $startDate, Carbon $endDate, string $currency, float $netIncome): array
    {
        $operatingCashFlow = [
            [
                'description' => 'Net Income',
                'amount' => $netIncome,
            ]
        ];

        // Add back non-cash expenses (depreciation, amortization)
        $depreciationAccounts = Account::where('organization_id', $organization->id)
            ->where('type', Account::TYPE_EXPENSE)
            ->where(function ($query) {
                $query->where('name', 'LIKE', '%depreciation%')
                      ->orWhere('name', 'LIKE', '%amortization%');
            })
            ->get();

        foreach ($depreciationAccounts as $account) {
            $amount = $this->getAccountBalanceForPeriod($account, $startDate, $endDate, $currency);
            if ($amount > 0) {
                $operatingCashFlow[] = [
                    'description' => $account->name,
                    'amount' => $amount,
                ];
            }
        }

        // Changes in working capital (simplified)
        $workingCapitalChanges = $this->getWorkingCapitalChanges($organization, $startDate, $endDate, $currency);
        $operatingCashFlow = array_merge($operatingCashFlow, $workingCapitalChanges);

        return $operatingCashFlow;
    }

    /**
     * Get investing cash flow
     */
    protected function getInvestingCashFlow(Organization $organization, Carbon $startDate, Carbon $endDate, string $currency): array
    {
        // This is a simplified version - in practice, you'd track specific investing activities
        $investingCashFlow = [];

        // Changes in fixed assets (simplified)
        $fixedAssetAccounts = Account::where('organization_id', $organization->id)
            ->where('type', Account::TYPE_ASSET)
            ->where('subtype', Account::SUBTYPE_NON_CURRENT_ASSET)
            ->get();

        foreach ($fixedAssetAccounts as $account) {
            $change = $this->getAccountBalanceForPeriod($account, $startDate, $endDate, $currency);
            if (abs($change) > 0.01) {
                $investingCashFlow[] = [
                    'description' => 'Change in ' . $account->name,
                    'amount' => -$change, // Negative because increase in assets uses cash
                ];
            }
        }

        return $investingCashFlow;
    }

    /**
     * Get financing cash flow
     */
    protected function getFinancingCashFlow(Organization $organization, Carbon $startDate, Carbon $endDate, string $currency): array
    {
        // This is a simplified version - in practice, you'd track specific financing activities
        $financingCashFlow = [];

        // Changes in long-term debt
        $debtAccounts = Account::where('organization_id', $organization->id)
            ->where('type', Account::TYPE_LIABILITY)
            ->where('subtype', Account::SUBTYPE_NON_CURRENT_LIABILITY)
            ->get();

        foreach ($debtAccounts as $account) {
            $change = $this->getAccountBalanceForPeriod($account, $startDate, $endDate, $currency);
            if (abs($change) > 0.01) {
                $financingCashFlow[] = [
                    'description' => 'Change in ' . $account->name,
                    'amount' => $change, // Positive because increase in liabilities provides cash
                ];
            }
        }

        // Changes in equity
        $equityAccounts = Account::where('organization_id', $organization->id)
            ->where('type', Account::TYPE_EQUITY)
            ->get();

        foreach ($equityAccounts as $account) {
            $change = $this->getAccountBalanceForPeriod($account, $startDate, $endDate, $currency);
            if (abs($change) > 0.01) {
                $financingCashFlow[] = [
                    'description' => 'Change in ' . $account->name,
                    'amount' => $change, // Positive because increase in equity provides cash
                ];
            }
        }

        return $financingCashFlow;
    }

    /**
     * Get working capital changes
     */
    protected function getWorkingCapitalChanges(Organization $organization, Carbon $startDate, Carbon $endDate, string $currency): array
    {
        $changes = [];

        // Accounts Receivable
        $arAccounts = Account::where('organization_id', $organization->id)
            ->where('type', Account::TYPE_ASSET)
            ->where('name', 'LIKE', '%receivable%')
            ->get();

        foreach ($arAccounts as $account) {
            $change = $this->getAccountBalanceForPeriod($account, $startDate, $endDate, $currency);
            if (abs($change) > 0.01) {
                $changes[] = [
                    'description' => 'Change in ' . $account->name,
                    'amount' => -$change, // Negative because increase in AR uses cash
                ];
            }
        }

        // Accounts Payable
        $apAccounts = Account::where('organization_id', $organization->id)
            ->where('type', Account::TYPE_LIABILITY)
            ->where('name', 'LIKE', '%payable%')
            ->get();

        foreach ($apAccounts as $account) {
            $change = $this->getAccountBalanceForPeriod($account, $startDate, $endDate, $currency);
            if (abs($change) > 0.01) {
                $changes[] = [
                    'description' => 'Change in ' . $account->name,
                    'amount' => $change, // Positive because increase in AP provides cash
                ];
            }
        }

        return $changes;
    }

    /**
     * Calculate section total
     */
    protected function calculateSectionTotal(array $section): float
    {
        $total = 0;
        foreach ($section as $subsection) {
            if (isset($subsection['total'])) {
                $total += $subsection['total'];
            } elseif (isset($subsection['amount'])) {
                $total += $subsection['amount'];
            }
        }
        return $total;
    }

    /**
     * Calculate balance sheet variance
     */
    protected function calculateBalanceSheetVariance(array $current, array $comparison): array
    {
        return [
            'total_assets_variance' => $current['total_assets'] - $comparison['total_assets'],
            'total_liabilities_variance' => $current['total_liabilities'] - $comparison['total_liabilities'],
            'total_equity_variance' => $current['total_equity'] - $comparison['total_equity'],
        ];
    }

    /**
     * Calculate income statement variance
     */
    protected function calculateIncomeStatementVariance(array $current, array $comparison): array
    {
        return [
            'revenue_variance' => $current['total_revenue'] - $comparison['total_revenue'],
            'expense_variance' => $current['total_expenses'] - $comparison['total_expenses'],
            'net_income_variance' => $current['net_income'] - $comparison['net_income'],
        ];
    }

    /**
     * Convert currency (simplified - in practice, use a proper exchange rate service)
     */
    protected function convertCurrency(float $amount, string $fromCurrency, string $toCurrency, Carbon $date): float
    {
        if ($fromCurrency === $toCurrency) {
            return $amount;
        }

        // This is a placeholder - implement proper currency conversion
        // You would typically use an exchange rate service or stored rates
        return $amount; // For now, return as-is
    }

    /**
     * Clear report cache
     */
    public function clearReportCache(Organization $organization, string $reportType = null): void
    {
        $pattern = $reportType 
            ? "{$reportType}_{$organization->id}_*"
            : "*_{$organization->id}_*";
            
        $keys = Cache::getRedis()->keys($pattern);
        if (!empty($keys)) {
            Cache::getRedis()->del($keys);
        }
    }
}

