<?php

namespace Modules\Accounting\Services;

use Modules\Accounting\Models\Account;
use Modules\Shared\Models\Organization;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ChartOfAccountsService
{
    /**
     * Get chart of accounts for an organization
     */
    public function getChartOfAccounts(Organization $organization, array $filters = []): Collection
    {
        $query = Account::where('organization_id', $organization->id);

        // Apply filters
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['subtype'])) {
            $query->where('subtype', $filters['subtype']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['is_system'])) {
            $query->where('is_system', $filters['is_system']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Order by code for proper hierarchy display
        return $query->orderBy('code')->get();
    }

    /**
     * Get hierarchical chart of accounts
     */
    public function getHierarchicalChart(Organization $organization, array $filters = []): array
    {
        $accounts = $this->getChartOfAccounts($organization, $filters);
        
        return $this->buildAccountHierarchy($accounts);
    }

    /**
     * Build account hierarchy from flat collection
     */
    protected function buildAccountHierarchy(Collection $accounts): array
    {
        $hierarchy = [];
        $accountsById = $accounts->keyBy('id');

        foreach ($accounts as $account) {
            if (is_null($account->parent_id)) {
                // Root account
                $hierarchy[] = $this->buildAccountNode($account, $accountsById);
            }
        }

        return $hierarchy;
    }

    /**
     * Build account node with children
     */
    protected function buildAccountNode(Account $account, Collection $accountsById): array
    {
        $node = [
            'account' => $account,
            'children' => [],
        ];

        // Find children
        foreach ($accountsById as $childAccount) {
            if ($childAccount->parent_id === $account->id) {
                $node['children'][] = $this->buildAccountNode($childAccount, $accountsById);
            }
        }

        return $node;
    }

    /**
     * Create a new account
     */
    public function createAccount(Organization $organization, array $accountData): Account
    {
        DB::beginTransaction();

        try {
            $accountData['organization_id'] = $organization->id;

            // Validate parent account if provided
            if (!empty($accountData['parent_id'])) {
                $parent = Account::where('organization_id', $organization->id)
                    ->find($accountData['parent_id']);
                
                if (!$parent) {
                    throw new \Exception('Parent account not found.');
                }

                // Ensure parent is of compatible type
                if ($parent->type !== $accountData['type']) {
                    throw new \Exception('Parent account must be of the same type.');
                }
            }

            // Set default currency from organization
            if (empty($accountData['currency'])) {
                $accountData['currency'] = $organization->currency;
            }

            $account = Account::create($accountData);

            DB::commit();

            return $account;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an account
     */
    public function updateAccount(Account $account, array $accountData): Account
    {
        DB::beginTransaction();

        try {
            // Validate parent account if being changed
            if (isset($accountData['parent_id']) && $accountData['parent_id'] !== $account->parent_id) {
                if (!empty($accountData['parent_id'])) {
                    $parent = Account::where('organization_id', $account->organization_id)
                        ->find($accountData['parent_id']);
                    
                    if (!$parent) {
                        throw new \Exception('Parent account not found.');
                    }

                    // Prevent circular references
                    if ($this->wouldCreateCircularReference($account, $parent)) {
                        throw new \Exception('Cannot set parent: would create circular reference.');
                    }

                    // Ensure parent is of compatible type
                    if ($parent->type !== $account->type) {
                        throw new \Exception('Parent account must be of the same type.');
                    }
                }
            }

            // Don't allow changing type if account has children or transactions
            if (isset($accountData['type']) && $accountData['type'] !== $account->type) {
                if ($account->children()->exists()) {
                    throw new \Exception('Cannot change account type: account has child accounts.');
                }

                if ($account->transactions()->exists()) {
                    throw new \Exception('Cannot change account type: account has transactions.');
                }
            }

            $account->update($accountData);

            DB::commit();

            return $account->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete an account
     */
    public function deleteAccount(Account $account): bool
    {
        DB::beginTransaction();

        try {
            if (!$account->canBeDeleted()) {
                throw new \Exception('Account cannot be deleted: it has children or transactions.');
            }

            $account->delete();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Create default chart of accounts for organization
     */
    public function createDefaultChartOfAccounts(Organization $organization): array
    {
        DB::beginTransaction();

        try {
            $defaultAccounts = $this->getDefaultAccountStructure();
            $createdAccounts = [];

            foreach ($defaultAccounts as $accountData) {
                $accountData['organization_id'] = $organization->id;
                $accountData['currency'] = $organization->currency;
                $accountData['is_system'] = true;

                $account = Account::create($accountData);
                $createdAccounts[] = $account;
            }

            DB::commit();

            return $createdAccounts;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get default account structure
     */
    protected function getDefaultAccountStructure(): array
    {
        return [
            // Assets
            [
                'code' => '1000',
                'name' => 'Assets',
                'type' => Account::TYPE_ASSET,
                'subtype' => Account::SUBTYPE_CURRENT_ASSET,
                'description' => 'All company assets',
                'parent_id' => null,
            ],
            [
                'code' => '1100',
                'name' => 'Current Assets',
                'type' => Account::TYPE_ASSET,
                'subtype' => Account::SUBTYPE_CURRENT_ASSET,
                'description' => 'Assets that can be converted to cash within one year',
                'parent_id' => null, // Will be set after creating parent
            ],
            [
                'code' => '1110',
                'name' => 'Cash and Cash Equivalents',
                'type' => Account::TYPE_ASSET,
                'subtype' => Account::SUBTYPE_CURRENT_ASSET,
                'description' => 'Cash in bank and on hand',
                'parent_id' => null,
            ],
            [
                'code' => '1120',
                'name' => 'Accounts Receivable',
                'type' => Account::TYPE_ASSET,
                'subtype' => Account::SUBTYPE_CURRENT_ASSET,
                'description' => 'Money owed by customers',
                'parent_id' => null,
            ],
            [
                'code' => '1130',
                'name' => 'Inventory',
                'type' => Account::TYPE_ASSET,
                'subtype' => Account::SUBTYPE_CURRENT_ASSET,
                'description' => 'Goods held for sale',
                'parent_id' => null,
            ],
            [
                'code' => '1200',
                'name' => 'Non-Current Assets',
                'type' => Account::TYPE_ASSET,
                'subtype' => Account::SUBTYPE_NON_CURRENT_ASSET,
                'description' => 'Long-term assets',
                'parent_id' => null,
            ],
            [
                'code' => '1210',
                'name' => 'Property, Plant & Equipment',
                'type' => Account::TYPE_ASSET,
                'subtype' => Account::SUBTYPE_NON_CURRENT_ASSET,
                'description' => 'Fixed assets used in operations',
                'parent_id' => null,
            ],

            // Liabilities
            [
                'code' => '2000',
                'name' => 'Liabilities',
                'type' => Account::TYPE_LIABILITY,
                'subtype' => Account::SUBTYPE_CURRENT_LIABILITY,
                'description' => 'All company liabilities',
                'parent_id' => null,
            ],
            [
                'code' => '2100',
                'name' => 'Current Liabilities',
                'type' => Account::TYPE_LIABILITY,
                'subtype' => Account::SUBTYPE_CURRENT_LIABILITY,
                'description' => 'Debts due within one year',
                'parent_id' => null,
            ],
            [
                'code' => '2110',
                'name' => 'Accounts Payable',
                'type' => Account::TYPE_LIABILITY,
                'subtype' => Account::SUBTYPE_CURRENT_LIABILITY,
                'description' => 'Money owed to suppliers',
                'parent_id' => null,
            ],
            [
                'code' => '2120',
                'name' => 'Accrued Expenses',
                'type' => Account::TYPE_LIABILITY,
                'subtype' => Account::SUBTYPE_CURRENT_LIABILITY,
                'description' => 'Expenses incurred but not yet paid',
                'parent_id' => null,
            ],
            [
                'code' => '2200',
                'name' => 'Non-Current Liabilities',
                'type' => Account::TYPE_LIABILITY,
                'subtype' => Account::SUBTYPE_NON_CURRENT_LIABILITY,
                'description' => 'Long-term debts',
                'parent_id' => null,
            ],

            // Equity
            [
                'code' => '3000',
                'name' => 'Equity',
                'type' => Account::TYPE_EQUITY,
                'subtype' => Account::SUBTYPE_OWNERS_EQUITY,
                'description' => 'Owner\'s equity in the company',
                'parent_id' => null,
            ],
            [
                'code' => '3100',
                'name' => 'Owner\'s Capital',
                'type' => Account::TYPE_EQUITY,
                'subtype' => Account::SUBTYPE_OWNERS_EQUITY,
                'description' => 'Capital invested by owners',
                'parent_id' => null,
            ],
            [
                'code' => '3200',
                'name' => 'Retained Earnings',
                'type' => Account::TYPE_EQUITY,
                'subtype' => Account::SUBTYPE_OWNERS_EQUITY,
                'description' => 'Accumulated profits retained in business',
                'parent_id' => null,
            ],

            // Revenue
            [
                'code' => '4000',
                'name' => 'Revenue',
                'type' => Account::TYPE_REVENUE,
                'subtype' => Account::SUBTYPE_OPERATING_REVENUE,
                'description' => 'Income from business operations',
                'parent_id' => null,
            ],
            [
                'code' => '4100',
                'name' => 'Sales Revenue',
                'type' => Account::TYPE_REVENUE,
                'subtype' => Account::SUBTYPE_OPERATING_REVENUE,
                'description' => 'Revenue from sales of goods or services',
                'parent_id' => null,
            ],
            [
                'code' => '4200',
                'name' => 'Other Revenue',
                'type' => Account::TYPE_REVENUE,
                'subtype' => Account::SUBTYPE_NON_OPERATING_REVENUE,
                'description' => 'Non-operating income',
                'parent_id' => null,
            ],

            // Expenses
            [
                'code' => '5000',
                'name' => 'Expenses',
                'type' => Account::TYPE_EXPENSE,
                'subtype' => Account::SUBTYPE_OPERATING_EXPENSE,
                'description' => 'Business operating expenses',
                'parent_id' => null,
            ],
            [
                'code' => '5100',
                'name' => 'Cost of Goods Sold',
                'type' => Account::TYPE_EXPENSE,
                'subtype' => Account::SUBTYPE_OPERATING_EXPENSE,
                'description' => 'Direct costs of producing goods sold',
                'parent_id' => null,
            ],
            [
                'code' => '5200',
                'name' => 'Operating Expenses',
                'type' => Account::TYPE_EXPENSE,
                'subtype' => Account::SUBTYPE_OPERATING_EXPENSE,
                'description' => 'General business operating expenses',
                'parent_id' => null,
            ],
            [
                'code' => '5210',
                'name' => 'Salaries and Wages',
                'type' => Account::TYPE_EXPENSE,
                'subtype' => Account::SUBTYPE_OPERATING_EXPENSE,
                'description' => 'Employee compensation',
                'parent_id' => null,
            ],
            [
                'code' => '5220',
                'name' => 'Rent Expense',
                'type' => Account::TYPE_EXPENSE,
                'subtype' => Account::SUBTYPE_OPERATING_EXPENSE,
                'description' => 'Office and facility rent',
                'parent_id' => null,
            ],
            [
                'code' => '5230',
                'name' => 'Utilities Expense',
                'type' => Account::TYPE_EXPENSE,
                'subtype' => Account::SUBTYPE_OPERATING_EXPENSE,
                'description' => 'Electricity, water, gas, internet',
                'parent_id' => null,
            ],
        ];
    }

    /**
     * Check if setting parent would create circular reference
     */
    protected function wouldCreateCircularReference(Account $account, Account $proposedParent): bool
    {
        $current = $proposedParent;
        
        while ($current) {
            if ($current->id === $account->id) {
                return true;
            }
            $current = $current->parent;
        }
        
        return false;
    }

    /**
     * Get account balances for a specific date
     */
    public function getAccountBalances(Organization $organization, \DateTime $asOfDate = null): array
    {
        $asOfDate = $asOfDate ?: now();
        $accounts = $this->getChartOfAccounts($organization, ['is_active' => true]);
        $balances = [];

        foreach ($accounts as $account) {
            $balance = $account->getBalanceAsOf($asOfDate);
            
            if (abs($balance) > 0.01) { // Only include accounts with non-zero balances
                $balances[] = [
                    'account' => $account,
                    'balance' => $balance,
                    'formatted_balance' => number_format($balance, 2) . ' ' . $account->currency,
                ];
            }
        }

        return $balances;
    }

    /**
     * Get trial balance
     */
    public function getTrialBalance(Organization $organization, \DateTime $asOfDate = null): array
    {
        $balances = $this->getAccountBalances($organization, $asOfDate);
        $totalDebits = 0;
        $totalCredits = 0;

        foreach ($balances as &$balance) {
            $account = $balance['account'];
            $amount = $balance['balance'];

            // Determine if balance should be shown as debit or credit
            if ($account->normal_balance === Account::BALANCE_DEBIT) {
                $balance['debit_balance'] = $amount >= 0 ? $amount : 0;
                $balance['credit_balance'] = $amount < 0 ? abs($amount) : 0;
            } else {
                $balance['debit_balance'] = $amount < 0 ? abs($amount) : 0;
                $balance['credit_balance'] = $amount >= 0 ? $amount : 0;
            }

            $totalDebits += $balance['debit_balance'];
            $totalCredits += $balance['credit_balance'];
        }

        return [
            'balances' => $balances,
            'total_debits' => $totalDebits,
            'total_credits' => $totalCredits,
            'is_balanced' => abs($totalDebits - $totalCredits) < 0.01,
            'as_of_date' => $asOfDate,
        ];
    }

    /**
     * Import chart of accounts from array
     */
    public function importChartOfAccounts(Organization $organization, array $accountsData): array
    {
        DB::beginTransaction();

        try {
            $imported = [];
            $errors = [];

            foreach ($accountsData as $index => $accountData) {
                try {
                    $accountData['organization_id'] = $organization->id;
                    
                    // Validate required fields
                    if (empty($accountData['code']) || empty($accountData['name']) || empty($accountData['type'])) {
                        throw new \Exception('Code, name, and type are required');
                    }

                    // Check if account code already exists
                    if (Account::where('organization_id', $organization->id)
                        ->where('code', $accountData['code'])
                        ->exists()) {
                        throw new \Exception('Account code already exists');
                    }

                    $account = Account::create($accountData);
                    $imported[] = $account;
                } catch (\Exception $e) {
                    $errors[] = "Row {$index}: " . $e->getMessage();
                }
            }

            if (empty($errors)) {
                DB::commit();
            } else {
                DB::rollBack();
            }

            return [
                'imported' => $imported,
                'errors' => $errors,
                'success' => empty($errors),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Export chart of accounts to array
     */
    public function exportChartOfAccounts(Organization $organization): array
    {
        $accounts = $this->getChartOfAccounts($organization);
        
        return $accounts->map(function ($account) {
            return [
                'code' => $account->code,
                'name' => $account->name,
                'description' => $account->description,
                'type' => $account->type,
                'subtype' => $account->subtype,
                'normal_balance' => $account->normal_balance,
                'parent_code' => $account->parent ? $account->parent->code : null,
                'is_active' => $account->is_active,
                'current_balance' => $account->current_balance,
                'currency' => $account->currency,
            ];
        })->toArray();
    }
}

