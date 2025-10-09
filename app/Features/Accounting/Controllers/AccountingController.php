<?php

namespace App\Features\Accounting\Controllers;

use App\Features\Accounting\Models\Account;
use App\Features\Accounting\Models\Transaction;
use App\Features\Accounting\Services\AccountingService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AccountingController extends Controller
{
    protected $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
        $this->middleware('auth');
        $this->middleware('tenant');
    }

    /**
     * Display accounting dashboard
     */
    public function index(): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $overview = $this->accountingService->getDashboardOverview($organizationId);

            return response()->json([
                'success' => true,
                'data' => $overview,
                'message' => 'Accounting dashboard data retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve accounting dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get chart of accounts
     */
    public function chartOfAccounts(Request $request): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            
            $filters = $request->only(['type', 'active_only', 'parent_id', 'root_only']);
            $accounts = $this->accountingService->getChartOfAccounts($organizationId, $filters);

            return response()->json([
                'success' => true,
                'data' => $accounts,
                'message' => 'Chart of accounts retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve chart of accounts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new account
     */
    public function createAccount(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:accounts,code',
            'description' => 'nullable|string',
            'type' => 'required|in:asset,liability,equity,revenue,expense',
            'subtype' => 'nullable|string',
            'parent_id' => 'nullable|exists:accounts,id',
            'normal_balance' => 'nullable|in:debit,credit',
            'currency' => 'nullable|string|max:3',
            'opening_balance' => 'nullable|numeric',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $organizationId = $this->getCurrentOrganizationId();
            $account = $this->accountingService->createAccount($organizationId, $validator->validated());

            return response()->json([
                'success' => true,
                'data' => $account->load(['parent', 'children']),
                'message' => 'Account created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified account
     */
    public function showAccount(Account $account): JsonResponse
    {
        try {
            $this->authorize('view', $account);

            $account->load(['parent', 'children', 'balances' => function ($query) {
                $query->latest('balance_date')->limit(12);
            }]);

            return response()->json([
                'success' => true,
                'data' => $account,
                'message' => 'Account retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified account
     */
    public function updateAccount(Request $request, Account $account): JsonResponse
    {
        $this->authorize('update', $account);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50|unique:accounts,code,' . $account->id,
            'description' => 'nullable|string',
            'type' => 'sometimes|required|in:asset,liability,equity,revenue,expense',
            'subtype' => 'nullable|string',
            'parent_id' => 'nullable|exists:accounts,id',
            'normal_balance' => 'nullable|in:debit,credit',
            'currency' => 'nullable|string|max:3',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $account->update($validator->validated());

            return response()->json([
                'success' => true,
                'data' => $account->load(['parent', 'children']),
                'message' => 'Account updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a journal entry
     */
    public function createJournalEntry(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'transaction_date' => 'required|date',
            'reference_number' => 'nullable|string|max:100',
            'description' => 'required|string|max:500',
            'total_amount' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'entries' => 'required|array|min:2',
            'entries.*.account_id' => 'required|exists:accounts,id',
            'entries.*.description' => 'nullable|string|max:255',
            'entries.*.debit_amount' => 'nullable|numeric|min:0',
            'entries.*.credit_amount' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $organizationId = $this->getCurrentOrganizationId();
            $transaction = $this->accountingService->createJournalEntry($organizationId, $validator->validated());

            return response()->json([
                'success' => true,
                'data' => $transaction,
                'message' => 'Journal entry created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create journal entry',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trial balance
     */
    public function trialBalance(Request $request): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $asOfDate = $request->get('as_of_date') ? Carbon::parse($request->get('as_of_date')) : null;
            
            $trialBalance = $this->accountingService->getTrialBalance($organizationId, $asOfDate);

            return response()->json([
                'success' => true,
                'data' => $trialBalance,
                'message' => 'Trial balance retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve trial balance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get general ledger for an account
     */
    public function generalLedger(Request $request, Account $account): JsonResponse
    {
        try {
            $this->authorize('view', $account);

            $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : null;
            $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : null;
            
            $ledger = $this->accountingService->getGeneralLedger($account->id, $startDate, $endDate);

            return response()->json([
                'success' => true,
                'data' => $ledger,
                'message' => 'General ledger retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve general ledger',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get transactions
     */
    public function transactions(Request $request): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            
            $query = Transaction::where('organization_id', $organizationId)
                               ->with(['journalEntries.account']);

            // Apply filters
            if ($request->has('status')) {
                $query->where('status', $request->get('status'));
            }

            if ($request->has('type')) {
                $query->where('type', $request->get('type'));
            }

            if ($request->has('start_date') && $request->has('end_date')) {
                $query->dateRange($request->get('start_date'), $request->get('end_date'));
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'transaction_date');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $perPage = $request->get('per_page', 15);
            $transactions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $transactions,
                'message' => 'Transactions retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve transactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a specific transaction
     */
    public function showTransaction(Transaction $transaction): JsonResponse
    {
        try {
            $this->authorize('view', $transaction);

            $transaction->load(['journalEntries.account', 'creator', 'approver']);

            return response()->json([
                'success' => true,
                'data' => $transaction,
                'message' => 'Transaction retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a transaction
     */
    public function approveTransaction(Transaction $transaction): JsonResponse
    {
        try {
            $this->authorize('approve', $transaction);

            if (!$transaction->canBeApproved()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction cannot be approved in its current state'
                ], 400);
            }

            $transaction->approve();

            return response()->json([
                'success' => true,
                'data' => $transaction->fresh(),
                'message' => 'Transaction approved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Post a transaction
     */
    public function postTransaction(Transaction $transaction): JsonResponse
    {
        try {
            $this->authorize('post', $transaction);

            if (!$transaction->canBePosted()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction cannot be posted in its current state'
                ], 400);
            }

            $transaction->post();

            return response()->json([
                'success' => true,
                'data' => $transaction->fresh(),
                'message' => 'Transaction posted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to post transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current organization ID from tenant context
     */
    private function getCurrentOrganizationId(): int
    {
        // This should be implemented based on your tenant resolution logic
        return auth()->user()->current_organization_id ?? 1;
    }
}
