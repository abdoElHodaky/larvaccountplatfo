<?php

namespace Modules\Accounting\Events;

use Modules\Shared\Events\BroadcastableDomainEvent;
use Modules\Accounting\Domain\Entities\Account;

class AccountCreated extends BroadcastableDomainEvent
{
    private Account $account;

    public function __construct(Account $account)
    {
        parent::__construct();
        $this->account = $account;
    }

    public function getAccount(): Account
    {
        return $this->account;
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
                'created_at' => $this->account->getCreatedAt()->toISOString(),
            ],
            'action' => 'created',
            'message' => "Account '{$this->account->getName()}' has been created",
        ];
    }

    public static function fromArray(array $data): static
    {
        // This would require reconstructing the Account entity from the payload
        // For now, we'll throw an exception as this requires more complex deserialization
        throw new \RuntimeException('AccountCreated event deserialization not implemented');
    }
}
