<?php

namespace Modules\Accounting\Domain\Services;

use Modules\Accounting\Domain\Entities\Account;
use Modules\Accounting\Domain\ValueObjects\AccountCode;
use Modules\Accounting\Domain\ValueObjects\Money;
use Modules\Accounting\Infrastructure\Repositories\AccountRepositoryInterface;
use InvalidArgumentException;

class AccountDomainService
{
    public function __construct(
        private AccountRepositoryInterface $accountRepository
    ) {}

    /**
     * Create a new account with validation
     */
    public function createAccount(
        AccountCode $code,
        string $name,
        string $type,
        string $subtype,
        ?int $parentId = null,
        string $description = ''
    ): Account {
        // Check if account code already exists
        if ($this->accountRepository->existsByCode($code)) {
            throw new InvalidArgumentException("Account with code {$code} already exists");
        }

        // Validate parent account if specified
        if ($parentId !== null) {
            $parentAccount = $this->accountRepository->findById($parentId);
            if (!$parentAccount) {
                throw new InvalidArgumentException("Parent account with ID {$parentId} not found");
            }

            // Validate parent-child relationship
            $tempAccount = new Account($code, $name, $type, $subtype);
            if (!$parentAccount->canBeParentOf($tempAccount)) {
                throw new InvalidArgumentException(
                    "Account {$code} cannot be a child of {$parentAccount->getCode()}"
                );
            }
        }

        return new Account($code, $name, $type, $subtype, $parentId, $description);
    }

    /**
     * Calculate account hierarchy balance
     */
    public function calculateHierarchyBalance(Account $account): Money
    {
        $balance = $account->getBalance();
        $childAccounts = $this->accountRepository->findByParentId($account->getId());

        foreach ($childAccounts as $childAccount) {
            $childBalance = $this->calculateHierarchyBalance($childAccount);
            $balance = $balance->add($childBalance);
        }

        return $balance;
    }

    /**
     * Get account hierarchy tree
     */
    public function getAccountHierarchy(?int $parentId = null): array
    {
        $accounts = $this->accountRepository->findByParentId($parentId);
        $hierarchy = [];

        foreach ($accounts as $account) {
            $accountData = $account->toArray();
            $accountData['children'] = $this->getAccountHierarchy($account->getId());
            $accountData['hierarchy_balance'] = $this->calculateHierarchyBalance($account)->toArray();
            $hierarchy[] = $accountData;
        }

        return $hierarchy;
    }

    /**
     * Validate account can be safely deleted
     */
    public function canDeleteAccount(Account $account): bool
    {
        // Cannot delete if account has non-zero balance
        if (!$account->getBalance()->isZero()) {
            return false;
        }

        // Cannot delete if account has child accounts
        $childAccounts = $this->accountRepository->findByParentId($account->getId());
        if (!empty($childAccounts)) {
            return false;
        }

        // Cannot delete if account has transactions
        if ($this->accountRepository->hasTransactions($account->getId())) {
            return false;
        }

        return true;
    }

    /**
     * Get accounts by type with hierarchy
     */
    public function getAccountsByType(string $type): array
    {
        $accounts = $this->accountRepository->findByType($type);
        return $this->buildHierarchyFromFlatList($accounts);
    }

    /**
     * Get trial balance data
     */
    public function getTrialBalance(): array
    {
        $accounts = $this->accountRepository->findAllActive();
        $trialBalance = [
            'assets' => [],
            'liabilities' => [],
            'equity' => [],
            'revenue' => [],
            'expenses' => [],
            'totals' => [
                'debits' => Money::zero(),
                'credits' => Money::zero(),
            ]
        ];

        foreach ($accounts as $account) {
            $balance = $account->getBalance();
            $accountData = [
                'account' => $account->toArray(),
                'debit_balance' => $account->isDebitAccount() && !$balance->isZero() ? $balance : Money::zero(),
                'credit_balance' => $account->isCreditAccount() && !$balance->isZero() ? $balance : Money::zero(),
            ];

            // Add to appropriate section
            $type = $account->getType();
            if (isset($trialBalance[$type . 's'])) {
                $trialBalance[$type . 's'][] = $accountData;
            }

            // Add to totals
            if ($account->isDebitAccount() && !$balance->isZero()) {
                $trialBalance['totals']['debits'] = $trialBalance['totals']['debits']->add($balance);
            } elseif ($account->isCreditAccount() && !$balance->isZero()) {
                $trialBalance['totals']['credits'] = $trialBalance['totals']['credits']->add($balance);
            }
        }

        return $trialBalance;
    }

    /**
     * Validate chart of accounts structure
     */
    public function validateChartOfAccounts(): array
    {
        $errors = [];
        $accounts = $this->accountRepository->findAll();

        // Check for duplicate codes
        $codes = [];
        foreach ($accounts as $account) {
            $code = $account->getCode()->getValue();
            if (isset($codes[$code])) {
                $errors[] = "Duplicate account code: {$code}";
            }
            $codes[$code] = true;
        }

        // Check for orphaned accounts
        foreach ($accounts as $account) {
            if ($account->hasParent()) {
                $parent = $this->accountRepository->findById($account->getParentId());
                if (!$parent) {
                    $errors[] = "Account {$account->getCode()} has invalid parent ID {$account->getParentId()}";
                }
            }
        }

        // Check for circular references
        foreach ($accounts as $account) {
            if ($this->hasCircularReference($account)) {
                $errors[] = "Circular reference detected for account {$account->getCode()}";
            }
        }

        return $errors;
    }

    /**
     * Build hierarchy from flat list of accounts
     */
    private function buildHierarchyFromFlatList(array $accounts): array
    {
        $hierarchy = [];
        $accountsById = [];

        // Index accounts by ID
        foreach ($accounts as $account) {
            $accountsById[$account->getId()] = $account->toArray();
            $accountsById[$account->getId()]['children'] = [];
        }

        // Build hierarchy
        foreach ($accounts as $account) {
            if ($account->hasParent()) {
                $parentId = $account->getParentId();
                if (isset($accountsById[$parentId])) {
                    $accountsById[$parentId]['children'][] = &$accountsById[$account->getId()];
                }
            } else {
                $hierarchy[] = &$accountsById[$account->getId()];
            }
        }

        return $hierarchy;
    }

    /**
     * Check for circular references in account hierarchy
     */
    private function hasCircularReference(Account $account, array $visited = []): bool
    {
        if (in_array($account->getId(), $visited)) {
            return true;
        }

        if (!$account->hasParent()) {
            return false;
        }

        $visited[] = $account->getId();
        $parent = $this->accountRepository->findById($account->getParentId());

        if (!$parent) {
            return false;
        }

        return $this->hasCircularReference($parent, $visited);
    }
}
