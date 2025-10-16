<?php

namespace App\Features\Accounting\Repositories;

use App\Features\Accounting\Contracts\AccountRepositoryInterface;
use App\Features\Accounting\Models\Account;
use App\Shared\Services\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

/**
 * Account Repository using Laravel Eloquent Repository Pattern
 */
class AccountRepository extends BaseRepository implements AccountRepositoryInterface
{
    /**
     * Specify Model class Name
     */
    public function model(): string
    {
        return Account::class;
    }

    /**
     * Initialize repository-specific cache configuration
     */
    protected function initializeCache(): void
    {
        parent::initializeCache();

        $this->cacheTags = array_merge($this->cacheTags, [
            'accounts',
            'accounting',
        ]);

        // Enable caching by default for accounts
        $this->enableCache(3600, $this->cacheTags); // 1 hour
    }

    /**
     * Find accounts by organization
     */
    public function findByOrganization(int $organizationId): Collection
    {
        return $this->cached('findByOrganization', ['org_id' => $organizationId], function () use ($organizationId) {
            return $this->model
                ->where('organization_id', $organizationId)
                ->where('is_active', true)
                ->orderBy('account_code')
                ->get();
        });
    }

    /**
     * Find accounts by type
     */
    public function findByType(string $accountType, ?int $organizationId = null): Collection
    {
        $criteria = ['account_type' => $accountType];
        if ($organizationId) {
            $criteria['organization_id'] = $organizationId;
        }

        return $this->cached('findByType', $criteria, function () use ($accountType, $organizationId) {
            $query = $this->model->where('account_type', $accountType);

            if ($organizationId) {
                $query->where('organization_id', $organizationId);
            }

            return $query->where('is_active', true)
                ->orderBy('account_code')
                ->get();
        });
    }

    /**
     * Get account balance
     */
    public function getAccountBalance(int $accountId): float
    {
        return $this->cached('getAccountBalance', ['account_id' => $accountId], function () use ($accountId) {
            $account = $this->findOrFail($accountId);

            // Calculate balance from journal entries
            $balance = $account->journalEntries()
                ->selectRaw('SUM(debit_amount - credit_amount) as balance')
                ->value('balance') ?? 0;

            return (float) $balance;
        });
    }

    /**
     * Get accounts with balances
     */
    public function getAccountsWithBalances(int $organizationId): Collection
    {
        return $this->cached('getAccountsWithBalances', ['org_id' => $organizationId], function () use ($organizationId) {
            return $this->model
                ->where('organization_id', $organizationId)
                ->where('is_active', true)
                ->with(['journalEntries' => function ($query) {
                    $query->selectRaw('account_id, SUM(debit_amount - credit_amount) as balance')
                        ->groupBy('account_id');
                }])
                ->orderBy('account_code')
                ->get()
                ->map(function ($account) {
                    $account->balance = $account->journalEntries->sum('balance') ?? 0;

                    return $account;
                });
        });
    }

    /**
     * Find accounts by code pattern
     */
    public function findByCodePattern(string $pattern, int $organizationId): Collection
    {
        return $this->cached('findByCodePattern', ['pattern' => $pattern, 'org_id' => $organizationId], function () use ($pattern, $organizationId) {
            return $this->model
                ->where('organization_id', $organizationId)
                ->where('account_code', 'LIKE', $pattern)
                ->where('is_active', true)
                ->orderBy('account_code')
                ->get();
        });
    }

    /**
     * Get chart of accounts
     */
    public function getChartOfAccounts(int $organizationId): array
    {
        return $this->cached('getChartOfAccounts', ['org_id' => $organizationId], function () use ($organizationId) {
            $accounts = $this->model
                ->where('organization_id', $organizationId)
                ->where('is_active', true)
                ->orderBy('account_code')
                ->get()
                ->groupBy('account_type');

            $chartOfAccounts = [];
            foreach ($accounts as $type => $typeAccounts) {
                $chartOfAccounts[$type] = $typeAccounts->map(function ($account) {
                    return [
                        'id' => $account->id,
                        'code' => $account->account_code,
                        'name' => $account->account_name,
                        'type' => $account->account_type,
                        'balance' => $this->getAccountBalance($account->id),
                    ];
                });
            }

            return $chartOfAccounts;
        });
    }

    /**
     * Search accounts
     */
    public function searchAccounts(string $search, int $organizationId, int $limit = 20): Collection
    {
        return $this->model
            ->where('organization_id', $organizationId)
            ->where('is_active', true)
            ->where(function ($query) use ($search) {
                $query->where('account_name', 'LIKE', "%{$search}%")
                    ->orWhere('account_code', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%");
            })
            ->orderBy('account_code')
            ->limit($limit)
            ->get();
    }

    /**
     * Get accounts by parent
     */
    public function getAccountsByParent(int $parentId): Collection
    {
        return $this->cached('getAccountsByParent', ['parent_id' => $parentId], function () use ($parentId) {
            return $this->model
                ->where('parent_account_id', $parentId)
                ->where('is_active', true)
                ->orderBy('account_code')
                ->get();
        });
    }

    /**
     * Get account hierarchy
     */
    public function getAccountHierarchy(int $organizationId): array
    {
        return $this->cached('getAccountHierarchy', ['org_id' => $organizationId], function () use ($organizationId) {
            $accounts = $this->model
                ->where('organization_id', $organizationId)
                ->where('is_active', true)
                ->orderBy('account_code')
                ->get();

            return $this->buildAccountTree($accounts);
        });
    }

    /**
     * Build account tree structure
     */
    protected function buildAccountTree(Collection $accounts, ?int $parentId = null): array
    {
        $tree = [];

        foreach ($accounts as $account) {
            if ($account->parent_account_id == $parentId) {
                $children = $this->buildAccountTree($accounts, $account->id);

                $accountData = [
                    'id' => $account->id,
                    'code' => $account->account_code,
                    'name' => $account->account_name,
                    'type' => $account->account_type,
                    'balance' => $this->getAccountBalance($account->id),
                ];

                if (! empty($children)) {
                    $accountData['children'] = $children;
                }

                $tree[] = $accountData;
            }
        }

        return $tree;
    }

    /**
     * Get accounts summary by type
     */
    public function getAccountsSummaryByType(int $organizationId): array
    {
        return $this->cached('getAccountsSummaryByType', ['org_id' => $organizationId], function () use ($organizationId) {
            return $this->model
                ->where('organization_id', $organizationId)
                ->where('is_active', true)
                ->selectRaw('account_type, COUNT(*) as count, SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as total_balance')
                ->groupBy('account_type')
                ->get()
                ->keyBy('account_type')
                ->toArray();
        });
    }
}
