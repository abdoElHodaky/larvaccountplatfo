<?php

namespace Modules\Accounting\Application\Services;

use Modules\Accounting\Domain\Services\AccountDomainService;
use Modules\Accounting\Domain\Entities\Account;
use Modules\Accounting\Domain\ValueObjects\AccountCode;
use Modules\Accounting\Domain\ValueObjects\Money;
use Modules\Shared\Services\PerformanceMonitor;
use Modules\Shared\Services\TelescopePerformanceAdapter;
use Illuminate\Support\Facades\Event;
use Exception;

class PerformanceAwareAccountDomainService
{
    public function __construct(
        private AccountDomainService $domainService,
        private PerformanceMonitor $performanceMonitor,
        private TelescopePerformanceAdapter $telescopeAdapter
    ) {}

    /**
     * Create a new account with performance monitoring
     */
    public function createAccount(
        AccountCode $code,
        string $name,
        string $type,
        string $subtype,
        ?int $parentId = null,
        string $description = ''
    ): Account {
        $operationId = uniqid('account_create_', true);
        $context = [
            'code' => $code->getValue(),
            'type' => $type,
            'subtype' => $subtype,
            'has_parent' => $parentId !== null,
        ];
        
        // Start timing with both custom monitor and Telescope integration
        $timerId = $this->performanceMonitor->startTimer('account.create', $context);
        
        // Fire Telescope performance event
        Event::dispatch('performance.operation.started', [
            'operation_id' => $operationId,
            'operation' => 'AccountDomainService::createAccount',
            'context' => $context,
        ]);

        try {
            $account = $this->domainService->createAccount(
                $code,
                $name,
                $type,
                $subtype,
                $parentId,
                $description
            );

            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'createAccount',
                $metrics['duration_ms'] ?? 0,
                ['status' => 'success']
            );

            $this->performanceMonitor->incrementCounter('account.created', 1, [
                'type' => $type,
                'subtype' => $subtype,
            ]);

            // Fire Telescope completion event
            Event::dispatch('performance.operation.completed', [
                'operation_id' => $operationId,
                'status' => 'success',
            ]);

            return $account;

        } catch (Exception $e) {
            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'createAccount',
                $metrics['duration_ms'] ?? 0,
                [
                    'status' => 'error',
                    'error_type' => get_class($e),
                    'error_message' => $e->getMessage(),
                ]
            );

            $this->performanceMonitor->incrementCounter('account.creation_errors', 1, [
                'error_type' => get_class($e),
            ]);

            // Fire Telescope error event
            Event::dispatch('performance.operation.completed', [
                'operation_id' => $operationId,
                'status' => 'error',
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Calculate account hierarchy balance with performance monitoring
     */
    public function calculateHierarchyBalance(Account $account): Money
    {
        $timerId = $this->performanceMonitor->startTimer('account.hierarchy_balance', [
            'account_id' => $account->getId(),
            'account_code' => $account->getCode()->getValue(),
            'account_type' => $account->getType(),
        ]);

        try {
            $balance = $this->domainService->calculateHierarchyBalance($account);

            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'calculateHierarchyBalance',
                $metrics['duration_ms'] ?? 0,
                ['status' => 'success']
            );

            // Record balance calculation metrics
            $this->performanceMonitor->recordMetric('account.hierarchy_balance_amount', $balance->getAmount(), [
                'account_type' => $account->getType(),
                'currency' => $balance->getCurrency(),
            ]);

            return $balance;

        } catch (Exception $e) {
            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'calculateHierarchyBalance',
                $metrics['duration_ms'] ?? 0,
                [
                    'status' => 'error',
                    'error_type' => get_class($e),
                ]
            );

            throw $e;
        }
    }

    /**
     * Get account hierarchy tree with performance monitoring
     */
    public function getAccountHierarchy(?int $parentId = null): array
    {
        $timerId = $this->performanceMonitor->startTimer('account.hierarchy_tree', [
            'parent_id' => $parentId,
            'is_root' => $parentId === null,
        ]);

        try {
            $hierarchy = $this->domainService->getAccountHierarchy($parentId);

            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'getAccountHierarchy',
                $metrics['duration_ms'] ?? 0,
                ['status' => 'success']
            );

            // Record hierarchy metrics
            $accountCount = $this->countAccountsInHierarchy($hierarchy);
            $this->performanceMonitor->recordMetric('account.hierarchy_size', $accountCount, [
                'parent_id' => $parentId ?? 'root',
            ]);

            return $hierarchy;

        } catch (Exception $e) {
            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'getAccountHierarchy',
                $metrics['duration_ms'] ?? 0,
                [
                    'status' => 'error',
                    'error_type' => get_class($e),
                ]
            );

            throw $e;
        }
    }

    /**
     * Validate account can be safely deleted with performance monitoring
     */
    public function canDeleteAccount(Account $account): bool
    {
        $timerId = $this->performanceMonitor->startTimer('account.delete_validation', [
            'account_id' => $account->getId(),
            'account_code' => $account->getCode()->getValue(),
        ]);

        try {
            $canDelete = $this->domainService->canDeleteAccount($account);

            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'canDeleteAccount',
                $metrics['duration_ms'] ?? 0,
                ['status' => 'success']
            );

            $this->performanceMonitor->incrementCounter('account.delete_validations', 1, [
                'result' => $canDelete ? 'allowed' : 'blocked',
            ]);

            return $canDelete;

        } catch (Exception $e) {
            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'canDeleteAccount',
                $metrics['duration_ms'] ?? 0,
                [
                    'status' => 'error',
                    'error_type' => get_class($e),
                ]
            );

            throw $e;
        }
    }

    /**
     * Get accounts by type with performance monitoring
     */
    public function getAccountsByType(string $type): array
    {
        $timerId = $this->performanceMonitor->startTimer('account.get_by_type', [
            'type' => $type,
        ]);

        try {
            $accounts = $this->domainService->getAccountsByType($type);

            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'getAccountsByType',
                $metrics['duration_ms'] ?? 0,
                ['status' => 'success']
            );

            $this->performanceMonitor->recordMetric('account.type_query_results', count($accounts), [
                'type' => $type,
            ]);

            return $accounts;

        } catch (Exception $e) {
            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'getAccountsByType',
                $metrics['duration_ms'] ?? 0,
                [
                    'status' => 'error',
                    'error_type' => get_class($e),
                ]
            );

            throw $e;
        }
    }

    /**
     * Get trial balance data with performance monitoring
     */
    public function getTrialBalance(): array
    {
        $timerId = $this->performanceMonitor->startTimer('account.trial_balance', [
            'operation' => 'full_trial_balance',
        ]);

        try {
            $trialBalance = $this->domainService->getTrialBalance();

            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'getTrialBalance',
                $metrics['duration_ms'] ?? 0,
                ['status' => 'success']
            );

            // Record trial balance metrics
            $totalAccounts = array_sum([
                count($trialBalance['assets'] ?? []),
                count($trialBalance['liabilities'] ?? []),
                count($trialBalance['equity'] ?? []),
                count($trialBalance['revenue'] ?? []),
                count($trialBalance['expenses'] ?? []),
            ]);

            $this->performanceMonitor->recordMetric('account.trial_balance_accounts', $totalAccounts);
            
            $debits = $trialBalance['totals']['debits'] ?? Money::zero();
            $credits = $trialBalance['totals']['credits'] ?? Money::zero();
            
            $this->performanceMonitor->recordMetric('account.trial_balance_debits', $debits->getAmount());
            $this->performanceMonitor->recordMetric('account.trial_balance_credits', $credits->getAmount());
            
            $isBalanced = $debits->equals($credits);
            $this->performanceMonitor->incrementCounter('account.trial_balance_generated', 1, [
                'balanced' => $isBalanced ? 'yes' : 'no',
            ]);

            return $trialBalance;

        } catch (Exception $e) {
            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'getTrialBalance',
                $metrics['duration_ms'] ?? 0,
                [
                    'status' => 'error',
                    'error_type' => get_class($e),
                ]
            );

            throw $e;
        }
    }

    /**
     * Validate chart of accounts structure with performance monitoring
     */
    public function validateChartOfAccounts(): array
    {
        $timerId = $this->performanceMonitor->startTimer('account.validate_chart', [
            'operation' => 'full_validation',
        ]);

        try {
            $errors = $this->domainService->validateChartOfAccounts();

            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'validateChartOfAccounts',
                $metrics['duration_ms'] ?? 0,
                ['status' => 'success']
            );

            $this->performanceMonitor->recordMetric('account.validation_errors', count($errors));
            $this->performanceMonitor->incrementCounter('account.chart_validations', 1, [
                'has_errors' => count($errors) > 0 ? 'yes' : 'no',
            ]);

            return $errors;

        } catch (Exception $e) {
            $metrics = $this->performanceMonitor->stopTimer($timerId);
            
            $this->performanceMonitor->recordDomainServiceOperation(
                'AccountDomainService',
                'validateChartOfAccounts',
                $metrics['duration_ms'] ?? 0,
                [
                    'status' => 'error',
                    'error_type' => get_class($e),
                ]
            );

            throw $e;
        }
    }

    /**
     * Get performance metrics for account operations (now with Telescope integration)
     */
    public function getAccountOperationMetrics(int $minutes = 60): array
    {
        // Get unified metrics from both custom monitor and Telescope
        $unifiedSummary = $this->telescopeAdapter->getUnifiedPerformanceSummary($minutes);
        $customSummary = $this->performanceMonitor->getPerformanceSummary($minutes);
        
        return [
            'period' => $customSummary['period'],
            'tenant_id' => $customSummary['tenant_id'],
            'account_operations' => [
                'domain_services' => $customSummary['domain_services'],
                'slow_operations' => $this->telescopeAdapter->getUnifiedSlowOperations(500, 10),
                'current_status' => $this->performanceMonitor->getCurrentStatus(),
            ],
            'telescope_insights' => [
                'database_performance' => $unifiedSummary['telescope_metrics']['database'] ?? [],
                'request_performance' => $unifiedSummary['telescope_metrics']['requests'] ?? [],
                'domain_events' => $unifiedSummary['telescope_metrics']['domain_events'] ?? [],
            ],
            'performance_alerts' => $this->telescopeAdapter->getPerformanceAlerts(),
            'generated_at' => $customSummary['generated_at'],
        ];
    }

    private function countAccountsInHierarchy(array $hierarchy): int
    {
        $count = count($hierarchy);
        
        foreach ($hierarchy as $account) {
            if (isset($account['children']) && is_array($account['children'])) {
                $count += $this->countAccountsInHierarchy($account['children']);
            }
        }
        
        return $count;
    }
}
