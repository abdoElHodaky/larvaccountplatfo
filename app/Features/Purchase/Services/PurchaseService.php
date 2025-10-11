<?php

namespace App\Features\Purchase\Services;

use App\Features\Purchase\Models\PurchaseOrder;
use App\Features\Purchase\Models\PurchaseOrderItem;
use App\Features\Purchase\Models\Supplier;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function getDashboardOverview(int $organizationId): array
    {
        $cacheKey = "purchase_overview_{$organizationId}";

        return Cache::remember($cacheKey, 300, function () use ($organizationId) {
            return [
                'total_suppliers' => Supplier::where('organization_id', $organizationId)->active()->count(),
                'monthly_purchases' => $this->getMonthlyPurchases($organizationId),
                'pending_orders' => PurchaseOrder::where('organization_id', $organizationId)->pending()->count(),
                'recent_orders' => $this->getRecentOrders($organizationId, 10),
                'top_suppliers' => $this->getTopSuppliers($organizationId, 5),
                'purchase_trends' => $this->getPurchaseTrends($organizationId),
            ];
        });
    }

    public function createSupplier(int $organizationId, array $data): Supplier
    {
        DB::beginTransaction();
        try {
            $data['organization_id'] = $organizationId;
            $data['created_by'] = auth()->id();

            if (empty($data['supplier_code'])) {
                $data['supplier_code'] = $this->generateSupplierCode($organizationId);
            }

            $supplier = Supplier::create($data);
            DB::commit();

            $this->clearPurchaseCache($organizationId);

            return $supplier;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function createPurchaseOrder(int $organizationId, array $data): PurchaseOrder
    {
        DB::beginTransaction();
        try {
            $orderData = array_merge($data, [
                'organization_id' => $organizationId,
                'created_by' => auth()->id(),
                'status' => PurchaseOrder::STATUS_DRAFT,
            ]);

            if (empty($orderData['po_number'])) {
                $orderData['po_number'] = $this->generatePoNumber($organizationId);
            }

            $order = PurchaseOrder::create($orderData);

            if (! empty($data['items'])) {
                foreach ($data['items'] as $itemData) {
                    $item = PurchaseOrderItem::create(array_merge($itemData, [
                        'organization_id' => $organizationId,
                        'purchase_order_id' => $order->id,
                    ]));
                    $item->calculateLineTotal();
                }
                $order->calculateTotals();
            }

            DB::commit();
            $this->clearPurchaseCache($organizationId);

            return $order->load(['supplier', 'items.product']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getSuppliers(int $organizationId, array $filters = []): Collection
    {
        $query = Supplier::where('organization_id', $organizationId);

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

        return $query->orderBy('company_name')->get();
    }

    public function getPurchaseOrders(int $organizationId, array $filters = []): Collection
    {
        $query = PurchaseOrder::where('organization_id', $organizationId)
            ->with(['supplier', 'items']);

        if (! empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (! empty($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        if (! empty($filters['start_date']) && ! empty($filters['end_date'])) {
            $query->dateRange($filters['start_date'], $filters['end_date']);
        }

        return $query->orderBy('order_date', 'desc')->get();
    }

    private function getMonthlyPurchases(int $organizationId): float
    {
        return PurchaseOrder::where('organization_id', $organizationId)
            ->whereMonth('order_date', now()->month)
            ->whereYear('order_date', now()->year)
            ->whereIn('status', [PurchaseOrder::STATUS_COMPLETED, PurchaseOrder::STATUS_RECEIVED])
            ->sum('total_amount');
    }

    private function getRecentOrders(int $organizationId, int $limit): Collection
    {
        return PurchaseOrder::where('organization_id', $organizationId)
            ->with(['supplier'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    private function getTopSuppliers(int $organizationId, int $limit): Collection
    {
        return Supplier::where('organization_id', $organizationId)
            ->withSum(['purchaseOrders as total_purchases' => function ($query) {
                $query->whereIn('status', [PurchaseOrder::STATUS_COMPLETED, PurchaseOrder::STATUS_RECEIVED]);
            }], 'total_amount')
            ->orderBy('total_purchases', 'desc')
            ->limit($limit)
            ->get();
    }

    private function getPurchaseTrends(int $organizationId): array
    {
        $trends = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $purchases = PurchaseOrder::where('organization_id', $organizationId)
                ->whereMonth('order_date', $date->month)
                ->whereYear('order_date', $date->year)
                ->whereIn('status', [PurchaseOrder::STATUS_COMPLETED, PurchaseOrder::STATUS_RECEIVED])
                ->sum('total_amount');

            $trends[] = [
                'month' => $date->format('M Y'),
                'purchases' => (float) $purchases,
            ];
        }

        return $trends;
    }

    private function generateSupplierCode(int $organizationId): string
    {
        $lastSupplier = Supplier::where('organization_id', $organizationId)
            ->where('supplier_code', 'like', 'SUP-%')
            ->orderBy('supplier_code', 'desc')
            ->first();

        if ($lastSupplier) {
            $lastNumber = (int) substr($lastSupplier->supplier_code, 4);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return 'SUP-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    private function generatePoNumber(int $organizationId): string
    {
        $lastOrder = PurchaseOrder::where('organization_id', $organizationId)
            ->where('po_number', 'like', 'PO-%')
            ->orderBy('po_number', 'desc')
            ->first();

        if ($lastOrder) {
            $lastNumber = (int) substr($lastOrder->po_number, 3);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return 'PO-'.str_pad($nextNumber, 8, '0', STR_PAD_LEFT);
    }

    private function clearPurchaseCache(int $organizationId): void
    {
        Cache::forget("purchase_overview_{$organizationId}");
        Cache::tags(['purchase', "org_{$organizationId}"])->flush();
    }
}
