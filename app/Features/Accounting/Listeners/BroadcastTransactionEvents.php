<?php

namespace App\Features\Accounting\Listeners;

use App\Features\Accounting\Events\TransactionCreated;
use App\Features\Accounting\Events\TransactionUpdated;
use App\Features\Dashboard\Events\MetricsUpdated;
use Illuminate\Events\Dispatcher;

class BroadcastTransactionEvents
{
    /**
     * Register the listeners for the subscriber.
     */
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            'eloquent.created: App\Features\Accounting\Models\Transaction',
            [BroadcastTransactionEvents::class, 'handleTransactionCreated']
        );

        $events->listen(
            'eloquent.updated: App\Features\Accounting\Models\Transaction',
            [BroadcastTransactionEvents::class, 'handleTransactionUpdated']
        );
    }

    /**
     * Handle transaction created event.
     */
    public function handleTransactionCreated($event, $data): void
    {
        $transaction = $data[0];

        // Broadcast transaction created event
        TransactionCreated::dispatch($transaction);

        // Update dashboard metrics
        $this->updateDashboardMetrics($transaction);
    }

    /**
     * Handle transaction updated event.
     */
    public function handleTransactionUpdated($event, $data): void
    {
        $transaction = $data[0];
        $changes = $transaction->getChanges();

        // Only broadcast if there are meaningful changes
        if (! empty($changes)) {
            TransactionUpdated::dispatch($transaction, $changes);

            // Update dashboard metrics if amount or account changed
            if (isset($changes['amount']) || isset($changes['account_id'])) {
                $this->updateDashboardMetrics($transaction);
            }
        }
    }

    /**
     * Update dashboard metrics when transactions change.
     */
    private function updateDashboardMetrics($transaction): void
    {
        try {
            // Calculate updated metrics
            $metrics = $this->calculateAccountingMetrics($transaction->organization_id);

            // Broadcast metrics update
            MetricsUpdated::dispatch(
                metrics: $metrics,
                organizationId: $transaction->organization_id,
                metricType: 'accounting'
            );
        } catch (\Exception $e) {
            // Log error but don't fail the transaction
            logger()->error('Failed to update dashboard metrics after transaction change', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Calculate accounting metrics for an organization.
     */
    private function calculateAccountingMetrics(int $organizationId): array
    {
        // Get current period (this month)
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        // Calculate revenue (credit transactions on revenue accounts)
        $totalRevenue = \DB::table('transactions')
            ->join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('transactions.organization_id', $organizationId)
            ->where('accounts.type', 'revenue')
            ->where('transactions.transaction_date', '>=', $startOfMonth)
            ->where('transactions.transaction_date', '<=', $endOfMonth)
            ->sum('transactions.credit_amount');

        // Calculate expenses (debit transactions on expense accounts)
        $totalExpenses = \DB::table('transactions')
            ->join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('transactions.organization_id', $organizationId)
            ->where('accounts.type', 'expense')
            ->where('transactions.transaction_date', '>=', $startOfMonth)
            ->where('transactions.transaction_date', '<=', $endOfMonth)
            ->sum('transactions.debit_amount');

        // Calculate net income
        $netIncome = $totalRevenue - $totalExpenses;

        // Calculate cash flow (simplified - cash account balance changes)
        $cashFlow = \DB::table('transactions')
            ->join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('transactions.organization_id', $organizationId)
            ->where('accounts.type', 'asset')
            ->where('accounts.subtype', 'cash')
            ->where('transactions.transaction_date', '>=', $startOfMonth)
            ->where('transactions.transaction_date', '<=', $endOfMonth)
            ->sum(\DB::raw('transactions.debit_amount - transactions.credit_amount'));

        // Get account balances summary
        $accountBalances = \DB::table('accounts')
            ->where('organization_id', $organizationId)
            ->where('is_active', true)
            ->select('type', \DB::raw('SUM(current_balance) as total_balance'))
            ->groupBy('type')
            ->pluck('total_balance', 'type')
            ->toArray();

        return [
            'total_revenue' => (float) $totalRevenue,
            'total_expenses' => (float) $totalExpenses,
            'net_income' => (float) $netIncome,
            'cash_flow' => (float) $cashFlow,
            'account_balances' => $accountBalances,
            'period' => [
                'start' => $startOfMonth->toDateString(),
                'end' => $endOfMonth->toDateString(),
            ],
            'updated_at' => now()->toISOString(),
        ];
    }
}
