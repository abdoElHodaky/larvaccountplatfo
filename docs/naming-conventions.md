# 📝 Unified Naming Conventions Guide

## 🎯 Overview

This document establishes unified naming conventions for the Laravel Modular Accounting Platform to ensure consistency, readability, and maintainability across the entire codebase. These conventions apply to all backend components including controllers, services, models, middleware, and other PHP classes.

---

## 🏗️ General Principles

### **1. Consistency First**
- Use the same naming pattern throughout the entire application
- Follow established Laravel conventions where applicable
- Prioritize clarity over brevity

### **2. Self-Documenting Names**
- Names should clearly indicate purpose and responsibility
- Avoid abbreviations unless they are widely understood
- Use descriptive names that reduce the need for comments

### **3. Context Awareness**
- Consider the namespace and directory structure when naming
- Avoid redundant information in names
- Use appropriate prefixes/suffixes for different component types

---

## 📁 Directory and Namespace Conventions

### **Feature Modules**
```php
// Pattern: PascalCase, descriptive business domain
app/Features/Accounting/
app/Features/InventoryManagement/
app/Features/FinancialReporting/
app/Features/UserAuthentication/

// Namespace pattern
namespace App\Features\Accounting\Services;
namespace App\Features\InventoryManagement\Controllers;
```

### **Shared Components**
```php
// Pattern: Descriptive purpose
app/Shared/Services/
app/Shared/Contracts/
app/Shared/Traits/
app/Shared/Exceptions/

// Namespace pattern
namespace App\Shared\Services;
namespace App\Shared\Contracts;
```

---

## 🎮 Controller Naming Conventions

### **1. Feature Controllers**
```php
// Pattern: [Feature]Controller
// Location: app/Features/[Feature]/Controllers/

✅ Correct Examples:
AccountingController.php
InventoryController.php
ReportingController.php
DashboardController.php
UserManagementController.php

❌ Incorrect Examples:
AccountController.php          // Too generic
AccController.php              // Abbreviated
AccountingManagementController.php  // Redundant
```

### **2. API Controllers**
```php
// Pattern: [Feature]ApiController
// Location: app/Features/[Feature]/Controllers/Api/

✅ Correct Examples:
AccountingApiController.php
InventoryApiController.php
ReportingApiController.php

// Alternative pattern for specific API versions
AccountingV1Controller.php
AccountingV2Controller.php
```

### **3. Global Controllers**
```php
// Pattern: [Purpose]Controller
// Location: app/Http/Controllers/

✅ Correct Examples:
AuthenticationController.php   // Core auth operations
HealthCheckController.php      // System health
WebhookController.php          // External webhooks
ApiController.php              // Base API controller

❌ Incorrect Examples:
RegisteredUserController.php   // Should be: UserRegistrationController.php
EmailVerificationPromptController.php  // Should be: EmailVerificationController.php
```

### **4. Specialized Controllers**
```php
// Pattern: [Entity][Action]Controller

✅ Correct Examples:
UserRegistrationController.php
PasswordResetController.php
EmailVerificationController.php
TenantProvisioningController.php

// For resource controllers
UserResourceController.php
AccountResourceController.php
```

---

## 🔧 Service Naming Conventions

### **1. Core Services**
```php
// Pattern: [Domain]Service
// Location: app/Services/Core/

✅ Correct Examples:
AuthenticationService.php      // Core authentication logic
AuthorizationService.php       // Permission management
TenantService.php              // Tenant operations
UserService.php                // User management
SecurityService.php            // Security utilities

❌ Incorrect Examples:
AuthService.php                // Too abbreviated
TenantProvisioningService.php  // Should be: TenantService.php
UserManagementService.php      // Redundant "Management"
```

### **2. Infrastructure Services**
```php
// Pattern: [Technology/Purpose]Service
// Location: app/Services/Infrastructure/

✅ Correct Examples:
CacheService.php               // Caching operations
QueueService.php               // Queue management
StorageService.php             // File storage
NotificationService.php        // Notifications
EmailService.php               // Email operations
SmsService.php                 // SMS operations

❌ Incorrect Examples:
CachingService.php             // Use "Cache" not "Caching"
FileStorageService.php         // Use "Storage" not "FileStorage"
```

### **3. Feature Services**
```php
// Pattern: [Domain][Purpose]Service (if purpose is specific)
// Pattern: [Domain]Service (if general domain service)
// Location: app/Features/[Feature]/Services/

✅ Correct Examples:
// General domain services
AccountingService.php          // Main accounting operations
InventoryService.php           // Main inventory operations
ReportingService.php           // Main reporting operations

// Specific purpose services
BudgetManagementService.php    // Budget-specific operations
TaxCalculationService.php      // Tax-specific calculations
StockValuationService.php      // Stock valuation logic
FinancialForecastingService.php // Financial forecasting

❌ Incorrect Examples:
BudgetService.php              // Too generic, use BudgetManagementService.php
TaxService.php                 // Too generic, use TaxCalculationService.php
ForecastingService.php         // Use FinancialForecastingService.php
```

### **4. Application Services**
```php
// Pattern: [Entity][Action]Service
// Location: app/Features/[Feature]/Services/Application/

✅ Correct Examples:
AccountCreationService.php     // Account creation logic
TransactionProcessingService.php // Transaction processing
ReportGenerationService.php    // Report generation
UserRegistrationService.php    // User registration flow

❌ Incorrect Examples:
CreateAccountService.php       // Use AccountCreationService.php
ProcessTransactionService.php  // Use TransactionProcessingService.php
```

### **5. Integration Services**
```php
// Pattern: [System]IntegrationService
// Location: app/Features/[Feature]/Services/Integration/

✅ Correct Examples:
BankingIntegrationService.php  // Bank API integration
TaxSystemIntegrationService.php // Tax system integration
PayrollIntegrationService.php  // Payroll system integration
QuickBooksIntegrationService.php // QuickBooks integration

❌ Incorrect Examples:
BankIntegrationService.php     // Use "Banking" not "Bank"
TaxIntegrationService.php      // Use "TaxSystem" for clarity
```

---

## 📊 Model Naming Conventions

### **1. Entity Models**
```php
// Pattern: [Entity] (singular, PascalCase)
// Location: app/Features/[Feature]/Models/ or app/Models/

✅ Correct Examples:
Account.php                    // Accounting entity
Transaction.php                // Transaction entity
JournalEntry.php               // Journal entry entity
User.php                       // User entity
Tenant.php                     // Tenant entity
Product.php                    // Product entity
Order.php                      // Order entity

❌ Incorrect Examples:
Accounts.php                   // Should be singular
TransactionModel.php           // Don't add "Model" suffix
JournalEntries.php             // Should be singular: JournalEntry.php
```

### **2. Pivot Models**
```php
// Pattern: [Entity1][Entity2] (alphabetical order)
// Location: app/Features/[Feature]/Models/Pivots/

✅ Correct Examples:
AccountUser.php                // Account-User relationship
ProductCategory.php            // Product-Category relationship
RolePermission.php             // Role-Permission relationship
TeamUser.php                   // Team-User relationship

❌ Incorrect Examples:
UserAccount.php                // Should be AccountUser.php (alphabetical)
CategoryProduct.php            // Should be ProductCategory.php
```

### **3. Value Objects**
```php
// Pattern: [Concept] (descriptive name)
// Location: app/Features/[Feature]/Models/ValueObjects/

✅ Correct Examples:
Money.php                      // Money value object
Address.php                    // Address value object
DateRange.php                  // Date range value object
AccountCode.php                // Account code value object

❌ Incorrect Examples:
MoneyValue.php                 // Don't add "Value" suffix
AddressVO.php                  // Don't abbreviate "ValueObject"
```

---

## 🛡️ Middleware Naming Conventions

### **1. Authentication/Authorization Middleware**
```php
// Pattern: [Verb][Entity/Purpose]
// Location: app/Http/Middleware/ or app/Features/[Feature]/Middleware/

✅ Correct Examples:
AuthenticateUser.php           // User authentication
AuthenticateTenant.php         // Tenant authentication
EnsureAccountingPermission.php // Permission checking
EnsureEmailVerified.php        // Email verification check
EnsureTeamMembership.php       // Team membership check

❌ Incorrect Examples:
AuthMiddleware.php             // Too generic
CheckPermission.php            // Use "Ensure" prefix
VerifyEmail.php                // Use "EnsureEmailVerified"
```

### **2. Request Processing Middleware**
```php
// Pattern: [Action][Entity/Purpose]
// Location: app/Http/Middleware/

✅ Correct Examples:
ResolveTenant.php              // Tenant resolution
ValidateApiRequest.php         // API request validation
TransformApiResponse.php       // API response transformation
LogApiRequest.php              // API request logging

❌ Incorrect Examples:
TenantResolver.php             // Use "ResolveTenant"
ApiValidator.php               // Use "ValidateApiRequest"
ResponseTransformer.php        // Use "TransformApiResponse"
```

### **3. Rate Limiting Middleware**
```php
// Pattern: [Purpose]RateLimit
// Location: app/Http/Middleware/

✅ Correct Examples:
ApiRateLimit.php               // API rate limiting
GraphQLRateLimit.php           // GraphQL rate limiting
AuthenticationRateLimit.php    // Auth rate limiting

❌ Incorrect Examples:
RateLimitApi.php               // Use "ApiRateLimit"
GraphQLThrottle.php            // Use "GraphQLRateLimit"
```

---

## 📋 Repository Naming Conventions

### **1. Entity Repositories**
```php
// Pattern: [Entity]Repository
// Location: app/Features/[Feature]/Repositories/

✅ Correct Examples:
AccountRepository.php          // Account data access
TransactionRepository.php      // Transaction data access
UserRepository.php             // User data access
ProductRepository.php          // Product data access

❌ Incorrect Examples:
AccountRepo.php                // Don't abbreviate
AccountsRepository.php         // Use singular entity name
AccountDataRepository.php      // Don't add "Data"
```

### **2. Repository Interfaces**
```php
// Pattern: [Entity]RepositoryInterface
// Location: app/Contracts/Repositories/

✅ Correct Examples:
AccountRepositoryInterface.php
TransactionRepositoryInterface.php
UserRepositoryInterface.php

// Alternative pattern (shorter)
AccountRepositoryContract.php
TransactionRepositoryContract.php
```

---

## 🎭 Event and Listener Naming Conventions

### **1. Domain Events**
```php
// Pattern: [Entity][Action] (past tense)
// Location: app/Features/[Feature]/Events/

✅ Correct Examples:
AccountCreated.php             // Account was created
TransactionProcessed.php       // Transaction was processed
UserRegistered.php             // User was registered
OrderCompleted.php             // Order was completed
PaymentReceived.php            // Payment was received

❌ Incorrect Examples:
CreateAccount.php              // Use past tense: AccountCreated
ProcessTransaction.php         // Use past tense: TransactionProcessed
NewUser.php                    // Use UserRegistered
```

### **2. Event Listeners**
```php
// Pattern: [Action][Entity]Listener
// Location: app/Features/[Feature]/Listeners/

✅ Correct Examples:
SendAccountCreatedNotification.php    // Send notification when account created
UpdateInventoryOnOrderCompleted.php   // Update inventory when order completed
LogUserRegistration.php               // Log user registration
CalculateTaxOnTransactionProcessed.php // Calculate tax when transaction processed

❌ Incorrect Examples:
AccountCreatedListener.php     // Be more specific about action
NotifyAccountCreated.php       // Use "Send" prefix for notifications
```

---

## 🔌 Job and Queue Naming Conventions

### **1. Job Classes**
```php
// Pattern: [Action][Entity]Job
// Location: app/Jobs/ or app/Features/[Feature]/Jobs/

✅ Correct Examples:
ProcessTransactionJob.php      // Process a transaction
SendEmailNotificationJob.php   // Send email notification
GenerateReportJob.php          // Generate a report
SyncInventoryJob.php           // Sync inventory data
BackupDatabaseJob.php          // Backup database

❌ Incorrect Examples:
TransactionProcessor.php       // Use ProcessTransactionJob
EmailSender.php                // Use SendEmailNotificationJob
ReportGenerator.php            // Use GenerateReportJob
```

### **2. Queue Names**
```php
// Pattern: [purpose]-[priority] (kebab-case)

✅ Correct Examples:
'email-notifications'          // Email notifications queue
'report-generation'            // Report generation queue
'data-processing-high'         // High priority data processing
'background-tasks-low'         // Low priority background tasks

❌ Incorrect Examples:
'emails'                       // Too generic
'reports'                      // Too generic
'high_priority'                // Use kebab-case
```

---

## 🧪 Test Naming Conventions

### **1. Test Classes**
```php
// Pattern: [ClassBeingTested]Test
// Location: tests/Feature/ or tests/Unit/

✅ Correct Examples:
AccountingServiceTest.php      // Testing AccountingService
AccountControllerTest.php      // Testing AccountController
UserRegistrationTest.php       // Testing user registration flow

❌ Incorrect Examples:
TestAccountingService.php      // Don't prefix with "Test"
AccountingTest.php             // Be specific about what's being tested
```

### **2. Test Methods**
```php
// Pattern: test_[what_is_being_tested]_[expected_outcome]

✅ Correct Examples:
public function test_create_account_with_valid_data_returns_account()
public function test_process_transaction_with_insufficient_funds_throws_exception()
public function test_generate_report_with_date_range_returns_correct_data()

❌ Incorrect Examples:
public function testCreateAccount()           // Not descriptive enough
public function test_account_creation()       // Missing expected outcome
public function createAccountTest()           // Wrong naming pattern
```

---

## 🏷️ Variable and Method Naming Conventions

### **1. Method Names**
```php
// Pattern: camelCase, verb-based for actions, noun-based for getters

✅ Correct Examples:
public function createAccount(array $data): Account
public function processTransaction(Transaction $transaction): void
public function getAccountBalance(Account $account): Money
public function calculateTax(Transaction $transaction): Money
public function isAccountActive(Account $account): bool
public function hasPermission(User $user, string $permission): bool

❌ Incorrect Examples:
public function account_create()              // Use camelCase
public function processTransactionData()      // Be specific about what's processed
public function getBalance()                  // Be specific: getAccountBalance
public function calc_tax()                    // Don't abbreviate
```

### **2. Variable Names**
```php
// Pattern: camelCase, descriptive

✅ Correct Examples:
$accountBalance = $this->calculateBalance($account);
$transactionData = $request->validated();
$userPermissions = $this->getPermissions($user);
$organizationId = $request->input('organization_id');

❌ Incorrect Examples:
$bal = $this->calculateBalance($account);     // Don't abbreviate
$data = $request->validated();                // Too generic
$perms = $this->getPermissions($user);        // Don't abbreviate
$org_id = $request->input('organization_id'); // Use camelCase
```

### **3. Constants**
```php
// Pattern: SCREAMING_SNAKE_CASE

✅ Correct Examples:
const ACCOUNT_TYPE_ASSET = 'asset';
const TRANSACTION_STATUS_PENDING = 'pending';
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_CACHE_TTL = 3600;

❌ Incorrect Examples:
const accountTypeAsset = 'asset';             // Use SCREAMING_SNAKE_CASE
const ASSET = 'asset';                        // Be more descriptive
const MAX_RETRIES = 3;                        // Use MAX_RETRY_ATTEMPTS
```

---

## 📊 Database Naming Conventions

### **1. Table Names**
```php
// Pattern: snake_case, plural

✅ Correct Examples:
accounts                       // Account model
transactions                   // Transaction model
journal_entries               // JournalEntry model
user_permissions              // UserPermission model

❌ Incorrect Examples:
account                        // Should be plural
Accounts                       // Use snake_case
journalEntries                 // Use snake_case
user_permission                // Should be plural
```

### **2. Column Names**
```php
// Pattern: snake_case

✅ Correct Examples:
account_id
transaction_date
created_at
updated_at
organization_id
is_active
current_balance

❌ Incorrect Examples:
accountId                      // Use snake_case
transactionDate                // Use snake_case
createdAt                      // Use snake_case
orgId                          // Don't abbreviate
active                         // Use is_active for booleans
```

### **3. Foreign Key Names**
```php
// Pattern: [referenced_table_singular]_id

✅ Correct Examples:
user_id                        // References users table
account_id                     // References accounts table
organization_id                // References organizations table
parent_account_id              // References accounts table (self-reference)

❌ Incorrect Examples:
userId                         // Use snake_case
account                        // Add _id suffix
org_id                         // Don't abbreviate
```

---

## 🔧 Configuration and Environment

### **1. Configuration Keys**
```php
// Pattern: snake_case, hierarchical

✅ Correct Examples:
'accounting.default_currency'
'reporting.cache_ttl'
'integration.banking.api_key'
'notification.email.from_address'

❌ Incorrect Examples:
'accountingDefaultCurrency'    // Use snake_case
'reportCacheTTL'               // Use snake_case with hierarchy
'bankingApiKey'                // Use hierarchical structure
```

### **2. Environment Variables**
```php
// Pattern: SCREAMING_SNAKE_CASE

✅ Correct Examples:
ACCOUNTING_DEFAULT_CURRENCY=USD
REPORTING_CACHE_TTL=3600
BANKING_API_KEY=your_key_here
EMAIL_FROM_ADDRESS=noreply@example.com

❌ Incorrect Examples:
accountingDefaultCurrency=USD  // Use SCREAMING_SNAKE_CASE
REPORT_CACHE=3600              // Be more descriptive
API_KEY=your_key_here          // Be specific: BANKING_API_KEY
```

---

## 📋 Validation and Form Requests

### **1. Form Request Classes**
```php
// Pattern: [Action][Entity]Request
// Location: app/Http/Requests/ or app/Features/[Feature]/Requests/

✅ Correct Examples:
CreateAccountRequest.php       // Create account validation
UpdateTransactionRequest.php   // Update transaction validation
StoreUserRequest.php           // Store user validation
DeleteProductRequest.php       // Delete product validation

❌ Incorrect Examples:
AccountRequest.php             // Be specific about action
AccountCreateRequest.php       // Use CreateAccountRequest
NewAccountRequest.php          // Use CreateAccountRequest
```

### **2. Validation Rule Names**
```php
// Pattern: snake_case, descriptive

✅ Correct Examples:
'account_code' => 'required|string|max:20|unique:accounts'
'transaction_amount' => 'required|numeric|min:0.01'
'organization_id' => 'required|exists:organizations,id'
'is_active' => 'boolean'

❌ Incorrect Examples:
'accountCode' => '...'          // Use snake_case
'amount' => '...'               // Be specific: transaction_amount
'org_id' => '...'               // Don't abbreviate
'active' => '...'               // Use is_active for booleans
```

---

## 🎯 Implementation Checklist

### **Phase 1: Documentation and Standards**
- [ ] Review and approve naming conventions
- [ ] Create code style configuration files
- [ ] Update IDE/editor configurations
- [ ] Create naming convention quick reference

### **Phase 2: Existing Code Analysis**
- [ ] Audit existing code for naming violations
- [ ] Prioritize violations by impact and effort
- [ ] Create migration plan for critical violations
- [ ] Document exceptions and legacy considerations

### **Phase 3: Gradual Implementation**
- [ ] Apply conventions to all new code
- [ ] Refactor high-impact violations
- [ ] Update tests to follow conventions
- [ ] Update documentation and comments

### **Phase 4: Enforcement and Maintenance**
- [ ] Set up automated code style checking
- [ ] Create pre-commit hooks for validation
- [ ] Update code review guidelines
- [ ] Train team on new conventions

---

## 🚀 Benefits of Consistent Naming

### **1. Developer Experience**
- **Faster Navigation**: Predictable names make code easier to find
- **Reduced Cognitive Load**: Consistent patterns reduce mental overhead
- **Improved Onboarding**: New developers can quickly understand the codebase

### **2. Code Quality**
- **Better Readability**: Self-documenting code reduces need for comments
- **Easier Maintenance**: Consistent patterns make changes more predictable
- **Reduced Bugs**: Clear names reduce misunderstandings and errors

### **3. Team Collaboration**
- **Shared Understanding**: Common vocabulary improves communication
- **Code Reviews**: Consistent patterns make reviews more effective
- **Knowledge Transfer**: Easier to share knowledge between team members

### **4. Long-term Maintainability**
- **Scalability**: Consistent patterns support codebase growth
- **Refactoring**: Predictable names make large-scale changes safer
- **Documentation**: Self-documenting code reduces documentation burden

---

## 📊 Naming Convention Quick Reference

### **File Types**
| Component | Pattern | Example |
|-----------|---------|---------|
| Controller | `[Feature]Controller.php` | `AccountingController.php` |
| Service | `[Domain][Purpose]Service.php` | `BudgetManagementService.php` |
| Model | `[Entity].php` | `Account.php` |
| Middleware | `[Verb][Entity].php` | `AuthenticateTenant.php` |
| Repository | `[Entity]Repository.php` | `AccountRepository.php` |
| Event | `[Entity][Action].php` | `AccountCreated.php` |
| Listener | `[Action][Entity]Listener.php` | `SendAccountCreatedNotification.php` |
| Job | `[Action][Entity]Job.php` | `ProcessTransactionJob.php` |
| Request | `[Action][Entity]Request.php` | `CreateAccountRequest.php` |

### **Method Types**
| Purpose | Pattern | Example |
|---------|---------|---------|
| Create | `create[Entity]()` | `createAccount()` |
| Update | `update[Entity]()` | `updateAccount()` |
| Delete | `delete[Entity]()` | `deleteAccount()` |
| Get Single | `get[Entity]()` | `getAccount()` |
| Get Multiple | `get[Entities]()` | `getAccounts()` |
| Find | `find[Entity]()` | `findAccount()` |
| Check Boolean | `is[Condition]()` | `isAccountActive()` |
| Check Boolean | `has[Condition]()` | `hasPermission()` |
| Calculate | `calculate[Value]()` | `calculateBalance()` |
| Process | `process[Entity]()` | `processTransaction()` |

---

**Last Updated**: 2024-10-16  
**Status**: Ready for Implementation  
**Next Review**: After team approval and initial implementation

