<?php

namespace Modules\Accounting\Domain\ValueObjects;

use InvalidArgumentException;

final class AccountCode
{
    private string $code;

    public function __construct(string $code)
    {
        $this->validate($code);
        $this->code = $code;
    }

    public function getValue(): string
    {
        return $this->code;
    }

    public function getLevel(): int
    {
        return strlen($this->code);
    }

    public function isParentOf(AccountCode $other): bool
    {
        return str_starts_with($other->code, $this->code) && $other->code !== $this->code;
    }

    public function isChildOf(AccountCode $other): bool
    {
        return str_starts_with($this->code, $other->code) && $this->code !== $other->code;
    }

    public function getParentCode(int $level = null): ?AccountCode
    {
        if ($level === null) {
            $level = $this->getLevel() - 1;
        }

        if ($level <= 0 || $level >= $this->getLevel()) {
            return null;
        }

        return new self(substr($this->code, 0, $level));
    }

    public function equals(AccountCode $other): bool
    {
        return $this->code === $other->code;
    }

    public function __toString(): string
    {
        return $this->code;
    }

    private function validate(string $code): void
    {
        if (empty($code)) {
            throw new InvalidArgumentException('Account code cannot be empty');
        }

        if (!preg_match('/^[0-9]+$/', $code)) {
            throw new InvalidArgumentException('Account code must contain only digits');
        }

        if (strlen($code) < 3 || strlen($code) > 10) {
            throw new InvalidArgumentException('Account code must be between 3 and 10 digits');
        }
    }
}
