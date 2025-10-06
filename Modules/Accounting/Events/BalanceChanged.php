<?php

namespace Modules\Accounting\Events;

use Modules\Shared\Events\BroadcastableDomainEvent;
use Modules\Accounting\Domain\Entities\Account;
use Modules\Accounting\Domain\ValueObjects\Money;

class BalanceChanged extends BroadcastableDomainEvent
{
    private Account $account;
    private Money $previousBalance;
    private Money $newBalance;
    private string $reason;

    public function __construct(Account $account, Money $previousBalance, Money $newBalance, string $reason = '')
    {
        parent::__construct();
        $this->account = $account;
        $this->previousBalance = $previousBalance;
        $this->newBalance = $newBalance;
        $this->reason = $reason;
    }

    public function getAccount(): Account
    {
        return $this->account;
    }

    public function getPreviousBalance(): Money
    {
        return $this->previousBalance;
    }

    public function getNewBalance(): Money
    {
        return $this->newBalance;
    }

    public function getReason(): string
    {
        return $this->reason;
    }

    public function getAggregateId(): string
    {
        return (string) $this->account->getId();
    }

    public function getAggregateType(): string
    {
        return 'Account';
    }

    public function getPayload(): array
    {
        return [
            'account_id' => $this->account->getId(),
            'account_code' => $this->account->getCode()->getValue(),
            'account_name' => $this->account->getName(),
            'previous_balance' => $this->previousBalance->toArray(),
            'new_balance' => $this->newBalance->toArray(),
            'balance_change' => [
                'amount' => $this->newBalance->getAmount() - $this->previousBalance->getAmount(),
                'amount_float' => $this->newBalance->getAmountAsFloat() - $this->previousBalance->getAmountAsFloat(),
                'currency' => $this->newBalance->getCurrency(),
            ],
            'reason' => $this->reason,
        ];
    }

    /**
     * Get the channel names for this event.
     */
    protected function getChannelNames(): array
    {
        return [
            'balances',
            'account.' . $this->account->getId() . '.balance',
            'accounts', // Also broadcast to general accounts channel
        ];
    }

    /**
     * Get additional data to broadcast with the event.
     */
    protected function getBroadcastData(): array
    {
        $balanceChange = $this->newBalance->getAmount() - $this->previousBalance->getAmount();
        
        return [
            'account' => [
                'id' => $this->account->getId(),
                'code' => $this->account->getCode()->getValue(),
                'name' => $this->account->getName(),
                'type' => $this->account->getType(),
            ],
            'balance_update' => [
                'previous' => [
                    'amount' => $this->previousBalance->getAmount(),
                    'amount_float' => $this->previousBalance->getAmountAsFloat(),
                    'currency' => $this->previousBalance->getCurrency(),
                    'formatted' => $this->previousBalance->format(),
                ],
                'current' => [
                    'amount' => $this->newBalance->getAmount(),
                    'amount_float' => $this->newBalance->getAmountAsFloat(),
                    'currency' => $this->newBalance->getCurrency(),
                    'formatted' => $this->newBalance->format(),
                ],
                'change' => [
                    'amount' => $balanceChange,
                    'amount_float' => $this->newBalance->getAmountAsFloat() - $this->previousBalance->getAmountAsFloat(),
                    'currency' => $this->newBalance->getCurrency(),
                    'formatted' => Money::fromAmount($balanceChange, $this->newBalance->getCurrency())->format(),
                    'direction' => $balanceChange > 0 ? 'increase' : ($balanceChange < 0 ? 'decrease' : 'no_change'),
                ],
            ],
            'reason' => $this->reason,
            'action' => 'balance_changed',
            'message' => "Balance for account '{$this->account->getName()}' changed from {$this->previousBalance->format()} to {$this->newBalance->format()}",
        ];
    }

    /**
     * This is a high-priority event that should always broadcast.
     */
    protected function shouldBroadcastForTenant(): bool
    {
        return true;
    }

    public static function fromArray(array $data): static
    {
        throw new \RuntimeException('BalanceChanged event deserialization not implemented');
    }
}
