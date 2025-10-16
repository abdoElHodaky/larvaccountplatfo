<?php

namespace App\Features\Accounting\Services;

use App\Features\Accounting\Models\Account;
use App\Features\Accounting\Models\AccountBalance;
use App\Features\Accounting\Models\JournalEntry;
use App\Features\Accounting\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AccountingService
{
    /**
     * Get accounting dashboard overview
     */
    public function getDashboardOverview(int $organizationId): array
    {
        $cacheKey = "accounting_overview_{$organizationId}";

        return Cache::remember($cacheKey, 300, function () use ($organizationId) {
            $currentYear = now()->year;
            $currentMonth = now()->month;

            // Financial summary
            $totalAssets = $this->getTotalByAccountType($organizationId, Account::TYPE_ASSET);
            $totalLiabilities = $this->getTotalByAccountType($organizationId, Account::TYPE_LIABILITY);
            $totalEquity = $this->getTotalByAccountType($organizationId, Account::TYPE_EQUITY);
            $totalRevenue = $this->getTotalByAccountType($organizationId, Account::TYPE_REVENUE, $currentYear);
            $totalExpenses = $this->getTotalByAccountType($organizationId, Account::TYPE_EXPENSE, $currentYear);

            // Recent transactions
            $recentTransactions = Transaction::where('organization_id', $organizationId)
                ->with(['journalEntries.account'])
                ->orderBy('transaction_date', 'desc')
                ->limit(10)
                ->get();

            // Pending transactions
            $pendingTransactions = Transaction::where('organization_id', $organizationId)
                ->pending()
                ->count();

            // Monthly revenue trend
            $monthlyRevenue = $this->getMonthlyRevenueTrend($organizationId, $currentYear);

            return [
                'financial_summary' => [
                    'total_assets' => $totalAssets,
                    'total_liabilities' => $totalLiabilities,
                    'total_equity' => $totalEquity,
                    'net_worth' => $totalAssets - $totalLiabilities,
                    'total_revenue' => $totalRevenue,
                    'total_expenses' => $totalExpenses,
                    'net_income' => $totalRevenue - $totalExpenses,
                ],
                'recent_transactions' => $recentTransactions,
                'pending_transactions' => $pendingTransactions,
                'monthly_revenue' => $monthlyRevenue,
                'cash_flow' => $this->getCashFlowSummary($organizationId, $currentYear),
            ];
        });
    }

    /**
     * Get chart of accounts
     */
    public function getChartOfAccounts(int $organizationId, array $filters = []): Collection
    {
        $query = Account::where('organization_id', $organizationId)
            ->with(['parent', 'children'])
            ->orderBy('code')
            ->orderBy('name');

        // Apply filters
        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['active_only'])) {
            $query->active();
        }

        if (! empty($filters['parent_id'])) {
            $query->where('parent_id', $filters['parent_id']);
        } elseif (! empty($filters['root_only'])) {
            $query->root();
        }

        return $query->get();
    }

    /**
     * Create a new account
     */
    public function createAccount(int $organizationId, array $data): Account
    {
        DB::beginTransaction();

        try {
            $data['organization_id'] = $organizationId;
            $data['created_by'] = auth()->id();

            // Generate account code if not provided
            if (empty($data['code'])) {
                $data['code'] = $this->generateAccountCode($organizationId, $data['type']);
            }

            // Set normal balance based on account type
            if (empty($data['normal_balance'])) {
                $data['normal_balance'] = $this->getDefaultNormalBalance($data['type']);
            }

            $account = Account::create($data);

            // Create initial balance record if opening balance provided
            if (! empty($data['opening_balance'])) {
                AccountBalance::create([
                    'organization_id' => $organizationId,
                    'account_id' => $account->id,
                    'balance_date' => now()->startOfYear(),
                    'balance' => $data['opening_balance'],
                    'debit_balance' => $account->isDebitAccount() ? $data['opening_balance'] : 0,
                    'credit_balance' => $account->isCreditAccount() ? $data['opening_balance'] : 0,
                    'period_type' => AccountBalance::PERIOD_YEARLY,
                    'fiscal_year' => now()->year,
                    'fiscal_period' => 1,
                ]);
            }

            DB::commit();

            // Clear cache
            $this->clearAccountingCache($organizationId);

            Log::info('Account created', ['account_id' => $account->id, 'organization_id' => $organizationId]);

            return $account;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create account', ['error' => $e->getMessage(), 'data' => $data]);
            throw $e;
        }
    }

    /**
     * Create a journal entry transaction
     */
    public function createJournalEntry(int $organizationId, array $data): Transaction
    {
        DB::beginTransaction();

        try {
            // Create transaction
            $transaction = Transaction::create([
                'organization_id' => $organizationId,
                'transaction_date' => $data['transaction_date'],
                'reference_number' => $data['reference_number'] ?? null,
                'description' => $data['description'],
                'total_amount' => $data['total_amount'],
                'status' => Transaction::STATUS_DRAFT,
                'type' => Transaction::TYPE_JOURNAL_ENTRY,
                'currency' => $data['currency'] ?? 'USD',
                'fiscal_year' => Carbon::parse($data['transaction_date'])->year,
                'fiscal_period' => Carbon::parse($data['transaction_date'])->month,
                'created_by' => auth()->id(),
            ]);

            // Create journal entries
            foreach ($data['entries'] as $entryData) {
                JournalEntry::create([
                    'organization_id' => $organizationId,
                    'account_id' => $entryData['account_id'],
                    'transaction_id' => $transaction->id,
                    'entry_date' => $data['transaction_date'],
                    'description' => $entryData['description'] ?? $data['description'],
                    'debit_amount' => $entryData['debit_amount'] ?? 0,
                    'credit_amount' => $entryData['credit_amount'] ?? 0,
                    'entry_type' => JournalEntry::TYPE_REGULAR,
                    'fiscal_year' => Carbon::parse($data['transaction_date'])->year,
                    'fiscal_period' => Carbon::parse($data['transaction_date'])->month,
                    'created_by' => auth()->id(),
                ]);
            }

            // Validate that transaction is balanced
            if (! $transaction->isBalanced()) {
                throw new \Exception('Transaction is not balanced. Debits must equal credits.');
            }

            DB::commit();

            // Clear cache
            $this->clearAccountingCache($organizationId);

            Log::info('Journal entry created', ['transaction_id' => $transaction->id]);

            return $transaction->load('journalEntries.account');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create journal entry', ['error' => $e->getMessage(), 'data' => $data]);
            throw $e;
        }
    }

    /**
     * Get trial balance
     */
    public function getTrialBalance(int $organizationId, ?Carbon $asOfDate = null): array
    {
        $asOfDate = $asOfDate ?: now();

        $accounts = Account::where('organization_id', $organizationId)
            ->active()
            ->with(['journalEntries' => function ($query) use ($asOfDate) {
                $query->where('entry_date', '<=', $asOfDate);
            }])
            ->get();

        $trialBalance = [];
        $totalDebits = 0;
        $totalCredits = 0;

        foreach ($accounts as $account) {
            $debitTotal = $account->journalEntries->sum('debit_amount');
            $creditTotal = $account->journalEntries->sum('credit_amount');

            $balance = $account->isDebitAccount()
                ? ($debitTotal - $creditTotal)
                : ($creditTotal - $debitTotal);

            if ($balance != 0) {
                $trialBalance[] = [
                    'account_id' => $account->id,
                    'account_code' => $account->code,
                    'account_name' => $account->name,
                    'account_type' => $account->type,
                    'debit_balance' => $balance > 0 && $account->isDebitAccount() ? $balance : 0,
                    'credit_balance' => $balance > 0 && $account->isCreditAccount() ? $balance : 0,
                ];

                if ($balance > 0 && $account->isDebitAccount()) {
                    $totalDebits += $balance;
                } elseif ($balance > 0 && $account->isCreditAccount()) {
                    $totalCredits += $balance;
                }
            }
        }

        return [
            'as_of_date' => $asOfDate->format('Y-m-d'),
            'accounts' => $trialBalance,
            'total_debits' => $totalDebits,
            'total_credits' => $totalCredits,
            'is_balanced' => abs($totalDebits - $totalCredits) < 0.01,
        ];
    }

    /**
     * Get general ledger for an account
     */
    public function getGeneralLedger(int $accountId, ?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $account = Account::findOrFail($accountId);
        $startDate = $startDate ?: now()->startOfYear();
        $endDate = $endDate ?: now();

        $entries = JournalEntry::where('account_id', $accountId)
            ->dateRange($startDate, $endDate)
            ->with(['transaction'])
            ->orderBy('entry_date')
            ->orderBy('id')
            ->get();

        $runningBalance = $account->opening_balance;
        $ledgerEntries = [];

        foreach ($entries as $entry) {
            if ($account->isDebitAccount()) {
                $runningBalance += $entry->debit_amount - $entry->credit_amount;
            } else {
                $runningBalance += $entry->credit_amount - $entry->debit_amount;
            }

            $ledgerEntries[] = [
                'date' => $entry->entry_date->format('Y-m-d'),
                'reference' => $entry->transaction->getFormattedReference(),
                'description' => $entry->description,
                'debit' => $entry->debit_amount,
                'credit' => $entry->credit_amount,
                'balance' => $runningBalance,
            ];
        }

        return [
            'account' => $account,
            'period' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'opening_balance' => $account->opening_balance,
            'closing_balance' => $runningBalance,
            'entries' => $ledgerEntries,
        ];
    }

    /**
     * Get total by account type
     */
    private function getTotalByAccountType(int $organizationId, string $type, ?int $year = null): float
    {
        $query = Account::where('organization_id', $organizationId)
            ->where('type', $type)
            ->active();

        if ($year) {
            return $query->withSum(['journalEntries as total_debits' => function ($q) use ($year) {
                $q->fiscalYear($year);
            }], 'debit_amount')
                ->withSum(['journalEntries as total_credits' => function ($q) use ($year) {
                    $q->fiscalYear($year);
                }], 'credit_amount')
                ->get()
                ->sum(function ($account) {
                    if ($account->isDebitAccount()) {
                        return ($account->total_debits ?? 0) - ($account->total_credits ?? 0);
                    } else {
                        return ($account->total_credits ?? 0) - ($account->total_debits ?? 0);
                    }
                });
        }

        return $query->sum('current_balance');
    }

    /**
     * Get monthly revenue trend
     */
    private function getMonthlyRevenueTrend(int $organizationId, int $year): array
    {
        $revenueAccounts = Account::where('organization_id', $organizationId)
            ->where('type', Account::TYPE_REVENUE)
            ->active()
            ->pluck('id');

        $monthlyData = [];
        for ($month = 1; $month <= 12; $month++) {
            $revenue = JournalEntry::whereIn('account_id', $revenueAccounts)
                ->where('fiscal_year', $year)
                ->where('fiscal_period', $month)
                ->sum('credit_amount') -
                      JournalEntry::whereIn('account_id', $revenueAccounts)
                          ->where('fiscal_year', $year)
                          ->where('fiscal_period', $month)
                          ->sum('debit_amount');

            $monthlyData[] = [
                'month' => $month,
                'month_name' => Carbon::create($year, $month, 1)->format('M'),
                'revenue' => $revenue,
            ];
        }

        return $monthlyData;
    }

    /**
     * Get cash flow summary
     */
    private function getCashFlowSummary(int $organizationId, int $year): array
    {
        // This is a simplified cash flow calculation
        // In a real implementation, you'd want more sophisticated cash flow analysis

        $operatingRevenue = $this->getTotalByAccountType($organizationId, Account::TYPE_REVENUE, $year);
        $operatingExpenses = $this->getTotalByAccountType($organizationId, Account::TYPE_EXPENSE, $year);

        return [
            'operating_cash_flow' => $operatingRevenue - $operatingExpenses,
            'investing_cash_flow' => 0, // Would need specific account mapping
            'financing_cash_flow' => 0, // Would need specific account mapping
            'net_cash_flow' => $operatingRevenue - $operatingExpenses,
        ];
    }

    /**
     * Generate account code
     */
    private function generateAccountCode(int $organizationId, string $type): string
    {
        $prefixes = [
            Account::TYPE_ASSET => '1',
            Account::TYPE_LIABILITY => '2',
            Account::TYPE_EQUITY => '3',
            Account::TYPE_REVENUE => '4',
            Account::TYPE_EXPENSE => '5',
        ];

        $prefix = $prefixes[$type] ?? '9';

        $lastAccount = Account::where('organization_id', $organizationId)
            ->where('type', $type)
            ->where('code', 'like', $prefix.'%')
            ->orderBy('code', 'desc')
            ->first();

        if ($lastAccount) {
            $lastNumber = (int) substr($lastAccount->code, 1);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1000; // Start from 1000
        }

        return $prefix.str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get default normal balance for account type
     */
    private function getDefaultNormalBalance(string $type): string
    {
        $debitTypes = [Account::TYPE_ASSET, Account::TYPE_EXPENSE];

        return in_array($type, $debitTypes) ? Account::NORMAL_BALANCE_DEBIT : Account::NORMAL_BALANCE_CREDIT;
    }

    /**
     * Clear accounting cache
     */
    private function clearAccountingCache(int $organizationId): void
    {
        Cache::forget("accounting_overview_{$organizationId}");
        Cache::tags(['accounting', "org_{$organizationId}"])->flush();
    }
}
