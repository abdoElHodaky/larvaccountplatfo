<?php

namespace App\Features\Accounting\Events;

use App\Features\Accounting\Models\Transaction;
use App\Shared\Events\BroadcastableDomainEvent;

class TransactionUpdated extends BroadcastableDomainEvent
{
    public function __construct(
        public readonly Transaction $transaction,
        public readonly array $changes = []
    ) {
        parent::__construct(
            aggregateId: $transaction->id,
            aggregateType: 'transaction',
            eventType: 'transaction.updated',
            payload: [
                'transaction_id' => $transaction->id,
                'changes' => $changes,
                'organization_id' => $transaction->organization_id,
            ],
            metadata: [
                'tenant_id' => $transaction->organization_id,
                'user_id' => auth()->id(),
            ]
        );
    }

    /**
     * Get the channels the event should broadcast on.
     */
    protected function getChannelNames(): array
    {
        return [
            'accounting',
            'dashboard',
            "organization.{$this->transaction->organization_id}",
        ];
    }

    /**
     * Get additional data to broadcast with the event.
     */
    protected function getBroadcastData(): array
    {
        return [
            'transaction' => [
                'id' => $this->transaction->id,
                'account_id' => $this->transaction->account_id,
                'account_name' => $this->transaction->account->name ?? null,
                'amount' => $this->transaction->amount,
                'type' => $this->transaction->type,
                'description' => $this->transaction->description,
                'reference' => $this->transaction->reference,
                'date' => $this->transaction->date,
                'status' => $this->transaction->status,
                'updated_at' => $this->transaction->updated_at,
            ],
            'changes' => $this->changes,
            'account_balance_updated' => [
                'account_id' => $this->transaction->account_id,
                'new_balance' => $this->transaction->account->current_balance ?? 0,
            ],
        ];
    }

    /**
     * Get private channel names.
     */
    protected function getPrivateChannels(): array
    {
        return [
            'accounting',
            "organization.{$this->transaction->organization_id}",
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'accounting:transaction_updated';
    }
}
