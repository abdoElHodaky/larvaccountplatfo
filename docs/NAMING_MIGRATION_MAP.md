# Naming Migration Map

This document tracks the renaming of components, hooks, interfaces, and files during the frontend naming simplification process.

## Components

### Accounting Feature

| Before | After | Status | Files Updated |
|--------|-------|--------|---------------|
| `AccountingDashboard` | `Dashboard` | 🔄 Pending | - |
| `ChartOfAccounts` | `Accounts` | 🔄 Pending | - |
| `TransactionManagement` | `Transactions` | 🔄 Pending | - |
| `FinancialReporting` | `Reports` | 🔄 Pending | - |

### Organization Feature

| Before | After | Status | Files Updated |
|--------|-------|--------|---------------|
| `UserManagement` | `Users` | 🔄 Pending | - |
| `OrganizationSettings` | `Settings` | 🔄 Pending | - |

### Reporting Feature

| Before | After | Status | Files Updated |
|--------|-------|--------|---------------|
| `ReportBuilder` | `Builder` | 🔄 Pending | - |
| `FinancialReporting` | `Reports` | 🔄 Pending | - |

## Hooks

### Accounting Hooks

| Before | After | Status | Files Updated |
|--------|-------|--------|---------------|
| `useRealtimeDashboard` | `useDashboard` | 🔄 Pending | - |
| `useRealtimeAccounting` | `useAccounting` | 🔄 Pending | - |
| `useChartOfAccounts` | `useAccounts` | 🔄 Pending | - |
| `useReportBuilder` | `useBuilder` | 🔄 Pending | - |
| `useFinancialData` | `useFinance` | 🔄 Pending | - |
| `useAccountData` | `useAccountData` | ✅ Keep | No change needed |

### Socket Hooks

| Before | After | Status | Files Updated |
|--------|-------|--------|---------------|
| `useRealtimeDashboard` | `useDashboard` | 🔄 Pending | - |
| `useRealtimeAccounting` | `useAccounting` | 🔄 Pending | - |

## Interfaces & Types

### Component Props

| Before | After | Status | Files Updated |
|--------|-------|--------|---------------|
| `AccountingDashboardProps` | `DashboardProps` | 🔄 Pending | - |
| `ChartOfAccountsProps` | `AccountsProps` | 🔄 Pending | - |
| `UserManagementProps` | `UsersProps` | 🔄 Pending | - |

### Hook Return Types

| Before | After | Status | Files Updated |
|--------|-------|--------|---------------|
| `UseReportBuilderOptions` | `BuilderOptions` | 🔄 Pending | - |
| `UseReportBuilderReturn` | `BuilderReturn` | 🔄 Pending | - |

## Files

### Component Files

| Before | After | Status | Dependencies |
|--------|-------|--------|--------------|
| `AccountingDashboard.tsx` | `Dashboard.tsx` | 🔄 Pending | Update imports in pages, tests |
| `ChartOfAccounts.tsx` | `Accounts.tsx` | 🔄 Pending | Update imports in pages, tests |
| `UserManagement.tsx` | `Users.tsx` | 🔄 Pending | Update imports in pages, tests |

### Hook Files

| Before | After | Status | Dependencies |
|--------|-------|--------|--------------|
| `useReportBuilder.ts` | `useBuilder.ts` | 🔄 Pending | Update imports in components |
| `useFinancialData.ts` | `useFinance.ts` | 🔄 Pending | Update imports in components |

## API Methods

### Accounting API

| Before | After | Status | Files Updated |
|--------|-------|--------|---------------|
| `getChartOfAccounts` | `getAccounts` | 🔄 Pending | - |
| `GetChartOfAccounts` (GraphQL) | `GetAccounts` | 🔄 Pending | - |

## Test Files

| Before | After | Status | Dependencies |
|--------|-------|--------|--------------|
| `UserManagement.test.tsx` | `Users.test.tsx` | 🔄 Pending | Update component imports |
| `useSocket.test.ts` | `useSocket.test.ts` | 🔄 Pending | Update hook names in tests |

## Migration Progress

### Phase 1: Documentation ✅
- [x] Create naming conventions guide
- [x] Create migration map
- [x] Define naming rules and examples

### Phase 2: Components 🔄
- [ ] Rename AccountingDashboard → Dashboard
- [ ] Rename ChartOfAccounts → Accounts
- [ ] Rename UserManagement → Users
- [ ] Update all component imports

### Phase 3: Hooks 🔄
- [ ] Rename useRealtimeDashboard → useDashboard
- [ ] Rename useChartOfAccounts → useAccounts
- [ ] Rename useReportBuilder → useBuilder
- [ ] Update all hook imports

### Phase 4: Interfaces 🔄
- [ ] Rename component prop interfaces
- [ ] Rename hook return type interfaces
- [ ] Update all interface references

### Phase 5: API Methods 🔄
- [ ] Rename API method names
- [ ] Rename GraphQL query names
- [ ] Update all API calls

### Phase 6: Tests & Documentation 🔄
- [ ] Update test file names
- [ ] Update test descriptions and imports
- [ ] Update documentation examples
- [ ] Update README files

### Phase 7: Validation 🔄
- [ ] Run TypeScript compilation
- [ ] Run test suites
- [ ] Verify all imports resolve
- [ ] Test key user flows

## Notes

- **Breaking Changes**: All renames are breaking changes and require careful coordination
- **IDE Support**: Use IDE refactoring tools when possible to ensure all references are updated
- **Testing**: Test thoroughly after each batch of renames
- **Documentation**: Update all documentation and examples with new names

## Status Legend

- ✅ **Complete**: Renaming finished and tested
- 🔄 **Pending**: Scheduled for renaming
- ⚠️ **Blocked**: Waiting for dependencies or approval
- ❌ **Skipped**: Decided not to rename

## Risk Assessment

### High Risk
- API method renames (may affect backend integration)
- GraphQL query renames (affects caching)
- Core component renames (many dependencies)

### Medium Risk
- Hook renames (localized usage)
- Interface renames (compile-time checking)

### Low Risk
- Test file renames
- Documentation updates
- Internal utility renames
