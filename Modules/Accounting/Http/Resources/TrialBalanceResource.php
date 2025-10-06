<?php

namespace Modules\Accounting\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrialBalanceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $trialBalance = $this->resource;

        return [
            'sections' => [
                'assets' => $this->formatAccountSection($trialBalance['assets'] ?? []),
                'liabilities' => $this->formatAccountSection($trialBalance['liabilities'] ?? []),
                'equity' => $this->formatAccountSection($trialBalance['equity'] ?? []),
                'revenue' => $this->formatAccountSection($trialBalance['revenue'] ?? []),
                'expenses' => $this->formatAccountSection($trialBalance['expenses'] ?? []),
            ],
            'totals' => [
                'debits' => [
                    'amount' => $trialBalance['totals']['debits']->getAmount(),
                    'amount_float' => $trialBalance['totals']['debits']->getAmountAsFloat(),
                    'currency' => $trialBalance['totals']['debits']->getCurrency(),
                    'formatted' => $trialBalance['totals']['debits']->format(),
                ],
                'credits' => [
                    'amount' => $trialBalance['totals']['credits']->getAmount(),
                    'amount_float' => $trialBalance['totals']['credits']->getAmountAsFloat(),
                    'currency' => $trialBalance['totals']['credits']->getCurrency(),
                    'formatted' => $trialBalance['totals']['credits']->format(),
                ],
                'difference' => [
                    'amount' => $trialBalance['totals']['debits']->getAmount() - $trialBalance['totals']['credits']->getAmount(),
                    'amount_float' => $trialBalance['totals']['debits']->getAmountAsFloat() - $trialBalance['totals']['credits']->getAmountAsFloat(),
                    'is_balanced' => $trialBalance['totals']['debits']->equals($trialBalance['totals']['credits']),
                ],
            ],
            'summary' => [
                'total_accounts' => $this->countTotalAccounts($trialBalance),
                'accounts_by_type' => [
                    'assets' => count($trialBalance['assets'] ?? []),
                    'liabilities' => count($trialBalance['liabilities'] ?? []),
                    'equity' => count($trialBalance['equity'] ?? []),
                    'revenue' => count($trialBalance['revenue'] ?? []),
                    'expenses' => count($trialBalance['expenses'] ?? []),
                ],
                'is_balanced' => $trialBalance['totals']['debits']->equals($trialBalance['totals']['credits']),
                'balance_status' => $trialBalance['totals']['debits']->equals($trialBalance['totals']['credits']) ? 'balanced' : 'unbalanced',
            ],
            'generated_at' => now()->toISOString(),
        ];
    }

    /**
     * Format an account section for the trial balance.
     */
    private function formatAccountSection(array $accounts): array
    {
        return array_map(function ($accountData) {
            return [
                'account' => [
                    'id' => $accountData['account']['id'] ?? null,
                    'code' => $accountData['account']['code'] ?? null,
                    'name' => $accountData['account']['name'] ?? null,
                    'type' => $accountData['account']['type'] ?? null,
                    'subtype' => $accountData['account']['subtype'] ?? null,
                ],
                'debit_balance' => $this->formatMoney($accountData['debit_balance']),
                'credit_balance' => $this->formatMoney($accountData['credit_balance']),
                'links' => [
                    'account_details' => $accountData['account']['id'] ? route('api.accounts.show', $accountData['account']['id']) : null,
                ],
            ];
        }, $accounts);
    }

    /**
     * Format a Money object for API response.
     */
    private function formatMoney($money): array
    {
        if (!$money || !method_exists($money, 'getAmount')) {
            return [
                'amount' => 0,
                'amount_float' => 0.0,
                'currency' => 'USD',
                'formatted' => 'USD 0.00',
            ];
        }

        return [
            'amount' => $money->getAmount(),
            'amount_float' => $money->getAmountAsFloat(),
            'currency' => $money->getCurrency(),
            'formatted' => $money->format(),
        ];
    }

    /**
     * Count total accounts in the trial balance.
     */
    private function countTotalAccounts(array $trialBalance): int
    {
        return array_sum([
            count($trialBalance['assets'] ?? []),
            count($trialBalance['liabilities'] ?? []),
            count($trialBalance['equity'] ?? []),
            count($trialBalance['revenue'] ?? []),
            count($trialBalance['expenses'] ?? []),
        ]);
    }
}
