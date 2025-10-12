<?php

namespace Tests\Feature\Integration;

use App\Features\Accounting\Events\TransactionCreated;
use App\Features\Accounting\Models\Account;
use App\Features\Accounting\Models\Transaction;
use App\Features\Dashboard\Events\MetricsUpdated;
use App\Features\Inventory\Events\StockUpdated;
use App\Features\Inventory\Models\Product;
use App\Features\Inventory\Models\ProductCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AlovaGraphQLSocketIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up test environment
        Event::fake();
        Queue::fake();

        // Create test user and organization
        $this->user = \App\Models\User::factory()->create();
        $this->organization = \App\Models\Organization::factory()->create();

        // Authenticate user
        $this->actingAs($this->user);
    }

    /** @test */
    public function itCanExecuteGraphqlQueriesWithAuthentication()
    {
        // Create test account
        $account = Account::factory()->create([
            'organization_id' => $this->organization->id,
            'name' => 'Test Account',
            'code' => 'TEST001',
            'type' => 'asset',
        ]);

        // Execute GraphQL query
        $response = $this->postJson('/graphql', [
            'query' => '
                query GetAccount($id: ID!) {
                    account(id: $id) {
                        id
                        name
                        code
                        type
                        balance
                    }
                }
            ',
            'variables' => [
                'id' => $account->id,
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'account' => [
                        'id',
                        'name',
                        'code',
                        'type',
                        'balance',
                    ],
                ],
            ]);

        $this->assertEquals($account->name, $response->json('data.account.name'));
    }

    /** @test */
    public function itBroadcastsEventsWhenTransactionsAreCreated()
    {
        // Create test account
        $account = Account::factory()->create([
            'organization_id' => $this->organization->id,
        ]);

        // Create transaction via GraphQL mutation
        $response = $this->postJson('/graphql', [
            'query' => '
                mutation CreateTransaction($input: CreateTransactionInput!) {
                    createTransaction(input: $input) {
                        id
                        amount
                        type
                        description
                        account {
                            id
                            name
                        }
                    }
                }
            ',
            'variables' => [
                'input' => [
                    'account_id' => $account->id,
                    'amount' => 100.50,
                    'type' => 'DEBIT',
                    'description' => 'Test transaction',
                    'date' => now()->toDateString(),
                ],
            ],
        ]);

        $response->assertStatus(200);

        // Verify events were dispatched
        Event::assertDispatched(TransactionCreated::class);
        Event::assertDispatched(MetricsUpdated::class);
    }

    /** @test */
    public function itBroadcastsInventoryEventsWhenStockChanges()
    {
        // Create test product category
        $category = ProductCategory::factory()->create([
            'organization_id' => $this->organization->id,
        ]);

        // Create test product
        $product = Product::factory()->create([
            'organization_id' => $this->organization->id,
            'category_id' => $category->id,
            'stock_quantity' => 100,
            'min_stock_level' => 10,
        ]);

        // Update stock via GraphQL mutation
        $response = $this->postJson('/graphql', [
            'query' => '
                mutation UpdateStock($input: UpdateStockInput!) {
                    updateStock(input: $input) {
                        id
                        product_id
                        quantity
                        movement_type
                    }
                }
            ',
            'variables' => [
                'input' => [
                    'product_id' => $product->id,
                    'quantity' => 50,
                    'movement_type' => 'OUT',
                    'reason' => 'Sale',
                ],
            ],
        ]);

        $response->assertStatus(200);

        // Verify events were dispatched
        Event::assertDispatched(StockUpdated::class);
        Event::assertDispatched(MetricsUpdated::class);
    }

    /** @test */
    public function itCanQueryDashboardMetricsViaGraphql()
    {
        // Create test data
        $account = Account::factory()->create([
            'organization_id' => $this->organization->id,
            'type' => 'revenue',
        ]);

        Transaction::factory()->create([
            'organization_id' => $this->organization->id,
            'account_id' => $account->id,
            'credit_amount' => 1000,
            'transaction_date' => now(),
        ]);

        // Query dashboard data
        $response = $this->postJson('/graphql', [
            'query' => '
                query GetAccountingDashboard {
                    accountingDashboard {
                        total_revenue
                        total_expenses
                        net_income
                        cash_flow
                    }
                }
            ',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'accountingDashboard' => [
                        'total_revenue',
                        'total_expenses',
                        'net_income',
                        'cash_flow',
                    ],
                ],
            ]);
    }

    /** @test */
    public function itCanQueryInventoryDashboardViaGraphql()
    {
        // Create test inventory data
        $category = ProductCategory::factory()->create([
            'organization_id' => $this->organization->id,
        ]);

        Product::factory()->count(5)->create([
            'organization_id' => $this->organization->id,
            'category_id' => $category->id,
            'stock_quantity' => 100,
            'cost_price' => 10.00,
        ]);

        // Query inventory dashboard
        $response = $this->postJson('/graphql', [
            'query' => '
                query GetInventoryDashboard {
                    inventoryDashboard {
                        total_products
                        low_stock_items
                        out_of_stock_items
                        total_value
                    }
                }
            ',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'inventoryDashboard' => [
                        'total_products',
                        'low_stock_items',
                        'out_of_stock_items',
                        'total_value',
                    ],
                ],
            ]);

        $this->assertEquals(5, $response->json('data.inventoryDashboard.total_products'));
    }

    /** @test */
    public function itHandlesAuthenticationErrorsProperly()
    {
        // Remove authentication
        auth()->logout();

        // Try to access protected GraphQL endpoint
        $response = $this->postJson('/graphql', [
            'query' => '
                query GetAccounts {
                    accounts {
                        data {
                            id
                            name
                        }
                    }
                }
            ',
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function itValidatesGraphqlInputProperly()
    {
        // Try to create transaction with invalid data
        $response = $this->postJson('/graphql', [
            'query' => '
                mutation CreateTransaction($input: CreateTransactionInput!) {
                    createTransaction(input: $input) {
                        id
                    }
                }
            ',
            'variables' => [
                'input' => [
                    'account_id' => 999999, // Non-existent account
                    'amount' => -100, // Invalid negative amount
                    'type' => 'INVALID_TYPE',
                    'description' => '',
                    'date' => 'invalid-date',
                ],
            ],
        ]);

        $response->assertStatus(200);
        $this->assertArrayHasKey('errors', $response->json());
    }

    /** @test */
    public function itCanPaginateGraphqlResults()
    {
        // Create multiple accounts
        Account::factory()->count(20)->create([
            'organization_id' => $this->organization->id,
        ]);

        // Query with pagination
        $response = $this->postJson('/graphql', [
            'query' => '
                query GetAccounts($first: Int!, $page: Int!) {
                    accounts(first: $first, page: $page) {
                        data {
                            id
                            name
                        }
                        paginatorInfo {
                            count
                            currentPage
                            hasMorePages
                            total
                        }
                    }
                }
            ',
            'variables' => [
                'first' => 10,
                'page' => 1,
            ],
        ]);

        $response->assertStatus(200);

        $data = $response->json('data.accounts');
        $this->assertCount(10, $data['data']);
        $this->assertEquals(1, $data['paginatorInfo']['currentPage']);
        $this->assertEquals(20, $data['paginatorInfo']['total']);
        $this->assertTrue($data['paginatorInfo']['hasMorePages']);
    }

    /** @test */
    public function itCanFilterGraphqlResults()
    {
        // Create accounts with different types
        Account::factory()->create([
            'organization_id' => $this->organization->id,
            'type' => 'asset',
            'name' => 'Asset Account',
        ]);

        Account::factory()->create([
            'organization_id' => $this->organization->id,
            'type' => 'liability',
            'name' => 'Liability Account',
        ]);

        // Query with filter
        $response = $this->postJson('/graphql', [
            'query' => '
                query GetAssetAccounts($type: AccountType!) {
                    accounts(type: $type) {
                        data {
                            id
                            name
                            type
                        }
                    }
                }
            ',
            'variables' => [
                'type' => 'ASSET',
            ],
        ]);

        $response->assertStatus(200);

        $accounts = $response->json('data.accounts.data');
        $this->assertCount(1, $accounts);
        $this->assertEquals('ASSET', $accounts[0]['type']);
    }

    /** @test */
    public function itHandlesConcurrentRequestsProperly()
    {
        // Create test account
        $account = Account::factory()->create([
            'organization_id' => $this->organization->id,
        ]);

        // Simulate concurrent transaction creation
        $promises = [];
        for ($i = 0; $i < 5; $i++) {
            $promises[] = $this->postJson('/graphql', [
                'query' => '
                    mutation CreateTransaction($input: CreateTransactionInput!) {
                        createTransaction(input: $input) {
                            id
                            amount
                        }
                    }
                ',
                'variables' => [
                    'input' => [
                        'account_id' => $account->id,
                        'amount' => 100 + $i,
                        'type' => 'DEBIT',
                        'description' => "Concurrent transaction {$i}",
                        'date' => now()->toDateString(),
                    ],
                ],
            ]);
        }

        // All requests should succeed
        foreach ($promises as $response) {
            $response->assertStatus(200);
            $this->assertArrayNotHasKey('errors', $response->json());
        }

        // Verify all transactions were created
        $this->assertEquals(5, Transaction::count());
    }
}
