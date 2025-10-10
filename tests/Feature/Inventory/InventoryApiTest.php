<?php

namespace Tests\Feature\Inventory;

use Tests\TestCase;
use App\Features\Inventory\Models\Product;
use App\Features\Inventory\Models\ProductCategory;
use App\Features\Inventory\Models\StockLevel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

class InventoryApiTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test user and authenticate
        $this->actingAs($this->createTestUser());
    }

    /** @test */
    public function it_can_get_inventory_dashboard_data()
    {
        // Create test data
        $category = ProductCategory::factory()->create();
        $products = Product::factory()->count(3)->create(['category_id' => $category->id]);
        
        foreach ($products as $product) {
            StockLevel::factory()->create(['product_id' => $product->id]);
        }

        $response = $this->getJson('/api/inventory/dashboard');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'total_products',
                        'low_stock_items',
                        'out_of_stock_items',
                        'total_value',
                        'recent_movements'
                    ]
                ]);
    }

    /** @test */
    public function it_can_get_all_products()
    {
        $category = ProductCategory::factory()->create();
        $products = Product::factory()->count(5)->create(['category_id' => $category->id]);

        $response = $this->getJson('/api/inventory/products');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'sku',
                            'description',
                            'category',
                            'price',
                            'cost_price',
                            'stock_quantity',
                            'min_stock_level',
                            'status'
                        ]
                    ]
                ]);
    }

    /** @test */
    public function it_can_get_single_product()
    {
        $category = ProductCategory::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $stockLevel = StockLevel::factory()->create(['product_id' => $product->id]);

        $response = $this->getJson("/api/inventory/products/{$product->id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'id',
                        'name',
                        'sku',
                        'description',
                        'category',
                        'price',
                        'cost_price',
                        'stock_quantity',
                        'min_stock_level',
                        'max_stock_level',
                        'reorder_point',
                        'status',
                        'stock_levels'
                    ]
                ]);
    }

    /** @test */
    public function it_can_create_new_product()
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
            'status' => 'active'
        ];

        $response = $this->postJson('/api/inventory/products', $productData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'id',
                        'name',
                        'sku',
                        'description',
                        'category_id',
                        'price',
                        'cost_price'
                    ]
                ]);

        $this->assertDatabaseHas('products', [
            'name' => 'Test Product',
            'sku' => 'TEST-001'
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
            'description' => 'Updated description'
        ];

        $response = $this->putJson("/api/inventory/products/{$product->id}", $updateData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'id',
                        'name',
                        'price',
                        'description'
                    ]
                ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Product Name',
            'price' => 149.99
        ]);
    }

    /** @test */
    public function it_can_delete_product()
    {
        $category = ProductCategory::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);

        $response = $this->deleteJson("/api/inventory/products/{$product->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Product deleted successfully'
                ]);

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    /** @test */
    public function it_can_get_categories()
    {
        $categories = ProductCategory::factory()->count(3)->create();

        $response = $this->getJson('/api/inventory/categories');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'description',
                            'parent_id',
                            'status'
                        ]
                    ]
                ]);
    }

    /** @test */
    public function it_can_update_stock_level()
    {
        $category = ProductCategory::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $stockLevel = StockLevel::factory()->create(['product_id' => $product->id]);

        $updateData = [
            'quantity' => 150,
            'reason' => 'Stock adjustment',
            'type' => 'adjustment'
        ];

        $response = $this->putJson("/api/inventory/products/{$product->id}/stock", $updateData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'product_id',
                        'quantity',
                        'previous_quantity',
                        'movement_type',
                        'reason'
                    ]
                ]);
    }

    /** @test */
    public function it_validates_required_fields_when_creating_product()
    {
        $response = $this->postJson('/api/inventory/products', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['name', 'sku', 'category_id']);
    }

    /** @test */
    public function it_prevents_duplicate_sku()
    {
        $category = ProductCategory::factory()->create();
        $existingProduct = Product::factory()->create([
            'category_id' => $category->id,
            'sku' => 'DUPLICATE-SKU'
        ]);

        $productData = [
            'name' => 'New Product',
            'sku' => 'DUPLICATE-SKU',
            'category_id' => $category->id,
            'price' => 99.99
        ];

        $response = $this->postJson('/api/inventory/products', $productData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['sku']);
    }

    /** @test */
    public function it_can_search_products()
    {
        $category = ProductCategory::factory()->create();
        $product1 = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Apple iPhone',
            'sku' => 'IPHONE-001'
        ]);
        $product2 = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Samsung Galaxy',
            'sku' => 'GALAXY-001'
        ]);

        $response = $this->getJson('/api/inventory/products?search=iPhone');

        $response->assertStatus(200)
                ->assertJsonCount(1, 'data')
                ->assertJsonFragment(['name' => 'Apple iPhone']);
    }

    /** @test */
    public function it_can_filter_products_by_category()
    {
        $category1 = ProductCategory::factory()->create(['name' => 'Electronics']);
        $category2 = ProductCategory::factory()->create(['name' => 'Clothing']);
        
        $product1 = Product::factory()->create(['category_id' => $category1->id]);
        $product2 = Product::factory()->create(['category_id' => $category2->id]);

        $response = $this->getJson("/api/inventory/products?category_id={$category1->id}");

        $response->assertStatus(200)
                ->assertJsonCount(1, 'data');
    }

    /** @test */
    public function it_can_get_low_stock_products()
    {
        $category = ProductCategory::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'min_stock_level' => 20
        ]);
        
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 5 // Below minimum
        ]);

        $response = $this->getJson('/api/inventory/products/low-stock');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'sku',
                            'current_stock',
                            'min_stock_level',
                            'shortage'
                        ]
                    ]
                ]);
    }

    /**
     * Create a test user for authentication
     */
    private function createTestUser()
    {
        return \App\Models\User::factory()->create();
    }
}
