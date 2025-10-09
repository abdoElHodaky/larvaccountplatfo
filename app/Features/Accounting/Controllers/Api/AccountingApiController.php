<?php

namespace App\Features\Accounting\Controllers\Api;

use App\Features\Accounting\Controllers\AccountingController;
use App\Features\Accounting\Models\Account;
use App\Features\Accounting\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AccountingApiController extends AccountingController
{
    /**
     * Get accounting dashboard data for frontend
     */
    public function dashboard(): JsonResponse
    {
        return $this->index();
    }

    /**
     * Get chart of accounts with frontend formatting
     */
    public function getChartOfAccounts(Request $request): JsonResponse
    {
        $response = $this->chartOfAccounts($request);
        $data = $response->getData(true);

        if ($data['success']) {
            // Format data for frontend tree structure
            $data['data'] = $this->formatAccountsForFrontend($data['data']);
        }

        return response()->json($data, $response->getStatusCode());
    }

    /**
     * Get accounts by type for frontend dropdowns
     */
    public function getAccountsByType(string $type): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            
            $accounts = Account::where('organization_id', $organizationId)
                             ->where('type', $type)
                             ->active()
                             ->orderBy('code')
                             ->orderBy('name')
                             ->get(['id', 'code', 'name', 'type', 'normal_balance']);

            return response()->json([
                'success' => true,
                'data' => $accounts,
                'message' => 'Accounts retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve accounts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create account via API
     */
    public function createAccountApi(Request $request): JsonResponse
    {
        return $this->createAccount($request);
    }

    /**
     * Update account via API
     */
    public function updateAccountApi(Request $request, Account $account): JsonResponse
    {
        return $this->updateAccount($request, $account);
    }

    /**
     * Get account details with frontend formatting
     */
    public function getAccount(Account $account): JsonResponse
    {
        $response = $this->showAccount($account);
        $data = $response->getData(true);

        if ($data['success']) {
            // Format data for frontend
            $data['data'] = $this->formatAccountForFrontend($data['data']);
        }

        return response()->json($data, $response->getStatusCode());
    }

    /**
     * Create journal entry via API
     */
    public function createJournalEntryApi(Request $request): JsonResponse
    {
        return $this->createJournalEntry($request);
    }

    /**
     * Get transactions with frontend formatting
     */
    public function getTransactions(Request $request): JsonResponse
    {
        $response = $this->transactions($request);
        $data = $response->getData(true);

        if ($data['success']) {
            // Format transactions for frontend
            $data['data'] = $this->formatTransactionsForFrontend($data['data']);
        }

        return response()->json($data, $response->getStatusCode());
    }

    /**
     * Get transaction details with frontend formatting
     */
    public function getTransaction(Transaction $transaction): JsonResponse
    {
        $response = $this->showTransaction($transaction);
        $data = $response->getData(true);

        if ($data['success']) {
            // Format transaction for frontend
            $data['data'] = $this->formatTransactionForFrontend($data['data']);
        }

        return response()->json($data, $response->getStatusCode());
    }

    /**
     * Get trial balance with frontend formatting
     */
    public function getTrialBalance(Request $request): JsonResponse
    {
        $response = $this->trialBalance($request);
        $data = $response->getData(true);

        if ($data['success']) {
            // Format trial balance for frontend
            $data['data'] = $this->formatTrialBalanceForFrontend($data['data']);
        }

        return response()->json($data, $response->getStatusCode());
    }

    /**
     * Get general ledger with frontend formatting
     */
    public function getGeneralLedger(Request $request, Account $account): JsonResponse
    {
        $response = $this->generalLedger($request, $account);
        $data = $response->getData(true);

        if ($data['success']) {
            // Format general ledger for frontend
            $data['data'] = $this->formatGeneralLedgerForFrontend($data['data']);
        }

        return response()->json($data, $response->getStatusCode());
    }

    /**
     * Get financial summary for dashboard widgets
     */
    public function getFinancialSummary(): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $overview = $this->accountingService->getDashboardOverview($organizationId);

            $summary = [
                'total_assets' => [
                    'value' => number_format($overview['financial_summary']['total_assets'], 2),
                    'label' => 'Total Assets',
                    'icon' => 'trending-up',
                    'color' => 'green'
                ],
                'total_liabilities' => [
                    'value' => number_format($overview['financial_summary']['total_liabilities'], 2),
                    'label' => 'Total Liabilities',
                    'icon' => 'trending-down',
                    'color' => 'red'
                ],
                'net_worth' => [
                    'value' => number_format($overview['financial_summary']['net_worth'], 2),
                    'label' => 'Net Worth',
                    'icon' => 'dollar-sign',
                    'color' => 'blue'
                ],
                'net_income' => [
                    'value' => number_format($overview['financial_summary']['net_income'], 2),
                    'label' => 'Net Income',
                    'icon' => 'bar-chart',
                    'color' => $overview['financial_summary']['net_income'] >= 0 ? 'green' : 'red'
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $summary,
                'message' => 'Financial summary retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve financial summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search accounts for frontend autocomplete
     */
    public function searchAccounts(Request $request): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $query = $request->get('q', '');
            $type = $request->get('type');
            $limit = $request->get('limit', 10);

            $accountsQuery = Account::where('organization_id', $organizationId)
                                  ->active()
                                  ->where(function ($q) use ($query) {
                                      $q->where('name', 'like', "%{$query}%")
                                        ->orWhere('code', 'like', "%{$query}%");
                                  });

            if ($type) {
                $accountsQuery->where('type', $type);
            }

            $accounts = $accountsQuery->limit($limit)->get(['id', 'code', 'name', 'type', 'normal_balance']);

            $formattedAccounts = $accounts->map(function ($account) {
                return [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'display_name' => $account->code . ' - ' . $account->name,
                    'type' => $account->type,
                    'normal_balance' => $account->normal_balance,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedAccounts,
                'message' => 'Accounts found'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Search failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format accounts for frontend tree structure
     */
    private function formatAccountsForFrontend($accounts): array
    {
        return collect($accounts)->map(function ($account) {
            return [
                'id' => $account['id'],
                'code' => $account['code'],
                'name' => $account['name'],
                'display_name' => $account['code'] . ' - ' . $account['name'],
                'description' => $account['description'],
                'type' => $account['type'],
                'subtype' => $account['subtype'],
                'normal_balance' => $account['normal_balance'],
                'current_balance' => (float) $account['current_balance'],
                'is_active' => (bool) $account['is_active'],
                'is_system' => (bool) $account['is_system'],
                'level' => $account['level'],
                'parent_id' => $account['parent_id'],
                'children' => isset($account['children']) ? $this->formatAccountsForFrontend($account['children']) : [],
                'full_path' => $account['getFullPath'] ?? $account['name'],
                'full_code_path' => $account['getFullCodePath'] ?? $account['code'],
            ];
        })->toArray();
    }

    /**
     * Format single account for frontend
     */
    private function formatAccountForFrontend($account): array
    {
        if (is_array($account)) {
            $account = (object) $account;
        }

        return [
            'id' => $account->id,
            'code' => $account->code,
            'name' => $account->name,
            'display_name' => $account->code . ' - ' . $account->name,
            'description' => $account->description,
            'type' => $account->type,
            'subtype' => $account->subtype,
            'normal_balance' => $account->normal_balance,
            'current_balance' => (float) $account->current_balance,
            'opening_balance' => (float) $account->opening_balance,
            'is_active' => (bool) $account->is_active,
            'is_system' => (bool) $account->is_system,
            'currency' => $account->currency,
            'parent' => $account->parent ? [
                'id' => $account->parent->id,
                'name' => $account->parent->name,
                'code' => $account->parent->code,
            ] : null,
            'children_count' => isset($account->children) ? count($account->children) : 0,
            'recent_balances' => isset($account->balances) ? collect($account->balances)->map(function ($balance) {
                return [
                    'date' => $balance->balance_date,
                    'balance' => (float) $balance->balance,
                ];
            })->toArray() : [],
            'created_at' => $account->created_at,
            'updated_at' => $account->updated_at,
        ];
    }

    /**
     * Format transactions for frontend
     */
    private function formatTransactionsForFrontend($transactions): array
    {
        if (isset($transactions['data'])) {
            $transactions['data'] = collect($transactions['data'])->map(function ($transaction) {
                return $this->formatTransactionForFrontend($transaction);
            })->toArray();
        }

        return $transactions;
    }

    /**
     * Format single transaction for frontend
     */
    private function formatTransactionForFrontend($transaction): array
    {
        if (is_array($transaction)) {
            $transaction = (object) $transaction;
        }

        return [
            'id' => $transaction->id,
            'reference_number' => $transaction->getFormattedReference ?? $transaction->reference_number,
            'transaction_date' => $transaction->transaction_date,
            'description' => $transaction->description,
            'total_amount' => (float) $transaction->total_amount,
            'status' => $transaction->status,
            'type' => $transaction->type,
            'currency' => $transaction->currency,
            'is_balanced' => $transaction->isBalanced ?? true,
            'can_be_edited' => $transaction->canBeEdited ?? false,
            'can_be_approved' => $transaction->canBeApproved ?? false,
            'can_be_posted' => $transaction->canBePosted ?? false,
            'entries' => isset($transaction->journal_entries) ? collect($transaction->journal_entries)->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'account' => [
                        'id' => $entry->account->id,
                        'code' => $entry->account->code,
                        'name' => $entry->account->name,
                        'display_name' => $entry->account->code . ' - ' . $entry->account->name,
                    ],
                    'description' => $entry->description,
                    'debit_amount' => (float) $entry->debit_amount,
                    'credit_amount' => (float) $entry->credit_amount,
                    'amount' => $entry->getAmount ?? max($entry->debit_amount, $entry->credit_amount),
                    'type' => $entry->getEntryType ?? ($entry->debit_amount > 0 ? 'debit' : 'credit'),
                ];
            })->toArray() : [],
            'created_at' => $transaction->created_at,
            'updated_at' => $transaction->updated_at,
        ];
    }

    /**
     * Format trial balance for frontend
     */
    private function formatTrialBalanceForFrontend($trialBalance): array
    {
        return [
            'as_of_date' => $trialBalance['as_of_date'],
            'is_balanced' => $trialBalance['is_balanced'],
            'total_debits' => (float) $trialBalance['total_debits'],
            'total_credits' => (float) $trialBalance['total_credits'],
            'accounts' => collect($trialBalance['accounts'])->map(function ($account) {
                return [
                    'account_id' => $account['account_id'],
                    'account_code' => $account['account_code'],
                    'account_name' => $account['account_name'],
                    'account_type' => $account['account_type'],
                    'debit_balance' => (float) $account['debit_balance'],
                    'credit_balance' => (float) $account['credit_balance'],
                    'display_name' => $account['account_code'] . ' - ' . $account['account_name'],
                ];
            })->toArray(),
        ];
    }

    /**
     * Format general ledger for frontend
     */
    private function formatGeneralLedgerForFrontend($ledger): array
    {
        return [
            'account' => [
                'id' => $ledger['account']->id,
                'code' => $ledger['account']->code,
                'name' => $ledger['account']->name,
                'display_name' => $ledger['account']->code . ' - ' . $ledger['account']->name,
                'type' => $ledger['account']->type,
                'normal_balance' => $ledger['account']->normal_balance,
            ],
            'period' => $ledger['period'],
            'opening_balance' => (float) $ledger['opening_balance'],
            'closing_balance' => (float) $ledger['closing_balance'],
            'entries' => collect($ledger['entries'])->map(function ($entry) {
                return [
                    'date' => $entry['date'],
                    'reference' => $entry['reference'],
                    'description' => $entry['description'],
                    'debit' => (float) $entry['debit'],
                    'credit' => (float) $entry['credit'],
                    'balance' => (float) $entry['balance'],
                ];
            })->toArray(),
        ];
    }
}
