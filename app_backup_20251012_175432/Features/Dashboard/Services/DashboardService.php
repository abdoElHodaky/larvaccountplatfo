<?php

namespace App\Features\Dashboard\Services;

use Illuminate\Support\Facades\Log;
use Modules\Accounting\Services\AccountingService;

class DashboardService
{
    protected $accountingService;

    public function __construct(?AccountingService $accountingService = null)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Get dashboard statistics for a tenant
     */
    public function getDashboardStats(int $tenantId): array
    {
        if (! $this->accountingService) {
            return $this->getDefaultStats();
        }

        try {
            // Get account statistics
            $totalAccounts = $this->accountingService->getTotalAccountsCount($tenantId);
            $totalTransactions = $this->accountingService->getTotalTransactionsCount($tenantId);
            $pendingTransactions = $this->accountingService->getPendingTransactionsCount($tenantId);

            // Get balance summaries by account type
            $balances = $this->accountingService->getAccountBalancesByType($tenantId);

            // Get monthly revenue and expenses
            $monthlyStats = $this->accountingService->getMonthlyStats($tenantId);

            return [
                'total_accounts' => $totalAccounts,
                'total_transactions' => $totalTransactions,
                'total_balance' => $balances['assets'] - $balances['liabilities'],
                'monthly_revenue' => $monthlyStats['revenue'] ?? 0,
                'monthly_expenses' => $monthlyStats['expenses'] ?? 0,
                'pending_transactions' => $pendingTransactions,
                'account_balances' => [
                    'assets' => $balances['assets'] ?? 0,
                    'liabilities' => $balances['liabilities'] ?? 0,
                    'equity' => $balances['equity'] ?? 0,
                    'revenue' => $balances['revenue'] ?? 0,
                    'expenses' => $balances['expenses'] ?? 0,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Dashboard stats error: '.$e->getMessage());

            return $this->getDefaultStats();
        }
    }

    /**
     * Get recent activity for a tenant
     */
    public function getRecentActivity(int $tenantId, int $limit = 10): array
    {
        if (! $this->accountingService) {
            return [];
        }

        try {
            $recentTransactions = $this->accountingService->getRecentTransactions($tenantId, $limit);

            return $recentTransactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'transaction_number' => $transaction->transaction_number,
                    'type' => $transaction->type,
                    'description' => $transaction->description,
                    'total_amount' => $transaction->total_amount,
                    'currency' => $transaction->currency,
                    'status' => $transaction->status,
                    'transaction_date' => $transaction->transaction_date,
                    'created_at' => $transaction->created_at,
                ];
            })->toArray();
        } catch (\Exception $e) {
            Log::error('Dashboard recent activity error: '.$e->getMessage());

            return [];
        }
    }

    /**
     * Get default statistics when accounting service is unavailable
     */
    protected function getDefaultStats(): array
    {
        return [
            'total_accounts' => 0,
            'total_transactions' => 0,
            'total_balance' => 0,
            'monthly_revenue' => 0,
            'monthly_expenses' => 0,
            'pending_transactions' => 0,
            'account_balances' => [
                'assets' => 0,
                'liabilities' => 0,
                'equity' => 0,
                'revenue' => 0,
                'expenses' => 0,
            ],
        ];
    }
}
