<?php

namespace App\Features\Inventory\Controllers;

use App\Features\Inventory\Models\Product;
use App\Features\Inventory\Services\InventoryService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
        $this->middleware('auth');
        $this->middleware('tenant');
    }

    /**
     * Display inventory dashboard page
     */
    public function index(): Response
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $overview = $this->inventoryService->getInventoryOverview($organizationId);
            
            // Get recent products and low stock alerts
            $recentProducts = $this->inventoryService->getRecentProducts($organizationId, 10);
            $lowStockProducts = $this->inventoryService->getLowStockProducts($organizationId);
            $categories = $this->inventoryService->getProductCategories($organizationId);

            return Inertia::render('Inventory/Dashboard', [
                'overview' => $overview,
                'recentProducts' => $recentProducts,
                'lowStockProducts' => $lowStockProducts,
                'categories' => $categories,
                'organization' => [
                    'id' => $organizationId,
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Inventory dashboard error: ' . $e->getMessage());
            
            // Return error page with Inertia
            return Inertia::render('Inventory/Dashboard', [
                'overview' => null,
                'recentProducts' => [],
                'lowStockProducts' => [],
                'categories' => [],
                'error' => 'Failed to load inventory data. Please try again.',
                'organization' => [
                    'id' => $this->getCurrentOrganizationId(),
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);
        }
    }

    /**
     * Get inventory dashboard data (API endpoint)
     */
    public function dashboardData(): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $overview = $this->inventoryService->getInventoryOverview($organizationId);

            return response()->json([
                'success' => true,
                'data' => $overview,
                'message' => 'Inventory dashboard data retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve inventory dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a listing of products
     */
    public function products(Request $request): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            
            $filters = $request->only([
                'status', 'category_id', 'type', 'search', 
                'low_stock', 'out_of_stock', 'sort_by', 'sort_order'
            ]);
            
            $perPage = $request->get('per_page', 15);
            $products = $this->inventoryService->getProducts($organizationId, $filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => $products,
                'message' => 'Products retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created product
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:products,sku',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:product_categories,id',
            'type' => 'required|in:physical,digital,service',
            'status' => 'required|in:active,inactive,discontinued',
            'unit_of_measure' => 'required|string|max:50',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'minimum_stock_level' => 'nullable|numeric|min:0',
            'maximum_stock_level' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'reorder_quantity' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|array',
            'barcode' => 'nullable|string|max:100',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'is_trackable' => 'boolean',
            'is_serialized' => 'boolean',
            'valuation_method' => 'nullable|in:fifo,lifo,average',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $organizationId = $this->getCurrentOrganizationId();
            $product = $this->inventoryService->createProduct($organizationId, $validator->validated());

            return response()->json([
                'success' => true,
                'data' => $product->load(['category', 'stockLevels']),
                'message' => 'Product created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified product page
     */
    public function show(Product $product): Response
    {
        try {
            $this->authorize('view', $product);

            $product->load(['category', 'stockLevels.warehouse', 'stockMovements' => function ($query) {
                $query->latest()->limit(10);
            }]);

            // Get related products and categories for context
            $relatedProducts = $this->inventoryService->getRelatedProducts($product, 5);
            $categories = $this->inventoryService->getProductCategories($product->organization_id);

            return Inertia::render('Inventory/ProductDetail', [
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'description' => $product->description,
                    'price' => $product->price,
                    'cost' => $product->cost,
                    'category' => $product->category,
                    'stock_levels' => $product->stockLevels,
                    'stock_movements' => $product->stockMovements,
                    'total_stock' => $product->stockLevels->sum('quantity'),
                    'low_stock_threshold' => $product->low_stock_threshold,
                    'is_low_stock' => $product->stockLevels->sum('quantity') <= $product->low_stock_threshold,
                    'created_at' => $product->created_at,
                    'updated_at' => $product->updated_at,
                ],
                'relatedProducts' => $relatedProducts,
                'categories' => $categories,
                'organization' => [
                    'id' => $product->organization_id,
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Product detail error: ' . $e->getMessage());
            
            // Return error page with Inertia
            return Inertia::render('Inventory/ProductDetail', [
                'product' => null,
                'relatedProducts' => [],
                'categories' => [],
                'error' => 'Failed to load product details. Please try again.',
                'organization' => [
                    'id' => $this->getCurrentOrganizationId(),
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);
        }
    }

    /**
     * Get product data (API endpoint)
     */
    public function productData(Product $product): JsonResponse
    {
        try {
            $this->authorize('view', $product);

            $product->load(['category', 'stockLevels.warehouse', 'stockMovements' => function ($query) {
                $query->latest()->limit(10);
            }]);

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Product retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified product
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'sku' => 'sometimes|required|string|max:100|unique:products,sku,' . $product->id,
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:product_categories,id',
            'type' => 'sometimes|required|in:physical,digital,service',
            'status' => 'sometimes|required|in:active,inactive,discontinued',
            'unit_of_measure' => 'sometimes|required|string|max:50',
            'cost_price' => 'sometimes|required|numeric|min:0',
            'selling_price' => 'sometimes|required|numeric|min:0',
            'minimum_stock_level' => 'nullable|numeric|min:0',
            'maximum_stock_level' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'reorder_quantity' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|array',
            'barcode' => 'nullable|string|max:100',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'is_trackable' => 'boolean',
            'is_serialized' => 'boolean',
            'valuation_method' => 'nullable|in:fifo,lifo,average',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updatedProduct = $this->inventoryService->updateProduct($product, $validator->validated());

            return response()->json([
                'success' => true,
                'data' => $updatedProduct->load(['category', 'stockLevels']),
                'message' => 'Product updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified product
     */
    public function destroy(Product $product): JsonResponse
    {
        try {
            $this->authorize('delete', $product);

            $this->inventoryService->deleteProduct($product);

            return response()->json([
                'success' => true,
                'message' => 'Product deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Adjust stock level for a product
     */
    public function adjustStock(Request $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $validator = Validator::make($request->all(), [
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric',
            'reason' => 'required|string|max:255',
            'type' => 'nullable|string|in:adjustment,receipt,issue,transfer,count',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $validator->validated();
            $type = $data['type'] ?? 'adjustment';

            $this->inventoryService->adjustStock(
                $product->id,
                $data['warehouse_id'],
                $data['quantity'],
                $data['reason'],
                $type
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock adjusted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to adjust stock',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get stock alerts
     */
    public function stockAlerts(): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $alerts = $this->inventoryService->getStockAlerts($organizationId);

            return response()->json([
                'success' => true,
                'data' => $alerts,
                'message' => 'Stock alerts retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve stock alerts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current organization ID from tenant context
     */
    private function getCurrentOrganizationId(): int
    {
        // This should be implemented based on your tenant resolution logic
        return auth()->user()->current_organization_id ?? 1;
    }
}
