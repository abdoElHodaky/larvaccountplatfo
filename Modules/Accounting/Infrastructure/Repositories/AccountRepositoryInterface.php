<?php

namespace Modules\Accounting\Infrastructure\Repositories;

use Modules\Accounting\Domain\Entities\Account;
use Modules\Accounting\Domain\ValueObjects\AccountCode;

interface AccountRepositoryInterface
{
    /**
     * Find account by ID
     */
    public function findById(int $id): ?Account;

    /**
     * Find account by code
     */
    public function findByCode(AccountCode $code): ?Account;

    /**
     * Check if account exists by code
     */
    public function existsByCode(AccountCode $code): bool;

    /**
     * Find accounts by parent ID
     */
    public function findByParentId(?int $parentId): array;

    /**
     * Find accounts by type
     */
    public function findByType(string $type): array;

    /**
     * Find all active accounts
     */
    public function findAllActive(): array;

    /**
     * Find all accounts
     */
    public function findAll(): array;

    /**
     * Check if account has transactions
     */
    public function hasTransactions(int $accountId): bool;

    /**
     * Save account
     */
    public function save(Account $account): Account;

    /**
     * Delete account
     */
    public function delete(Account $account): void;

    /**
     * Find accounts with pagination
     */
    public function findWithPagination(int $page = 1, int $perPage = 25, array $filters = []): array;

    /**
     * Search accounts by name or code
     */
    public function search(string $query): array;
}
