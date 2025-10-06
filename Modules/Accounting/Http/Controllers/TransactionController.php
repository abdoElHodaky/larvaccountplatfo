<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Transaction;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Services\AccountingService;
use Modules\Accounting\Http\Requests\StoreTransactionRequest;
use Modules\Accounting\Http\Requests\UpdateTransactionRequest;

class TransactionController extends Controller
{
    public function __construct(
        private AccountingService $accountingService
    ) {}

    /**
     * Display a listing of transactions
     */
    public function index(Request $request): Response
    {
        $transactions = Transaction::query()
            ->with(['journalEntries.account'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('transaction_number', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('reference', 'like', "%{$search}%")
                      ->orWhere('notes', 'like', "%{$search}%");
                });
            })
            ->when($request->type, function ($query, $type) {
                $query->where('type', $type);
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->account_id, function ($query, $accountId) {
                $query->whereHas('journalEntries', function ($q) use ($accountId) {
                    $q->where('account_id', $accountId);
                });
            })
            ->when($request->date_from, function ($query, $dateFrom) {
                $query->where('transaction_date', '>=', $dateFrom);
            })
            ->when($request->date_to, function ($query, $dateTo) {
                $query->where('transaction_date', '<=', $dateTo);
            })
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString();

        $accounts = Account::query()
            ->active()
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'type']);

        $transactionTypes = [
            'journal_entry' => 'Journal Entry',
            'invoice' => 'Invoice',
            'payment' => 'Payment',
            'receipt' => 'Receipt',
            'transfer' => 'Transfer',
            'adjustment' => 'Adjustment',
            'opening_balance' => 'Opening Balance',
            'closing_entry' => 'Closing Entry',
        ];

        $transactionStatuses = [
            'draft' => 'Draft',
            'pending' => 'Pending',
            'approved' => 'Approved',
            'posted' => 'Posted',
            'cancelled' => 'Cancelled',
            'reversed' => 'Reversed',
        ];

        return Inertia::render('Accounting/Transactions/Index', [
            'transactions' => $transactions,
            'accounts' => $accounts,
            'transactionTypes' => $transactionTypes,
            'transactionStatuses' => $transactionStatuses,
            'filters' => $request->only(['search', 'type', 'status', 'account_id', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show the form for creating a new transaction
     */
    public function create(): Response
    {
        $accounts = Account::query()
            ->active()
            ->with(['children' => function ($query) {
                $query->active()->orderBy('code');
            }])
            ->whereNull('parent_id')
            ->orderBy('code')
            ->get();

        $transactionTypes = [
            'journal_entry' => 'Journal Entry',
            'invoice' => 'Invoice',
            'payment' => 'Payment',
            'receipt' => 'Receipt',
            'transfer' => 'Transfer',
            'adjustment' => 'Adjustment',
        ];

        $currencies = [
            ['value' => 'USD', 'label' => 'US Dollar (USD)'],
            ['value' => 'EUR', 'label' => 'Euro (EUR)'],
            ['value' => 'GBP', 'label' => 'British Pound (GBP)'],
            ['value' => 'CAD', 'label' => 'Canadian Dollar (CAD)'],
            ['value' => 'AUD', 'label' => 'Australian Dollar (AUD)'],
        ];

        return Inertia::render('Accounting/Transactions/Create', [
            'accounts' => $accounts,
            'transactionTypes' => $transactionTypes,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Store a newly created transaction
     */
    public function store(StoreTransactionRequest $request): JsonResponse
    {
        try {
            $transaction = $this->accountingService->createTransaction($request->validated());

            return response()->json([
                'message' => 'Transaction created successfully',
                'transaction' => $transaction->load(['journalEntries.account']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create transaction',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Display the specified transaction
     */
    public function show(Transaction $transaction): Response
    {
        $transaction->load([
            'journalEntries' => function ($query) {
                $query->with(['account'])
                      ->orderBy('debit_amount', 'desc')
                      ->orderBy('credit_amount', 'desc');
            },
            'reversalTransaction.journalEntries.account',
            'originalTransaction.journalEntries.account'
        ]);

        // Calculate totals
        $totalDebits = $transaction->journalEntries->sum('debit_amount');
        $totalCredits = $transaction->journalEntries->sum('credit_amount');
        $isBalanced = abs($totalDebits - $totalCredits) < 0.01;

        return Inertia::render('Accounting/Transactions/Show', [
            'transaction' => $transaction,
            'totalDebits' => $totalDebits,
            'totalCredits' => $totalCredits,
            'isBalanced' => $isBalanced,
        ]);
    }

    /**
     * Show the form for editing the specified transaction
     */
    public function edit(Transaction $transaction): Response
    {
        if ($transaction->status !== 'draft') {
            abort(403, 'Only draft transactions can be edited');
        }

        $transaction->load(['journalEntries.account']);

        $accounts = Account::query()
            ->active()
            ->with(['children' => function ($query) {
                $query->active()->orderBy('code');
            }])
            ->whereNull('parent_id')
            ->orderBy('code')
            ->get();

        $transactionTypes = [
            'journal_entry' => 'Journal Entry',
            'invoice' => 'Invoice',
            'payment' => 'Payment',
            'receipt' => 'Receipt',
            'transfer' => 'Transfer',
            'adjustment' => 'Adjustment',
        ];

        $currencies = [
            ['value' => 'USD', 'label' => 'US Dollar (USD)'],
            ['value' => 'EUR', 'label' => 'Euro (EUR)'],
            ['value' => 'GBP', 'label' => 'British Pound (GBP)'],
            ['value' => 'CAD', 'label' => 'Canadian Dollar (CAD)'],
            ['value' => 'AUD', 'label' => 'Australian Dollar (AUD)'],
        ];

        return Inertia::render('Accounting/Transactions/Edit', [
            'transaction' => $transaction,
            'accounts' => $accounts,
            'transactionTypes' => $transactionTypes,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Update the specified transaction
     */
    public function update(UpdateTransactionRequest $request, Transaction $transaction): JsonResponse
    {
        if ($transaction->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft transactions can be updated',
            ], 403);
        }

        try {
            $transaction = $this->accountingService->updateTransaction($transaction, $request->validated());

            return response()->json([
                'message' => 'Transaction updated successfully',
                'transaction' => $transaction->load(['journalEntries.account']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update transaction',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove the specified transaction
     */
    public function destroy(Transaction $transaction): JsonResponse
    {
        if ($transaction->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft transactions can be deleted',
            ], 403);
        }

        try {
            $transaction->delete();

            return response()->json([
                'message' => 'Transaction deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete transaction',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Duplicate a transaction
     */
    public function duplicate(Transaction $transaction): JsonResponse
    {
        try {
            $duplicatedTransaction = $this->accountingService->duplicateTransaction($transaction);

            return response()->json([
                'message' => 'Transaction duplicated successfully',
                'transaction' => $duplicatedTransaction->load(['journalEntries.account']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to duplicate transaction',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Reverse a posted transaction
     */
    public function reverse(Transaction $transaction, Request $request): JsonResponse
    {
        if ($transaction->status !== 'posted') {
            return response()->json([
                'message' => 'Only posted transactions can be reversed',
            ], 403);
        }

        if ($transaction->reversed_at) {
            return response()->json([
                'message' => 'Transaction has already been reversed',
            ], 422);
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $reversalTransaction = $this->accountingService->reverseTransaction(
                $transaction,
                $request->input('reason')
            );

            return response()->json([
                'message' => 'Transaction reversed successfully',
                'original_transaction' => $transaction->fresh(['journalEntries.account']),
                'reversal_transaction' => $reversalTransaction->load(['journalEntries.account']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reverse transaction',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Post a transaction (change status from draft to posted)
     */
    public function post(Transaction $transaction): JsonResponse
    {
        if ($transaction->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft transactions can be posted',
            ], 403);
        }

        if (!$transaction->isBalanced()) {
            return response()->json([
                'message' => 'Transaction must be balanced before posting',
            ], 422);
        }

        try {
            $transaction = $this->accountingService->postTransaction($transaction);

            return response()->json([
                'message' => 'Transaction posted successfully',
                'transaction' => $transaction->load(['journalEntries.account']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to post transaction',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get transaction summary statistics
     */
    public function summary(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after:date_from',
            'account_id' => 'nullable|exists:accounts,id',
        ]);

        $query = Transaction::query()
            ->when($request->date_from, function ($query, $dateFrom) {
                $query->where('transaction_date', '>=', $dateFrom);
            })
            ->when($request->date_to, function ($query, $dateTo) {
                $query->where('transaction_date', '<=', $dateTo);
            })
            ->when($request->account_id, function ($query, $accountId) {
                $query->whereHas('journalEntries', function ($q) use ($accountId) {
                    $q->where('account_id', $accountId);
                });
            });

        $summary = [
            'total_transactions' => $query->count(),
            'total_amount' => $query->sum('total_amount'),
            'by_status' => $query->groupBy('status')
                ->selectRaw('status, count(*) as count, sum(total_amount) as total')
                ->get()
                ->keyBy('status'),
            'by_type' => $query->groupBy('type')
                ->selectRaw('type, count(*) as count, sum(total_amount) as total')
                ->get()
                ->keyBy('type'),
            'recent_activity' => Transaction::query()
                ->with(['journalEntries.account'])
                ->latest()
                ->limit(5)
                ->get(),
        ];

        return response()->json($summary);
    }
}
