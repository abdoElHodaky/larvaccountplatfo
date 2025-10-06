<?php

namespace Modules\Accounting\Jobs;

use Modules\Shared\Events\QueueableDomainEvent;
use Modules\Accounting\Events\AccountCreated;
use Modules\Accounting\Domain\Entities\Account;

class ProcessAccountCreatedJob extends QueueableDomainEvent
{
    private Account $account;

    public function __construct(Account $account)
    {
        $this->account = $account;
        parent::__construct();
    }

    /**
     * Get the aggregate ID.
     */
    public function getAggregateId(): string
    {
        return (string) $this->account->getId();
    }

    /**
     * Get the aggregate type.
     */
    public function getAggregateType(): string
    {
        return 'Account';
    }

    /**
     * Get the event payload.
     */
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
     * Process the account created event.
     */
    protected function process(): void
    {
        // 1. Update search indexes
        $this->updateSearchIndexes();
        
        // 2. Generate account reports
        $this->generateAccountReports();
        
        // 3. Send notifications
        $this->sendNotifications();
        
        // 4. Update parent account balances if needed
        $this->updateParentAccountBalances();
        
        // 5. Trigger integrations
        $this->triggerIntegrations();
        
        // 6. Broadcast real-time updates
        $this->broadcastUpdates();
    }

    /**
     * Update search indexes for the new account.
     */
    private function updateSearchIndexes(): void
    {
        // Update Elasticsearch or other search indexes
        logger()->info('Updating search indexes for account', [
            'account_id' => $this->account->getId(),
            'tenant_id' => $this->getTenantId(),
        ]);
        
        // Example: Update search index
        // SearchService::updateAccountIndex($this->account);
    }

    /**
     * Generate account reports.
     */
    private function generateAccountReports(): void
    {
        // Generate or update relevant reports
        logger()->info('Generating account reports', [
            'account_id' => $this->account->getId(),
            'tenant_id' => $this->getTenantId(),
        ]);
        
        // Example: Queue report generation jobs
        // GenerateTrialBalanceReportJob::dispatch($this->getTenantId());
        // GenerateChartOfAccountsReportJob::dispatch($this->getTenantId());
    }

    /**
     * Send notifications about the new account.
     */
    private function sendNotifications(): void
    {
        // Send email notifications to relevant users
        logger()->info('Sending account creation notifications', [
            'account_id' => $this->account->getId(),
            'tenant_id' => $this->getTenantId(),
        ]);
        
        // Example: Send notifications
        // NotificationService::sendAccountCreatedNotification($this->account);
    }

    /**
     * Update parent account balances if needed.
     */
    private function updateParentAccountBalances(): void
    {
        if ($this->account->getParentId()) {
            logger()->info('Updating parent account balances', [
                'account_id' => $this->account->getId(),
                'parent_id' => $this->account->getParentId(),
                'tenant_id' => $this->getTenantId(),
            ]);
            
            // Example: Update parent balances
            // UpdateParentAccountBalancesJob::dispatch($this->account->getParentId());
        }
    }

    /**
     * Trigger external integrations.
     */
    private function triggerIntegrations(): void
    {
        // Trigger external system integrations
        logger()->info('Triggering external integrations', [
            'account_id' => $this->account->getId(),
            'tenant_id' => $this->getTenantId(),
        ]);
        
        // Example: Sync with external accounting systems
        // ExternalSyncJob::dispatch($this->account, 'account_created');
    }

    /**
     * Broadcast real-time updates.
     */
    private function broadcastUpdates(): void
    {
        // Broadcast the account created event for real-time updates
        $accountCreatedEvent = new AccountCreated($this->account);
        
        // Dispatch the broadcastable event
        event($accountCreatedEvent);
        
        logger()->info('Broadcasting account created event', [
            'account_id' => $this->account->getId(),
            'tenant_id' => $this->getTenantId(),
        ]);
    }

    /**
     * Get the base queue name for this job type.
     */
    protected function getBaseQueueName(): string
    {
        return 'default'; // Account creation is standard priority
    }

    /**
     * Create from array (for event sourcing).
     */
    public static function fromArray(array $data): static
    {
        throw new \RuntimeException('ProcessAccountCreatedJob deserialization not implemented');
    }

    /**
     * Handle job failure.
     */
    public function failed(\Throwable $exception): void
    {
        parent::failed($exception);
        
        // Additional failure handling specific to account creation
        logger()->error('Account creation processing failed', [
            'account_id' => $this->account->getId(),
            'tenant_id' => $this->getTenantId(),
            'exception' => $exception->getMessage(),
        ]);
        
        // Maybe send alert to administrators
        // AlertService::sendAccountProcessingFailedAlert($this->account, $exception);
    }

    /**
     * Get the tags for this job.
     */
    public function tags(): array
    {
        return array_merge(parent::tags(), [
            'account-processing',
            'account-id:' . $this->account->getId(),
        ]);
    }
}
