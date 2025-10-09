<?php

namespace App\Features\Reporting\Services;

use App\Features\Inventory\Models\Product;
use App\Features\Accounting\Models\Account;
use App\Features\Sales\Models\Customer;
use App\Features\Sales\Models\SalesOrder;
use App\Features\Purchase\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class ReportingService
{
    public function getExecutiveDashboard(int $organizationId): array
    {
        $cacheKey = "executive_dashboard_{$organizationId}";
        
        return Cache::remember($cacheKey, 300, function () use ($organizationId) {
            return [
                'financial_overview' => $this->getFinancialOverview($organizationId),
                'sales_performance' => $this->getSalesPerformance($organizationId),
                'inventory_status' => $this->getInventoryStatus($organizationId),
                'purchase_analytics' => $this->getPurchaseAnalytics($organizationId),
                'key_metrics' => $this->getKeyMetrics($organizationId),
                'trends' => $this->getTrends($organizationId),
            ];
        });
    }

    public function getSalesReport(int $organizationId, array $filters = []): array
    {
        $startDate = $filters['start_date'] ?? now()->startOfMonth();
        $endDate = $filters['end_date'] ?? now()->endOfMonth();

        $salesData = SalesOrder::where('organization_id', $organizationId)
                              ->whereBetween('order_date', [$startDate, $endDate])
                              ->with(['customer', 'items.product'])
                              ->get();

        return [
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => [
                'total_orders' => $salesData->count(),
                'total_revenue' => $salesData->sum('total_amount'),
                'average_order_value' => $salesData->avg('total_amount'),
                'completed_orders' => $salesData->where('status', 'completed')->count(),
            ],
            'by_status' => $this->groupSalesByStatus($salesData),
            'by_customer' => $this->groupSalesByCustomer($salesData),
            'by_product' => $this->groupSalesByProduct($salesData),
            'daily_trends' => $this->getDailySalesTrends($organizationId, $startDate, $endDate),
        ];
    }

    public function getInventoryReport(int $organizationId, array $filters = []): array
    {
        $products = Product::where('organization_id', $organizationId)
                          ->with(['category', 'stockLevels'])
                          ->get();

        $lowStockProducts = $products->filter(function ($product) {
            return $product->current_stock <= $product->minimum_stock_level;
        });

        $outOfStockProducts = $products->filter(function ($product) {
            return $product->current_stock <= 0;
        });

        return [
            'summary' => [
                'total_products' => $products->count(),
                'total_stock_value' => $products->sum(function ($product) {
                    return $product->current_stock * $product->cost_price;
                }),
                'low_stock_items' => $lowStockProducts->count(),
                'out_of_stock_items' => $outOfStockProducts->count(),
            ],
            'by_category' => $this->groupInventoryByCategory($products),
            'stock_alerts' => [
                'low_stock' => $lowStockProducts->take(10),
                'out_of_stock' => $outOfStockProducts->take(10),
            ],
            'top_products' => $this->getTopProductsByValue($products),
        ];
    }

    public function getFinancialReport(int $organizationId, array $filters = []): array
    {
        $startDate = $filters['start_date'] ?? now()->startOfYear();
        $endDate = $filters['end_date'] ?? now()->endOfYear();

        return [
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'profit_loss' => $this->getProfitLossStatement($organizationId, $startDate, $endDate),
            'balance_sheet' => $this->getBalanceSheetSummary($organizationId, $endDate),
            'cash_flow' => $this->getCashFlowSummary($organizationId, $startDate, $endDate),
            'financial_ratios' => $this->getFinancialRatios($organizationId, $endDate),
        ];
    }

    private function getFinancialOverview(int $organizationId): array
    {
        $currentMonth = now()->startOfMonth();
        $lastMonth = now()->subMonth()->startOfMonth();

        $currentRevenue = SalesOrder::where('organization_id', $organizationId)
                                   ->whereMonth('order_date', $currentMonth->month)
                                   ->whereYear('order_date', $currentMonth->year)
                                   ->sum('total_amount');

        $lastMonthRevenue = SalesOrder::where('organization_id', $organizationId)
                                     ->whereMonth('order_date', $lastMonth->month)
                                     ->whereYear('order_date', $lastMonth->year)
                                     ->sum('total_amount');

        return [
            'current_month_revenue' => $currentRevenue,
            'last_month_revenue' => $lastMonthRevenue,
            'revenue_growth' => $lastMonthRevenue > 0 ? (($currentRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 : 0,
            'ytd_revenue' => SalesOrder::where('organization_id', $organizationId)
                                      ->whereYear('order_date', now()->year)
                                      ->sum('total_amount'),
        ];
    }

    private function getSalesPerformance(int $organizationId): array
    {
        $currentMonth = now()->startOfMonth();
        
        return [
            'monthly_orders' => SalesOrder::where('organization_id', $organizationId)
                                         ->whereMonth('order_date', $currentMonth->month)
                                         ->count(),
            'conversion_rate' => 85.5, // This would be calculated based on leads/quotes
            'average_deal_size' => SalesOrder::where('organization_id', $organizationId)
                                            ->whereMonth('order_date', $currentMonth->month)
                                            ->avg('total_amount'),
            'top_customers' => Customer::where('organization_id', $organizationId)
                                     ->withSum('salesOrders', 'total_amount')
                                     ->orderBy('sales_orders_sum_total_amount', 'desc')
                                     ->limit(5)
                                     ->get(),
        ];
    }

    private function getInventoryStatus(int $organizationId): array
    {
        $products = Product::where('organization_id', $organizationId)->get();
        
        return [
            'total_products' => $products->count(),
            'total_stock_value' => $products->sum(function ($product) {
                return $product->current_stock * $product->cost_price;
            }),
            'low_stock_alerts' => $products->filter(function ($product) {
                return $product->current_stock <= $product->minimum_stock_level;
            })->count(),
            'stock_turnover' => 4.2, // This would be calculated based on sales/average inventory
        ];
    }

    private function getPurchaseAnalytics(int $organizationId): array
    {
        $currentMonth = now()->startOfMonth();
        
        return [
            'monthly_purchases' => PurchaseOrder::where('organization_id', $organizationId)
                                               ->whereMonth('order_date', $currentMonth->month)
                                               ->sum('total_amount'),
            'pending_orders' => PurchaseOrder::where('organization_id', $organizationId)
                                            ->where('status', 'pending')
                                            ->count(),
            'supplier_performance' => 92.3, // This would be calculated based on delivery times
            'cost_savings' => 15.7, // This would be calculated based on negotiated discounts
        ];
    }

    private function getKeyMetrics(int $organizationId): array
    {
        return [
            'gross_margin' => 35.2,
            'net_margin' => 12.8,
            'inventory_turnover' => 6.4,
            'accounts_receivable_turnover' => 8.2,
            'current_ratio' => 2.1,
            'quick_ratio' => 1.8,
        ];
    }

    private function getTrends(int $organizationId): array
    {
        $trends = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            
            $revenue = SalesOrder::where('organization_id', $organizationId)
                                ->whereMonth('order_date', $date->month)
                                ->whereYear('order_date', $date->year)
                                ->sum('total_amount');
            
            $expenses = PurchaseOrder::where('organization_id', $organizationId)
                                   ->whereMonth('order_date', $date->month)
                                   ->whereYear('order_date', $date->year)
                                   ->sum('total_amount');
            
            $trends[] = [
                'month' => $date->format('M Y'),
                'revenue' => (float) $revenue,
                'expenses' => (float) $expenses,
                'profit' => (float) ($revenue - $expenses),
            ];
        }
        
        return $trends;
    }

    private function groupSalesByStatus($salesData): array
    {
        return $salesData->groupBy('status')->map(function ($orders, $status) {
            return [
                'status' => $status,
                'count' => $orders->count(),
                'total_amount' => $orders->sum('total_amount'),
            ];
        })->values()->toArray();
    }

    private function groupSalesByCustomer($salesData): array
    {
        return $salesData->groupBy('customer.id')->map(function ($orders, $customerId) {
            $customer = $orders->first()->customer;
            return [
                'customer_id' => $customerId,
                'customer_name' => $customer->display_name,
                'order_count' => $orders->count(),
                'total_amount' => $orders->sum('total_amount'),
            ];
        })->sortByDesc('total_amount')->take(10)->values()->toArray();
    }

    private function groupSalesByProduct($salesData): array
    {
        $productSales = [];
        
        foreach ($salesData as $order) {
            foreach ($order->items as $item) {
                $productId = $item->product_id;
                if (!isset($productSales[$productId])) {
                    $productSales[$productId] = [
                        'product_id' => $productId,
                        'product_name' => $item->product->name,
                        'quantity_sold' => 0,
                        'total_revenue' => 0,
                    ];
                }
                
                $productSales[$productId]['quantity_sold'] += $item->quantity;
                $productSales[$productId]['total_revenue'] += $item->line_total;
            }
        }
        
        return collect($productSales)->sortByDesc('total_revenue')->take(10)->values()->toArray();
    }

    private function getDailySalesTrends(int $organizationId, $startDate, $endDate): array
    {
        return SalesOrder::where('organization_id', $organizationId)
                        ->whereBetween('order_date', [$startDate, $endDate])
                        ->selectRaw('DATE(order_date) as date, COUNT(*) as orders, SUM(total_amount) as revenue')
                        ->groupBy('date')
                        ->orderBy('date')
                        ->get()
                        ->toArray();
    }

    private function groupInventoryByCategory($products): array
    {
        return $products->groupBy('category.name')->map(function ($categoryProducts, $categoryName) {
            return [
                'category' => $categoryName ?: 'Uncategorized',
                'product_count' => $categoryProducts->count(),
                'total_stock' => $categoryProducts->sum('current_stock'),
                'total_value' => $categoryProducts->sum(function ($product) {
                    return $product->current_stock * $product->cost_price;
                }),
            ];
        })->values()->toArray();
    }

    private function getTopProductsByValue($products): array
    {
        return $products->map(function ($product) {
            return [
                'product_id' => $product->id,
                'name' => $product->name,
                'current_stock' => $product->current_stock,
                'cost_price' => $product->cost_price,
                'total_value' => $product->current_stock * $product->cost_price,
            ];
        })->sortByDesc('total_value')->take(10)->values()->toArray();
    }

    private function getProfitLossStatement(int $organizationId, $startDate, $endDate): array
    {
        // This would integrate with the accounting module for actual P&L
        return [
            'revenue' => 150000,
            'cost_of_goods_sold' => 90000,
            'gross_profit' => 60000,
            'operating_expenses' => 35000,
            'operating_income' => 25000,
            'net_income' => 22000,
        ];
    }

    private function getBalanceSheetSummary(int $organizationId, $endDate): array
    {
        // This would integrate with the accounting module for actual balance sheet
        return [
            'total_assets' => 250000,
            'current_assets' => 120000,
            'fixed_assets' => 130000,
            'total_liabilities' => 80000,
            'current_liabilities' => 45000,
            'long_term_liabilities' => 35000,
            'total_equity' => 170000,
        ];
    }

    private function getCashFlowSummary(int $organizationId, $startDate, $endDate): array
    {
        return [
            'operating_cash_flow' => 28000,
            'investing_cash_flow' => -15000,
            'financing_cash_flow' => 5000,
            'net_cash_flow' => 18000,
        ];
    }

    private function getFinancialRatios(int $organizationId, $endDate): array
    {
        return [
            'current_ratio' => 2.67,
            'quick_ratio' => 1.89,
            'debt_to_equity' => 0.47,
            'return_on_assets' => 0.088,
            'return_on_equity' => 0.129,
            'gross_margin' => 0.40,
            'net_margin' => 0.147,
        ];
    }
}
