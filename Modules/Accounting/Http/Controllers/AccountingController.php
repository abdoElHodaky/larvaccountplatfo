<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\Transaction;
use Modules\Accounting\Services\ChartOfAccountsService;
use Modules\Accounting\Services\DoubleEntryService;
use Modules\Shared\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AccountingController extends Controller
{
    /**
     * The chart of accounts service.
     */
    protected $chartService;

    /**
     * The double entry service.
     */
    protected $doubleEntryService;

    /**
     * Create a new controller instance.
     */
    public function __construct(ChartOfAccountsService $chartService, DoubleEntryService $doubleEntryService)
    {
        $this->middleware('auth');
        $this->chartService = $chartService;
        $this->doubleEntryService = $doubleEntryService;
    }

    /**
     * Display the accounting dashboard.
     */
    public function dashboard()
    {
        $organization = $this->getCurrentOrganization();
        
        $dashboardData = [
            'total_accounts' => Account::where('organization_id', $organization->id)->count(),
            'active_accounts' => Account::where('organization_id', $organization->id)->where('is_active', true)->count(),
            'total_journal_entries' => JournalEntry::where('organization_id', $organization->id)->count(),
            'posted_entries' => JournalEntry::where('organization_id', $organization->id)->where('status', JournalEntry::STATUS_POSTED)->count(),
            'draft_entries' => JournalEntry::where('organization_id', $organization->id)->where('status', JournalEntry::STATUS_DRAFT)->count(),
            'recent_entries' => JournalEntry::where('organization_id', $organization->id)
                ->with(['transactions.account'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
        ];

        if (request()->wantsJson()) {
            return response()->json($dashboardData);
        }

        return view('accounting::dashboard', compact('dashboardData', 'organization'));
    }

    /**
     * Display chart of accounts.
     */
    public function chartOfAccounts(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $filters = $request->only(['type', 'subtype', 'is_active', 'is_system', 'search']);
        
        if ($request->get('hierarchical', false)) {
            $accounts = $this->chartService->getHierarchicalChart($organization, $filters);
        } else {
            $accounts = $this->chartService->getChartOfAccounts($organization, $filters);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'accounts' => $accounts,
                'account_types' => Account::getAccountTypes(),
                'account_subtypes' => Account::getAccountSubtypes(),
            ]);
        }

        return view('accounting::chart-of-accounts', compact('accounts', 'organization'));
    }

    /**
     * Show form for creating a new account.
     */
    public function createAccount()
    {
        $organization = $this->getCurrentOrganization();
        
        $parentAccounts = Account::where('organization_id', $organization->id)
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        $accountTypes = Account::getAccountTypes();
        $accountSubtypes = Account::getAccountSubtypes();

        return view('accounting::create-account', compact('parentAccounts', 'accountTypes', 'accountSubtypes', 'organization'));
    }

    /**
     * Store a new account.
     */
    public function storeAccount(Request $request)
    {
        $organization = $this->getCurrentOrganization();

        $validatedData = $request->validate([
            'parent_id' => 'nullable|exists:accounts,id',
            'code' => 'nullable|string|max:50',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'type' => 'required|in:' . implode(',', array_keys(Account::getAccountTypes())),
            'subtype' => 'required|string|max:100',
            'currency' => 'nullable|string|size:3',
            'opening_balance' => 'nullable|numeric',
            'is_active' => 'boolean',
        ]);

        try {
            $account = $this->chartService->createAccount($organization, $validatedData);

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Account created successfully.',
                    'account' => $account,
                ], 201);
            }

            return redirect()->route('accounting.chart-of-accounts')
                           ->with('success', 'Account created successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to create account.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withInput()
                        ->withErrors(['error' => 'Failed to create account: ' . $e->getMessage()]);
        }
    }

    /**
     * Show form for editing an account.
     */
    public function editAccount(Account $account)
    {
        $this->authorize('update', $account);

        $organization = $this->getCurrentOrganization();
        
        $parentAccounts = Account::where('organization_id', $organization->id)
            ->where('id', '!=', $account->id)
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        $accountTypes = Account::getAccountTypes();
        $accountSubtypes = Account::getAccountSubtypes();

        return view('accounting::edit-account', compact('account', 'parentAccounts', 'accountTypes', 'accountSubtypes', 'organization'));
    }

    /**
     * Update an account.
     */
    public function updateAccount(Request $request, Account $account)
    {
        $this->authorize('update', $account);

        $validatedData = $request->validate([
            'parent_id' => 'nullable|exists:accounts,id',
            'code' => 'nullable|string|max:50',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'type' => 'required|in:' . implode(',', array_keys(Account::getAccountTypes())),
            'subtype' => 'required|string|max:100',
            'currency' => 'nullable|string|size:3',
            'opening_balance' => 'nullable|numeric',
            'is_active' => 'boolean',
        ]);

        try {
            $account = $this->chartService->updateAccount($account, $validatedData);

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Account updated successfully.',
                    'account' => $account,
                ]);
            }

            return redirect()->route('accounting.chart-of-accounts')
                           ->with('success', 'Account updated successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to update account.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withInput()
                        ->withErrors(['error' => 'Failed to update account: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete an account.
     */
    public function deleteAccount(Account $account)
    {
        $this->authorize('delete', $account);

        try {
            $this->chartService->deleteAccount($account);

            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Account deleted successfully.',
                ]);
            }

            return redirect()->route('accounting.chart-of-accounts')
                           ->with('success', 'Account deleted successfully.');
        } catch (\Exception $e) {
            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to delete account.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to delete account: ' . $e->getMessage()]);
        }
    }

    /**
     * Display journal entries.
     */
    public function journalEntries(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $filters = $request->only(['status', 'start_date', 'end_date', 'search']);
        $journalEntries = $this->doubleEntryService->getJournalEntries($organization, $filters);

        if ($request->wantsJson()) {
            return response()->json([
                'journal_entries' => $journalEntries,
                'statuses' => JournalEntry::getStatuses(),
            ]);
        }

        return view('accounting::journal-entries', compact('journalEntries', 'organization'));
    }

    /**
     * Show form for creating a new journal entry.
     */
    public function createJournalEntry()
    {
        $organization = $this->getCurrentOrganization();
        
        $accounts = Account::where('organization_id', $organization->id)
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        return view('accounting::create-journal-entry', compact('accounts', 'organization'));
    }

    /**
     * Store a new journal entry.
     */
    public function storeJournalEntry(Request $request)
    {
        $organization = $this->getCurrentOrganization();

        $validatedData = $request->validate([
            'entry_date' => 'required|date|before_or_equal:today',
            'description' => 'required|string|max:500',
            'reference' => 'nullable|string|max:100',
            'transactions' => 'required|array|min:2',
            'transactions.*.account_id' => 'required|exists:accounts,id',
            'transactions.*.debit_amount' => 'nullable|numeric|min:0',
            'transactions.*.credit_amount' => 'nullable|numeric|min:0',
            'transactions.*.description' => 'nullable|string|max:500',
        ]);

        try {
            $entryData = $request->only(['entry_date', 'description', 'reference']);
            $transactions = $validatedData['transactions'];

            $journalEntry = $this->doubleEntryService->createJournalEntry($organization, $entryData, $transactions);

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Journal entry created successfully.',
                    'journal_entry' => $journalEntry,
                ], 201);
            }

            return redirect()->route('accounting.journal-entries')
                           ->with('success', 'Journal entry created successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to create journal entry.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withInput()
                        ->withErrors(['error' => 'Failed to create journal entry: ' . $e->getMessage()]);
        }
    }

    /**
     * Show a journal entry.
     */
    public function showJournalEntry(JournalEntry $journalEntry)
    {
        $this->authorize('view', $journalEntry);

        $journalEntry->load(['transactions.account', 'createdBy', 'postedBy']);

        if (request()->wantsJson()) {
            return response()->json(['journal_entry' => $journalEntry]);
        }

        return view('accounting::show-journal-entry', compact('journalEntry'));
    }

    /**
     * Post a journal entry.
     */
    public function postJournalEntry(JournalEntry $journalEntry)
    {
        $this->authorize('update', $journalEntry);

        try {
            $this->doubleEntryService->postJournalEntry($journalEntry, auth()->id());

            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Journal entry posted successfully.',
                    'journal_entry' => $journalEntry->fresh(),
                ]);
            }

            return back()->with('success', 'Journal entry posted successfully.');
        } catch (\Exception $e) {
            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to post journal entry.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to post journal entry: ' . $e->getMessage()]);
        }
    }

    /**
     * Reverse a journal entry.
     */
    public function reverseJournalEntry(Request $request, JournalEntry $journalEntry)
    {
        $this->authorize('update', $journalEntry);

        $validatedData = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            $reversal = $this->doubleEntryService->reverseJournalEntry(
                $journalEntry, 
                $validatedData['reason'] ?? null, 
                auth()->id()
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Journal entry reversed successfully.',
                    'original_entry' => $journalEntry->fresh(),
                    'reversal_entry' => $reversal,
                ]);
            }

            return redirect()->route('accounting.journal-entries')
                           ->with('success', 'Journal entry reversed successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to reverse journal entry.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to reverse journal entry: ' . $e->getMessage()]);
        }
    }

    /**
     * Display account ledger.
     */
    public function accountLedger(Request $request, Account $account)
    {
        $this->authorize('view', $account);

        $startDate = $request->get('start_date') ? new \DateTime($request->get('start_date')) : null;
        $endDate = $request->get('end_date') ? new \DateTime($request->get('end_date')) : null;

        $ledger = $this->doubleEntryService->getAccountLedger($account, $startDate, $endDate);

        if ($request->wantsJson()) {
            return response()->json(['ledger' => $ledger]);
        }

        return view('accounting::account-ledger', compact('ledger', 'account'));
    }

    /**
     * Display trial balance.
     */
    public function trialBalance(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $asOfDate = $request->get('as_of_date') ? new \DateTime($request->get('as_of_date')) : null;
        $trialBalance = $this->chartService->getTrialBalance($organization, $asOfDate);

        if ($request->wantsJson()) {
            return response()->json(['trial_balance' => $trialBalance]);
        }

        return view('accounting::trial-balance', compact('trialBalance', 'organization'));
    }

    /**
     * Create default chart of accounts.
     */
    public function createDefaultChart()
    {
        $organization = $this->getCurrentOrganization();

        try {
            $accounts = $this->chartService->createDefaultChartOfAccounts($organization);

            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Default chart of accounts created successfully.',
                    'accounts' => $accounts,
                ]);
            }

            return redirect()->route('accounting.chart-of-accounts')
                           ->with('success', 'Default chart of accounts created successfully.');
        } catch (\Exception $e) {
            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to create default chart of accounts.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to create default chart: ' . $e->getMessage()]);
        }
    }

    /**
     * Export chart of accounts.
     */
    public function exportChart()
    {
        $organization = $this->getCurrentOrganization();
        
        $accounts = $this->chartService->exportChartOfAccounts($organization);

        return response()->json([
            'accounts' => $accounts,
            'exported_at' => now()->toISOString(),
        ]);
    }

    /**
     * Get the current organization.
     */
    protected function getCurrentOrganization(): Organization
    {
        // This would typically come from the tenant context
        // For now, we'll get it from the authenticated user
        $user = Auth::user();
        
        if (!$user->organization_id) {
            throw new \Exception('User is not associated with an organization.');
        }

        return Organization::findOrFail($user->organization_id);
    }
}

