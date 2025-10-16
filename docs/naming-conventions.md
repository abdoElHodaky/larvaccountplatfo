# Laravel Backend Naming Conventions Guide

## Overview

This document establishes consistent naming conventions for the Laravel accounting platform backend to improve code readability, maintainability, and developer experience.

## General Principles

1. **Clarity over Brevity** - Names should be descriptive and self-documenting
2. **Consistency** - Follow established patterns throughout the codebase
3. **Context Awareness** - Names should make sense within their domain context
4. **Avoid Abbreviations** - Use full words unless the abbreviation is universally understood

## File and Directory Naming

### Directory Names
- **PascalCase** for feature directories: `Accounting`, `BusinessOperations`
- **PascalCase** for subdirectories: `Controllers`, `Services`, `Models`
- **lowercase** for configuration directories: `config`, `database`, `resources`

### File Names
- **PascalCase** with descriptive suffixes:
  - Controllers: `AccountController.php`, `TransactionController.php`
  - Services: `AccountCreationService.php`, `TransactionProcessingService.php`
  - Models: `Account.php`, `Transaction.php`, `JournalEntry.php`
  - Events: `TransactionCreated.php`, `AccountBalanceUpdated.php`
  - Listeners: `SendTransactionNotification.php`, `UpdateAccountBalance.php`

## Class Naming Conventions

### Controllers
```php
// ✅ Good - Descriptive and follows pattern
class AccountController extends Controller
class TransactionController extends Controller
class ReportGenerationController extends Controller

// ❌ Avoid - Too generic or unclear
class AccountingController extends Controller  // Too broad
class DataController extends Controller        // Too generic
class AccController extends Controller         // Abbreviated
```

### Services
```php
// ✅ Good - Specific responsibility and action
class AccountCreationService
class TransactionProcessingService
class ReportGenerationService
class TaxCalculationService
class ReconciliationService

// ❌ Avoid - Too broad or unclear
class AccountingService     // Too broad - what does it do?
class DataService          // Too generic
class HelperService        // Unclear purpose
```

### Models
```php
// ✅ Good - Singular, descriptive entity names
class Account extends Model
class Transaction extends Model
class JournalEntry extends Model
class ChartOfAccounts extends Model
class TaxRate extends Model

// ❌ Avoid - Plural or unclear names
class Accounts extends Model           // Should be singular
class TransactionData extends Model    // Redundant suffix
class AccModel extends Model          // Abbreviated
```

### Events
```php
// ✅ Good - Past tense, descriptive
class TransactionCreated
class AccountBalanceUpdated
class ReportGenerated
class UserLoggedIn
class InvoicePaid

// ❌ Avoid - Present tense or unclear
class CreateTransaction    // Should be past tense
class AccountEvent        // Too generic
class DataUpdated         // Too vague
```

### Listeners
```php
// ✅ Good - Action-oriented, descriptive
class SendTransactionNotification
class UpdateAccountBalance
class LogUserActivity
class GenerateAuditTrail
class RecalculateTotals

// ❌ Avoid - Unclear or generic names
class TransactionListener     // What does it do?
class AccountHandler         // Too generic
class DataProcessor          // Too vague
```

## Method Naming Conventions

### Controller Methods
```php
// ✅ Good - RESTful and descriptive
public function index()           // List resources
public function show($id)         // Show single resource
public function store(Request $request)    // Create new resource
public function update(Request $request, $id)  // Update resource
public function destroy($id)      // Delete resource

// Custom actions - verb + noun
public function generateReport()
public function exportData()
public function reconcileAccount()
```

### Service Methods
```php
// ✅ Good - Verb + noun pattern
public function createAccount(array $data): Account
public function updateTransaction(int $id, array $data): Transaction
public function calculateTax(float $amount): float
public function generateReport(string $type): Report
public function reconcileAccount(int $accountId): bool

// ❌ Avoid - Unclear or inconsistent
public function doStuff()         // Too vague
public function handle()          // What does it handle?
public function process()         // Process what?
```

### Model Methods
```php
// ✅ Good - Descriptive relationships and scopes
// Relationships
public function transactions(): HasMany
public function parentAccount(): BelongsTo
public function childAccounts(): HasMany

// Scopes
public function scopeActive($query)
public function scopeByType($query, $type)
public function scopeWithBalance($query)

// Accessors/Mutators
public function getFormattedBalanceAttribute(): string
public function setCodeAttribute($value): void

// Business logic methods
public function calculateBalance(): float
public function isReconciled(): bool
public function canBeDeleted(): bool
```

## Variable Naming Conventions

### General Variables
```php
// ✅ Good - Descriptive camelCase
$accountBalance = 1000.00;
$transactionDate = now();
$chartOfAccounts = Account::all();
$userPreferences = $user->preferences;

// ❌ Avoid - Unclear or abbreviated
$bal = 1000.00;           // Abbreviated
$data = Account::all();   // Too generic
$temp = now();           // Unclear purpose
```

### Collections and Arrays
```php
// ✅ Good - Plural nouns
$accounts = Account::all();
$transactions = $account->transactions;
$reportData = $report->getData();
$validationRules = ['name' => 'required'];

// ❌ Avoid - Singular or unclear
$account = Account::all();     // Should be plural
$list = $account->transactions; // Too generic
```

### Boolean Variables
```php
// ✅ Good - is/has/can/should prefix
$isActive = true;
$hasTransactions = $account->transactions->count() > 0;
$canBeDeleted = $account->canBeDeleted();
$shouldReconcile = $account->needsReconciliation();

// ❌ Avoid - Unclear boolean intent
$active = true;           // Could be string or boolean
$status = true;          // What status?
$flag = false;           // What flag?
```

## Database Naming Conventions

### Table Names
```sql
-- ✅ Good - Plural, snake_case
accounts
transactions
journal_entries
chart_of_accounts
tax_rates
user_preferences

-- ❌ Avoid - Singular or inconsistent
account              -- Should be plural
transactionData      -- camelCase not appropriate
acc_trans           -- Abbreviated
```

### Column Names
```sql
-- ✅ Good - Descriptive snake_case
id
account_code
account_name
transaction_date
created_at
updated_at
parent_account_id
is_active

-- ❌ Avoid - Abbreviated or unclear
acc_cd              -- Abbreviated
date               -- Which date?
flag               -- What flag?
```

### Foreign Keys
```sql
-- ✅ Good - {table}_id pattern
account_id
user_id
organization_id
parent_account_id
journal_entry_id

-- ❌ Avoid - Inconsistent patterns
accountId           -- camelCase not appropriate
acc_id             -- Abbreviated
account            -- Missing _id suffix
```

## Route Naming Conventions

### API Routes
```php
// ✅ Good - RESTful resource routes
Route::apiResource('accounts', AccountController::class);
Route::apiResource('transactions', TransactionController::class);

// Custom routes - verb.noun pattern
Route::post('accounts/{account}/reconcile', [AccountController::class, 'reconcile'])
    ->name('accounts.reconcile');
Route::get('reports/generate', [ReportController::class, 'generate'])
    ->name('reports.generate');
```

### Route Names
```php
// ✅ Good - Descriptive dot notation
'accounts.index'
'accounts.show'
'accounts.store'
'transactions.reconcile'
'reports.generate'

// ❌ Avoid - Unclear or inconsistent
'acc.list'          -- Abbreviated
'show_account'      -- Inconsistent format
'data.get'          -- Too generic
```

## Configuration and Environment Variables

### Environment Variables
```bash
# ✅ Good - SCREAMING_SNAKE_CASE, descriptive
APP_NAME="Accounting Platform"
DB_CONNECTION=mysql
WEBSOCKET_URL=ws://localhost:6001
MAIL_MAILER=smtp
CACHE_DRIVER=redis

# ❌ Avoid - Unclear or inconsistent
APP=accounting      # Too abbreviated
db_host=localhost   # Wrong case
URL=ws://localhost  # Too generic
```

### Configuration Keys
```php
// ✅ Good - snake_case, descriptive
'database_connection' => 'mysql',
'cache_timeout' => 3600,
'mail_from_address' => 'noreply@example.com',
'websocket_url' => env('WEBSOCKET_URL'),

// ❌ Avoid - camelCase or unclear
'dbConn' => 'mysql',        // Abbreviated
'timeout' => 3600,          // Which timeout?
'url' => env('URL'),        // Too generic
```

## GraphQL Naming Conventions

### Types
```graphql
# ✅ Good - PascalCase, descriptive
type Account {
  id: ID!
  code: String!
  name: String!
}

type Transaction {
  id: ID!
  date: String!
  amount: Float!
}

# ❌ Avoid - Unclear or inconsistent
type AccountData {    # Redundant suffix
  # ...
}
```

### Queries and Mutations
```graphql
# ✅ Good - camelCase, descriptive
type Query {
  accounts: [Account!]!
  account(id: ID!): Account
  transactionsByAccount(accountId: ID!): [Transaction!]!
}

type Mutation {
  createAccount(input: CreateAccountInput!): Account!
  updateTransaction(id: ID!, input: UpdateTransactionInput!): Transaction!
  deleteAccount(id: ID!): Boolean!
}

# ❌ Avoid - Unclear or inconsistent
type Query {
  getAccounts: [Account!]!     # Redundant 'get' prefix
  acc(id: ID!): Account        # Abbreviated
  data: [Transaction!]!        # Too generic
}
```

## Testing Naming Conventions

### Test Classes
```php
// ✅ Good - {Class}Test pattern
class AccountControllerTest extends TestCase
class TransactionServiceTest extends TestCase
class AccountCreationTest extends TestCase

// ❌ Avoid - Unclear or inconsistent
class TestAccount extends TestCase     // Wrong prefix
class AccountTests extends TestCase    # Plural
```

### Test Methods
```php
// ✅ Good - test_{action}_{expected_result}
public function test_create_account_with_valid_data_returns_account()
public function test_update_transaction_with_invalid_amount_throws_exception()
public function test_delete_account_with_transactions_fails()

// ❌ Avoid - Unclear or too brief
public function testAccount()          // What about account?
public function test_create()          // Create what?
public function it_works()             // What works?
```

## Implementation Checklist

### For New Code
- [ ] Follow established naming patterns
- [ ] Use descriptive, self-documenting names
- [ ] Avoid abbreviations unless universally understood
- [ ] Maintain consistency with existing codebase
- [ ] Add appropriate suffixes (Controller, Service, etc.)

### For Refactoring
- [ ] Identify inconsistent naming patterns
- [ ] Rename classes/methods to follow conventions
- [ ] Update all references and imports
- [ ] Update documentation and comments
- [ ] Run tests to ensure nothing breaks

## Tools and Automation

### IDE Configuration
- Configure IDE to suggest naming patterns
- Set up code templates with proper naming
- Enable naming convention inspections

### Code Quality Tools
- Use PHP_CodeSniffer with custom rules
- Configure PHPStan for naming analysis
- Set up pre-commit hooks for naming validation

### Documentation
- Keep this guide updated with new patterns
- Document exceptions and special cases
- Provide examples for complex scenarios

## Conclusion

Consistent naming conventions improve code readability, reduce cognitive load, and make the codebase more maintainable. By following these guidelines, we ensure that:

1. **New developers** can quickly understand the codebase structure
2. **Code reviews** focus on logic rather than naming discussions
3. **Maintenance** becomes easier with predictable naming patterns
4. **Collaboration** improves with shared understanding of conventions

Remember: These are guidelines, not rigid rules. Use judgment when special cases arise, but document any exceptions clearly.

