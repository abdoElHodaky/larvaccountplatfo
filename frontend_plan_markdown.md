# Accounting Platform - Frontend Architecture Plan
## Vue 3 + Inertia.js with Modern UI/UX

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Technology Selection](#technology-selection)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Core Features & Components](#core-features--components)
6. [State Management](#state-management)
7. [UI/UX Design System](#uiux-design-system)
8. [Module-Based Pages](#module-based-pages)
9. [Implementation Guide](#implementation-guide)
10. [Performance Optimization](#performance-optimization)
11. [Testing Strategy](#testing-strategy)
12. [Deployment](#deployment)

---

## 🎯 Overview

A modern, responsive, and performant **Single Page Application (SPA)** built with **Vue 3 Composition API** and **Inertia.js**, providing seamless integration with Laravel Modular backend without building traditional REST APIs.

### Key Highlights
- **Zero API Layer**: Direct Laravel controller → Vue component rendering
- **SPA Experience**: Fast navigation with no full page reloads
- **Server-Side Routing**: Laravel handles routing, Vue handles rendering
- **Type Safety**: TypeScript support for better developer experience
- **Modern UI**: TailwindCSS with custom design system
- **Responsive Design**: Mobile-first approach, PWA support

---

## 🔧 Technology Selection

### Recommended Stack: Vue 3 + Inertia.js ✅

| Technology | Purpose | Why? |
|------------|---------|------|
| **Vue 3** | Frontend Framework | Composition API, Reactivity, Easy learning curve |
| **Inertia.js** | SPA Adapter | No API needed, Server-driven, Seamless Laravel integration |
| **Pinia** | State Management | Official Vue store, TypeScript support, DevTools |
| **TailwindCSS** | Styling | Utility-first, Customizable, Great DX |
| **Vite** | Build Tool | Fast HMR, Modern bundling, Optimized builds |
| **TypeScript** | Type Safety | Better DX, Catch errors early, IDE support |
| **Headless UI** | Component Library | Accessible, Unstyled, Customizable |
| **Chart.js / ApexCharts** | Data Visualization | Beautiful charts, Interactive, Responsive |

### Why Vue 3 + Inertia.js for Laravel Modular?

✅ **Perfect Integration**: Built specifically for Laravel  
✅ **No API Layer**: Direct module → component communication  
✅ **Shared Validation**: Use same Laravel validation rules  
✅ **CSRF Protection**: Automatic handling  
✅ **Fast Development**: Less boilerplate, more productivity  
✅ **SEO Friendly**: Server-side rendering with Inertia SSR  
✅ **Module-Based**: Easily map to backend modules  

### Alternative Options Comparison

| Framework | Pros | Cons | Best For |
|-----------|------|------|----------|
| **Vue 3 + Inertia** ✅ | No API, Fast dev, Laravel native | Coupled to Laravel | Laravel apps, Rapid dev |
| **React + Next.js** | SSR/SSG, Large ecosystem, Mobile reuse | Requires API, More complex | SEO critical, Mobile apps |
| **Nuxt 3** | SSR/SSG, Auto-imports, Great DX | Requires API | Vue fans, Modern SSR |
| **Angular** | Enterprise-ready, Strong typing | Steep curve, Heavier | Large teams, Complex apps |
| **Svelte + SvelteKit** | Smallest bundle, Best performance | Smaller ecosystem | Performance-critical |

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Vue 3 Application (SPA)                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │  Pinia     │  │ Components │  │  Inertia   │    │  │
│  │  │  Store     │  │            │  │   Client   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ▼
                    HTTP Request (XHR)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Laravel Backend                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Inertia Middleware                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Module Controllers                           │  │
│  │  Accounting | Invoice | Banking | Reporting          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Returns JSON Props                      │  │
│  │         { component: 'Page', props: {...} }          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User Action** → Click link or submit form
2. **Inertia.js** → Intercepts request, makes XHR call
3. **Laravel Controller** → Processes request, returns Inertia response
4. **Inertia Response** → JSON with component name + props
5. **Vue Component** → Renders with new props
6. **Browser History** → Updated without page reload

---

## 📁 Project Structure

```
resources/
├── js/
│   ├── app.js                          # Main entry point
│   ├── bootstrap.js                    # Bootstrap dependencies
│   │
│   ├── Layouts/                        # Layout components
│   │   ├── AppLayout.vue              # Main app layout
│   │   ├── AuthLayout.vue             # Auth pages layout
│   │   └── GuestLayout.vue            # Guest pages layout
│   │
│   ├── Pages/                          # Page components (by module)
│   │   ├── Dashboard/
│   │   │   └── Index.vue
│   │   │
│   │   ├── Accounting/
│   │   │   ├── Accounts/
│   │   │   │   ├── Index.vue
│   │   │   │   ├── Create.vue
│   │   │   │   └── Edit.vue
│   │   │   ├── JournalEntries/
│   │   │   └── Ledger/
│   │   │
│   │   ├── Invoice/
│   │   │   ├── Invoices/
│   │   │   ├── Bills/
│   │   │   └── Payments/
│   │   │
│   │   ├── Banking/
│   │   │   ├── Accounts/
│   │   │   ├── Transactions/
│   │   │   └── Reconciliation/
│   │   │
│   │   ├── Reporting/
│   │   │   ├── FinancialStatements/
│   │   │   ├── CustomReports/
│   │   │   └── Analytics/
│   │   │
│   │   └── Organization/
│   │       ├── Profile/
│   │       ├── Users/
│   │       └── Settings/
│   │
│   ├── Components/                     # Shared components
│   │   ├── Common/
│   │   │   ├── Button.vue
│   │   │   ├── Input.vue
│   │   │   ├── Select.vue
│   │   │   ├── Modal.vue
│   │   │   ├── Table.vue
│   │   │   └── Card.vue
│   │   │
│   │   ├── Forms/
│   │   │   ├── FormInput.vue
│   │   │   ├── FormSelect.vue
│   │   │   ├── FormTextarea.vue
│   │   │   └── FormDatePicker.vue
│   │   │
│   │   ├── Charts/
│   │   │   ├── LineChart.vue
│   │   │   ├── BarChart.vue
│   │   │   └── PieChart.vue
│   │   │
│   │   └── Accounting/                # Module-specific components
│   │       ├── AccountTree.vue
│   │       ├── JournalEntryForm.vue
│   │       └── TransactionTable.vue
│   │
│   ├── Composables/                    # Composition API utilities
│   │   ├── useForm.js
│   │   ├── useTable.js
│   │   ├── useModal.js
│   │   ├── useNotification.js
│   │   └── usePermissions.js
│   │
│   ├── Stores/                         # Pinia stores
│   │   ├── auth.js
│   │   ├── organization.js
│   │   ├── accounting.js
│   │   ├── invoice.js
│   │   └── notifications.js
│   │
│   ├── Utils/                          # Utility functions
│   │   ├── formatting.js
│   │   ├── validation.js
│   │   ├── date.js
│   │   └── currency.js
│   │
│   └── Types/                          # TypeScript types
│       ├── models.ts
│       ├── api.ts
│       └── components.ts
│
├── css/
│   ├── app.css                         # Main CSS with Tailwind
│   └── modules/                        # Module-specific styles
│
└── views/
    └── app.blade.php                   # Root HTML template
```

---

## ✨ Core Features & Components

### 1. **Dashboard Module**

**Components:**
- `Dashboard/Index.vue` - Main dashboard with widgets
- `Widgets/FinancialSummary.vue` - Key financial metrics
- `Widgets/RecentTransactions.vue` - Latest transactions
- `Widgets/CashFlowChart.vue` - Cash flow visualization
- `Widgets/ProfitLossChart.vue` - P&L trend chart
- `Widgets/QuickActions.vue` - Quick action buttons

**Features:**
- Customizable widgets
- Real-time data updates
- Drag-and-drop widget arrangement
- Date range filtering
- Organization switching

---

### 2. **Accounting Module**

#### Chart of Accounts
```vue
<!-- Pages/Accounting/Accounts/Index.vue -->
<template>
  <AppLayout>
    <div class="container mx-auto px-4 py-8">
      <PageHeader 
        title="Chart of Accounts"
        :actions="headerActions"
      />
      
      <Card>
        <AccountTree 
          :accounts="accounts"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </Card>
      
      <AccountModal 
        v-model="showModal"
        :account="selectedAccount"
        @saved="refreshAccounts"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import AccountTree from '@/Components/Accounting/AccountTree.vue'
import AccountModal from '@/Components/Accounting/AccountModal.vue'

const props = defineProps({
  accounts: Array
})

const showModal = ref(false)
const selectedAccount = ref(null)

const headerActions = [
  { label: 'Add Account', onClick: () => showModal.value = true },
  { label: 'Import', onClick: handleImport },
  { label: 'Export', onClick: handleExport }
]

const refreshAccounts = () => {
  router.reload({ only: ['accounts'] })
}
</script>
```

#### Journal Entry Form
```vue
<!-- Components/Accounting/JournalEntryForm.vue -->
<template>
  <form @submit.prevent="submit">
    <div class="space-y-6">
      <FormInput 
        v-model="form.date"
        type="date"
        label="Date"
        :error="form.errors.date"
      />
      
      <FormInput 
        v-model="form.reference"
        label="Reference Number"
        :error="form.errors.reference"
      />
      
      <FormTextarea 
        v-model="form.description"
        label="Description"
        :error="form.errors.description"
      />
      
      <!-- Journal Lines -->
      <div class="border rounded-lg p-4">
        <h3 class="font-semibold mb-4">Journal Lines</h3>
        
        <div 
          v-for="(line, index) in form.lines" 
          :key="index"
          class="grid grid-cols-12 gap-4 mb-4"
        >
          <div class="col-span-5">
            <AccountSelect 
              v-model="line.account_id"
              :error="form.errors[`lines.${index}.account_id`]"
            />
          </div>
          
          <div class="col-span-3">
            <FormInput 
              v-model="line.debit"
              type="number"
              step="0.01"
              placeholder="Debit"
              @input="calculateBalance"
            />
          </div>
          
          <div class="col-span-3">
            <FormInput 
              v-model="line.credit"
              type="number"
              step="0.01"
              placeholder="Credit"
              @input="calculateBalance"
            />
          </div>
          
          <div class="col-span-1 flex items-center">
            <button 
              type="button"
              @click="removeLine(index)"
              class="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
        
        <Button 
          type="button" 
          variant="secondary"
          @click="addLine"
        >
          + Add Line
        </Button>
        
        <!-- Balance Check -->
        <div class="mt-4 p-3 rounded" :class="balanceClass">
          <div class="flex justify-between">
            <span>Total Debit:</span>
            <span class="font-semibold">{{ formatCurrency(totalDebit) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Total Credit:</span>
            <span class="font-semibold">{{ formatCurrency(totalCredit) }}</span>
          </div>
          <div class="flex justify-between font-bold mt-2 pt-2 border-t">
            <span>Difference:</span>
            <span>{{ formatCurrency(difference) }}</span>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end gap-4">
        <Button type="button" variant="secondary" @click="cancel">
          Cancel
        </Button>
        <Button 
          type="submit" 
          :disabled="!isBalanced || form.processing"
          :loading="form.processing"
        >
          Save Entry
        </Button>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useForm } from '@inertiajs/vue3'
import { formatCurrency } from '@/Utils/formatting'

const form = useForm({
  date: new Date().toISOString().split('T')[0],
  reference: '',
  description: '',
  lines: [
    { account_id: null, debit: 0, credit: 0 },
    { account_id: null, debit: 0, credit: 0 }
  ]
})

const totalDebit = computed(() => 
  form.lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0)
)

const totalCredit = computed(() => 
  form.lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0)
)

const difference = computed(() => totalDebit.value - totalCredit.value)

const isBalanced = computed(() => Math.abs(difference.value) < 0.01)

const balanceClass = computed(() => 
  isBalanced.value 
    ? 'bg-green-50 border border-green-300' 
    : 'bg-red-50 border border-red-300'
)

const addLine = () => {
  form.lines.push({ account_id: null, debit: 0, credit: 0 })
}

const removeLine = (index) => {
  if (form.lines.length > 2) {
    form.lines.splice(index, 1)
  }
}

const submit = () => {
  form.post('/accounting/journal-entries')
}
</script>
```

---

### 3. **Invoice Module**

#### Invoice List
```vue
<!-- Pages/Invoice/Invoices/Index.vue -->
<template>
  <AppLayout>
    <div class="container mx-auto px-4 py-8">
      <PageHeader 
        title="Invoices"
        :actions="headerActions"
      />
      
      <!-- Filters -->
      <Card class="mb-6">
        <div class="grid grid-cols-4 gap-4">
          <FormSelect 
            v-model="filters.status"
            label="Status"
            :options="statusOptions"
            @change="applyFilters"
          />
          
          <FormInput 
            v-model="filters.search"
            type="search"
            placeholder="Search invoices..."
            @input="debounceSearch"
          />
          
          <FormDatePicker 
            v-model="filters.date_from"
            label="From Date"
            @change="applyFilters"
          />
          
          <FormDatePicker 
            v-model="filters.date_to"
            label="To Date"
            @change="applyFilters"
          />
        </div>
      </Card>
      
      <!-- Invoice Table -->
      <Card>
        <DataTable 
          :columns="columns"
          :data="invoices.data"
          :pagination="invoices"
          @row-click="viewInvoice"
        >
          <template #status="{ row }">
            <StatusBadge :status="row.status" />
          </template>
          
          <template #amount="{ row }">
            {{ formatCurrency(row.total) }}
          </template>
          
          <template #actions="{ row }">
            <DropdownMenu>
              <DropdownItem @click="viewInvoice(row)">View</DropdownItem>
              <DropdownItem @click="editInvoice(row)">Edit</DropdownItem>
              <DropdownItem @click="sendInvoice(row)">Send</DropdownItem>
              <DropdownItem @click="downloadPDF(row)">Download PDF</DropdownItem>
              <DropdownItem 
                @click="deleteInvoice(row)"
                variant="danger"
              >
                Delete
              </DropdownItem>
            </DropdownMenu>
          </template>
        </DataTable>
      </Card>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { router } from '@inertiajs/vue3'
import { debounce } from 'lodash'
import AppLayout from '@/Layouts/AppLayout.vue'
import DataTable from '@/Components/Common/DataTable.vue'
import StatusBadge from '@/Components/Common/StatusBadge.vue'

const props = defineProps({
  invoices: Object,
  filters: Object
})

const columns = [
  { key: 'invoice_number', label: 'Invoice #', sortable: true },
  { key: 'customer_name', label: 'Customer', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'due_date', label: 'Due Date', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'actions', label: 'Actions' }
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' }
]

const filters = reactive(props.filters)

const applyFilters = () => {
  router.get('/invoices', filters, {
    preserveState: true,
    preserveScroll: true
  })
}

const debounceSearch = debounce(applyFilters, 500)

const viewInvoice = (invoice) => {
  router.visit(`/invoices/${invoice.id}`)
}

const headerActions = [
  { label: 'Create Invoice', onClick: () => router.visit('/invoices/create') }
]
</script>
```

---

### 4. **Reporting Module**

#### Financial Statement Dashboard
```vue
<!-- Pages/Reporting/FinancialStatements/Index.vue -->
<template>
  <AppLayout>
    <div class="container mx-auto px-4 py-8">
      <PageHeader title="Financial Statements" />
      
      <!-- Date Range Selector -->
      <Card class="mb-6">
        <div class="flex items-end gap-4">
          <FormDatePicker 
            v-model="dateRange.from"
            label="From Date"
          />
          
          <FormDatePicker 
            v-model="dateRange.to"
            label="To Date"
          />
          
          <FormSelect 
            v-model="selectedOrganization"
            label="Organization"
            :options="organizations"
          />
          
          <Button @click="loadStatements">
            Generate Reports
          </Button>
        </div>
      </Card>
      
      <!-- Statement Tabs -->
      <Card>
        <TabGroup>
          <TabList class="border-b">
            <Tab>Balance Sheet</Tab>
            <Tab>Profit & Loss</Tab>
            <Tab>Cash Flow</Tab>
            <Tab>Trial Balance</Tab>
          </TabList>
          
          <TabPanels>
            <!-- Balance Sheet -->
            <TabPanel>
              <BalanceSheet 
                :data="statements.balanceSheet"
                :date="dateRange.to"
              />
            </TabPanel>
            
            <!-- Profit & Loss -->
            <TabPanel>
              <ProfitLoss 
                :data="statements.profitLoss"
                :dateRange="dateRange"
              />
            </TabPanel>
            
            <!-- Cash Flow -->
            <TabPanel>
              <CashFlowStatement 
                :data="statements.cashFlow"
                :dateRange="dateRange"
              />
            </TabPanel>
            
            <!-- Trial Balance -->
            <TabPanel>
              <TrialBalance 
                :data="statements.trialBalance"
                :date="dateRange.to"
              />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Card>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { router } from '@inertiajs/vue3'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import AppLayout from '@/Layouts/AppLayout.vue'
import BalanceSheet from '@/Components/Reporting/BalanceSheet.vue'
import ProfitLoss from '@/Components/Reporting/ProfitLoss.vue'

const props = defineProps({
  statements: Object,
  organizations: Array
})

const dateRange = reactive({
  from: null,
  to: new Date().toISOString().split('T')[0]
})

const selectedOrganization = ref(null)

const loadStatements = () => {
  router.get('/reporting/financial-statements', {
    date_from: dateRange.from,
    date_to: dateRange.to,
    organization_id: selectedOrganization.value
  }, {
    preserveState: true
  })
}
</script>
```

---

## 🗄️ State Management

### Pinia Store Examples

#### Authentication Store
```javascript
// stores/auth.js
import { defineStore } from 'pinia'
import { router } from '@inertiajs/vue3'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    permissions: [],
    currentOrganization: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.user,
    
    hasPermission: (state) => (permission) => {
      return state.permissions.includes(permission)
    },
    
    canAccessModule: (state) => (module) => {
      return state.permissions.some(p => p.startsWith(`${module}.`))
    }
  },
  
  actions: {
    setUser(user) {
      this.user = user
      this.permissions = user.permissions || []
    },
    
    setOrganization(organization) {
      this.currentOrganization = organization
    },
    
    async logout() {
      router.post('/logout')
    },
    
    async switchOrganization(organizationId) {
      router.post('/organization/switch', {
        organization_id: organizationId
      }, {
        onSuccess: () => {
          router.reload()
        }
      })
    }
  }
})
```

#### Accounting Store
```javascript
// stores/accounting.js
import { defineStore } from 'pinia'
import { router } from '@inertiajs/vue3'

export const useAccountingStore = defineStore('accounting', {
  state: () => ({
    accounts: [],
    journalEntries: [],
    currentAccount: null,
    chartOfAccountsCache: null
  }),
  
  getters: {
    assetAccounts: (state) => 
      state.accounts.filter(a => a.type === 'asset'),
    
    liabilityAccounts: (state) => 
      state.accounts.filter(a => a.type === 'liability'),
    
    revenueAccounts: (state) => 
      state.accounts.filter(a => a.type === 'revenue'),
    
    expenseAccounts: (state) => 
      state.accounts.filter(a => a.type === 'expense'),
      
    accountTree: (state) => {
      // Build hierarchical tree
      const buildTree = (parentId = null) => {
        return state.accounts
          .filter(a => a.parent_id === parentId)
          .map(account => ({
            ...account,
            children: buildTree(account.id)
          }))
      }
      return buildTree()
    }
  },
  
  actions: {
    setAccounts(accounts) {
      this.accounts = accounts
    },
    
    async createAccount(data) {
      return new Promise((resolve, reject) => {
        router.post('/accounting/accounts', data, {
          onSuccess: () => resolve(),
          onError: (errors) => reject(errors)
        })
      })
    },
    
    async createJournalEntry(data) {
      return new Promise((resolve, reject) => {
        router.post('/accounting/journal-entries', data, {
          onSuccess: () => resolve(),
          onError: (errors) => reject(errors)
        })
      })
    }
  }
})
```

---

## 🎨 UI/UX Design System

### Design Principles
1. **Clean & Minimal**: Focus on content, remove clutter
2. **Consistent**: Same patterns throughout the app
3. **Accessible**: WCAG 2.1 AA compliance
4. **Responsive**: Mobile-first, works on all devices
5. **Fast**: Optimized for performance

### Color Palette
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          500: '#6b7280',
          900: '#111827',
        }
      }
    }
  }
}
```

### Typography
- **Headings**: Inter font, bold
- **Body**: Inter font, regular
- **Monospace**: JetBrains Mono (for codes, numbers)

### Component Library

#### Button Component
```vue
<!-- Components/Common/Button.vue -->
<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="mr-2">
      <Spinner />
    </span>
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: Boolean,
  loading: Boolean
})

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }
  
  const disabled = props.disabled || props.loading ? 'opacity-50 cursor-not-allowed' : ''
  
  return [base, variants[props.variant], sizes[props.size], disabled].join(' ')
})
</script>
```

---

## 🚀 Implementation Guide

### 1. Installation

```bash
# Install dependencies
npm install @inertiajs/vue3 vue@next @vitejs/plugin-vue
npm install pinia
npm install -D tailwindcss postcss autoprefixer
npm install @headlessui/vue
npm install chart.js vue-chartjs
npm install date-fns
npm install lodash
```

### 2. Setup Inertia.js

```javascript
// resources/js/app.js
import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { createPinia } from 'pinia'
import { ZiggyVue } from '../../vendor/tightenco/ziggy/dist/vue.m'

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
    return pages[`./Pages/${name}.vue`]
  },
  
  setup({ el, App, props, plugin }) {
    const pinia = createPinia()
    
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .use(pinia)
      .use(ZiggyVue)
      .mount(el)
  },
  
  progress: {
    color: '#3b82f6',
    showSpinner: true
  }
})
```

### 3. Configure Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.js'],
      refresh: true
    }),
    vue({
      template: {
        transformAssetUrls: {
          base: null,
          includeAbsolute: false
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './resources/js'),
      'ziggy-js': path.resolve('vendor/tightenco/ziggy/dist/index.js')
    }
  }
})
```

### 4. Setup Tailwind

```javascript
// tailwind.config.js
export default {
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
```

---

## ⚡ Performance Optimization

### 1. Code Splitting
```javascript
// Lazy load components
const AccountModal = defineAsyncComponent(() =>
  import('@/Components/Accounting/AccountModal.vue')
)
```

### 2. Image Optimization
- Use WebP format
- Lazy load images
- Responsive images with srcset

### 3. Caching Strategy
```javascript
// Cache API responses
const { data, error } = await useFetch('/api/accounts', {
  key: 'accounts',
  getCachedData(key) {
    return nuxtApp.static.data[key] ?? nuxtApp.payload.data[key]
  }
})
```

### 4. Virtual Scrolling
```vue
<!-- For large lists -->
<RecycleScroller
  :items="transactions"
  :item-size="50"
  key-field="id"
  v-slot="{ item }"
>
  <TransactionRow :transaction="item" />
</RecycleScroller>
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
```javascript
// tests/unit/components/Button.spec.js
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Button from '@/Components/Common/Button.vue'

describe('Button Component', () => {
  it('renders properly', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click Me'
      }
    })
    expect(wrapper.text()).toContain('Click Me')
  })
  
  it('applies variant classes', () => {
    const wrapper = mount(Button, {
      props: { variant: 'danger' }
    })
    expect(wrapper.classes()).toContain('bg-red-600')
  })
  
  it('emits click event', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
  })
  
  it('disables when loading', () => {
    const wrapper = mount(Button, {
      props: { loading: true }
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })
})
```

### Component Tests
```javascript
// tests/components/AccountTree.spec.js
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AccountTree from '@/Components/Accounting/AccountTree.vue'

describe('AccountTree Component', () => {
  const accounts = [
    {
      id: 1,
      code: '1000',
      name: 'Assets',
      type: 'asset',
      children: [
        { id: 2, code: '1100', name: 'Current Assets', type: 'asset' }
      ]
    }
  ]
  
  it('renders account tree', () => {
    const wrapper = mount(AccountTree, {
      props: { accounts }
    })
    expect(wrapper.text()).toContain('Assets')
    expect(wrapper.text()).toContain('Current Assets')
  })
  
  it('emits edit event', async () => {
    const wrapper = mount(AccountTree, {
      props: { accounts }
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
  })
})
```

### Integration Tests (Cypress)
```javascript
// cypress/e2e/accounting/journal-entries.cy.js
describe('Journal Entry Creation', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/accounting/journal-entries/create')
  })
  
  it('creates a balanced journal entry', () => {
    cy.get('input[name="date"]').type('2025-01-05')
    cy.get('input[name="reference"]').type('JE-001')
    cy.get('textarea[name="description"]').type('Test Entry')
    
    // Add debit line
    cy.get('[data-test="account-select"]').first().select('Cash')
    cy.get('[data-test="debit-input"]').first().type('1000')
    
    // Add credit line
    cy.get('[data-test="account-select"]').eq(1).select('Revenue')
    cy.get('[data-test="credit-input"]').eq(1).type('1000')
    
    // Submit
    cy.get('[data-test="submit-button"]').click()
    
    // Verify success
    cy.url().should('include', '/accounting/journal-entries')
    cy.contains('Journal entry created successfully')
  })
  
  it('prevents unbalanced entry submission', () => {
    cy.get('[data-test="debit-input"]').first().type('1000')
    cy.get('[data-test="credit-input"]').first().type('500')
    
    cy.get('[data-test="submit-button"]').should('be.disabled')
    cy.contains('Difference: 500.00')
  })
})
```

### End-to-End Tests
```javascript
// tests/e2e/complete-workflow.spec.js
describe('Complete Accounting Workflow', () => {
  it('completes full invoice to payment cycle', () => {
    cy.login()
    
    // Create invoice
    cy.visit('/invoices/create')
    cy.fillInvoiceForm({
      customer: 'Test Customer',
      amount: 5000,
      dueDate: '2025-02-05'
    })
    cy.get('[data-test="save-invoice"]').click()
    
    // Verify accounting entry
    cy.visit('/accounting/journal-entries')
    cy.contains('INV-')
    cy.contains('5000.00')
    
    // Record payment
    cy.visit('/invoices')
    cy.get('[data-test="invoice-row"]').first().click()
    cy.get('[data-test="record-payment"]').click()
    cy.fillPaymentForm({ amount: 5000 })
    cy.get('[data-test="save-payment"]').click()
    
    // Verify payment entry
    cy.visit('/accounting/journal-entries')
    cy.contains('PMT-')
    cy.contains('5000.00')
  })
})
```

---

## 📱 Responsive Design

### Breakpoints
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Mobile
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large Desktop
      '2xl': '1536px'  // Extra Large
    }
  }
}
```

### Mobile-First Components
```vue
<!-- Responsive Navigation -->
<template>
  <nav class="bg-white shadow">
    <!-- Mobile Menu Button -->
    <div class="md:hidden">
      <button @click="mobileMenuOpen = !mobileMenuOpen">
        <MenuIcon />
      </button>
    </div>
    
    <!-- Desktop Navigation -->
    <div class="hidden md:flex gap-6">
      <NavLink href="/accounting">Accounting</NavLink>
      <NavLink href="/invoices">Invoices</NavLink>
      <NavLink href="/banking">Banking</NavLink>
      <NavLink href="/reports">Reports</NavLink>
    </div>
    
    <!-- Mobile Menu -->
    <transition name="slide">
      <div v-if="mobileMenuOpen" class="md:hidden">
        <MobileNav @close="mobileMenuOpen = false" />
      </div>
    </transition>
  </nav>
</template>
```

### Responsive Tables
```vue
<!-- Desktop: Table, Mobile: Cards -->
<template>
  <!-- Desktop View -->
  <table class="hidden md:table w-full">
    <thead>
      <tr>
        <th>Invoice #</th>
        <th>Customer</th>
        <th>Amount</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="invoice in invoices" :key="invoice.id">
        <td>{{ invoice.number }}</td>
        <td>{{ invoice.customer }}</td>
        <td>{{ formatCurrency(invoice.total) }}</td>
        <td><StatusBadge :status="invoice.status" /></td>
      </tr>
    </tbody>
  </table>
  
  <!-- Mobile View -->
  <div class="md:hidden space-y-4">
    <InvoiceCard 
      v-for="invoice in invoices" 
      :key="invoice.id"
      :invoice="invoice"
    />
  </div>
</template>
```

---

## 🔔 Real-Time Features

### WebSocket Integration
```javascript
// composables/useRealTime.js
import { onMounted, onUnmounted } from 'vue'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher

export function useRealTime() {
  const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true
  })
  
  return {
    listenToInvoices(organizationId, callback) {
      echo.private(`organization.${organizationId}`)
        .listen('InvoiceCreated', callback)
        .listen('InvoiceUpdated', callback)
        .listen('PaymentReceived', callback)
    },
    
    disconnect() {
      echo.disconnect()
    }
  }
}
```

### Real-Time Notifications
```vue
<!-- Components/Notifications/NotificationCenter.vue -->
<template>
  <div class="relative">
    <button @click="showNotifications = !showNotifications" class="relative">
      <BellIcon class="w-6 h-6" />
      <span 
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
      >
        {{ unreadCount }}
      </span>
    </button>
    
    <transition name="fade">
      <div 
        v-if="showNotifications"
        class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50"
      >
        <div class="p-4 border-b">
          <h3 class="font-semibold">Notifications</h3>
        </div>
        
        <div class="max-h-96 overflow-y-auto">
          <NotificationItem 
            v-for="notification in notifications"
            :key="notification.id"
            :notification="notification"
            @mark-read="markAsRead"
          />
        </div>
        
        <div class="p-4 border-t text-center">
          <button @click="markAllAsRead" class="text-primary-600 text-sm">
            Mark all as read
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRealTime } from '@/composables/useRealTime'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { listenToInvoices } = useRealTime()

const notifications = ref([])
const showNotifications = ref(false)

const unreadCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

onMounted(() => {
  // Listen to real-time events
  listenToInvoices(authStore.currentOrganization.id, (event) => {
    notifications.value.unshift({
      id: Date.now(),
      type: event.type,
      message: event.message,
      read: false,
      timestamp: new Date()
    })
  })
})
</script>
```

---

## 🎯 Advanced Features

### 1. Keyboard Shortcuts
```javascript
// composables/useKeyboardShortcuts.js
import { onMounted, onUnmounted } from 'vue'
import { router } from '@inertiajs/vue3'

export function useKeyboardShortcuts() {
  const shortcuts = {
    'ctrl+k': () => openCommandPalette(),
    'ctrl+n': () => router.visit('/invoices/create'),
    'ctrl+/': () => toggleHelp(),
    'g i': () => router.visit('/invoices'),
    'g a': () => router.visit('/accounting'),
    'g r': () => router.visit('/reports')
  }
  
  let sequence = ''
  let sequenceTimer = null
  
  const handleKeydown = (e) => {
    const key = e.key.toLowerCase()
    const combo = [
      e.ctrlKey && 'ctrl',
      e.altKey && 'alt',
      e.shiftKey && 'shift',
      key
    ].filter(Boolean).join('+')
    
    // Check for direct combo
    if (shortcuts[combo]) {
      e.preventDefault()
      shortcuts[combo]()
      return
    }
    
    // Check for sequence
    clearTimeout(sequenceTimer)
    sequence += key
    sequenceTimer = setTimeout(() => sequence = '', 1000)
    
    if (shortcuts[sequence]) {
      e.preventDefault()
      shortcuts[sequence]()
      sequence = ''
    }
  }
  
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}
```

### 2. Command Palette
```vue
<!-- Components/CommandPalette.vue -->
<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog @close="close">
      <div class="fixed inset-0 bg-black/30" />
      
      <div class="fixed inset-0 flex items-start justify-center pt-20">
        <DialogPanel class="w-full max-w-2xl bg-white rounded-lg shadow-2xl">
          <Combobox @update:modelValue="executeCommand">
            <div class="relative">
              <ComboboxInput
                placeholder="Type a command or search..."
                class="w-full border-0 px-4 py-3 text-lg focus:ring-0"
                @input="query = $event.target.value"
              />
            </div>
            
            <ComboboxOptions class="max-h-96 overflow-y-auto p-2">
              <ComboboxOption
                v-for="command in filteredCommands"
                :key="command.id"
                :value="command"
                v-slot="{ active }"
              >
                <div :class="['px-4 py-2 rounded cursor-pointer', active && 'bg-primary-50']">
                  <div class="flex items-center gap-3">
                    <component :is="command.icon" class="w-5 h-5" />
                    <div>
                      <div class="font-medium">{{ command.label }}</div>
                      <div class="text-sm text-gray-500">{{ command.description }}</div>
                    </div>
                    <div class="ml-auto text-sm text-gray-400">
                      {{ command.shortcut }}
                    </div>
                  </div>
                </div>
              </ComboboxOption>
            </ComboboxOptions>
          </Combobox>
        </DialogPanel>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, computed } from 'vue'
import { router } from '@inertiajs/vue3'
import { 
  Dialog, DialogPanel, 
  TransitionRoot,
  Combobox, ComboboxInput, ComboboxOptions, ComboboxOption
} from '@headlessui/vue'

const isOpen = ref(false)
const query = ref('')

const commands = [
  { id: 1, label: 'Create Invoice', action: () => router.visit('/invoices/create'), icon: 'DocumentPlusIcon', shortcut: 'Ctrl+N' },
  { id: 2, label: 'View Invoices', action: () => router.visit('/invoices'), icon: 'DocumentTextIcon', shortcut: 'G I' },
  { id: 3, label: 'Chart of Accounts', action: () => router.visit('/accounting/accounts'), icon: 'ChartBarIcon', shortcut: 'G A' },
  { id: 4, label: 'Financial Reports', action: () => router.visit('/reports'), icon: 'ChartPieIcon', shortcut: 'G R' },
  // ... more commands
]

const filteredCommands = computed(() => {
  if (!query.value) return commands
  
  return commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.value.toLowerCase())
  )
})

const executeCommand = (command) => {
  command.action()
  close()
}

const open = () => isOpen.value = true
const close = () => isOpen.value = false

defineExpose({ open, close })
</script>
```

### 3. Offline Support (PWA)
```javascript
// service-worker.js
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST)

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 // 1 hour
      })
    ]
  })
)

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
)
```

### 4. Export Functionality
```javascript
// composables/useExport.js
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function useExport() {
  const exportToExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${filename}.xlsx`)
  }
  
  const exportToPDF = (data, columns, filename) => {
    const doc = new jsPDF()
    
    doc.text(filename, 14, 15)
    
    doc.autoTable({
      head: [columns.map(col => col.label)],
      body: data.map(row => columns.map(col => row[col.key])),
      startY: 20,
      styles: { fontSize: 8 }
    })
    
    doc.save(`${filename}.pdf`)
  }
  
  const exportToCSV = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${filename}.csv`)
  }
  
  return {
    exportToExcel,
    exportToPDF,
    exportToCSV
  }
}
```

---

## 🚀 Deployment

### Build Configuration

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "cypress open",
    "lint": "eslint resources/js --ext .js,.vue",
    "format": "prettier --write resources/js"
  }
}
```

### Production Build

```bash
# Build assets
npm run build

# Optimize images
npm run optimize-images

# Generate service worker
npm run generate-sw
```

### Environment Variables

```env
# .env
VITE_APP_NAME="Accounting Platform"
VITE_API_URL="${APP_URL}/api"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

### CDN Configuration

```javascript
// vite.config.js - Production CDN
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', '@inertiajs/vue3'],
          'ui-vendor': ['@headlessui/vue', 'chart.js'],
          'utils-vendor': ['lodash', 'date-fns']
        }
      }
    }
  }
})
```

---

## 📊 Performance Metrics

### Target Metrics
- **First Contentful Paint (FCP)**: <1.5s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Time to Interactive (TTI)**: <3.5s
- **Cumulative Layout Shift (CLS)**: <0.1
- **First Input Delay (FID)**: <100ms
- **Bundle Size**: <500KB (gzipped)

### Monitoring Tools
- Google Lighthouse
- WebPageTest
- Chrome DevTools
- Vue DevTools
- Sentry for error tracking

---

## 🔒 Security Best Practices

1. **XSS Prevention**: Vue automatically escapes HTML
2. **CSRF Protection**: Inertia.js handles CSRF tokens
3. **Content Security Policy**: Configure CSP headers
4. **Input Validation**: Client + server-side validation
5. **Authentication**: Secure token storage
6. **Authorization**: Check permissions before rendering
7. **HTTPS Only**: Force HTTPS in production
8. **Dependency Audits**: Regular `npm audit`

---

## 📚 Additional Resources

### Documentation
- [Vue 3 Documentation](https://vuejs.org/)
- [Inertia.js Documentation](https://inertiajs.com/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Headless UI Documentation](https://headlessui.com/)

### Learning Resources
- Vue Mastery
- Vue School
- Laracasts (Inertia.js series)
- TailwindCSS tutorials

### Community
- Vue.js Discord
- Laravel Discord (#inertia channel)
- Stack Overflow
- GitHub Discussions

---

## 🎯 Success Criteria

- ✅ **Performance**: All pages load under 2 seconds
- ✅ **Accessibility**: WCAG 2.1 AA compliance
- ✅ **Responsiveness**: Works on all devices (mobile, tablet, desktop)
- ✅ **Browser Support**: Chrome, Firefox, Safari, Edge (last 2 versions)
- ✅ **User Satisfaction**: >90% positive feedback
- ✅ **Test Coverage**: >80% unit test coverage
- ✅ **Zero Critical Bugs**: In production

---

**Last Updated**: 2025-01-05  
**Version**: 1.0.0  
**Status**: Production Ready  
**Recommended Stack**: ✅ Vue 3 + Inertia.js + TailwindCSS