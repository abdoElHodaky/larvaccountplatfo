<?php

namespace Tests\Feature\Accounting;

use App\Features\Accounting\Models\Account;
use App\Features\Accounting\Models\JournalEntry;
use App\Features\Accounting\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AccountingApiTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test user and authenticate
        $this->actingAs($this->createTestUser());
    }

    /** @test */
    public function itCanGetAccountingDashboardData()
    {
        // Create test accounts and transactions
        $account = Account::factory()->create();
        $transactions = Transaction::factory()->count(3)->create(['account_id' => $account->id]);

        $response = $this->getJson('/api/accounting/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_revenue',
                    'total_expenses',
                    'net_income',
                    'cash_flow',
                    'recent_transactions',
                    'account_balances',
                ],
            ]);
    }

    /** @test */
    public function itCanGetAllAccounts()
    {
        $accounts = Account::factory()->count(5)->create();

        $response = $this->getJson('/api/accounting/accounts');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'code',
                        'type',
                        'balance',
                        'status',
                        'description',
                    ],
                ],
            ]);
    }

    /** @test */
    public function itCanGetSingleAccount()
    {
        $account = Account::factory()->create();
        $transactions = Transaction::factory()->count(3)->create(['account_id' => $account->id]);

        $response = $this->getJson("/api/accounting/accounts/{$account->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'name',
                    'code',
                    'type',
                    'balance',
                    'status',
                    'description',
                    'transactions',
                ],
            ]);
    }

    /** @test */
    public function itCanCreateNewAccount()
    {
        $accountData = [
            'name' => 'Test Account',
            'code' => 'TEST-001',
            'type' => 'asset',
            'description' => 'Test account description',
            'status' => 'active',
        ];

        $response = $this->postJson('/api/accounting/accounts', $accountData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'name',
                    'code',
                    'type',
                    'description',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('accounts', [
            'name' => 'Test Account',
            'code' => 'TEST-001',
        ]);
    }

    /** @test */
    public function itCanUpdateAccount()
    {
        $account = Account::factory()->create();

        $updateData = [
            'name' => 'Updated Account Name',
            'description' => 'Updated description',
        ];

        $response = $this->putJson("/api/accounting/accounts/{$account->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'name',
                    'description',
                ],
            ]);

        $this->assertDatabaseHas('accounts', [
            'id' => $account->id,
            'name' => 'Updated Account Name',
        ]);
    }

    /** @test */
    public function itCanGetAllTransactions()
    {
        $account = Account::factory()->create();
        $transactions = Transaction::factory()->count(5)->create(['account_id' => $account->id]);

        $response = $this->getJson('/api/accounting/transactions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'account_id',
                        'amount',
                        'type',
                        'description',
                        'reference',
                        'date',
                        'status',
                    ],
                ],
            ]);
    }

    /** @test */
    public function itCanCreateNewTransaction()
    {
        $account = Account::factory()->create();

        $transactionData = [
            'account_id' => $account->id,
            'amount' => 1000.00,
            'type' => 'credit',
            'description' => 'Test transaction',
            'reference' => 'REF-001',
            'date' => now()->format('Y-m-d'),
        ];

        $response = $this->postJson('/api/accounting/transactions', $transactionData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'account_id',
                    'amount',
                    'type',
                    'description',
                    'reference',
                    'date',
                ],
            ]);

        $this->assertDatabaseHas('transactions', [
            'account_id' => $account->id,
            'amount' => 1000.00,
            'reference' => 'REF-001',
        ]);
    }

    /** @test */
    public function itCanGetJournalEntries()
    {
        $journalEntries = JournalEntry::factory()->count(3)->create();

        $response = $this->getJson('/api/accounting/journal-entries');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'date',
                        'reference',
                        'description',
                        'total_debit',
                        'total_credit',
                        'status',
                    ],
                ],
            ]);
    }

    /** @test */
    public function itCanCreateJournalEntry()
    {
        $debitAccount = Account::factory()->create(['type' => 'asset']);
        $creditAccount = Account::factory()->create(['type' => 'liability']);

        $journalEntryData = [
            'date' => now()->format('Y-m-d'),
            'reference' => 'JE-001',
            'description' => 'Test journal entry',
            'entries' => [
                [
                    'account_id' => $debitAccount->id,
                    'debit' => 1000.00,
                    'credit' => 0,
                    'description' => 'Debit entry',
                ],
                [
                    'account_id' => $creditAccount->id,
                    'debit' => 0,
                    'credit' => 1000.00,
                    'description' => 'Credit entry',
                ],
            ],
        ];

        $response = $this->postJson('/api/accounting/journal-entries', $journalEntryData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'date',
                    'reference',
                    'description',
                    'total_debit',
                    'total_credit',
                    'entries',
                ],
            ]);

        $this->assertDatabaseHas('journal_entries', [
            'reference' => 'JE-001',
            'description' => 'Test journal entry',
        ]);
    }

    /** @test */
    public function itCanGetFinancialReports()
    {
        // Create test data
        $assetAccount = Account::factory()->create(['type' => 'asset']);
        $liabilityAccount = Account::factory()->create(['type' => 'liability']);
        $revenueAccount = Account::factory()->create(['type' => 'revenue']);
        $expenseAccount = Account::factory()->create(['type' => 'expense']);

        Transaction::factory()->create([
            'account_id' => $assetAccount->id,
            'amount' => 5000,
            'type' => 'debit',
        ]);
        Transaction::factory()->create([
            'account_id' => $revenueAccount->id,
            'amount' => 3000,
            'type' => 'credit',
        ]);

        $response = $this->getJson('/api/accounting/reports/balance-sheet');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'assets',
                    'liabilities',
                    'equity',
                    'total_assets',
                    'total_liabilities_equity',
                ],
            ]);
    }

    /** @test */
    public function itCanGetProfitLossReport()
    {
        $revenueAccount = Account::factory()->create(['type' => 'revenue']);
        $expenseAccount = Account::factory()->create(['type' => 'expense']);

        Transaction::factory()->create([
            'account_id' => $revenueAccount->id,
            'amount' => 5000,
            'type' => 'credit',
        ]);
        Transaction::factory()->create([
            'account_id' => $expenseAccount->id,
            'amount' => 2000,
            'type' => 'debit',
        ]);

        $response = $this->getJson('/api/accounting/reports/profit-loss');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'revenue',
                    'expenses',
                    'gross_profit',
                    'net_income',
                    'period',
                ],
            ]);
    }

    /** @test */
    public function itValidatesRequiredFieldsWhenCreatingAccount()
    {
        $response = $this->postJson('/api/accounting/accounts', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'code', 'type']);
    }

    /** @test */
    public function itPreventsDuplicateAccountCodes()
    {
        $existingAccount = Account::factory()->create(['code' => 'DUPLICATE-CODE']);

        $accountData = [
            'name' => 'New Account',
            'code' => 'DUPLICATE-CODE',
            'type' => 'asset',
        ];

        $response = $this->postJson('/api/accounting/accounts', $accountData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    /** @test */
    public function itValidatesJournalEntryBalance()
    {
        $account = Account::factory()->create();

        $journalEntryData = [
            'date' => now()->format('Y-m-d'),
            'reference' => 'JE-UNBALANCED',
            'description' => 'Unbalanced journal entry',
            'entries' => [
                [
                    'account_id' => $account->id,
                    'debit' => 1000.00,
                    'credit' => 0,
                    'description' => 'Debit entry',
                ],
                [
                    'account_id' => $account->id,
                    'debit' => 0,
                    'credit' => 500.00, // Unbalanced
                    'description' => 'Credit entry',
                ],
            ],
        ];

        $response = $this->postJson('/api/accounting/journal-entries', $journalEntryData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['entries']);
    }

    /** @test */
    public function itCanFilterTransactionsByDateRange()
    {
        $account = Account::factory()->create();

        $oldTransaction = Transaction::factory()->create([
            'account_id' => $account->id,
            'date' => now()->subDays(30),
        ]);
        $recentTransaction = Transaction::factory()->create([
            'account_id' => $account->id,
            'date' => now()->subDays(5),
        ]);

        $response = $this->getJson('/api/accounting/transactions?from='.now()->subDays(10)->format('Y-m-d').'&to='.now()->format('Y-m-d'));

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /** @test */
    public function itCanFilterTransactionsByAccount()
    {
        $account1 = Account::factory()->create();
        $account2 = Account::factory()->create();

        $transaction1 = Transaction::factory()->create(['account_id' => $account1->id]);
        $transaction2 = Transaction::factory()->create(['account_id' => $account2->id]);

        $response = $this->getJson("/api/accounting/transactions?account_id={$account1->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Create a test user for authentication
     */
    private function createTestUser()
    {
        return \App\Models\User::factory()->create();
    }
}
