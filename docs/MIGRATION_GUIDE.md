# Migration Guide - Structure Simplification

## 🎯 **Overview**

This guide helps developers migrate from the old complex structure to the new simplified architecture. All functionality remains the same, but with improved organization and naming.

## 📁 **Directory Changes**

### **Backend Structure Changes**

#### **Old Structure → New Structure**
```
OLD                                    NEW
app/Features/Accounting/              → app/Domain/Accounting/
app/Features/Dashboard/               → app/Domain/Dashboard/
app/Features/Inventory/               → app/Domain/Inventory/
app/Broadcasting/                     → app/Infrastructure/Broadcasting/
app/GraphQL/Cache/                    → app/Infrastructure/Cache/
app/Shared/Services/                  → app/Services/Core/
```

#### **Import Changes (PHP)**
```php
// OLD
use App\Features\Accounting\Services\AccountingService;
use App\Broadcasting\ConnectionLimiter;
use App\GraphQL\Cache\QueryCache;

// NEW
use App\Domain\Accounting\Services\AccountingService;
use App\Infrastructure\Broadcasting\ConnectionLimiter;
use App\Infrastructure\Cache\QueryCache;
```

### **Frontend Structure Changes**

#### **Old Structure → New Structure**
```
OLD                                    NEW
resources/js/shared/hooks/            → resources/js/core/hooks/
resources/js/shared/services/         → resources/js/core/services/
resources/js/shared/utils/            → resources/js/core/utils/
resources/js/shared/components/       → resources/js/ui/components/
resources/js/icons/LiveIcons.tsx      → resources/js/ui/icons/Icons.tsx
resources/js/animations/              → resources/js/ui/animations/
```

#### **Import Changes (TypeScript)**
```typescript
// OLD
import { LiveIcons } from '@/icons/LiveIcons';
import { useRealtimeWithRetry } from '@/shared/hooks/useRealtimeWithRetry';
import { GraphQLService } from '@/shared/services/graphql';

// NEW
import { Icons } from '@/ui/icons/Icons';
import { useRealtimeWithRetry } from '@/core/hooks/useRealtimeWithRetry';
import { GraphQLService } from '@/core/services/graphql';
```

## 🏷️ **Naming Changes**

### **Component Naming**
```typescript
// OLD
import { LiveHomeIcon, LiveChevronLeftIcon } from '@/icons/LiveIcons';

// NEW
import { HomeIcon, ChevronLeftIcon } from '@/ui/icons/Icons';
```

### **Hook Naming**
```typescript
// OLD
import { useRealTime, useRealtimeWithRetry } from '@/hooks';

// NEW (Consolidated)
import { useRealtimeData, useData } from '@/core/hooks/useData';
```

### **Service Naming**
```php
// OLD
class AccountingService extends BaseService
{
    // Implementation
}

// NEW (Using unified base)
class AccountingService extends \App\Services\Core\BaseService
{
    // Simplified implementation
}
```

## 🔧 **API Changes**

### **Unified Data Hooks**

#### **Before (Multiple Hooks)**
```typescript
// OLD - Multiple different hooks
import { useGraphQL } from '@/hooks/useGraphQL';
import { useRealtime } from '@/hooks/useRealtime';
import { useOptimizedGraphQL } from '@/hooks/useOptimizedGraphQL';

const { data: transactions } = useGraphQL(GET_TRANSACTIONS);
const { connected } = useRealtime('transactions');
const { data: optimized } = useOptimizedGraphQL(GET_OPTIMIZED_DATA);
```

#### **After (Unified Hook)**
```typescript
// NEW - Single unified hook
import { useData, useRealtimeData, useCombinedData } from '@/core/hooks/useData';

// Simple data fetching
const { data: transactions, loading, error } = useData(GET_TRANSACTIONS);

// Real-time data
const { data: liveTransactions } = useRealtimeData(
  GET_TRANSACTIONS, 
  TRANSACTION_UPDATES
);

// Combined query + subscription + mutations
const { data, mutations, subscriptionData } = useCombinedData(GET_TRANSACTIONS, {
  subscription: TRANSACTION_UPDATES,
  mutations: {
    create: CREATE_TRANSACTION,
    update: UPDATE_TRANSACTION
  }
});
```

### **Simplified Service Pattern**

#### **Before (Complex Services)**
```php
// OLD - Complex service with lots of boilerplate
class AccountingService
{
    public function findTransaction($id)
    {
        return Transaction::find($id);
    }
    
    public function getAllTransactions($filters = [])
    {
        $query = Transaction::query();
        // Complex filtering logic...
        return $query->get();
    }
    
    public function createTransaction($data)
    {
        // Validation logic...
        return Transaction::create($data);
    }
    
    // More repetitive methods...
}
```

#### **After (Unified Base Service)**
```php
// NEW - Simplified with base service
class AccountingService extends BaseService
{
    public function __construct()
    {
        parent::__construct(new Transaction());
    }
    
    // All basic CRUD operations inherited from BaseService
    // find(), findAll(), create(), update(), delete(), paginate()
    
    // Only custom business logic needed
    public function calculateBalance($accountId)
    {
        // Custom business logic
    }
}
```

## 🎨 **Component Migration**

### **Icon System Migration**

#### **Before**
```tsx
// OLD - Complex LiveIcons system
import { LiveHomeIcon, LiveChevronLeftIcon, LiveStatus } from '@/icons/LiveIcons';

<LiveHomeIcon size="lg" animated={true} />
<LiveStatus connected={connected} loading={loading} />
```

#### **After**
```tsx
// NEW - Simplified Icons system
import { HomeIcon, ChevronLeftIcon, StatusIcon } from '@/ui/icons/Icons';

<HomeIcon size="lg" animated={true} />
<StatusIcon connected={connected} loading={loading} />
```

### **Animation System Migration**

#### **Before**
```tsx
// OLD - Complex animation imports
import { useAnimation } from '@/shared/animations/utils';
import { transitions } from '@/animations/transitions';

const { highlightUpdate } = useAnimation();
```

#### **After**
```tsx
// NEW - Simplified animation system
import { useAnimation, transitions } from '@/ui/animations/transitions';

const { highlightUpdate } = useAnimation();
```

## 📚 **Documentation Migration**

### **Old Documentation Structure**
```
docs/
├── BACKEND_REORGANIZATION_STRATEGY.md
├── FRONTEND_ANALYSIS_AND_REORGANIZATION.md
├── COMPONENT_PATTERNS.md
├── API_STANDARDIZATION_GUIDE.md
├── ICONS_SYSTEM.md
├── integration-architecture.md
├── realtime-setup.md
└── ... (20+ scattered files)
```

### **New Documentation Structure**
```
docs/
├── architecture/
│   ├── BACKEND.md
│   ├── FRONTEND.md
│   └── REALTIME.md
├── features/
│   ├── accounting.md
│   ├── inventory.md
│   └── dashboard.md
├── api/
│   ├── graphql.md
│   └── rest.md
└── development/
    ├── setup.md
    ├── testing.md
    └── deployment.md
```

## 🚀 **Migration Steps**

### **Step 1: Update Imports**
1. **Backend**: Update all `use` statements to new namespaces
2. **Frontend**: Update all `import` statements to new paths
3. **Tests**: Update test imports and references

### **Step 2: Rename Components**
1. **Icons**: Replace `LiveIcons` with `Icons`
2. **Hooks**: Use unified `useData` hooks
3. **Services**: Extend new `BaseService`

### **Step 3: Update Configuration**
1. **Webpack/Vite**: Update path aliases
2. **TypeScript**: Update path mappings
3. **IDE**: Update project settings

### **Step 4: Test Everything**
1. **Unit Tests**: Ensure all tests pass
2. **Integration Tests**: Verify API functionality
3. **E2E Tests**: Test complete user flows

## ⚠️ **Breaking Changes**

### **Removed Components**
- `LiveIcons` → Use `Icons` instead
- Multiple GraphQL hooks → Use unified `useData` hooks
- Complex service patterns → Use `BaseService`

### **Changed APIs**
- Icon component props remain the same
- Hook return values are consistent
- Service methods are standardized

### **Deprecated Patterns**
- Direct feature imports (use domain imports)
- Multiple hook patterns (use unified hooks)
- Complex service inheritance (use BaseService)

## 🔄 **Backward Compatibility**

### **Temporary Aliases**
During migration, temporary aliases are available:

```typescript
// Temporary aliases (will be removed in future version)
export { Icons as LiveIcons } from '@/ui/icons/Icons';
export { useData as useGraphQL } from '@/core/hooks/useData';
```

### **Deprecation Warnings**
Old imports will show deprecation warnings:
```
Warning: LiveIcons is deprecated. Use Icons from @/ui/icons/Icons instead.
```

## ✅ **Migration Checklist**

### **Backend Migration**
- [ ] Update all `use` statements
- [ ] Move files to new directory structure
- [ ] Update service inheritance
- [ ] Update configuration files
- [ ] Run tests to verify functionality

### **Frontend Migration**
- [ ] Update all `import` statements
- [ ] Replace `LiveIcons` with `Icons`
- [ ] Use unified data hooks
- [ ] Update path aliases
- [ ] Run tests and build

### **Documentation Migration**
- [ ] Consolidate scattered documentation
- [ ] Update all references
- [ ] Create new structure
- [ ] Remove outdated files

### **Testing**
- [ ] All unit tests pass
- [ ] Integration tests work
- [ ] E2E tests complete
- [ ] Performance is maintained
- [ ] No functionality lost

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Import Errors**
```
Error: Cannot resolve module '@/shared/hooks/useGraphQL'
```
**Solution**: Update to `@/core/hooks/useData`

#### **Component Not Found**
```
Error: LiveHomeIcon is not exported
```
**Solution**: Use `HomeIcon` from `@/ui/icons/Icons`

#### **Service Errors**
```
Error: Class not found App\Features\Accounting\Services\AccountingService
```
**Solution**: Update to `App\Domain\Accounting\Services\AccountingService`

### **Migration Support**
- Check the [ARCHITECTURE.md](./ARCHITECTURE.md) for new structure
- Review [SIMPLIFICATION_STANDARDS.md](./SIMPLIFICATION_STANDARDS.md) for conventions
- Create issues for migration problems

---

*This migration maintains 100% functionality while providing a cleaner, more maintainable structure.*
