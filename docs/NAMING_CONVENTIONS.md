# Frontend Naming Conventions

## Overview
This document establishes simplified naming conventions for the Laravel Account Platform frontend to improve code readability, maintainability, and developer experience.

## Core Principles

### 1. **Brevity Over Verbosity**
- Prefer short, clear names over long descriptive ones
- Remove redundant prefixes when context is clear
- Use common abbreviations when widely understood

### 2. **Context-Aware Naming**
- Component names should be clear within their module context
- Avoid repeating module/feature names in component names
- Use folder structure to provide context

### 3. **Consistency**
- Follow established patterns across the codebase
- Use consistent naming for similar concepts
- Maintain TypeScript naming conventions

## Naming Rules

### Components

#### ✅ **DO**
```typescript
// Within accounting feature
Dashboard.tsx          // instead of AccountingDashboard.tsx
Accounts.tsx          // instead of ChartOfAccounts.tsx
Transactions.tsx      // instead of TransactionManagement.tsx
Reports.tsx           // instead of FinancialReporting.tsx

// Within organization feature
Users.tsx             // instead of UserManagement.tsx
Settings.tsx          // instead of OrganizationSettings.tsx
```

#### ❌ **DON'T**
```typescript
// Verbose, redundant prefixes
AccountingDashboard.tsx
UserManagementComponent.tsx
FinancialReportingSystem.tsx
```

### Hooks

#### ✅ **DO**
```typescript
// Simplified hook names
useDashboard()        // instead of useRealtimeDashboard()
useAccounting()       // instead of useAccountingDashboard()
useAccounts()         // instead of useChartOfAccounts()
useBuilder()          // instead of useReportBuilder()
useFinance()          // instead of useFinancialData()
```

#### ❌ **DON'T**
```typescript
// Verbose hook names
useRealtimeDashboardData()
useAccountingDashboardState()
useChartOfAccountsManagement()
```

### Interfaces & Types

#### ✅ **DO**
```typescript
// Simplified interface names
interface DashboardProps {}     // instead of AccountingDashboardProps
interface AccountsProps {}      // instead of ChartOfAccountsProps
interface BuilderOptions {}     // instead of UseReportBuilderOptions
interface BuilderReturn {}      // instead of UseReportBuilderReturn

// Type names
type UserRole = 'admin' | 'user';
type StockLevel = 'high' | 'low';
```

#### ❌ **DON'T**
```typescript
// Verbose interface names
interface AccountingDashboardComponentProps {}
interface ChartOfAccountsManagementProps {}
interface UseReportBuilderConfigurationOptions {}
```

### Files & Directories

#### ✅ **DO**
```
features/
├── accounting/
│   ├── components/
│   │   ├── Dashboard.tsx      // instead of AccountingDashboard.tsx
│   │   ├── Accounts.tsx       // instead of ChartOfAccounts.tsx
│   │   └── Reports.tsx        // instead of FinancialReporting.tsx
│   └── hooks/
│       ├── useDashboard.ts    // instead of useRealtimeDashboard.ts
│       └── useAccounts.ts     // instead of useChartOfAccounts.ts
```

#### ❌ **DON'T**
```
features/
├── accounting/
│   ├── components/
│   │   ├── AccountingDashboardComponent.tsx
│   │   ├── ChartOfAccountsManagement.tsx
│   │   └── FinancialReportingSystem.tsx
```

### API & Service Methods

#### ✅ **DO**
```typescript
// Simplified API method names
getAccounts()         // instead of getChartOfAccounts()
getTransactions()     // instead of getTransactionHistory()
updateAccount()       // instead of updateAccountInformation()
```

#### ❌ **DON'T**
```typescript
// Verbose API method names
getChartOfAccountsData()
getTransactionHistoryWithFilters()
updateAccountInformationAndMetadata()
```

## Migration Strategy

### Phase 1: New Code
- All new components, hooks, and interfaces follow simplified conventions
- Update imports as new simplified components are created

### Phase 2: Existing Code
- Rename components one module at a time
- Update all import statements and references
- Maintain backward compatibility during transition

### Phase 3: Validation
- Run TypeScript compilation to catch missed references
- Update tests and documentation
- Verify all imports resolve correctly

## Common Abbreviations

| Full Term | Abbreviation | Usage |
|-----------|--------------|-------|
| Dashboard | Dash | When context is clear |
| Transaction | Txn | In technical contexts |
| Account | Acc | When space is limited |
| Organization | Org | Common abbreviation |
| Configuration | Config | Technical contexts |
| Authentication | Auth | Standard abbreviation |
| Administration | Admin | Standard abbreviation |

## Examples

### Before (Verbose)
```typescript
// Component
export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({ ... }) => {
  const { data } = useRealtimeDashboard();
  const accounts = useChartOfAccounts();
  // ...
};

// Hook
export function useRealtimeDashboard(): UseRealtimeDashboardReturn {
  // ...
}

// Interface
interface AccountingDashboardProps {
  organizationId: number;
  showChartOfAccounts: boolean;
}
```

### After (Simplified)
```typescript
// Component
export const Dashboard: React.FC<DashboardProps> = ({ ... }) => {
  const { data } = useDashboard();
  const accounts = useAccounts();
  // ...
};

// Hook
export function useDashboard(): DashboardReturn {
  // ...
}

// Interface
interface DashboardProps {
  organizationId: number;
  showAccounts: boolean;
}
```

## Benefits

1. **Improved Readability**: Shorter names are easier to scan and understand
2. **Reduced Cognitive Load**: Less verbose names reduce mental overhead
3. **Better IDE Experience**: Shorter names improve autocomplete and navigation
4. **Consistent Patterns**: Standardized naming improves code predictability
5. **Easier Refactoring**: Simpler names are easier to search and replace

## Implementation Notes

- Use IDE refactoring tools when possible to ensure all references are updated
- Update import statements systematically
- Maintain a migration log to track renamed components
- Test thoroughly after each batch of renames
- Update documentation and examples with new names
