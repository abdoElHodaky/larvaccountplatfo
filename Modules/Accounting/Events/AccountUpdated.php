<?php

namespace Modules\Accounting\Events;

use Modules\Shared\Events\BroadcastableDomainEvent;
use Modules\Accounting\Domain\Entities\Account;

class AccountUpdated extends BroadcastableDomainEvent
{
    private Account $account;
    private array $changes;

    public function __construct(Account $account, array $changes = [])
    {
        parent::__construct();
        $this->account = $account;
        $this->changes = $changes;
    }

    public function getAccount(): Account
    {
        return $this->account;
    }

    public function getChanges(): array
    {
        return $this->changes;
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
            'code' => $this->account->getCode()->getValue(),
            'name' => $this->account->getName(),
            'type' => $this->account->getType(),
            'subtype' => $this->account->getSubtype(),
            'parent_id' => $this->account->getParentId(),
            'description' => $this->account->getDescription(),
            'is_active' => $this->account->isActive(),
            'balance' => $this->account->getBalance()->toArray(),
            'changes' => $this->changes,
        ];
    }

    /**
     * Get the channel names for this event.
     */
    protected function getChannelNames(): array
    {
        return [
            'accounts',
            'account.' . $this->account->getId(),
        ];
    }

    /**
     * Get additional data to broadcast with the event.
     */
    protected function getBroadcastData(): array
    {
        return [
            'account' => [
                'id' => $this->account->getId(),
                'code' => $this->account->getCode()->getValue(),
                'name' => $this->account->getName(),
                'type' => $this->account->getType(),
                'subtype' => $this->account->getSubtype(),
                'parent_id' => $this->account->getParentId(),
                'description' => $this->account->getDescription(),
                'balance' => [
                    'amount' => $this->account->getBalance()->getAmount(),
                    'amount_float' => $this->account->getBalance()->getAmountAsFloat(),
                    'currency' => $this->account->getBalance()->getCurrency(),
                    'formatted' => $this->account->getBalance()->format(),
                ],
                'is_active' => $this->account->isActive(),
                'updated_at' => $this->account->getUpdatedAt()->toISOString(),
            ],
            'changes' => $this->changes,
            'action' => 'updated',
            'message' => "Account '{$this->account->getName()}' has been updated",
        ];
    }

    public static function fromArray(array $data): static
    {
        throw new \RuntimeException('AccountUpdated event deserialization not implemented');
    }
}
