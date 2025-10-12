<?php

namespace Tests\Unit\Inventory;

use App\Features\Inventory\Models\Product;
use App\Features\Inventory\Models\ProductCategory;
use App\Features\Inventory\Models\StockLevel;
use App\Features\Inventory\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryServiceTest extends TestCase
{
    use RefreshDatabase;

    private InventoryService $inventoryService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->inventoryService = new InventoryService;
    }

    /** @test */
    public function it_can_get_dashboard_data()
    {
        // Create test data
        $category = ProductCategory::factory()->create();
        $products = Product::factory()->count(5)->create(['category_id' => $category->id]);

        // Create stock levels with different quantities
        StockLevel::factory()->create([
            'product_id' => $products[0]->id,
            'quantity' => 0, // Out of stock
        ]);
        StockLevel::factory()->create([
            'product_id' => $products[1]->id,
            'quantity' => 5, // Low stock (assuming min_stock_level is 10)
        ]);
        StockLevel::factory()->create([
            'product_id' => $products[2]->id,
            'quantity' => 50, // Normal stock
        ]);

        $dashboardData = $this->inventoryService->getDashboardData();

        $this->assertIsArray($dashboardData);
        $this->assertArrayHasKey('total_products', $dashboardData);
        $this->assertArrayHasKey('low_stock_items', $dashboardData);
        $this->assertArrayHasKey('out_of_stock_items', $dashboardData);
        $this->assertArrayHasKey('total_value', $dashboardData);
        $this->assertArrayHasKey('recent_movements', $dashboardData);

        $this->assertEquals(5, $dashboardData['total_products']);
    }

    /** @test */
    public function it_can_create_product()
    {
        $category = ProductCategory::factory()->create();

        $productData = [
            'name' => 'Test Product',
            'sku' => 'TEST-001',
            'description' => 'Test product description',
            'category_id' => $category->id,
            'price' => 99.99,
            'cost_price' => 50.00,
            'min_stock_level' => 10,
            'max_stock_level' => 100,
            'reorder_point' => 20,
            'status' => 'active',
        ];

        $product = $this->inventoryService->createProduct($productData);

        $this->assertInstanceOf(Product::class, $product);
        $this->assertEquals('Test Product', $product->name);
        $this->assertEquals('TEST-001', $product->sku);
        $this->assertDatabaseHas('products', [
            'name' => 'Test Product',
            'sku' => 'TEST-001',
        ]);
    }

    /** @test */
    public function it_can_update_product()
    {
        $category = ProductCategory::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);

        $updateData = [
            'name' => 'Updated Product Name',
            'price' => 149.99,
            'description' => 'Updated description',
        ];

        $updatedProduct = $this->inventoryService->updateProduct($product->id, $updateData);

        $this->assertInstanceOf(Product::class, $updatedProduct);
        $this->assertEquals('Updated Product Name', $updatedProduct->name);
        $this->assertEquals(149.99, $updatedProduct->price);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Product Name',
            'price' => 149.99,
        ]);
    }

    /** @test */
    public function it_can_delete_product()
    {
        $category = ProductCategory::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);

        $result = $this->inventoryService->deleteProduct($product->id);

        $this->assertTrue($result);
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    /** @test */
    public function it_can_get_products_with_filters()
    {
        $category1 = ProductCategory::factory()->create(['name' => 'Electronics']);
        $category2 = ProductCategory::factory()->create(['name' => 'Clothing']);

        $product1 = Product::factory()->create([
            'category_id' => $category1->id,
            'name' => 'iPhone',
            'status' => 'active',
        ]);
        $product2 = Product::factory()->create([
            'category_id' => $category2->id,
            'name' => 'T-Shirt',
            'status' => 'active',
        ]);
        $product3 = Product::factory()->create([
            'category_id' => $category1->id,
            'name' => 'iPad',
            'status' => 'inactive',
        ]);

        // Test category filter
        $products = $this->inventoryService->getProducts(['category_id' => $category1->id]);
        $this->assertCount(2, $products);

        // Test status filter
        $products = $this->inventoryService->getProducts(['status' => 'active']);
        $this->assertCount(2, $products);

        // Test search filter
        $products = $this->inventoryService->getProducts(['search' => 'iPhone']);
        $this->assertCount(1, $products);
        $this->assertEquals('iPhone', $products->first()->name);
    }

    /** @test */
    public function it_can_update_stock_level()
    {
        $category = ProductCategory::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $stockLevel = StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 50,
        ]);

        $result = $this->inventoryService->updateStock($product->id, 100, 'Stock adjustment', 'adjustment');

        $this->assertIsArray($result);
        $this->assertArrayHasKey('product_id', $result);
        $this->assertArrayHasKey('quantity', $result);
        $this->assertArrayHasKey('previous_quantity', $result);
        $this->assertArrayHasKey('movement_type', $result);
        $this->assertArrayHasKey('reason', $result);

        $this->assertEquals($product->id, $result['product_id']);
        $this->assertEquals(100, $result['quantity']);
        $this->assertEquals(50, $result['previous_quantity']);
        $this->assertEquals('adjustment', $result['movement_type']);
    }

    /** @test */
    public function it_can_get_low_stock_products()
    {
        $category = ProductCategory::factory()->create();

        $product1 = Product::factory()->create([
            'category_id' => $category->id,
            'min_stock_level' => 20,
        ]);
        $product2 = Product::factory()->create([
            'category_id' => $category->id,
            'min_stock_level' => 10,
        ]);

        // Product 1 - low stock
        StockLevel::factory()->create([
            'product_id' => $product1->id,
            'quantity' => 5,
        ]);

        // Product 2 - adequate stock
        StockLevel::factory()->create([
            'product_id' => $product2->id,
            'quantity' => 50,
        ]);

        $lowStockProducts = $this->inventoryService->getLowStockProducts();

        $this->assertCount(1, $lowStockProducts);
        $this->assertEquals($product1->id, $lowStockProducts->first()->id);
    }

    /** @test */
    public function it_can_get_out_of_stock_products()
    {
        $category = ProductCategory::factory()->create();

        $product1 = Product::factory()->create(['category_id' => $category->id]);
        $product2 = Product::factory()->create(['category_id' => $category->id]);

        // Product 1 - out of stock
        StockLevel::factory()->create([
            'product_id' => $product1->id,
            'quantity' => 0,
        ]);

        // Product 2 - in stock
        StockLevel::factory()->create([
            'product_id' => $product2->id,
            'quantity' => 10,
        ]);

        $outOfStockProducts = $this->inventoryService->getOutOfStockProducts();

        $this->assertCount(1, $outOfStockProducts);
        $this->assertEquals($product1->id, $outOfStockProducts->first()->id);
    }

    /** @test */
    public function it_can_calculate_total_inventory_value()
    {
        $category = ProductCategory::factory()->create();

        $product1 = Product::factory()->create([
            'category_id' => $category->id,
            'price' => 100.00,
        ]);
        $product2 = Product::factory()->create([
            'category_id' => $category->id,
            'price' => 50.00,
        ]);

        StockLevel::factory()->create([
            'product_id' => $product1->id,
            'quantity' => 10,
        ]);
        StockLevel::factory()->create([
            'product_id' => $product2->id,
            'quantity' => 20,
        ]);

        $totalValue = $this->inventoryService->getTotalInventoryValue();

        // (100 * 10) + (50 * 20) = 1000 + 1000 = 2000
        $this->assertEquals(2000.00, $totalValue);
    }

    /** @test */
    public function it_can_get_products_needing_reorder()
    {
        $category = ProductCategory::factory()->create();

        $product1 = Product::factory()->create([
            'category_id' => $category->id,
            'reorder_point' => 15,
        ]);
        $product2 = Product::factory()->create([
            'category_id' => $category->id,
            'reorder_point' => 10,
        ]);

        // Product 1 - needs reorder
        StockLevel::factory()->create([
            'product_id' => $product1->id,
            'quantity' => 10,
        ]);

        // Product 2 - doesn't need reorder
        StockLevel::factory()->create([
            'product_id' => $product2->id,
            'quantity' => 20,
        ]);

        $reorderProducts = $this->inventoryService->getProductsNeedingReorder();

        $this->assertCount(1, $reorderProducts);
        $this->assertEquals($product1->id, $reorderProducts->first()->id);
    }

    /** @test */
    public function it_can_get_categories()
    {
        $categories = ProductCategory::factory()->count(3)->create();

        $result = $this->inventoryService->getCategories();

        $this->assertCount(3, $result);
        $this->assertInstanceOf(ProductCategory::class, $result->first());
    }

    /** @test */
    public function it_can_create_category()
    {
        $categoryData = [
            'name' => 'Test Category',
            'description' => 'Test category description',
            'status' => 'active',
        ];

        $category = $this->inventoryService->createCategory($categoryData);

        $this->assertInstanceOf(ProductCategory::class, $category);
        $this->assertEquals('Test Category', $category->name);
        $this->assertDatabaseHas('product_categories', [
            'name' => 'Test Category',
        ]);
    }

    /** @test */
    public function it_handles_product_not_found_exception()
    {
        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);

        $this->inventoryService->updateProduct(999, ['name' => 'Updated Name']);
    }

    /** @test */
    public function it_validates_stock_update_data()
    {
        $category = ProductCategory::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);

        $this->expectException(\InvalidArgumentException::class);

        $this->inventoryService->updateStock($product->id, -10, 'Invalid quantity', 'adjustment');
    }

    /** @test */
    public function it_can_get_stock_movements_history()
    {
        $category = ProductCategory::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);

        // Create some stock movements
        $this->inventoryService->updateStock($product->id, 100, 'Initial stock', 'in');
        $this->inventoryService->updateStock($product->id, 90, 'Sale', 'out');
        $this->inventoryService->updateStock($product->id, 95, 'Return', 'in');

        $movements = $this->inventoryService->getStockMovements($product->id);

        $this->assertCount(3, $movements);
    }
}
