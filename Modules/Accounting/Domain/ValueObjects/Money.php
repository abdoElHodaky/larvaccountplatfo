<?php

namespace Modules\Accounting\Domain\ValueObjects;

use InvalidArgumentException;

final class Money
{
    private int $amount; // Amount in cents to avoid floating point issues
    private string $currency;

    public function __construct(int $amount, string $currency = 'USD')
    {
        if ($amount < 0) {
            throw new InvalidArgumentException('Amount cannot be negative');
        }

        if (empty($currency) || strlen($currency) !== 3) {
            throw new InvalidArgumentException('Currency must be a valid 3-letter code');
        }

        $this->amount = $amount;
        $this->currency = strtoupper($currency);
    }

    public static function fromFloat(float $amount, string $currency = 'USD'): self
    {
        return new self((int) round($amount * 100), $currency);
    }

    public static function zero(string $currency = 'USD'): self
    {
        return new self(0, $currency);
    }

    public function getAmount(): int
    {
        return $this->amount;
    }

    public function getAmountAsFloat(): float
    {
        return $this->amount / 100;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function add(Money $other): self
    {
        $this->ensureSameCurrency($other);
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function subtract(Money $other): self
    {
        $this->ensureSameCurrency($other);
        $newAmount = $this->amount - $other->amount;
        
        if ($newAmount < 0) {
            throw new InvalidArgumentException('Subtraction would result in negative amount');
        }
        
        return new self($newAmount, $this->currency);
    }

    public function multiply(float $multiplier): self
    {
        if ($multiplier < 0) {
            throw new InvalidArgumentException('Multiplier cannot be negative');
        }
        
        return new self((int) round($this->amount * $multiplier), $this->currency);
    }

    public function divide(float $divisor): self
    {
        if ($divisor <= 0) {
            throw new InvalidArgumentException('Divisor must be positive');
        }
        
        return new self((int) round($this->amount / $divisor), $this->currency);
    }

    public function equals(Money $other): bool
    {
        return $this->amount === $other->amount && $this->currency === $other->currency;
    }

    public function isGreaterThan(Money $other): bool
    {
        $this->ensureSameCurrency($other);
        return $this->amount > $other->amount;
    }

    public function isLessThan(Money $other): bool
    {
        $this->ensureSameCurrency($other);
        return $this->amount < $other->amount;
    }

    public function isZero(): bool
    {
        return $this->amount === 0;
    }

    public function format(): string
    {
        $formatted = number_format($this->getAmountAsFloat(), 2);
        return "{$this->currency} {$formatted}";
    }

    public function toArray(): array
    {
        return [
            'amount' => $this->amount,
            'amount_float' => $this->getAmountAsFloat(),
            'currency' => $this->currency,
            'formatted' => $this->format(),
        ];
    }

    public function __toString(): string
    {
        return $this->format();
    }

    private function ensureSameCurrency(Money $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new InvalidArgumentException(
                "Currency mismatch: {$this->currency} vs {$other->currency}"
            );
        }
    }
}
