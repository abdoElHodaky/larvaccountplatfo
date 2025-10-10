<?php

namespace App\Features\Accounting\Contracts;

use App\Shared\Contracts\RepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

/**
 * Account Repository Contract
 */
interface AccountRepositoryInterface extends RepositoryInterface
{
    /**
     * Find accounts by organization
     */
    public function findByOrganization(int $organizationId): Collection;

    /**
     * Find accounts by type
     */
    public function findByType(string $accountType, int $organizationId = null): Collection;

    /**
     * Get account balance
     */
    public function getAccountBalance(int $accountId): float;

    /**
     * Get accounts with balances
     */
    public function getAccountsWithBalances(int $organizationId): Collection;

    /**
     * Find accounts by code pattern
     */
    public function findByCodePattern(string $pattern, int $organizationId): Collection;

    /**
     * Get chart of accounts
     */
    public function getChartOfAccounts(int $organizationId): array;

    /**
     * Search accounts
     */
    public function searchAccounts(string $search, int $organizationId, int $limit = 20): Collection;

    /**
     * Get accounts by parent
     */
    public function getAccountsByParent(int $parentId): Collection;

    /**
     * Get account hierarchy
     */
    public function getAccountHierarchy(int $organizationId): array;

    /**
     * Get accounts summary by type
     */
    public function getAccountsSummaryByType(int $organizationId): array;
}
