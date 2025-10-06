<?php

namespace Modules\Accounting\Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\Transaction;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_an_account()
    {
        $account = Account::create([
            'tenant_id' => 1,
            'code' => '1000',
            'name' => 'Cash',
            'type' => 'asset',
            'subtype' => 'current_asset',
            'normal_balance' => 'debit',
            'currency' => 'USD',
            'opening_balance' => 1000.00,
        ]);

        $this->assertInstanceOf(Account::class, $account);
        $this->assertEquals('1000', $account->code);
        $this->assertEquals('Cash', $account->name);
        $this->assertEquals('asset', $account->type);
        $this->assertEquals('debit', $account->normal_balance);
        $this->assertEquals(1000.00, $account->opening_balance);
    }

    /** @test */
    public function it_has_correct_normal_balance_for_account_types()
    {
        // Asset accounts should have debit normal balance
        $assetAccount = Account::factory()->create([
            'type' => 'asset',
            'normal_balance' => 'debit'
        ]);
        $this->assertEquals('debit', $assetAccount->normal_balance);

        // Liability accounts should have credit normal balance
        $liabilityAccount = Account::factory()->create([
            'type' => 'liability',
            'normal_balance' => 'credit'
        ]);
        $this->assertEquals('credit', $liabilityAccount->normal_balance);

        // Equity accounts should have credit normal balance
        $equityAccount = Account::factory()->create([
            'type' => 'equity',
            'normal_balance' => 'credit'
        ]);
        $this->assertEquals('credit', $equityAccount->normal_balance);

        // Revenue accounts should have credit normal balance
        $revenueAccount = Account::factory()->create([
            'type' => 'revenue',
            'normal_balance' => 'credit'
        ]);
        $this->assertEquals('credit', $revenueAccount->normal_balance);

        // Expense accounts should have debit normal balance
        $expenseAccount = Account::factory()->create([
            'type' => 'expense',
            'normal_balance' => 'debit'
        ]);
        $this->assertEquals('debit', $expenseAccount->normal_balance);
    }

    /** @test */
    public function it_can_have_parent_child_relationships()
    {
        $parentAccount = Account::factory()->create([
            'code' => '1000',
            'name' => 'Assets',
        ]);

        $childAccount = Account::factory()->create([
            'code' => '1100',
            'name' => 'Current Assets',
            'parent_id' => $parentAccount->id,
        ]);

        $this->assertTrue($childAccount->parent->is($parentAccount));
        $this->assertTrue($parentAccount->children->contains($childAccount));
    }

    /** @test */
    public function it_calculates_current_balance_correctly()
    {
        $account = Account::factory()->create([
            'type' => 'asset',
            'normal_balance' => 'debit',
            'opening_balance' => 1000.00,
        ]);

        // Create a transaction with journal entries
        $transaction = Transaction::factory()->create();
        
        // Debit entry (increases asset balance)
        JournalEntry::factory()->create([
            'transaction_id' => $transaction->id,
            'account_id' => $account->id,
            'debit_amount' => 500.00,
            'credit_amount' => 0,
        ]);

        // Credit entry (decreases asset balance)
        JournalEntry::factory()->create([
            'transaction_id' => $transaction->id,
            'account_id' => $account->id,
            'debit_amount' => 0,
            'credit_amount' => 200.00,
        ]);

        // Refresh the account to get updated balance
        $account->refresh();
        $account->updateBalance();

        // Expected balance: 1000 (opening) + 500 (debit) - 200 (credit) = 1300
        $this->assertEquals(1300.00, $account->current_balance);
    }

    /** @test */
    public function it_can_check_if_account_can_be_deleted()
    {
        $account = Account::factory()->create();

        // Account without journal entries can be deleted
        $this->assertTrue($account->canBeDeleted());

        // Create a journal entry for the account
        $transaction = Transaction::factory()->create();
        JournalEntry::factory()->create([
            'transaction_id' => $transaction->id,
            'account_id' => $account->id,
        ]);

        // Account with journal entries cannot be deleted
        $this->assertFalse($account->canBeDeleted());
    }

    /** @test */
    public function it_can_check_if_account_has_transactions()
    {
        $account = Account::factory()->create();

        // Account without journal entries has no transactions
        $this->assertFalse($account->hasTransactions());

        // Create a journal entry for the account
        $transaction = Transaction::factory()->create();
        JournalEntry::factory()->create([
            'transaction_id' => $transaction->id,
            'account_id' => $account->id,
        ]);

        // Account with journal entries has transactions
        $this->assertTrue($account->hasTransactions());
    }

    /** @test */
    public function it_scopes_active_accounts()
    {
        Account::factory()->create(['is_active' => true]);
        Account::factory()->create(['is_active' => false]);

        $activeAccounts = Account::active()->get();
        $this->assertCount(1, $activeAccounts);
        $this->assertTrue($activeAccounts->first()->is_active);
    }

    /** @test */
    public function it_scopes_accounts_by_type()
    {
        Account::factory()->create(['type' => 'asset']);
        Account::factory()->create(['type' => 'liability']);
        Account::factory()->create(['type' => 'asset']);

        $assetAccounts = Account::ofType('asset')->get();
        $this->assertCount(2, $assetAccounts);
        $assetAccounts->each(function ($account) {
            $this->assertEquals('asset', $account->type);
        });
    }

    /** @test */
    public function it_validates_account_code_uniqueness_per_tenant()
    {
        Account::factory()->create([
            'tenant_id' => 1,
            'code' => '1000',
        ]);

        // Same code in different tenant should be allowed
        $account2 = Account::factory()->create([
            'tenant_id' => 2,
            'code' => '1000',
        ]);

        $this->assertNotNull($account2);

        // Same code in same tenant should fail
        $this->expectException(\Illuminate\Database\QueryException::class);
        Account::factory()->create([
            'tenant_id' => 1,
            'code' => '1000',
        ]);
    }

    /** @test */
    public function it_formats_account_display_name()
    {
        $account = Account::factory()->create([
            'code' => '1000',
            'name' => 'Cash',
        ]);

        $this->assertEquals('1000 - Cash', $account->display_name);
    }

    /** @test */
    public function it_gets_account_hierarchy_path()
    {
        $grandparent = Account::factory()->create([
            'code' => '1000',
            'name' => 'Assets',
        ]);

        $parent = Account::factory()->create([
            'code' => '1100',
            'name' => 'Current Assets',
            'parent_id' => $grandparent->id,
        ]);

        $child = Account::factory()->create([
            'code' => '1110',
            'name' => 'Cash',
            'parent_id' => $parent->id,
        ]);

        $path = $child->getHierarchyPath();
        $this->assertEquals('Assets > Current Assets > Cash', $path);
    }
}
