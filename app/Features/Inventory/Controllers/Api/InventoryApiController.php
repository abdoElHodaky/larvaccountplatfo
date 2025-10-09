<?php

namespace App\Features\Inventory\Controllers\Api;

use App\Features\Inventory\Controllers\InventoryController;
use App\Features\Inventory\Models\Product;
use App\Features\Inventory\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InventoryApiController extends InventoryController
{
    /**
     * Get inventory dashboard data for frontend
     */
    public function dashboard(): JsonResponse
    {
        return $this->index();
    }

    /**
     * Get all products with frontend-specific formatting
     */
    public function getProducts(Request $request): JsonResponse
    {
        $response = $this->products($request);
        $data = $response->getData(true);

        if ($data['success']) {
            // Format data for frontend expectations
            $data['data'] = $this->formatProductsForFrontend($data['data']);
        }

        return response()->json($data, $response->getStatusCode());
    }

    /**
     * Get single product with frontend-specific formatting
     */
    public function getProduct(Product $product): JsonResponse
    {
        $response = $this->show($product);
        $data = $response->getData(true);

        if ($data['success']) {
            // Format data for frontend expectations
            $data['data'] = $this->formatProductForFrontend($data['data']);
        }

        return response()->json($data, $response->getStatusCode());
    }

    /**
     * Create product via API
     */
    public function createProduct(Request $request): JsonResponse
    {
        return $this->store($request);
    }

    /**
     * Update product via API
     */
    public function updateProduct(Request $request, Product $product): JsonResponse
    {
        return $this->update($request, $product);
    }

    /**
     * Delete product via API
     */
    public function deleteProduct(Product $product): JsonResponse
    {
        return $this->destroy($product);
    }

    /**
     * Adjust stock via API
     */
    public function adjustProductStock(Request $request, Product $product): JsonResponse
    {
        return $this->adjustStock($request, $product);
    }

    /**
     * Get stock alerts for frontend
     */
    public function getStockAlerts(): JsonResponse
    {
        $response = $this->stockAlerts();
        $data = $response->getData(true);

        if ($data['success']) {
            // Format alerts for frontend
            $data['data'] = $this->formatAlertsForFrontend($data['data']);
        }

        return response()->json($data, $response->getStatusCode());
    }

    /**
     * Get product categories
     */
    public function getCategories(): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            
            $categories = ProductCategory::where('organization_id', $organizationId)
                                       ->active()
                                       ->with(['children'])
                                       ->whereNull('parent_id')
                                       ->orderBy('sort_order')
                                       ->orderBy('name')
                                       ->get();

            return response()->json([
                'success' => true,
                'data' => $this->formatCategoriesForFrontend($categories),
                'message' => 'Categories retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get inventory statistics for dashboard widgets
     */
    public function getStatistics(): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $overview = $this->inventoryService->getInventoryOverview($organizationId);

            $statistics = [
                'total_products' => [
                    'value' => $overview['total_products'],
                    'label' => 'Total Products',
                    'icon' => 'package',
                    'color' => 'blue'
                ],
                'total_stock_value' => [
                    'value' => number_format($overview['total_stock_value'], 2),
                    'label' => 'Total Stock Value',
                    'icon' => 'dollar-sign',
                    'color' => 'green'
                ],
                'low_stock_products' => [
                    'value' => $overview['low_stock_products'],
                    'label' => 'Low Stock Items',
                    'icon' => 'alert-triangle',
                    'color' => 'yellow'
                ],
                'out_of_stock_products' => [
                    'value' => $overview['out_of_stock_products'],
                    'label' => 'Out of Stock',
                    'icon' => 'x-circle',
                    'color' => 'red'
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics,
                'message' => 'Statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search products for frontend autocomplete
     */
    public function searchProducts(Request $request): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $query = $request->get('q', '');
            $limit = $request->get('limit', 10);

            $products = Product::where('organization_id', $organizationId)
                             ->active()
                             ->where(function ($q) use ($query) {
                                 $q->where('name', 'like', "%{$query}%")
                                   ->orWhere('sku', 'like', "%{$query}%");
                             })
                             ->with(['category'])
                             ->limit($limit)
                             ->get();

            $formattedProducts = $products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'category' => $product->category?->name,
                    'current_stock' => $product->getCurrentStockLevel(),
                    'cost_price' => $product->cost_price,
                    'selling_price' => $product->selling_price,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedProducts,
                'message' => 'Products found'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Search failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format products data for frontend consumption
     */
    private function formatProductsForFrontend($products): array
    {
        if (isset($products['data'])) {
            $products['data'] = collect($products['data'])->map(function ($product) {
                return $this->formatProductForFrontend($product);
            })->toArray();
        }

        return $products;
    }

    /**
     * Format single product for frontend
     */
    private function formatProductForFrontend($product): array
    {
        if (is_array($product)) {
            $product = (object) $product;
        }

        return [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'description' => $product->description,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
            ] : null,
            'type' => $product->type,
            'status' => $product->status,
            'unit_of_measure' => $product->unit_of_measure,
            'cost_price' => (float) $product->cost_price,
            'selling_price' => (float) $product->selling_price,
            'current_stock' => $product->getCurrentStockLevel ? $product->getCurrentStockLevel() : 0,
            'available_stock' => $product->getAvailableStockLevel ? $product->getAvailableStockLevel() : 0,
            'stock_value' => $product->getStockValue ? $product->getStockValue() : 0,
            'is_low_stock' => $product->isLowStock ? $product->isLowStock() : false,
            'is_out_of_stock' => $product->isOutOfStock ? $product->isOutOfStock() : false,
            'reorder_point' => (float) $product->reorder_point,
            'reorder_quantity' => (float) $product->reorder_quantity,
            'is_trackable' => (bool) $product->is_trackable,
            'is_serialized' => (bool) $product->is_serialized,
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
        ];
    }

    /**
     * Format categories for frontend tree structure
     */
    private function formatCategoriesForFrontend($categories): array
    {
        return $categories->map(function ($category) {
            return [
                'id' => $category->id,
                'name' => $category->name,
                'description' => $category->description,
                'code' => $category->code,
                'status' => $category->status,
                'sort_order' => $category->sort_order,
                'level' => $category->getLevel(),
                'full_path' => $category->getFullPath(),
                'children' => $this->formatCategoriesForFrontend($category->children),
                'products_count' => $category->products()->count(),
            ];
        })->toArray();
    }

    /**
     * Format alerts for frontend
     */
    private function formatAlertsForFrontend($alerts): array
    {
        return [
            'low_stock' => collect($alerts['low_stock'])->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'current_stock' => $product->getCurrentStockLevel(),
                    'reorder_point' => $product->reorder_point,
                    'category' => $product->category?->name,
                    'urgency' => 'medium',
                ];
            })->toArray(),
            'out_of_stock' => collect($alerts['out_of_stock'])->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'current_stock' => 0,
                    'reorder_point' => $product->reorder_point,
                    'category' => $product->category?->name,
                    'urgency' => 'high',
                ];
            })->toArray(),
        ];
    }
}
