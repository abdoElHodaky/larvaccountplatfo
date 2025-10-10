<?php

namespace Tests\Feature\GraphQL;

use Tests\TestCase;
use App\Features\Accounting\Models\Account;
use App\Features\Accounting\Models\Transaction;
use App\Features\Accounting\Models\JournalEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;

class AccountingGraphQLTest extends TestCase
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
    public function it_can_query_accounting_dashboard()
    {
        // Create test accounts
        $revenueAccount = Account::factory()->create(['type' => 'revenue']);
        $expenseAccount = Account::factory()->create(['type' => 'expense']);
        
        // Create test transactions
        Transaction::factory()->count(3)->create(['account_id' => $revenueAccount->id]);
        Transaction::factory()->count(2)->create(['account_id' => $expenseAccount->id]);

        $query = '
            query {
                accountingDashboard {
                    total_revenue
                    total_expenses
                    net_income
                    cash_flow
                    recent_transactions {
                        id
                        amount
                        type
                        description
                        date
                    }
                    account_balances {
                        account {
                            id
                            name
                            type
                        }
                        balance
                        as_of_date
                    }
                }
            }
        ';

        $response = $this->graphQL($query);

        $response->assertJsonStructure([
            'data' => [
                'accountingDashboard' => [
                    'total_revenue',
                    'total_expenses',
                    'net_income',
                    'cash_flow',
                    'recent_transactions' => [
                        '*' => [
                            'id',
                            'amount',
                            'type',
                            'description',
                            'date'
                        ]
                    ],
                    'account_balances' => [
                        '*' => [
                            'account' => [
                                'id',
                                'name',
                                'type'
                            ],
                            'balance',
                            'as_of_date'
                        ]
                    ]
                ]
            ]
        ]);
    }

    /** @test */
    public function it_can_query_accounts_with_filtering()
    {
        // Create accounts of different types
        Account::factory()->count(3)->create(['type' => 'asset']);
        Account::factory()->count(2)->create(['type' => 'liability']);
        Account::factory()->count(1)->create(['type' => 'equity']);

        $query = '
            query {
                accounts(type: ASSET, first: 10) {
                    data {
                        id
                        name
                        code
                        type
                        balance
                        status
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
                'accounts' => [
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'code',
                            'type',
                            'balance',
                            'status'
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

        // Should only return asset accounts
        $this->assertEquals(3, count($response->json('data.accounts.data')));
        
        foreach ($response->json('data.accounts.data') as $account) {
            $this->assertEquals('ASSET', $account['type']);
        }
    }

    /** @test */
    public function it_can_create_an_account()
    {
        $mutation = '
            mutation CreateAccount($input: CreateAccountInput!) {
                createAccount(input: $input) {
                    id
                    name
                    code
                    type
                    description
                    status
                }
            }
        ';

        $variables = [
            'input' => [
                'name' => 'Test Cash Account',
                'code' => '1001',
                'type' => 'ASSET',
                'description' => 'Main cash account for testing',
                'status' => 'ACTIVE'
            ]
        ];

        $response = $this->graphQL($mutation, $variables);

        $response->assertJsonStructure([
            'data' => [
                'createAccount' => [
                    'id',
                    'name',
                    'code',
                    'type',
                    'description',
                    'status'
                ]
            ]
        ]);

        $this->assertEquals('Test Cash Account', $response->json('data.createAccount.name'));
        $this->assertEquals('1001', $response->json('data.createAccount.code'));
        $this->assertEquals('ASSET', $response->json('data.createAccount.type'));

        // Verify account was created in database
        $this->assertDatabaseHas('accounts', [
            'name' => 'Test Cash Account',
            'code' => '1001',
            'type' => 'asset'
        ]);
    }

    /** @test */
    public function it_can_create_a_journal_entry()
    {
        // Create test accounts
        $cashAccount = Account::factory()->create(['code' => '1001', 'type' => 'asset']);
        $revenueAccount = Account::factory()->create(['code' => '4001', 'type' => 'revenue']);

        $mutation = '
            mutation CreateJournalEntry($input: CreateJournalEntryInput!) {
                createJournalEntry(input: $input) {
                    id
                    date
                    reference
                    description
                    total_debit
                    total_credit
                    status
                    entries {
                        id
                        account {
                            id
                            name
                            code
                        }
                        debit
                        credit
                        description
                    }
                }
            }
        ';

        $variables = [
            'input' => [
                'date' => now()->format('Y-m-d H:i:s'),
                'reference' => 'JE-001',
                'description' => 'Test journal entry',
                'entries' => [
                    [
                        'account_id' => $cashAccount->id,
                        'debit' => 1000.00,
                        'credit' => 0.00,
                        'description' => 'Cash received'
                    ],
                    [
                        'account_id' => $revenueAccount->id,
                        'debit' => 0.00,
                        'credit' => 1000.00,
                        'description' => 'Revenue earned'
                    ]
                ]
            ]
        ];

        $response = $this->graphQL($mutation, $variables);

        $response->assertJsonStructure([
            'data' => [
                'createJournalEntry' => [
                    'id',
                    'date',
                    'reference',
                    'description',
                    'total_debit',
                    'total_credit',
                    'status',
                    'entries' => [
                        '*' => [
                            'id',
                            'account' => [
                                'id',
                                'name',
                                'code'
                            ],
                            'debit',
                            'credit',
                            'description'
                        ]
                    ]
                ]
            ]
        ]);

        $this->assertEquals('JE-001', $response->json('data.createJournalEntry.reference'));
        $this->assertEquals(1000.00, $response->json('data.createJournalEntry.total_debit'));
        $this->assertEquals(1000.00, $response->json('data.createJournalEntry.total_credit'));
        $this->assertCount(2, $response->json('data.createJournalEntry.entries'));

        // Verify journal entry was created in database
        $this->assertDatabaseHas('journal_entries', [
            'reference' => 'JE-001',
            'total_debit' => 1000.00,
            'total_credit' => 1000.00
        ]);
    }

    /** @test */
    public function it_validates_journal_entry_balance()
    {
        $cashAccount = Account::factory()->create(['type' => 'asset']);
        $revenueAccount = Account::factory()->create(['type' => 'revenue']);

        $mutation = '
            mutation CreateJournalEntry($input: CreateJournalEntryInput!) {
                createJournalEntry(input: $input) {
                    id
                    reference
                }
            }
        ';

        $variables = [
            'input' => [
                'date' => now()->format('Y-m-d H:i:s'),
                'reference' => 'JE-UNBALANCED',
                'description' => 'Unbalanced journal entry',
                'entries' => [
                    [
                        'account_id' => $cashAccount->id,
                        'debit' => 1000.00,
                        'credit' => 0.00,
                        'description' => 'Cash received'
                    ],
                    [
                        'account_id' => $revenueAccount->id,
                        'debit' => 0.00,
                        'credit' => 500.00, // Unbalanced - should be 1000.00
                        'description' => 'Revenue earned'
                    ]
                ]
            ]
        ];

        $response = $this->graphQL($mutation, $variables);

        $response->assertGraphQLErrorMessage('Total debits must equal total credits');
    }

    /** @test */
    public function it_can_query_balance_sheet()
    {
        // Create test accounts
        $assetAccount = Account::factory()->create(['type' => 'asset', 'balance' => 10000]);
        $liabilityAccount = Account::factory()->create(['type' => 'liability', 'balance' => 5000]);
        $equityAccount = Account::factory()->create(['type' => 'equity', 'balance' => 5000]);

        $query = '
            query {
                balanceSheet(as_of_date: "2024-12-31 23:59:59") {
                    as_of_date
                    assets {
                        account {
                            id
                            name
                            code
                        }
                        balance
                    }
                    liabilities {
                        account {
                            id
                            name
                            code
                        }
                        balance
                    }
                    equity {
                        account {
                            id
                            name
                            code
                        }
                        balance
                    }
                    total_assets
                    total_liabilities
                    total_equity
                }
            }
        ';

        $response = $this->graphQL($query);

        $response->assertJsonStructure([
            'data' => [
                'balanceSheet' => [
                    'as_of_date',
                    'assets' => [
                        '*' => [
                            'account' => [
                                'id',
                                'name',
                                'code'
                            ],
                            'balance'
                        ]
                    ],
                    'liabilities' => [
                        '*' => [
                            'account' => [
                                'id',
                                'name',
                                'code'
                            ],
                            'balance'
                        ]
                    ],
                    'equity' => [
                        '*' => [
                            'account' => [
                                'id',
                                'name',
                                'code'
                            ],
                            'balance'
                        ]
                    ],
                    'total_assets',
                    'total_liabilities',
                    'total_equity'
                ]
            ]
        ]);

        $this->assertEquals(10000, $response->json('data.balanceSheet.total_assets'));
        $this->assertEquals(5000, $response->json('data.balanceSheet.total_liabilities'));
        $this->assertEquals(5000, $response->json('data.balanceSheet.total_equity'));
    }

    /** @test */
    public function it_can_query_profit_loss_report()
    {
        // Create test accounts
        $revenueAccount = Account::factory()->create(['type' => 'revenue', 'balance' => 15000]);
        $expenseAccount = Account::factory()->create(['type' => 'expense', 'balance' => 8000]);

        $query = '
            query {
                profitLoss(
                    from_date: "2024-01-01 00:00:00"
                    to_date: "2024-12-31 23:59:59"
                ) {
                    from_date
                    to_date
                    revenue {
                        account {
                            id
                            name
                            code
                        }
                        balance
                    }
                    expenses {
                        account {
                            id
                            name
                            code
                        }
                        balance
                    }
                    total_revenue
                    total_expenses
                    gross_profit
                    net_income
                }
            }
        ';

        $response = $this->graphQL($query);

        $response->assertJsonStructure([
            'data' => [
                'profitLoss' => [
                    'from_date',
                    'to_date',
                    'revenue' => [
                        '*' => [
                            'account' => [
                                'id',
                                'name',
                                'code'
                            ],
                            'balance'
                        ]
                    ],
                    'expenses' => [
                        '*' => [
                            'account' => [
                                'id',
                                'name',
                                'code'
                            ],
                            'balance'
                        ]
                    ],
                    'total_revenue',
                    'total_expenses',
                    'gross_profit',
                    'net_income'
                ]
            ]
        ]);

        $this->assertEquals(15000, $response->json('data.profitLoss.total_revenue'));
        $this->assertEquals(8000, $response->json('data.profitLoss.total_expenses'));
        $this->assertEquals(7000, $response->json('data.profitLoss.net_income')); // 15000 - 8000
    }

    /** @test */
    public function it_can_query_transactions_with_filtering()
    {
        $account = Account::factory()->create();
        
        // Create transactions with different dates and amounts
        Transaction::factory()->create([
            'account_id' => $account->id,
            'amount' => 1000,
            'date' => '2024-01-15',
            'type' => 'debit'
        ]);
        
        Transaction::factory()->create([
            'account_id' => $account->id,
            'amount' => 500,
            'date' => '2024-02-15',
            'type' => 'credit'
        ]);

        $query = '
            query {
                transactions(
                    account_id: ' . $account->id . '
                    date_from: "2024-01-01 00:00:00"
                    date_to: "2024-01-31 23:59:59"
                    first: 10
                ) {
                    data {
                        id
                        amount
                        type
                        date
                        account {
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
                'transactions' => [
                    'data' => [
                        '*' => [
                            'id',
                            'amount',
                            'type',
                            'date',
                            'account' => [
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

        // Should only return January transaction
        $this->assertCount(1, $response->json('data.transactions.data'));
        $this->assertEquals(1000, $response->json('data.transactions.data.0.amount'));
    }
}
