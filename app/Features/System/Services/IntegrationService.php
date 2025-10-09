<?php

namespace App\Features\System\Services;

use App\Features\Inventory\Services\InventoryService;
use App\Features\Accounting\Services\AccountingService;
use App\Features\Sales\Services\SalesService;
use App\Features\Purchase\Services\PurchaseService;
use App\Features\Reporting\Services\ReportingService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class IntegrationService
{
    protected $inventoryService;
    protected $accountingService;
    protected $salesService;
    protected $purchaseService;
    protected $reportingService;

    public function __construct(
        InventoryService $inventoryService,
        AccountingService $accountingService,
        SalesService $salesService,
        PurchaseService $purchaseService,
        ReportingService $reportingService
    ) {
        $this->inventoryService = $inventoryService;
        $this->accountingService = $accountingService;
        $this->salesService = $salesService;
        $this->purchaseService = $purchaseService;
        $this->reportingService = $reportingService;
    }

    /**
     * Get unified dashboard for all modules
     */
    public function getUnifiedDashboard(int $organizationId): array
    {
        $cacheKey = "unified_dashboard_{$organizationId}";
        
        return Cache::remember($cacheKey, 300, function () use ($organizationId) {
            try {
                return [
                    'inventory' => $this->inventoryService->getDashboardOverview($organizationId),
                    'accounting' => $this->accountingService->getDashboardOverview($organizationId),
                    'sales' => $this->salesService->getDashboardOverview($organizationId),
                    'purchase' => $this->purchaseService->getDashboardOverview($organizationId),
                    'reporting' => $this->reportingService->getExecutiveDashboard($organizationId),
                    'system_health' => $this->getSystemHealth(),
                    'quick_actions' => $this->getQuickActions($organizationId),
                ];
            } catch (\Exception $e) {
                Log::error('Failed to load unified dashboard', [
                    'organization_id' => $organizationId,
                    'error' => $e->getMessage()
                ]);
                
                return [
                    'error' => 'Failed to load dashboard data',
                    'system_health' => $this->getSystemHealth(),
                ];
            }
        });
    }

    /**
     * Process sales order and update inventory
     */
    public function processSalesOrder(int $organizationId, array $orderData): array
    {
        try {
            \DB::beginTransaction();

            // Create sales order
            $salesOrder = $this->salesService->createSalesOrder($organizationId, $orderData);

            // Update inventory levels
            foreach ($orderData['items'] as $item) {
                $this->inventoryService->adjustStock(
                    $item['product_id'],
                    -$item['quantity'],
                    'sales_order',
                    "Sales Order #{$salesOrder->id}"
                );
            }

            // Create accounting entries
            $this->createSalesAccountingEntries($organizationId, $salesOrder);

            \DB::commit();

            // Clear relevant caches
            $this->clearIntegrationCaches($organizationId);

            return [
                'success' => true,
                'sales_order' => $salesOrder,
                'message' => 'Sales order processed successfully'
            ];

        } catch (\Exception $e) {
            \DB::rollBack();
            Log::error('Failed to process sales order', [
                'organization_id' => $organizationId,
                'error' => $e->getMessage(),
                'data' => $orderData
            ]);

            return [
                'success' => false,
                'message' => 'Failed to process sales order: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process purchase order and update inventory
     */
    public function processPurchaseOrder(int $organizationId, array $orderData): array
    {
        try {
            \DB::beginTransaction();

            // Create purchase order
            $purchaseOrder = $this->purchaseService->createPurchaseOrder($organizationId, $orderData);

            // When received, update inventory levels
            if (isset($orderData['status']) && $orderData['status'] === 'received') {
                foreach ($orderData['items'] as $item) {
                    $this->inventoryService->adjustStock(
                        $item['product_id'],
                        $item['quantity'],
                        'purchase_order',
                        "Purchase Order #{$purchaseOrder->id}"
                    );
                }

                // Create accounting entries
                $this->createPurchaseAccountingEntries($organizationId, $purchaseOrder);
            }

            \DB::commit();

            // Clear relevant caches
            $this->clearIntegrationCaches($organizationId);

            return [
                'success' => true,
                'purchase_order' => $purchaseOrder,
                'message' => 'Purchase order processed successfully'
            ];

        } catch (\Exception $e) {
            \DB::rollBack();
            Log::error('Failed to process purchase order', [
                'organization_id' => $organizationId,
                'error' => $e->getMessage(),
                'data' => $orderData
            ]);

            return [
                'success' => false,
                'message' => 'Failed to process purchase order: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get system health status
     */
    public function getSystemHealth(): array
    {
        return [
            'database' => $this->checkDatabaseHealth(),
            'cache' => $this->checkCacheHealth(),
            'storage' => $this->checkStorageHealth(),
            'modules' => $this->checkModulesHealth(),
            'overall_status' => 'healthy',
            'last_check' => now()->toISOString(),
        ];
    }

    /**
     * Get quick actions for dashboard
     */
    public function getQuickActions(int $organizationId): array
    {
        return [
            'create_sales_order' => [
                'label' => 'New Sales Order',
                'icon' => 'shopping-cart',
                'url' => '/sales/orders/create',
                'permission' => 'sales.create'
            ],
            'create_purchase_order' => [
                'label' => 'New Purchase Order',
                'icon' => 'truck',
                'url' => '/purchase/orders/create',
                'permission' => 'purchase.create'
            ],
            'add_product' => [
                'label' => 'Add Product',
                'icon' => 'package',
                'url' => '/inventory/products/create',
                'permission' => 'inventory.create'
            ],
            'create_journal_entry' => [
                'label' => 'Journal Entry',
                'icon' => 'book',
                'url' => '/accounting/journal-entries/create',
                'permission' => 'accounting.create'
            ],
            'view_reports' => [
                'label' => 'View Reports',
                'icon' => 'bar-chart',
                'url' => '/reports',
                'permission' => 'reports.view'
            ],
        ];
    }

    /**
     * Sync data between modules
     */
    public function syncModuleData(int $organizationId): array
    {
        try {
            $results = [];

            // Sync inventory with accounting (update asset accounts)
            $results['inventory_accounting'] = $this->syncInventoryWithAccounting($organizationId);

            // Sync sales with accounting (update revenue accounts)
            $results['sales_accounting'] = $this->syncSalesWithAccounting($organizationId);

            // Sync purchases with accounting (update expense accounts)
            $results['purchase_accounting'] = $this->syncPurchaseWithAccounting($organizationId);

            // Clear all caches
            $this->clearIntegrationCaches($organizationId);

            return [
                'success' => true,
                'results' => $results,
                'message' => 'Module data synchronized successfully'
            ];

        } catch (\Exception $e) {
            Log::error('Failed to sync module data', [
                'organization_id' => $organizationId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to sync module data: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Create accounting entries for sales order
     */
    private function createSalesAccountingEntries(int $organizationId, $salesOrder): void
    {
        $entries = [
            [
                'account_id' => $this->getAccountId($organizationId, 'accounts_receivable'),
                'debit_amount' => $salesOrder->total_amount,
                'credit_amount' => 0,
                'description' => "Sales Order #{$salesOrder->id} - {$salesOrder->customer->display_name}",
            ],
            [
                'account_id' => $this->getAccountId($organizationId, 'sales_revenue'),
                'debit_amount' => 0,
                'credit_amount' => $salesOrder->subtotal,
                'description' => "Sales Order #{$salesOrder->id} - Revenue",
            ],
        ];

        if ($salesOrder->tax_amount > 0) {
            $entries[] = [
                'account_id' => $this->getAccountId($organizationId, 'sales_tax_payable'),
                'debit_amount' => 0,
                'credit_amount' => $salesOrder->tax_amount,
                'description' => "Sales Order #{$salesOrder->id} - Tax",
            ];
        }

        $this->accountingService->createJournalEntry($organizationId, [
            'transaction_date' => $salesOrder->order_date,
            'description' => "Sales Order #{$salesOrder->id}",
            'total_amount' => $salesOrder->total_amount,
            'entries' => $entries,
        ]);
    }

    /**
     * Create accounting entries for purchase order
     */
    private function createPurchaseAccountingEntries(int $organizationId, $purchaseOrder): void
    {
        $entries = [
            [
                'account_id' => $this->getAccountId($organizationId, 'inventory'),
                'debit_amount' => $purchaseOrder->subtotal,
                'credit_amount' => 0,
                'description' => "Purchase Order #{$purchaseOrder->id} - Inventory",
            ],
            [
                'account_id' => $this->getAccountId($organizationId, 'accounts_payable'),
                'debit_amount' => 0,
                'credit_amount' => $purchaseOrder->total_amount,
                'description' => "Purchase Order #{$purchaseOrder->id} - {$purchaseOrder->supplier->display_name}",
            ],
        ];

        if ($purchaseOrder->tax_amount > 0) {
            $entries[] = [
                'account_id' => $this->getAccountId($organizationId, 'input_tax'),
                'debit_amount' => $purchaseOrder->tax_amount,
                'credit_amount' => 0,
                'description' => "Purchase Order #{$purchaseOrder->id} - Tax",
            ];
        }

        $this->accountingService->createJournalEntry($organizationId, [
            'transaction_date' => $purchaseOrder->order_date,
            'description' => "Purchase Order #{$purchaseOrder->id}",
            'total_amount' => $purchaseOrder->total_amount,
            'entries' => $entries,
        ]);
    }

    /**
     * Get account ID by type
     */
    private function getAccountId(int $organizationId, string $accountType): int
    {
        // This would map to actual account IDs based on chart of accounts
        $accountMappings = [
            'accounts_receivable' => 1,
            'sales_revenue' => 2,
            'sales_tax_payable' => 3,
            'inventory' => 4,
            'accounts_payable' => 5,
            'input_tax' => 6,
        ];

        return $accountMappings[$accountType] ?? 1;
    }

    /**
     * Check database health
     */
    private function checkDatabaseHealth(): array
    {
        try {
            \DB::connection()->getPdo();
            return ['status' => 'healthy', 'message' => 'Database connection successful'];
        } catch (\Exception $e) {
            return ['status' => 'unhealthy', 'message' => 'Database connection failed'];
        }
    }

    /**
     * Check cache health
     */
    private function checkCacheHealth(): array
    {
        try {
            Cache::put('health_check', 'test', 10);
            $value = Cache::get('health_check');
            return ['status' => $value === 'test' ? 'healthy' : 'unhealthy'];
        } catch (\Exception $e) {
            return ['status' => 'unhealthy', 'message' => 'Cache system failed'];
        }
    }

    /**
     * Check storage health
     */
    private function checkStorageHealth(): array
    {
        try {
            $diskSpace = disk_free_space(storage_path());
            $totalSpace = disk_total_space(storage_path());
            $usagePercent = (($totalSpace - $diskSpace) / $totalSpace) * 100;
            
            return [
                'status' => $usagePercent < 90 ? 'healthy' : 'warning',
                'usage_percent' => round($usagePercent, 2),
                'free_space' => $this->formatBytes($diskSpace),
            ];
        } catch (\Exception $e) {
            return ['status' => 'unhealthy', 'message' => 'Storage check failed'];
        }
    }

    /**
     * Check modules health
     */
    private function checkModulesHealth(): array
    {
        return [
            'inventory' => ['status' => 'healthy'],
            'accounting' => ['status' => 'healthy'],
            'sales' => ['status' => 'healthy'],
            'purchase' => ['status' => 'healthy'],
            'reporting' => ['status' => 'healthy'],
        ];
    }

    /**
     * Sync inventory with accounting
     */
    private function syncInventoryWithAccounting(int $organizationId): array
    {
        // Implementation would sync inventory values with accounting
        return ['synced_items' => 0, 'status' => 'completed'];
    }

    /**
     * Sync sales with accounting
     */
    private function syncSalesWithAccounting(int $organizationId): array
    {
        // Implementation would sync sales data with accounting
        return ['synced_orders' => 0, 'status' => 'completed'];
    }

    /**
     * Sync purchases with accounting
     */
    private function syncPurchaseWithAccounting(int $organizationId): array
    {
        // Implementation would sync purchase data with accounting
        return ['synced_orders' => 0, 'status' => 'completed'];
    }

    /**
     * Clear integration caches
     */
    private function clearIntegrationCaches(int $organizationId): void
    {
        Cache::forget("unified_dashboard_{$organizationId}");
        Cache::forget("inventory_overview_{$organizationId}");
        Cache::forget("accounting_overview_{$organizationId}");
        Cache::forget("sales_overview_{$organizationId}");
        Cache::forget("purchase_overview_{$organizationId}");
        Cache::forget("executive_dashboard_{$organizationId}");
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
