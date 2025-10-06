<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\Transaction;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Services\AccountingService;
use Modules\Accounting\Http\Requests\StoreJournalEntryRequest;
use Modules\Accounting\Http\Requests\UpdateJournalEntryRequest;

class JournalEntryController extends Controller
{
    public function __construct(
        private AccountingService $accountingService
    ) {}

    /**
     * Display a listing of journal entries
     */
    public function index(Request $request): Response
    {
        // Get journal entries grouped by transaction
        $journalEntries = Transaction::query()
            ->with(['journalEntries.account'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('transaction_number', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhereHas('journalEntries', function ($je) use ($search) {
                          $je->where('description', 'like', "%{$search}%");
                      });
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
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

        // Transform data to match React component expectations
        $transformedEntries = $journalEntries->through(function ($transaction) {
            $totalDebits = $transaction->journalEntries->sum('debit_amount');
            $totalCredits = $transaction->journalEntries->sum('credit_amount');
            
            return [
                'id' => $transaction->id,
                'entry_number' => $transaction->transaction_number,
                'entry_date' => $transaction->transaction_date,
                'description' => $transaction->description,
                'total_debits' => $totalDebits,
                'total_credits' => $totalCredits,
                'status' => $transaction->status,
                'currency' => $transaction->currency,
                'is_balanced' => abs($totalDebits - $totalCredits) < 0.01,
                'journal_entries' => $transaction->journalEntries,
            ];
        });

        $journalEntryStatuses = [
            'draft' => 'Draft',
            'posted' => 'Posted',
            'reversed' => 'Reversed',
        ];

        return Inertia::render('Accounting/JournalEntries/Index', [
            'journalEntries' => $transformedEntries,
            'journalEntryStatuses' => $journalEntryStatuses,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show the form for creating a new journal entry
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

        $currencies = [
            ['value' => 'USD', 'label' => 'US Dollar (USD)'],
            ['value' => 'EUR', 'label' => 'Euro (EUR)'],
            ['value' => 'GBP', 'label' => 'British Pound (GBP)'],
            ['value' => 'CAD', 'label' => 'Canadian Dollar (CAD)'],
            ['value' => 'AUD', 'label' => 'Australian Dollar (AUD)'],
        ];

        return Inertia::render('Accounting/JournalEntries/Create', [
            'accounts' => $accounts,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Store a newly created journal entry
     */
    public function store(StoreJournalEntryRequest $request): JsonResponse
    {
        try {
            // Create transaction with journal entries
            $transactionData = array_merge($request->validated(), [
                'type' => 'journal_entry',
            ]);

            $transaction = $this->accountingService->createTransaction($transactionData);

            return response()->json([
                'message' => 'Journal entry created successfully',
                'transaction' => $transaction->load(['journalEntries.account']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create journal entry',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Display the specified journal entry
     */
    public function show(Transaction $journalEntry): Response
    {
        $journalEntry->load([
            'journalEntries' => function ($query) {
                $query->with(['account'])
                      ->orderBy('debit_amount', 'desc')
                      ->orderBy('credit_amount', 'desc');
            },
            'reversalTransaction.journalEntries.account',
            'originalTransaction.journalEntries.account'
        ]);

        // Calculate totals and balance
        $totalDebits = $journalEntry->journalEntries->sum('debit_amount');
        $totalCredits = $journalEntry->journalEntries->sum('credit_amount');
        $isBalanced = abs($totalDebits - $totalCredits) < 0.01;

        // Get affected accounts with balance changes
        $affectedAccounts = $journalEntry->journalEntries
            ->groupBy('account_id')
            ->map(function ($entries, $accountId) {
                $account = $entries->first()->account;
                $totalDebit = $entries->sum('debit_amount');
                $totalCredit = $entries->sum('credit_amount');
                $netChange = $totalDebit - $totalCredit;

                return [
                    'account' => $account,
                    'debit_amount' => $totalDebit,
                    'credit_amount' => $totalCredit,
                    'net_change' => $netChange,
                ];
            })
            ->values();

        return Inertia::render('Accounting/JournalEntries/Show', [
            'journalEntry' => $journalEntry,
            'totalDebits' => $totalDebits,
            'totalCredits' => $totalCredits,
            'isBalanced' => $isBalanced,
            'affectedAccounts' => $affectedAccounts,
        ]);
    }

    /**
     * Show the form for editing the specified journal entry
     */
    public function edit(Transaction $journalEntry): Response
    {
        if ($journalEntry->status !== 'draft') {
            abort(403, 'Only draft journal entries can be edited');
        }

        $journalEntry->load(['journalEntries.account']);

        $accounts = Account::query()
            ->active()
            ->with(['children' => function ($query) {
                $query->active()->orderBy('code');
            }])
            ->whereNull('parent_id')
            ->orderBy('code')
            ->get();

        $currencies = [
            ['value' => 'USD', 'label' => 'US Dollar (USD)'],
            ['value' => 'EUR', 'label' => 'Euro (EUR)'],
            ['value' => 'GBP', 'label' => 'British Pound (GBP)'],
            ['value' => 'CAD', 'label' => 'Canadian Dollar (CAD)'],
            ['value' => 'AUD', 'label' => 'Australian Dollar (AUD)'],
        ];

        return Inertia::render('Accounting/JournalEntries/Edit', [
            'journalEntry' => $journalEntry,
            'accounts' => $accounts,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Update the specified journal entry
     */
    public function update(UpdateJournalEntryRequest $request, Transaction $journalEntry): JsonResponse
    {
        if ($journalEntry->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft journal entries can be updated',
            ], 403);
        }

        try {
            $transaction = $this->accountingService->updateTransaction($journalEntry, $request->validated());

            return response()->json([
                'message' => 'Journal entry updated successfully',
                'transaction' => $transaction->load(['journalEntries.account']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update journal entry',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove the specified journal entry
     */
    public function destroy(Transaction $journalEntry): JsonResponse
    {
        if ($journalEntry->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft journal entries can be deleted',
            ], 403);
        }

        try {
            $journalEntry->delete();

            return response()->json([
                'message' => 'Journal entry deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete journal entry',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Post a journal entry (change status from draft to posted)
     */
    public function post(Transaction $journalEntry): JsonResponse
    {
        if ($journalEntry->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft journal entries can be posted',
            ], 403);
        }

        if (!$journalEntry->isBalanced()) {
            return response()->json([
                'message' => 'Journal entry must be balanced before posting',
            ], 422);
        }

        try {
            $transaction = $this->accountingService->postTransaction($journalEntry);

            return response()->json([
                'message' => 'Journal entry posted successfully',
                'transaction' => $transaction->load(['journalEntries.account']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to post journal entry',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Reverse a posted journal entry
     */
    public function reverse(Transaction $journalEntry, Request $request): JsonResponse
    {
        if ($journalEntry->status !== 'posted') {
            return response()->json([
                'message' => 'Only posted journal entries can be reversed',
            ], 403);
        }

        if ($journalEntry->reversed_at) {
            return response()->json([
                'message' => 'Journal entry has already been reversed',
            ], 422);
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $reversalTransaction = $this->accountingService->reverseTransaction(
                $journalEntry,
                $request->input('reason')
            );

            return response()->json([
                'message' => 'Journal entry reversed successfully',
                'original_entry' => $journalEntry->fresh(['journalEntries.account']),
                'reversal_entry' => $reversalTransaction->load(['journalEntries.account']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reverse journal entry',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get journal entry templates for common transactions
     */
    public function templates(): JsonResponse
    {
        $templates = [
            [
                'name' => 'Cash Sale',
                'description' => 'Record a cash sale transaction',
                'entries' => [
                    ['account_type' => 'asset', 'account_subtype' => 'current_asset', 'side' => 'debit'],
                    ['account_type' => 'revenue', 'account_subtype' => 'operating_revenue', 'side' => 'credit'],
                ],
            ],
            [
                'name' => 'Purchase with Cash',
                'description' => 'Record a cash purchase transaction',
                'entries' => [
                    ['account_type' => 'expense', 'account_subtype' => 'operating_expense', 'side' => 'debit'],
                    ['account_type' => 'asset', 'account_subtype' => 'current_asset', 'side' => 'credit'],
                ],
            ],
            [
                'name' => 'Loan Payment',
                'description' => 'Record a loan payment transaction',
                'entries' => [
                    ['account_type' => 'liability', 'account_subtype' => 'long_term_liability', 'side' => 'debit'],
                    ['account_type' => 'expense', 'account_subtype' => 'other_expense', 'side' => 'debit'],
                    ['account_type' => 'asset', 'account_subtype' => 'current_asset', 'side' => 'credit'],
                ],
            ],
            [
                'name' => 'Depreciation',
                'description' => 'Record depreciation expense',
                'entries' => [
                    ['account_type' => 'expense', 'account_subtype' => 'operating_expense', 'side' => 'debit'],
                    ['account_type' => 'asset', 'account_subtype' => 'fixed_asset', 'side' => 'credit'],
                ],
            ],
        ];

        return response()->json([
            'templates' => $templates,
        ]);
    }

    /**
     * Validate journal entry balance
     */
    public function validateBalance(Request $request): JsonResponse
    {
        $request->validate([
            'journal_entries' => ['required', 'array', 'min:2'],
            'journal_entries.*.debit_amount' => ['nullable', 'numeric', 'min:0'],
            'journal_entries.*.credit_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $journalEntries = $request->input('journal_entries', []);
        $totalDebits = 0;
        $totalCredits = 0;

        foreach ($journalEntries as $entry) {
            $totalDebits += (float) ($entry['debit_amount'] ?? 0);
            $totalCredits += (float) ($entry['credit_amount'] ?? 0);
        }

        $isBalanced = abs($totalDebits - $totalCredits) < 0.01;
        $difference = $totalDebits - $totalCredits;

        return response()->json([
            'is_balanced' => $isBalanced,
            'total_debits' => $totalDebits,
            'total_credits' => $totalCredits,
            'difference' => $difference,
            'message' => $isBalanced 
                ? 'Journal entry is balanced' 
                : "Journal entry is not balanced. Difference: " . number_format($difference, 2),
        ]);
    }
}
