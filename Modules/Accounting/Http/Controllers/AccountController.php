<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Services\AccountingService;
use Modules\Accounting\Http\Requests\StoreAccountRequest;
use Modules\Accounting\Http\Requests\UpdateAccountRequest;

class AccountController extends Controller
{
    public function __construct(
        private AccountingService $accountingService
    ) {}

    /**
     * Display the chart of accounts
     */
    public function index(Request $request): Response
    {
        $accounts = Account::query()
            ->with(['parent', 'children'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->type, function ($query, $type) {
                $query->where('type', $type);
            })
            ->when($request->active !== null, function ($query) use ($request) {
                $query->where('is_active', $request->boolean('active'));
            })
            ->orderBy('code')
            ->paginate(50)
            ->withQueryString();

        $accountTypes = [
            'asset' => 'Assets',
            'liability' => 'Liabilities',
            'equity' => 'Equity',
            'revenue' => 'Revenue',
            'expense' => 'Expenses',
        ];

        $accountSubtypes = [
            // Assets
            'current_asset' => 'Current Assets',
            'fixed_asset' => 'Fixed Assets',
            'other_asset' => 'Other Assets',
            // Liabilities
            'current_liability' => 'Current Liabilities',
            'long_term_liability' => 'Long-term Liabilities',
            'other_liability' => 'Other Liabilities',
            // Equity
            'owner_equity' => 'Owner\'s Equity',
            'retained_earnings' => 'Retained Earnings',
            // Revenue
            'operating_revenue' => 'Operating Revenue',
            'other_revenue' => 'Other Revenue',
            // Expenses
            'operating_expense' => 'Operating Expenses',
            'other_expense' => 'Other Expenses',
            'cost_of_goods_sold' => 'Cost of Goods Sold',
        ];

        return Inertia::render('Accounting/Accounts/Index', [
            'accounts' => $accounts,
            'accountTypes' => $accountTypes,
            'accountSubtypes' => $accountSubtypes,
            'filters' => $request->only(['search', 'type', 'active']),
        ]);
    }

    /**
     * Show the form for creating a new account
     */
    public function create(): Response
    {
        $parentAccounts = Account::query()
            ->active()
            ->whereNull('parent_id')
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'type']);

        return Inertia::render('Accounting/Accounts/Create', [
            'parentAccounts' => $parentAccounts,
        ]);
    }

    /**
     * Store a newly created account
     */
    public function store(StoreAccountRequest $request): JsonResponse
    {
        try {
            $account = $this->accountingService->createAccount($request->validated());

            return response()->json([
                'message' => 'Account created successfully',
                'account' => $account->load(['parent', 'children']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create account',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Display the specified account
     */
    public function show(Account $account): Response
    {
        $account->load([
            'parent',
            'children',
            'journalEntries' => function ($query) {
                $query->with(['transaction'])
                      ->latest()
                      ->limit(10);
            },
            'balances' => function ($query) {
                $query->latest('period_date')
                      ->limit(12);
            }
        ]);

        // Calculate recent activity
        $recentTransactions = $account->journalEntries()
            ->with(['transaction'])
            ->whereHas('transaction', function ($query) {
                $query->where('status', 'posted');
            })
            ->latest()
            ->limit(20)
            ->get();

        // Calculate balance trend
        $balanceTrend = $account->balances()
            ->where('period_type', 'monthly')
            ->orderBy('period_date')
            ->limit(12)
            ->get()
            ->map(function ($balance) {
                return [
                    'date' => $balance->period_date->format('Y-m'),
                    'balance' => $balance->closing_balance,
                ];
            });

        return Inertia::render('Accounting/Accounts/Show', [
            'account' => $account,
            'recentTransactions' => $recentTransactions,
            'balanceTrend' => $balanceTrend,
        ]);
    }

    /**
     * Show the form for editing the specified account
     */
    public function edit(Account $account): Response
    {
        if ($account->is_system) {
            abort(403, 'System accounts cannot be edited');
        }

        $parentAccounts = Account::query()
            ->active()
            ->where('id', '!=', $account->id)
            ->whereNull('parent_id')
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'type']);

        return Inertia::render('Accounting/Accounts/Edit', [
            'account' => $account,
            'parentAccounts' => $parentAccounts,
        ]);
    }

    /**
     * Update the specified account
     */
    public function update(UpdateAccountRequest $request, Account $account): JsonResponse
    {
        if ($account->is_system) {
            return response()->json([
                'message' => 'System accounts cannot be modified',
            ], 403);
        }

        try {
            $account = $this->accountingService->updateAccount($account, $request->validated());

            return response()->json([
                'message' => 'Account updated successfully',
                'account' => $account->load(['parent', 'children']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update account',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove the specified account
     */
    public function destroy(Account $account): JsonResponse
    {
        if ($account->is_system) {
            return response()->json([
                'message' => 'System accounts cannot be deleted',
            ], 403);
        }

        if (!$account->canBeDeleted()) {
            return response()->json([
                'message' => 'Account cannot be deleted because it has child accounts or journal entries',
            ], 422);
        }

        try {
            $account->delete();

            return response()->json([
                'message' => 'Account deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete account',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get account hierarchy as tree structure
     */
    public function tree(): JsonResponse
    {
        $accounts = Account::query()
            ->with(['children' => function ($query) {
                $query->orderBy('code');
            }])
            ->whereNull('parent_id')
            ->orderBy('code')
            ->get();

        return response()->json([
            'accounts' => $this->buildAccountTree($accounts),
        ]);
    }

    /**
     * Get account balance history
     */
    public function balanceHistory(Account $account, Request $request): JsonResponse
    {
        $request->validate([
            'period_type' => 'in:daily,monthly,quarterly,yearly',
            'start_date' => 'date',
            'end_date' => 'date|after:start_date',
        ]);

        $query = $account->balances()
            ->when($request->period_type, function ($query, $periodType) {
                $query->where('period_type', $periodType);
            })
            ->when($request->start_date, function ($query, $startDate) {
                $query->where('period_date', '>=', $startDate);
            })
            ->when($request->end_date, function ($query, $endDate) {
                $query->where('period_date', '<=', $endDate);
            })
            ->orderBy('period_date');

        $balances = $query->get();

        return response()->json([
            'balances' => $balances,
        ]);
    }

    /**
     * Recalculate account balance
     */
    public function recalculateBalance(Account $account): JsonResponse
    {
        try {
            $oldBalance = $account->current_balance;
            $account->updateBalance();
            $newBalance = $account->current_balance;

            return response()->json([
                'message' => 'Account balance recalculated successfully',
                'old_balance' => $oldBalance,
                'new_balance' => $newBalance,
                'difference' => $newBalance - $oldBalance,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to recalculate balance',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Build account tree structure recursively
     */
    private function buildAccountTree($accounts): array
    {
        return $accounts->map(function ($account) {
            return [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'subtype' => $account->subtype,
                'current_balance' => $account->current_balance,
                'is_active' => $account->is_active,
                'is_system' => $account->is_system,
                'children' => $this->buildAccountTree($account->children),
            ];
        })->toArray();
    }
}
