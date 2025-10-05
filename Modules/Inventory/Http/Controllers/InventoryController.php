<?php

namespace Modules\Inventory\Http\Controllers;

use Modules\Inventory\Models\Product;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\ProductCategory;
use Modules\Inventory\Models\Supplier;
use Modules\Inventory\Models\PurchaseOrder;
use Modules\Inventory\Services\InventoryService;
use Modules\Shared\Http\Controllers\BaseController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class InventoryController extends BaseController
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Get inventory dashboard
     */
    public function dashboard(): JsonResponse
    {
        $organizationId = $this->getCurrentOrganizationId();
        $overview = $this->inventoryService->getInventoryOverview($organizationId);

        return $this->successResponse($overview, 'Inventory dashboard data retrieved successfully');
    }

    /**
     * Get all products
     */
    public function products(Request $request): JsonResponse
    {
        $organizationId = $this->getCurrentOrganizationId();
        
        $query = Product::where('organization_id', $organizationId)
                       ->with(['category', 'stockLevels.warehouse']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('low_stock')) {
            $query->lowStock();
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('sku', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $products = $query->paginate($request->get('per_page', 15));

        return $this->successResponse($products, 'Products retrieved successfully');
    }

    /**
     * Create a new product
     */
    public function createProduct(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:products,sku',
            'description' => 'nullable|string',
            'type' => 'required|in:' . implode(',', array_keys(Product::getProductTypes())),
            'category_id' => 'nullable|exists:product_categories,id',
            'unit_of_measure' => 'required|in:' . implode(',', array_keys(Product::getUnitsOfMeasure())),
            'cost_price' => 'nullable|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'minimum_stock_level' => 'nullable|numeric|min:0',
            'maximum_stock_level' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'reorder_quantity' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|array',
            'barcode' => 'nullable|string|max:255',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'is_trackable' => 'boolean',
            'is_serialized' => 'boolean',
            'valuation_method' => 'required|in:' . implode(',', array_keys(Product::getValuationMethods())),
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', $validator->errors(), 422);
        }

        $data = $validator->validated();
        $data['organization_id'] = $this->getCurrentOrganizationId();
        $data['created_by'] = auth()->id();

        $product = Product::create($data);

        return $this->successResponse($product->load(['category', 'stockLevels']), 'Product created successfully', 201);
    }

    /**
     * Get a specific product
     */
    public function showProduct(int $id): JsonResponse
    {
        $organizationId = $this->getCurrentOrganizationId();
        
        $product = Product::where('organization_id', $organizationId)
                         ->with(['category', 'stockLevels.warehouse', 'suppliers'])
                         ->findOrFail($id);

        return $this->successResponse($product, 'Product retrieved successfully');
    }

    /**
     * Update a product
     */
    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $organizationId = $this->getCurrentOrganizationId();
        
        $product = Product::where('organization_id', $organizationId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'sku' => 'sometimes|nullable|string|max:100|unique:products,sku,' . $id,
            'description' => 'nullable|string',
            'type' => 'sometimes|required|in:' . implode(',', array_keys(Product::getProductTypes())),
            'category_id' => 'nullable|exists:product_categories,id',
            'unit_of_measure' => 'sometimes|required|in:' . implode(',', array_keys(Product::getUnitsOfMeasure())),
            'cost_price' => 'nullable|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'minimum_stock_level' => 'nullable|numeric|min:0',
            'maximum_stock_level' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'reorder_quantity' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|array',
            'barcode' => 'nullable|string|max:255',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'is_trackable' => 'boolean',
            'is_serialized' => 'boolean',
            'valuation_method' => 'sometimes|required|in:' . implode(',', array_keys(Product::getValuationMethods())),
            'status' => 'sometimes|required|in:' . implode(',', array_keys(Product::getStatuses())),
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', $validator->errors(), 422);
        }

        $product->update($validator->validated());

        return $this->successResponse($product->load(['category', 'stockLevels']), 'Product updated successfully');
    }

    /**
     * Delete a product
     */
    public function deleteProduct(int $id): JsonResponse
    {
        $organizationId = $this->getCurrentOrganizationId();
        
        $product = Product::where('organization_id', $organizationId)->findOrFail($id);

        // Check if product has stock movements
        if ($product->stockMovements()->exists()) {
            return $this->errorResponse('Cannot delete product with existing stock movements', null, 422);
        }

        $product->delete();

        return $this->successResponse(null, 'Product deleted successfully');
    }

    /**
     * Get stock levels
     */
    public function stockLevels(Request $request): JsonResponse
    {
        $organizationId = $this->getCurrentOrganizationId();
        
        $query = StockLevel::where('organization_id', $organizationId)
                          ->with(['product', 'warehouse']);

        // Apply filters
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('low_stock')) {
            $query->lowStock();
        }

        if ($request->filled('out_of_stock')) {
            $query->outOfStock();
        }

        $stockLevels = $query->paginate($request->get('per_page', 15));

        return $this->successResponse($stockLevels, 'Stock levels retrieved successfully');
    }

    /**
     * Adjust stock
     */
    public function adjustStock(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric',
            'reason' => 'required|in:' . implode(',', array_keys(StockMovement::getReasons())),
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', $validator->errors(), 422);
        }

        $data = $validator->validated();
        
        try {
            $movement = $this->inventoryService->adjustStock(
                $data['product_id'],
                $data['warehouse_id'],
                $data['quantity'],
                $data['reason'],
                array_filter([
                    'unit_cost' => $data['unit_cost'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ])
            );

            return $this->successResponse($movement->load(['product', 'warehouse']), 'Stock adjusted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to adjust stock: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Transfer stock between warehouses
     */
    public function transferStock(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', $validator->errors(), 422);
        }

        $data = $validator->validated();

        try {
            $movements = $this->inventoryService->transferStock(
                $data['product_id'],
                $data['from_warehouse_id'],
                $data['to_warehouse_id'],
                $data['quantity'],
                $data['notes'] ?? null
            );

            return $this->successResponse($movements, 'Stock transferred successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to transfer stock: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Get stock movements
     */
    public function stockMovements(Request $request): JsonResponse
    {
        $organizationId = $this->getCurrentOrganizationId();
        
        $query = StockMovement::where('organization_id', $organizationId)
                             ->with(['product', 'warehouse', 'createdBy']);

        // Apply filters
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        if ($request->filled('reason')) {
            $query->where('reason', $request->reason);
        }

        if ($request->filled('date_from')) {
            $query->where('movement_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('movement_date', '<=', $request->date_to);
        }

        $movements = $query->orderBy('movement_date', 'desc')
                          ->paginate($request->get('per_page', 15));

        return $this->successResponse($movements, 'Stock movements retrieved successfully');
    }

    /**
     * Get inventory valuation
     */
    public function inventoryValuation(Request $request): JsonResponse
    {
        $organizationId = $this->getCurrentOrganizationId();
        $method = $request->get('method', 'weighted_average');

        $valuation = $this->inventoryService->calculateInventoryValuation($organizationId, $method);

        return $this->successResponse($valuation, 'Inventory valuation calculated successfully');
    }

    /**
     * Get inventory aging report
     */
    public function inventoryAging(): JsonResponse
    {
        $organizationId = $this->getCurrentOrganizationId();
        $aging = $this->inventoryService->getInventoryAging($organizationId);

        return $this->successResponse($aging, 'Inventory aging report generated successfully');
    }

    /**
     * Get low stock products
     */
    public function lowStockProducts(): JsonResponse
    {
        $organizationId = $this->getCurrentOrganizationId();
        $products = $this->inventoryService->getLowStockProducts($organizationId);

        return $this->successResponse($products, 'Low stock products retrieved successfully');
    }

    /**
     * Get products needing reorder
     */
    public function productsNeedingReorder(): JsonResponse
    {
        $organizationId = $this->getCurrentOrganizationId();
        $products = $this->inventoryService->getProductsNeedingReorder($organizationId);

        return $this->successResponse($products, 'Products needing reorder retrieved successfully');
    }

    /**
     * Reserve stock
     */
    public function reserveStock(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.01',
            'reason' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', $validator->errors(), 422);
        }

        $data = $validator->validated();

        $success = $this->inventoryService->reserveStock(
            $data['product_id'],
            $data['warehouse_id'],
            $data['quantity'],
            $data['reason'] ?? null
        );

        if ($success) {
            return $this->successResponse(null, 'Stock reserved successfully');
        } else {
            return $this->errorResponse('Insufficient stock available for reservation', null, 422);
        }
    }

    /**
     * Release reserved stock
     */
    public function releaseReservedStock(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', $validator->errors(), 422);
        }

        $data = $validator->validated();

        $success = $this->inventoryService->releaseReservedStock(
            $data['product_id'],
            $data['warehouse_id'],
            $data['quantity']
        );

        if ($success) {
            return $this->successResponse(null, 'Reserved stock released successfully');
        } else {
            return $this->errorResponse('Failed to release reserved stock', null, 422);
        }
    }

    /**
     * Get metadata for dropdowns
     */
    public function metadata(): JsonResponse
    {
        return $this->successResponse([
            'product_types' => Product::getProductTypes(),
            'product_statuses' => Product::getStatuses(),
            'valuation_methods' => Product::getValuationMethods(),
            'units_of_measure' => Product::getUnitsOfMeasure(),
            'movement_types' => StockMovement::getMovementTypes(),
            'movement_reasons' => StockMovement::getReasons(),
        ], 'Metadata retrieved successfully');
    }
}

