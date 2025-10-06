<?php

namespace Modules\Accounting\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Application\Services\PerformanceAwareAccountDomainService;
use Modules\Accounting\Domain\ValueObjects\AccountCode;
use Modules\Accounting\Http\Requests\CreateAccountRequest;
use Modules\Accounting\Http\Requests\UpdateAccountRequest;
use Modules\Accounting\Http\Resources\AccountResource;
use Modules\Accounting\Http\Resources\AccountHierarchyResource;
use Modules\Accounting\Http\Resources\TrialBalanceResource;
use Modules\Shared\Services\PerformanceMonitor;
use Exception;

class AccountController extends Controller
{
    public function __construct(
        private PerformanceAwareAccountDomainService $accountService,
        private PerformanceMonitor $performanceMonitor
    ) {}

    /**
     * Display a listing of accounts
     */
    public function index(Request $request): JsonResponse
    {
        $timerId = $this->performanceMonitor->startTimer('api.accounts.index', [
            'filters' => $request->query(),
        ]);

        try {
            $type = $request->query('type');
            $parentId = $request->query('parent_id');
            
            if ($type) {
                $accounts = $this->accountService->getAccountsByType($type);
            } elseif ($parentId !== null) {
                $accounts = $this->accountService->getAccountHierarchy((int) $parentId);
            } else {
                $accounts = $this->accountService->getAccountHierarchy();
            }

            $this->performanceMonitor->stopTimer($timerId);

            return response()->json([
                'data' => AccountHierarchyResource::collection($accounts),
                'meta' => [
                    'total' => count($accounts),
                    'type_filter' => $type,
                    'parent_filter' => $parentId,
                ],
            ]);

        } catch (Exception $e) {
            $this->performanceMonitor->stopTimer($timerId);
            
            return response()->json([
                'error' => 'Failed to retrieve accounts',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created account
     */
    public function store(CreateAccountRequest $request): JsonResponse
    {
        $timerId = $this->performanceMonitor->startTimer('api.accounts.store', [
            'type' => $request->input('type'),
            'subtype' => $request->input('subtype'),
        ]);

        try {
            $account = $this->accountService->createAccount(
                new AccountCode($request->input('code')),
                $request->input('name'),
                $request->input('type'),
                $request->input('subtype'),
                $request->input('parent_id'),
                $request->input('description', '')
            );

            $this->performanceMonitor->stopTimer($timerId);

            return response()->json([
                'data' => new AccountResource($account),
                'message' => 'Account created successfully',
            ], 201);

        } catch (ValidationException $e) {
            $this->performanceMonitor->stopTimer($timerId);
            
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);

        } catch (Exception $e) {
            $this->performanceMonitor->stopTimer($timerId);
            
            return response()->json([
                'error' => 'Failed to create account',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified account
     */
    public function show(int $id): JsonResponse
    {
        $timerId = $this->performanceMonitor->startTimer('api.accounts.show', [
            'account_id' => $id,
        ]);

        try {
            // This would require implementing findById in the service
            // For now, we'll return a placeholder response
            $this->performanceMonitor->stopTimer($timerId);

            return response()->json([
                'message' => 'Account show endpoint - implementation pending',
                'account_id' => $id,
            ]);

        } catch (Exception $e) {
            $this->performanceMonitor->stopTimer($timerId);
            
            return response()->json([
                'error' => 'Failed to retrieve account',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified account
     */
    public function update(UpdateAccountRequest $request, int $id): JsonResponse
    {
        $timerId = $this->performanceMonitor->startTimer('api.accounts.update', [
            'account_id' => $id,
        ]);

        try {
            // This would require implementing update functionality in the service
            $this->performanceMonitor->stopTimer($timerId);

            return response()->json([
                'message' => 'Account update endpoint - implementation pending',
                'account_id' => $id,
                'data' => $request->validated(),
            ]);

        } catch (ValidationException $e) {
            $this->performanceMonitor->stopTimer($timerId);
            
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);

        } catch (Exception $e) {
            $this->performanceMonitor->stopTimer($timerId);
            
            return response()->json([
                'error' => 'Failed to update account',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified account
     */
    public function destroy(int $id): JsonResponse
    {
        $timerId = $this->performanceMonitor->startTimer('api.accounts.destroy', [
            'account_id' => $id,
        ]);

        try {
            // This would require implementing delete functionality
            $this->performanceMonitor->stopTimer($timerId);

            return response()->json([
                'message' => 'Account delete endpoint - implementation pending',
                'account_id' => $id,
            ]);

        } catch (Exception $e) {
            $this->performanceMonitor->stopTimer($timerId);
            
            return response()->json([
                'error' => 'Failed to delete account',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get account hierarchy tree
     */
    public function hierarchy(Request $request): JsonResponse
    {
        $timerId = $this->performanceMonitor->startTimer('api.accounts.hierarchy', [
            'parent_id' => $request->query('parent_id'),
        ]);

        try {
            $parentId = $request->query('parent_id') ? (int) $request->query('parent_id') : null;
            $hierarchy = $this->accountService->getAccountHierarchy($parentId);

            $this->performanceMonitor->stopTimer($timerId);

            return response()->json([
                'data' => AccountHierarchyResource::collection($hierarchy),
                'meta' => [
                    'parent_id' => $parentId,
                    'total_accounts' => $this->countAccountsInHierarchy($hierarchy),
                ],
            ]);

        } catch (Exception $e) {
            $this->performanceMonitor->stopTimer($timerId);
            
            return response()->json([
                'error' => 'Failed to retrieve account hierarchy',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get trial balance
     */
    public function trialBalance(): JsonResponse
    {
        $timerId = $this->performanceMonitor->startTimer('api.accounts.trial_balance');

        try {
            $trialBalance = $this->accountService->getTrialBalance();

            $this->performanceMonitor->stopTimer($timerId);

            return response()->json([
                'data' => new TrialBalanceResource($trialBalance),
                'meta' => [
                    'generated_at' => now(),
                    'is_balanced' => $trialBalance['totals']['debits']->equals($trialBalance['totals']['credits']),
                ],
            ]);

        } catch (Exception $e) {
            $this->performanceMonitor->stopTimer($timerId);
            
            return response()->json([
                'error' => 'Failed to generate trial balance',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate chart of accounts
     */
    public function validateChart(): JsonResponse
    {
        $timerId = $this->performanceMonitor->startTimer('api.accounts.validate_chart');

        try {
            $errors = $this->accountService->validateChartOfAccounts();

            $this->performanceMonitor->stopTimer($timerId);

            return response()->json([
                'data' => [
                    'is_valid' => empty($errors),
                    'errors' => $errors,
                    'error_count' => count($errors),
                ],
                'meta' => [
                    'validated_at' => now(),
                ],
            ]);

        } catch (Exception $e) {
            $this->performanceMonitor->stopTimer($timerId);
            
            return response()->json([
                'error' => 'Failed to validate chart of accounts',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get account types and subtypes
     */
    public function types(): JsonResponse
    {
        return response()->json([
            'data' => [
                'asset' => [
                    'label' => 'Asset',
                    'subtypes' => [
                        'current_asset' => 'Current Asset',
                        'fixed_asset' => 'Fixed Asset',
                        'other_asset' => 'Other Asset',
                    ],
                ],
                'liability' => [
                    'label' => 'Liability',
                    'subtypes' => [
                        'current_liability' => 'Current Liability',
                        'long_term_liability' => 'Long-term Liability',
                        'other_liability' => 'Other Liability',
                    ],
                ],
                'equity' => [
                    'label' => 'Equity',
                    'subtypes' => [
                        'owner_equity' => 'Owner\'s Equity',
                        'retained_earnings' => 'Retained Earnings',
                    ],
                ],
                'revenue' => [
                    'label' => 'Revenue',
                    'subtypes' => [
                        'operating_revenue' => 'Operating Revenue',
                        'other_revenue' => 'Other Revenue',
                    ],
                ],
                'expense' => [
                    'label' => 'Expense',
                    'subtypes' => [
                        'operating_expense' => 'Operating Expense',
                        'other_expense' => 'Other Expense',
                    ],
                ],
            ],
        ]);
    }

    /**
     * Get performance metrics for account operations
     */
    public function metrics(Request $request): JsonResponse
    {
        $minutes = (int) $request->query('minutes', 60);
        
        try {
            $metrics = $this->accountService->getAccountOperationMetrics($minutes);

            return response()->json([
                'data' => $metrics,
                'meta' => [
                    'period_minutes' => $minutes,
                    'generated_at' => now(),
                ],
            ]);

        } catch (Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve performance metrics',
                'message' => $e->getMessage(),
            ], 500);
        }
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
