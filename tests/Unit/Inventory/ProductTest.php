<?php

namespace Tests\Unit\Inventory;

use App\Features\Inventory\Models\Product;
use App\Features\Inventory\Models\ProductCategory;
use App\Features\Inventory\Models\StockLevel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_belongs_to_a_category()
    {
        $category = ProductCategory::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);

        $this->assertInstanceOf(ProductCategory::class, $product->category);
        $this->assertEquals($category->id, $product->category->id);
    }

    /** @test */
    public function it_has_many_stock_levels()
    {
        $product = Product::factory()->create();
        $stockLevels = StockLevel::factory()->count(3)->create(['product_id' => $product->id]);

        $this->assertCount(3, $product->stockLevels);
        $this->assertInstanceOf(StockLevel::class, $product->stockLevels->first());
    }

    /** @test */
    public function it_can_get_current_stock_quantity()
    {
        $product = Product::factory()->create();
        $stockLevel = StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 100,
        ]);

        $this->assertEquals(100, $product->getCurrentStock());
    }

    /** @test */
    public function it_can_check_if_stock_is_low()
    {
        $product = Product::factory()->create(['min_stock_level' => 20]);

        // Stock above minimum
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 50,
        ]);
        $this->assertFalse($product->isLowStock());

        // Stock below minimum
        $product->stockLevels()->delete();
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 10,
        ]);
        $this->assertTrue($product->isLowStock());
    }

    /** @test */
    public function it_can_check_if_out_of_stock()
    {
        $product = Product::factory()->create();

        // In stock
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 10,
        ]);
        $this->assertFalse($product->isOutOfStock());

        // Out of stock
        $product->stockLevels()->delete();
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 0,
        ]);
        $this->assertTrue($product->isOutOfStock());
    }

    /** @test */
    public function it_can_calculate_total_value()
    {
        $product = Product::factory()->create(['price' => 50.00]);
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        $this->assertEquals(500.00, $product->getTotalValue());
    }

    /** @test */
    public function it_can_scope_by_category()
    {
        $category1 = ProductCategory::factory()->create();
        $category2 = ProductCategory::factory()->create();

        $product1 = Product::factory()->create(['category_id' => $category1->id]);
        $product2 = Product::factory()->create(['category_id' => $category2->id]);

        $products = Product::byCategory($category1->id)->get();

        $this->assertCount(1, $products);
        $this->assertEquals($product1->id, $products->first()->id);
    }

    /** @test */
    public function it_can_scope_active_products()
    {
        $activeProduct = Product::factory()->create(['status' => 'active']);
        $inactiveProduct = Product::factory()->create(['status' => 'inactive']);

        $products = Product::active()->get();

        $this->assertCount(1, $products);
        $this->assertEquals($activeProduct->id, $products->first()->id);
    }

    /** @test */
    public function it_can_scope_low_stock_products()
    {
        $product1 = Product::factory()->create(['min_stock_level' => 20]);
        $product2 = Product::factory()->create(['min_stock_level' => 10]);

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

        $lowStockProducts = Product::lowStock()->get();

        $this->assertCount(1, $lowStockProducts);
        $this->assertEquals($product1->id, $lowStockProducts->first()->id);
    }

    /** @test */
    public function it_can_search_by_name_or_sku()
    {
        $product1 = Product::factory()->create([
            'name' => 'Apple iPhone',
            'sku' => 'IPHONE-001',
        ]);
        $product2 = Product::factory()->create([
            'name' => 'Samsung Galaxy',
            'sku' => 'GALAXY-001',
        ]);

        // Search by name
        $products = Product::search('iPhone')->get();
        $this->assertCount(1, $products);
        $this->assertEquals($product1->id, $products->first()->id);

        // Search by SKU
        $products = Product::search('GALAXY')->get();
        $this->assertCount(1, $products);
        $this->assertEquals($product2->id, $products->first()->id);
    }

    /** @test */
    public function it_validates_required_fields()
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        Product::create([]);
    }

    /** @test */
    public function it_ensures_unique_sku()
    {
        Product::factory()->create(['sku' => 'UNIQUE-SKU']);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Product::factory()->create(['sku' => 'UNIQUE-SKU']);
    }

    /** @test */
    public function it_can_be_soft_deleted()
    {
        $product = Product::factory()->create();

        $product->delete();

        $this->assertSoftDeleted('products', ['id' => $product->id]);
        $this->assertCount(0, Product::all());
        $this->assertCount(1, Product::withTrashed()->get());
    }

    /** @test */
    public function it_formats_price_correctly()
    {
        $product = Product::factory()->create(['price' => 99.99]);

        $this->assertEquals('$99.99', $product->getFormattedPriceAttribute());
    }

    /** @test */
    public function it_can_check_reorder_point()
    {
        $product = Product::factory()->create(['reorder_point' => 15]);

        // Above reorder point
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 20,
        ]);
        $this->assertFalse($product->needsReorder());

        // At reorder point
        $product->stockLevels()->delete();
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 15,
        ]);
        $this->assertTrue($product->needsReorder());

        // Below reorder point
        $product->stockLevels()->delete();
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 10,
        ]);
        $this->assertTrue($product->needsReorder());
    }
}
