<?php

namespace App\Features\Sales\Services;

use App\Features\Sales\Models\Customer;
use App\Features\Sales\Models\SalesOrder;
use App\Features\Sales\Models\SalesOrderItem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SalesService
{
    public function getDashboardOverview(int $organizationId): array
    {
        $cacheKey = "sales_overview_{$organizationId}";

        return Cache::remember($cacheKey, 300, function () use ($organizationId) {
            $currentMonth = now()->startOfMonth();
            $lastMonth = now()->subMonth()->startOfMonth();

            return [
                'total_customers' => Customer::where('organization_id', $organizationId)->active()->count(),
                'monthly_sales' => $this->getMonthlySales($organizationId),
                'pending_orders' => SalesOrder::where('organization_id', $organizationId)->pending()->count(),
                'recent_orders' => $this->getRecentOrders($organizationId, 10),
                'top_customers' => $this->getTopCustomers($organizationId, 5),
                'sales_trends' => $this->getSalesTrends($organizationId),
            ];
        });
    }

    public function createCustomer(int $organizationId, array $data): Customer
    {
        DB::beginTransaction();
        try {
            $data['organization_id'] = $organizationId;
            $data['created_by'] = auth()->id();

            if (empty($data['customer_code'])) {
                $data['customer_code'] = $this->generateCustomerCode($organizationId);
            }

            $customer = Customer::create($data);
            DB::commit();

            $this->clearSalesCache($organizationId);

            return $customer;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function createSalesOrder(int $organizationId, array $data): SalesOrder
    {
        DB::beginTransaction();
        try {
            $orderData = array_merge($data, [
                'organization_id' => $organizationId,
                'created_by' => auth()->id(),
                'status' => SalesOrder::STATUS_DRAFT,
            ]);

            if (empty($orderData['order_number'])) {
                $orderData['order_number'] = $this->generateOrderNumber($organizationId);
            }

            $order = SalesOrder::create($orderData);

            // Create order items
            if (! empty($data['items'])) {
                foreach ($data['items'] as $itemData) {
                    $item = SalesOrderItem::create(array_merge($itemData, [
                        'organization_id' => $organizationId,
                        'sales_order_id' => $order->id,
                    ]));
                    $item->calculateLineTotal();
                }
                $order->calculateTotals();
            }

            DB::commit();
            $this->clearSalesCache($organizationId);

            return $order->load(['customer', 'items.product']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getCustomers(int $organizationId, array $filters = []): Collection
    {
        $query = Customer::where('organization_id', $organizationId);

        if (! empty($filters['active_only'])) {
            $query->active();
        }

        if (! empty($filters['type'])) {
            $query->byType($filters['type']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('company_name', 'like', "%{$filters['search']}%")
                    ->orWhere('contact_person', 'like', "%{$filters['search']}%")
                    ->orWhere('email', 'like', "%{$filters['search']}%");
            });
        }

        return $query->orderBy('company_name')->orderBy('contact_person')->get();
    }

    public function getSalesOrders(int $organizationId, array $filters = []): Collection
    {
        $query = SalesOrder::where('organization_id', $organizationId)
            ->with(['customer', 'items']);

        if (! empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (! empty($filters['start_date']) && ! empty($filters['end_date'])) {
            $query->dateRange($filters['start_date'], $filters['end_date']);
        }

        return $query->orderBy('order_date', 'desc')->get();
    }

    private function getMonthlySales(int $organizationId): float
    {
        return SalesOrder::where('organization_id', $organizationId)
            ->whereMonth('order_date', now()->month)
            ->whereYear('order_date', now()->year)
            ->whereIn('status', [SalesOrder::STATUS_COMPLETED, SalesOrder::STATUS_DELIVERED])
            ->sum('total_amount');
    }

    private function getRecentOrders(int $organizationId, int $limit): Collection
    {
        return SalesOrder::where('organization_id', $organizationId)
            ->with(['customer'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    private function getTopCustomers(int $organizationId, int $limit): Collection
    {
        return Customer::where('organization_id', $organizationId)
            ->withSum(['salesOrders as total_sales' => function ($query) {
                $query->whereIn('status', [SalesOrder::STATUS_COMPLETED, SalesOrder::STATUS_DELIVERED]);
            }], 'total_amount')
            ->orderBy('total_sales', 'desc')
            ->limit($limit)
            ->get();
    }

    private function getSalesTrends(int $organizationId): array
    {
        $trends = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $sales = SalesOrder::where('organization_id', $organizationId)
                ->whereMonth('order_date', $date->month)
                ->whereYear('order_date', $date->year)
                ->whereIn('status', [SalesOrder::STATUS_COMPLETED, SalesOrder::STATUS_DELIVERED])
                ->sum('total_amount');

            $trends[] = [
                'month' => $date->format('M Y'),
                'sales' => (float) $sales,
            ];
        }

        return $trends;
    }

    private function generateCustomerCode(int $organizationId): string
    {
        $lastCustomer = Customer::where('organization_id', $organizationId)
            ->where('customer_code', 'like', 'CUST-%')
            ->orderBy('customer_code', 'desc')
            ->first();

        if ($lastCustomer) {
            $lastNumber = (int) substr($lastCustomer->customer_code, 5);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return 'CUST-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    private function generateOrderNumber(int $organizationId): string
    {
        $lastOrder = SalesOrder::where('organization_id', $organizationId)
            ->where('order_number', 'like', 'SO-%')
            ->orderBy('order_number', 'desc')
            ->first();

        if ($lastOrder) {
            $lastNumber = (int) substr($lastOrder->order_number, 3);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return 'SO-'.str_pad($nextNumber, 8, '0', STR_PAD_LEFT);
    }

    private function clearSalesCache(int $organizationId): void
    {
        Cache::forget("sales_overview_{$organizationId}");
        Cache::tags(['sales', "org_{$organizationId}"])->flush();
    }
}
