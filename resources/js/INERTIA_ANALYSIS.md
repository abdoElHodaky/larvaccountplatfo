# Inertia.js Dependency Analysis & Component Reorganization Plan

## 📊 Current Inertia.js Usage Analysis

### Total Files Using @inertiajs/react: 27 files

## 🔴 Core Infrastructure (Keep Inertia.js) - 2 files
**High coupling with routing/SSR - DO NOT MIGRATE**

| File | Imports | Usage Pattern | Migration Risk |
|------|---------|---------------|----------------|
| `app.tsx` | `createInertiaApp` | App initialization | ❌ CRITICAL - Core entry point |
| `ssr.tsx` | `createInertiaApp` | Server-side rendering | ❌ CRITICAL - SSR setup |

## 🟡 Navigation Layer (High Migration Complexity) - 6 files
**Tightly coupled to Inertia routing - Complex migration required**

| File | Imports | Usage Pattern | Migration Complexity |
|------|---------|---------------|---------------------|
| `shared/components/AnimatedSidebar.tsx` | `Link, usePage` | Navigation + page context | 🔴 HIGH - Route awareness |
| `shared/components/organisms/Sidebar.tsx` | `Link, usePage` | Navigation + active state | 🔴 HIGH - Route awareness |
| `shared/components/organisms/TopBar.tsx` | `Link, usePage` | Navigation + user context | 🔴 HIGH - Route awareness |
| `shared/components/organisms/Breadcrumbs.tsx` | `Link, usePage` | Dynamic breadcrumbs | 🔴 HIGH - Route parsing |
| `shared/components/organisms/InertiaModal/InertiaModal.tsx` | `router` | Modal navigation | 🔴 HIGH - Router integration |
| `features/organization/components/molecules/TenantSwitcher.tsx` | `Link, router` | Tenant switching | 🔴 HIGH - Route manipulation |

## 🟢 Feature Pages (Medium Complexity) - 16 files
**Form handling + navigation - Moderate migration effort**

### Auth Pages (4 files)
| File | Imports | Usage Pattern | Migration Priority |
|------|---------|---------------|-------------------|
| `features/auth/pages/Login.tsx` | `Head, Link, useForm` | Form + navigation | 🟡 MEDIUM - Form abstraction needed |
| `features/auth/pages/Register.tsx` | `Head, Link, useForm` | Form + navigation | 🟡 MEDIUM - Form abstraction needed |
| `features/auth/pages/ForgotPassword.tsx` | `Head, useForm` | Form only | 🟢 LOW - Simple form |
| `features/auth/pages/ResetPassword.tsx` | `Head, useForm` | Form only | 🟢 LOW - Simple form |
| `features/auth/pages/TenantSelect.tsx` | `Head, Link, useForm` | Form + navigation | 🟡 MEDIUM - Tenant logic |

### Dashboard Pages (3 files)
| File | Imports | Usage Pattern | Migration Priority |
|------|---------|---------------|-------------------|
| `features/dashboard/pages/Dashboard.tsx` | `Head` | Metadata only | 🟢 LOW - Head replacement |
| `features/accounting/pages/Dashboard.tsx` | `Head` | Metadata only | 🟢 LOW - Head replacement |
| `features/sales/pages/Dashboard.tsx` | `Head, Link` | Metadata + navigation | 🟢 LOW - Simple links |

### Accounting Pages (5 files)
| File | Imports | Usage Pattern | Migration Priority |
|------|---------|---------------|-------------------|
| `features/accounting/pages/Accounts/Create.tsx` | `Head, Link, useForm` | Form + navigation | 🟡 MEDIUM - Form abstraction |
| `features/accounting/pages/Accounts/Index.tsx` | `Head, Link, router` | List + navigation | 🟡 MEDIUM - Router usage |
| `features/accounting/pages/Accounts/Show.tsx` | `Head, Link` | Display + navigation | 🟢 LOW - Simple links |
| `features/accounting/pages/JournalEntries/Index.tsx` | `Head, Link, router` | List + navigation | 🟡 MEDIUM - Router usage |
| `features/accounting/pages/Transactions/Index.tsx` | `Head, Link, router` | List + navigation | 🟡 MEDIUM - Router usage |

### Other Feature Pages (4 files)
| File | Imports | Usage Pattern | Migration Priority |
|------|---------|---------------|-------------------|
| `features/inventory/pages/Dashboard.tsx` | `Head, Link` | Metadata + navigation | 🟢 LOW - Simple links |
| `features/inventory/pages/ProductDetail.tsx` | `Head, Link` | Display + navigation | 🟢 LOW - Simple links |
| `features/organization/pages/Index.tsx` | `Head, Link` | Display + navigation | 🟢 LOW - Simple links |

## ⚪ Utility Layer (Low Complexity) - 3 files
**Abstraction layer - Easy to migrate**

| File | Imports | Usage Pattern | Migration Priority |
|------|---------|---------------|-------------------|
| `shared/hooks/useInertiaForm.ts` | `useForm, router` | Form abstraction | 🟢 LOW - Already abstracted |
| `features/accounting/components/AccountForm.tsx` | `useForm` | Form component | 🟢 LOW - Component level |
| `shared/components/layouts/AuthLayout.tsx` | `Link` | Layout navigation | 🟡 MEDIUM - Layout dependency |

## 📈 Migration Priority Matrix

### Phase 1: Low-Risk Migrations (9 files)
**Start here - minimal coupling**
- Dashboard pages using only `Head`
- Display pages with simple `Link` usage
- Components with isolated `useForm` usage

### Phase 2: Medium-Risk Migrations (8 files)
**Requires form abstraction layer**
- Auth pages with form handling
- CRUD pages with router usage
- Layout components

### Phase 3: High-Risk Migrations (6 files)
**Complex routing integration**
- Navigation components
- Modal systems
- Tenant switching logic

### Phase 4: Core Infrastructure (2 files)
**Keep as-is - critical for app functionality**
- Entry points and SSR setup

## 🔧 Component Usage Analysis

### Shared Components Import Patterns
Found 76+ files importing from shared directories, indicating:
- Heavy usage of shared component library
- Good separation of concerns already established
- Atomic design pattern partially implemented

### Key Shared Components Categories:
1. **Atoms**: Button, Input, Label components
2. **Molecules**: FormInput, FormSelect, Container components  
3. **Organisms**: Sidebar, TopBar, Breadcrumbs, Modal systems
4. **Layouts**: AuthLayout, AppLayout
5. **Utilities**: Hooks, services, formatters

## 🎯 Recommended Migration Strategy

### 1. Create Abstraction Layers
- Enhanced `useForm` hook supporting multiple backends
- Router abstraction for navigation
- Head/Meta component abstraction

### 2. Start with Low-Risk Components
- Replace `Head` with React Helmet or similar
- Convert simple `Link` usage to standard anchors
- Migrate isolated form components

### 3. Build Progressive Enhancement
- Maintain Inertia.js for complex routing
- Gradually replace form handling
- Keep navigation components until last

### 4. Maintain Backward Compatibility
- Support both Inertia and standard React patterns
- Use feature flags for gradual rollout
- Comprehensive testing at each phase

## 📋 Next Steps

1. ✅ **Dependency Analysis Complete**
2. 🔄 **Create Form Abstraction Layer**
3. 🔄 **Identify React.Fragment Opportunities**
4. 🔄 **Start Low-Risk Migrations**
5. ⏳ **Component Usage Matrix**
6. ⏳ **Bundle Optimization Analysis**

---
*Generated: $(date)*
*Total Inertia.js files analyzed: 27*
*Migration complexity assessed: 4 tiers*

