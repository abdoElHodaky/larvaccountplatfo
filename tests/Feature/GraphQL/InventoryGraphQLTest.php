<?php

namespace Tests\Feature\GraphQL;

use Tests\TestCase;
use App\Features\Inventory\Models\Product;
use App\Features\Inventory\Models\ProductCategory;
use App\Features\Inventory\Models\StockLevel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;

class InventoryGraphQLTest extends TestCase
{
    use RefreshDatabase, WithFaker, MakesGraphQLRequests;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test user and authenticate
        $user = \App\Models\User::factory()->create();
        $this->actingAs($user, 'sanctum');
    }

    /** @test */
    public function it_can_query_inventory_dashboard()
    {
        // Create test data
        $category = ProductCategory::factory()->create();
        $products = Product::factory()->count(5)->create(['category_id' => $category->id]);
        
        // Create stock levels
        foreach ($products as $product) {
            StockLevel::factory()->create([
                'product_id' => $product->id,
                'quantity_on_hand' => $this->faker->numberBetween(0, 100)
            ]);
        }

        $query = '
            query {
                inventoryDashboard {
                    total_products
                    low_stock_items
                    out_of_stock_items
                    total_value
                    recent_movements {
                        id
                        product_id
                        quantity
                        movement_type
                        created_at
                    }
                }
            }
        ';

        $response = $this->graphQL($query);

        $response->assertJson([
            'data' => [
                'inventoryDashboard' => [
                    'total_products' => 5,
                ]
            ]
        ]);
    }

    /** @test */
    public function it_can_query_products_with_pagination()
    {
        $category = ProductCategory::factory()->create();
        Product::factory()->count(20)->create(['category_id' => $category->id]);

        $query = '
            query {
                products(first: 10) {
                    data {
                        id
                        name
                        sku
                        price
                        status
                        category {
                            id
                            name
                        }
                    }
                    paginatorInfo {
                        count
                        currentPage
                        hasMorePages
                    }
                }
            }
        ';

        $response = $this->graphQL($query);

        $response->assertJsonStructure([
            'data' => [
                'products' => [
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'sku',
                            'price',
                            'status',
                            'category' => [
                                'id',
                                'name'
                            ]
                        ]
                    ],
                    'paginatorInfo' => [
                        'count',
                        'currentPage',
                        'hasMorePages'
                    ]
                ]
            ]
        ]);

        $this->assertEquals(10, count($response->json('data.products.data')));
    }

    /** @test */
    public function it_can_query_low_stock_products()
    {
        $category = ProductCategory::factory()->create();
        
        // Create products with low stock
        $lowStockProduct = Product::factory()->create([
            'category_id' => $category->id,
            'min_stock_level' => 10
        ]);
        
        StockLevel::factory()->create([
            'product_id' => $lowStockProduct->id,
            'quantity_on_hand' => 5 // Below minimum
        ]);

        // Create product with normal stock
        $normalStockProduct = Product::factory()->create([
            'category_id' => $category->id,
            'min_stock_level' => 10
        ]);
        
        StockLevel::factory()->create([
            'product_id' => $normalStockProduct->id,
            'quantity_on_hand' => 20 // Above minimum
        ]);

        $query = '
            query {
                lowStockProducts {
                    id
                    name
                    sku
                    min_stock_level
                    stock_quantity
                }
            }
        ';

        $response = $this->graphQL($query);

        $response->assertJsonStructure([
            'data' => [
                'lowStockProducts' => [
                    '*' => [
                        'id',
                        'name',
                        'sku',
                        'min_stock_level',
                        'stock_quantity'
                    ]
                ]
            ]
        ]);

        // Should only return the low stock product
        $this->assertCount(1, $response->json('data.lowStockProducts'));
        $this->assertEquals($lowStockProduct->id, $response->json('data.lowStockProducts.0.id'));
    }

    /** @test */
    public function it_can_create_a_product()
    {
        $category = ProductCategory::factory()->create();

        $mutation = '
            mutation CreateProduct($input: CreateProductInput!) {
                createProduct(input: $input) {
                    id
                    name
                    sku
                    price
                    category {
                        id
                        name
                    }
                    status
                }
            }
        ';

        $variables = [
            'input' => [
                'name' => 'Test Product',
                'sku' => 'TEST-001',
                'description' => 'A test product',
                'category_id' => $category->id,
                'price' => 99.99,
                'cost_price' => 50.00,
                'min_stock_level' => 10,
                'status' => 'ACTIVE'
            ]
        ];

        $response = $this->graphQL($mutation, $variables);

        $response->assertJsonStructure([
            'data' => [
                'createProduct' => [
                    'id',
                    'name',
                    'sku',
                    'price',
                    'category' => [
                        'id',
                        'name'
                    ],
                    'status'
                ]
            ]
        ]);

        $this->assertEquals('Test Product', $response->json('data.createProduct.name'));
        $this->assertEquals('TEST-001', $response->json('data.createProduct.sku'));
        $this->assertEquals(99.99, $response->json('data.createProduct.price'));

        // Verify product was created in database
        $this->assertDatabaseHas('products', [
            'name' => 'Test Product',
            'sku' => 'TEST-001',
            'price' => 99.99
        ]);
    }

    /** @test */
    public function it_can_update_stock_levels()
    {
        $category = ProductCategory::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity_on_hand' => 50
        ]);

        $mutation = '
            mutation UpdateStock($input: UpdateStockInput!) {
                updateStock(input: $input) {
                    product_id
                    quantity
                    previous_quantity
                    movement_type
                    reason
                    created_at
                }
            }
        ';

        $variables = [
            'input' => [
                'product_id' => $product->id,
                'quantity' => 75,
                'movement_type' => 'IN',
                'reason' => 'Stock replenishment',
                'reference' => 'PO-001'
            ]
        ];

        $response = $this->graphQL($mutation, $variables);

        $response->assertJsonStructure([
            'data' => [
                'updateStock' => [
                    'product_id',
                    'quantity',
                    'previous_quantity',
                    'movement_type',
                    'reason',
                    'created_at'
                ]
            ]
        ]);

        $this->assertEquals($product->id, $response->json('data.updateStock.product_id'));
        $this->assertEquals(75, $response->json('data.updateStock.quantity'));
        $this->assertEquals('IN', $response->json('data.updateStock.movement_type'));
        $this->assertEquals('Stock replenishment', $response->json('data.updateStock.reason'));
    }

    /** @test */
    public function it_validates_product_creation_input()
    {
        $mutation = '
            mutation CreateProduct($input: CreateProductInput!) {
                createProduct(input: $input) {
                    id
                    name
                }
            }
        ';

        $variables = [
            'input' => [
                'name' => '', // Invalid: empty name
                'sku' => 'TEST-001',
                'category_id' => 999, // Invalid: non-existent category
                'price' => -10 // Invalid: negative price
            ]
        ];

        $response = $this->graphQL($mutation, $variables);

        $response->assertGraphQLErrorMessage('Validation failed for the field [createProduct].');
    }

    /** @test */
    public function it_can_search_products()
    {
        $category = ProductCategory::factory()->create();
        
        Product::factory()->create([
            'name' => 'Apple iPhone',
            'sku' => 'IPHONE-001',
            'category_id' => $category->id
        ]);
        
        Product::factory()->create([
            'name' => 'Samsung Galaxy',
            'sku' => 'GALAXY-001',
            'category_id' => $category->id
        ]);

        $query = '
            query {
                products(name: "%Apple%") {
                    data {
                        id
                        name
                        sku
                    }
                }
            }
        ';

        $response = $this->graphQL($query);

        $response->assertJsonStructure([
            'data' => [
                'products' => [
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'sku'
                        ]
                    ]
                ]
            ]
        ]);

        $this->assertCount(1, $response->json('data.products.data'));
        $this->assertStringContainsString('Apple', $response->json('data.products.data.0.name'));
    }
}
