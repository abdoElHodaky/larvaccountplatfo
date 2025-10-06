<?php

namespace Modules\Accounting\Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\Transaction;
use Modules\Accounting\Models\JournalEntry;
use Inertia\Testing\AssertableInertia as Assert;

class AccountControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Set up authentication and tenant context
        $this->actingAs($this->createUser());
        $this->withoutExceptionHandling();
    }

    /** @test */
    public function it_displays_accounts_index_page()
    {
        Account::factory()->count(3)->create();

        $response = $this->get(route('accounting.accounts.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => 
            $page->component('Accounting/Accounts/Index')
                ->has('accounts.data', 3)
                ->has('accountTypes')
                ->has('accountSubtypes')
                ->has('filters')
        );
    }

    /** @test */
    public function it_can_filter_accounts_by_search()
    {
        Account::factory()->create(['name' => 'Cash Account', 'code' => '1000']);
        Account::factory()->create(['name' => 'Bank Account', 'code' => '1100']);
        Account::factory()->create(['name' => 'Inventory', 'code' => '1200']);

        $response = $this->get(route('accounting.accounts.index', ['search' => 'Cash']));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => 
            $page->component('Accounting/Accounts/Index')
                ->has('accounts.data', 1)
                ->where('accounts.data.0.name', 'Cash Account')
        );
    }

    /** @test */
    public function it_can_filter_accounts_by_type()
    {
        Account::factory()->create(['type' => 'asset']);
        Account::factory()->create(['type' => 'liability']);
        Account::factory()->create(['type' => 'asset']);

        $response = $this->get(route('accounting.accounts.index', ['type' => 'asset']));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => 
            $page->component('Accounting/Accounts/Index')
                ->has('accounts.data', 2)
        );
    }

    /** @test */
    public function it_displays_account_create_page()
    {
        $response = $this->get(route('accounting.accounts.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => 
            $page->component('Accounting/Accounts/Create')
                ->has('parentAccounts')
        );
    }

    /** @test */
    public function it_can_create_a_new_account()
    {
        $accountData = [
            'code' => '1000',
            'name' => 'Cash Account',
            'description' => 'Main cash account',
            'type' => 'asset',
            'subtype' => 'current_asset',
            'normal_balance' => 'debit',
            'currency' => 'USD',
            'opening_balance' => 1000.00,
            'is_active' => true,
            'allow_manual_entries' => true,
        ];

        $response = $this->post(route('accounting.accounts.store'), $accountData);

        $response->assertStatus(201);
        $response->assertJson([
            'message' => 'Account created successfully',
        ]);

        $this->assertDatabaseHas('accounts', [
            'code' => '1000',
            'name' => 'Cash Account',
            'type' => 'asset',
            'subtype' => 'current_asset',
        ]);
    }

    /** @test */
    public function it_validates_required_fields_when_creating_account()
    {
        $response = $this->post(route('accounting.accounts.store'), []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['code', 'name', 'type', 'subtype', 'normal_balance']);
    }

    /** @test */
    public function it_validates_unique_account_code()
    {
        Account::factory()->create(['code' => '1000']);

        $accountData = [
            'code' => '1000', // Duplicate code
            'name' => 'Another Account',
            'type' => 'asset',
            'subtype' => 'current_asset',
            'normal_balance' => 'debit',
            'currency' => 'USD',
        ];

        $response = $this->post(route('accounting.accounts.store'), $accountData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['code']);
    }

    /** @test */
    public function it_displays_account_show_page()
    {
        $account = Account::factory()->create();

        $response = $this->get(route('accounting.accounts.show', $account));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => 
            $page->component('Accounting/Accounts/Show')
                ->where('account.id', $account->id)
                ->has('recentTransactions')
                ->has('balanceTrend')
        );
    }

    /** @test */
    public function it_displays_account_edit_page()
    {
        $account = Account::factory()->create();

        $response = $this->get(route('accounting.accounts.edit', $account));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => 
            $page->component('Accounting/Accounts/Edit')
                ->where('account.id', $account->id)
                ->has('parentAccounts')
        );
    }

    /** @test */
    public function it_prevents_editing_system_accounts()
    {
        $systemAccount = Account::factory()->create(['is_system' => true]);

        $response = $this->get(route('accounting.accounts.edit', $systemAccount));

        $response->assertStatus(403);
    }

    /** @test */
    public function it_can_update_an_account()
    {
        $account = Account::factory()->create([
            'name' => 'Old Name',
            'description' => 'Old Description',
        ]);

        $updateData = [
            'code' => $account->code,
            'name' => 'Updated Name',
            'description' => 'Updated Description',
            'type' => $account->type,
            'subtype' => $account->subtype,
            'normal_balance' => $account->normal_balance,
            'currency' => $account->currency,
            'is_active' => true,
            'allow_manual_entries' => true,
        ];

        $response = $this->put(route('accounting.accounts.update', $account), $updateData);

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Account updated successfully',
        ]);

        $this->assertDatabaseHas('accounts', [
            'id' => $account->id,
            'name' => 'Updated Name',
            'description' => 'Updated Description',
        ]);
    }

    /** @test */
    public function it_prevents_updating_system_accounts()
    {
        $systemAccount = Account::factory()->create(['is_system' => true]);

        $updateData = [
            'name' => 'Updated Name',
            'type' => 'liability', // Try to change type
        ];

        $response = $this->put(route('accounting.accounts.update', $systemAccount), $updateData);

        $response->assertStatus(403);
        $response->assertJson([
            'message' => 'System accounts cannot be modified',
        ]);
    }

    /** @test */
    public function it_can_delete_an_account()
    {
        $account = Account::factory()->create();

        $response = $this->delete(route('accounting.accounts.destroy', $account));

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Account deleted successfully',
        ]);

        $this->assertSoftDeleted('accounts', ['id' => $account->id]);
    }

    /** @test */
    public function it_prevents_deleting_system_accounts()
    {
        $systemAccount = Account::factory()->create(['is_system' => true]);

        $response = $this->delete(route('accounting.accounts.destroy', $systemAccount));

        $response->assertStatus(403);
        $response->assertJson([
            'message' => 'System accounts cannot be deleted',
        ]);
    }

    /** @test */
    public function it_prevents_deleting_accounts_with_journal_entries()
    {
        $account = Account::factory()->create();
        $transaction = Transaction::factory()->create();
        JournalEntry::factory()->create([
            'transaction_id' => $transaction->id,
            'account_id' => $account->id,
        ]);

        $response = $this->delete(route('accounting.accounts.destroy', $account));

        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'Account cannot be deleted because it has child accounts or journal entries',
        ]);
    }

    /** @test */
    public function it_can_get_account_tree_structure()
    {
        $parent = Account::factory()->create(['name' => 'Assets']);
        $child = Account::factory()->create([
            'name' => 'Current Assets',
            'parent_id' => $parent->id,
        ]);

        $response = $this->get(route('accounting.accounts.tree'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'accounts' => [
                '*' => [
                    'id',
                    'code',
                    'name',
                    'type',
                    'current_balance',
                    'children',
                ],
            ],
        ]);
    }

    /** @test */
    public function it_can_get_account_balance_history()
    {
        $account = Account::factory()->create();

        $response = $this->get(route('accounting.accounts.balance-history', [
            'account' => $account,
            'period_type' => 'monthly',
        ]));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'balances',
        ]);
    }

    /** @test */
    public function it_can_recalculate_account_balance()
    {
        $account = Account::factory()->create(['current_balance' => 100.00]);

        $response = $this->post(route('accounting.accounts.recalculate-balance', $account));

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Account balance recalculated successfully',
        ]);
        $response->assertJsonStructure([
            'old_balance',
            'new_balance',
            'difference',
        ]);
    }

    /**
     * Create a test user for authentication
     */
    private function createUser()
    {
        return \App\Models\User::factory()->create();
    }
}
