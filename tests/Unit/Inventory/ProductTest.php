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
    public function itBelongsToACategory()
    {
        $category = ProductCategory::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);

        $this->assertInstanceOf(ProductCategory::class, $product->category);
        $this->assertEquals($category->id, $product->category->id);
    }

    /** @test */
    public function itHasManyStockLevels()
    {
        $product = Product::factory()->create();
        $stockLevels = StockLevel::factory()->count(3)->create(['product_id' => $product->id]);

        $this->assertCount(3, $product->stockLevels);
        $this->assertInstanceOf(StockLevel::class, $product->stockLevels->first());
    }

    /** @test */
    public function itCanGetCurrentStockQuantity()
    {
        $product = Product::factory()->create();
        $stockLevel = StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 100,
        ]);

        $this->assertEquals(100, $product->getCurrentStock());
    }

    /** @test */
    public function itCanCheckIfStockIsLow()
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
    public function itCanCheckIfOutOfStock()
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
    public function itCanCalculateTotalValue()
    {
        $product = Product::factory()->create(['price' => 50.00]);
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        $this->assertEquals(500.00, $product->getTotalValue());
    }

    /** @test */
    public function itCanScopeByCategory()
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
    public function itCanScopeActiveProducts()
    {
        $activeProduct = Product::factory()->create(['status' => 'active']);
        $inactiveProduct = Product::factory()->create(['status' => 'inactive']);

        $products = Product::active()->get();

        $this->assertCount(1, $products);
        $this->assertEquals($activeProduct->id, $products->first()->id);
    }

    /** @test */
    public function itCanScopeLowStockProducts()
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
    public function itCanSearchByNameOrSku()
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
    public function itValidatesRequiredFields()
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        Product::create([]);
    }

    /** @test */
    public function itEnsuresUniqueSku()
    {
        Product::factory()->create(['sku' => 'UNIQUE-SKU']);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Product::factory()->create(['sku' => 'UNIQUE-SKU']);
    }

    /** @test */
    public function itCanBeSoftDeleted()
    {
        $product = Product::factory()->create();

        $product->delete();

        $this->assertSoftDeleted('products', ['id' => $product->id]);
        $this->assertCount(0, Product::all());
        $this->assertCount(1, Product::withTrashed()->get());
    }

    /** @test */
    public function itFormatsPriceCorrectly()
    {
        $product = Product::factory()->create(['price' => 99.99]);

        $this->assertEquals('$99.99', $product->getFormattedPriceAttribute());
    }

    /** @test */
    public function itCanCheckReorderPoint()
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
