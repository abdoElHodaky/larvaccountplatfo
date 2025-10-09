<?php

namespace App\Features\Dashboard\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Services\AccountingService;
use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    protected $accountingService;

    public function __construct(AccountingService $accountingService = null)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Display the dashboard
     */
    public function index(): Response
    {
        $tenant = app('tenant');
        $user = Auth::user();

        if (!$tenant) {
            return redirect()->route('tenant.select');
        }

        // Get basic dashboard data
        $stats = $this->getDashboardStats();
        $recentActivity = $this->getRecentActivity();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentActivity' => $recentActivity,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'user',
                'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
            ],
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo' => $tenant->logo,
                'subscription_status' => $tenant->subscription_status,
            ],
        ]);
    }

    /**
     * Get dashboard statistics (API endpoint)
     */
    public function stats(): JsonResponse
    {
        $stats = $this->getDashboardStats();
        return response()->json($stats);
    }

    /**
     * Get recent activity (API endpoint)
     */
    public function recentActivity(): JsonResponse
    {
        $activity = $this->getRecentActivity();
        return response()->json($activity);
    }

    /**
     * Get dashboard statistics
     */
    protected function getDashboardStats(): array
    {
        $tenant = app('tenant');
        
        if (!$tenant || !$this->accountingService) {
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

        try {
            // Get account statistics
            $totalAccounts = $this->accountingService->getTotalAccountsCount($tenant->id);
            $totalTransactions = $this->accountingService->getTotalTransactionsCount($tenant->id);
            $pendingTransactions = $this->accountingService->getPendingTransactionsCount($tenant->id);

            // Get balance summaries by account type
            $balances = $this->accountingService->getAccountBalancesByType($tenant->id);

            // Get monthly revenue and expenses
            $monthlyStats = $this->accountingService->getMonthlyStats($tenant->id);

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
            // Log error and return default stats
            \Log::error('Dashboard stats error: ' . $e->getMessage());
            
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

    /**
     * Get recent activity
     */
    protected function getRecentActivity(): array
    {
        $tenant = app('tenant');
        
        if (!$tenant || !$this->accountingService) {
            return [];
        }

        try {
            $recentTransactions = $this->accountingService->getRecentTransactions($tenant->id, 10);
            
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
            // Log error and return empty array
            \Log::error('Dashboard recent activity error: ' . $e->getMessage());
            return [];
        }
    }
}
