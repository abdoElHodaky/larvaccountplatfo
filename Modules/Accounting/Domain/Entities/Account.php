<?php

namespace Modules\Accounting\Domain\Entities;

use Modules\Accounting\Domain\ValueObjects\AccountCode;
use Modules\Accounting\Domain\ValueObjects\Money;
use InvalidArgumentException;

class Account
{
    private ?int $id;
    private AccountCode $code;
    private string $name;
    private string $type;
    private string $subtype;
    private ?int $parentId;
    private string $description;
    private bool $isActive;
    private Money $balance;
    private \DateTimeImmutable $createdAt;
    private \DateTimeImmutable $updatedAt;

    public function __construct(
        AccountCode $code,
        string $name,
        string $type,
        string $subtype,
        ?int $parentId = null,
        string $description = '',
        bool $isActive = true,
        ?int $id = null
    ) {
        $this->validateType($type);
        $this->validateSubtype($type, $subtype);

        $this->id = $id;
        $this->code = $code;
        $this->name = $name;
        $this->type = $type;
        $this->subtype = $subtype;
        $this->parentId = $parentId;
        $this->description = $description;
        $this->isActive = $isActive;
        $this->balance = Money::zero();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCode(): AccountCode
    {
        return $this->code;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getSubtype(): string
    {
        return $this->subtype;
    }

    public function getParentId(): ?int
    {
        return $this->parentId;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function getBalance(): Money
    {
        return $this->balance;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function updateName(string $name): void
    {
        if (empty(trim($name))) {
            throw new InvalidArgumentException('Account name cannot be empty');
        }

        $this->name = $name;
        $this->touch();
    }

    public function updateDescription(string $description): void
    {
        $this->description = $description;
        $this->touch();
    }

    public function activate(): void
    {
        $this->isActive = true;
        $this->touch();
    }

    public function deactivate(): void
    {
        if (!$this->balance->isZero()) {
            throw new InvalidArgumentException('Cannot deactivate account with non-zero balance');
        }

        $this->isActive = false;
        $this->touch();
    }

    public function debit(Money $amount): void
    {
        if ($this->isDebitAccount()) {
            $this->balance = $this->balance->add($amount);
        } else {
            $this->balance = $this->balance->subtract($amount);
        }
        $this->touch();
    }

    public function credit(Money $amount): void
    {
        if ($this->isCreditAccount()) {
            $this->balance = $this->balance->add($amount);
        } else {
            $this->balance = $this->balance->subtract($amount);
        }
        $this->touch();
    }

    public function isDebitAccount(): bool
    {
        return in_array($this->type, ['asset', 'expense']);
    }

    public function isCreditAccount(): bool
    {
        return in_array($this->type, ['liability', 'equity', 'revenue']);
    }

    public function isAsset(): bool
    {
        return $this->type === 'asset';
    }

    public function isLiability(): bool
    {
        return $this->type === 'liability';
    }

    public function isEquity(): bool
    {
        return $this->type === 'equity';
    }

    public function isRevenue(): bool
    {
        return $this->type === 'revenue';
    }

    public function isExpense(): bool
    {
        return $this->type === 'expense';
    }

    public function isCurrentAsset(): bool
    {
        return $this->type === 'asset' && $this->subtype === 'current_asset';
    }

    public function isFixedAsset(): bool
    {
        return $this->type === 'asset' && $this->subtype === 'fixed_asset';
    }

    public function isCurrentLiability(): bool
    {
        return $this->type === 'liability' && $this->subtype === 'current_liability';
    }

    public function isLongTermLiability(): bool
    {
        return $this->type === 'liability' && $this->subtype === 'long_term_liability';
    }

    public function hasParent(): bool
    {
        return $this->parentId !== null;
    }

    public function canBeParentOf(Account $other): bool
    {
        // Same type accounts can have parent-child relationships
        if ($this->type !== $other->type) {
            return false;
        }

        // Cannot be parent of itself
        if ($this->id === $other->id) {
            return false;
        }

        // Code hierarchy validation
        return $this->code->isParentOf($other->code);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code->getValue(),
            'name' => $this->name,
            'type' => $this->type,
            'subtype' => $this->subtype,
            'parent_id' => $this->parentId,
            'description' => $this->description,
            'is_active' => $this->isActive,
            'balance' => $this->balance->toArray(),
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }

    private function validateType(string $type): void
    {
        $validTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
        
        if (!in_array($type, $validTypes)) {
            throw new InvalidArgumentException(
                "Invalid account type: {$type}. Must be one of: " . implode(', ', $validTypes)
            );
        }
    }

    private function validateSubtype(string $type, string $subtype): void
    {
        $validSubtypes = [
            'asset' => ['current_asset', 'fixed_asset', 'other_asset'],
            'liability' => ['current_liability', 'long_term_liability', 'other_liability'],
            'equity' => ['owner_equity', 'retained_earnings'],
            'revenue' => ['operating_revenue', 'other_revenue'],
            'expense' => ['operating_expense', 'other_expense'],
        ];

        if (!isset($validSubtypes[$type]) || !in_array($subtype, $validSubtypes[$type])) {
            throw new InvalidArgumentException(
                "Invalid subtype '{$subtype}' for account type '{$type}'"
            );
        }
    }

    private function touch(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
