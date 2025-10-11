# HeadlessUI + TailwindCSS Component Library

A comprehensive, production-ready component library built with HeadlessUI and TailwindCSS, specifically designed for accounting and financial applications.

## 🚀 Features

- **50+ Production-Ready Components** - Complete UI component library
- **TypeScript First** - Full type safety with comprehensive interfaces
- **Accessibility Built-In** - WCAG 2.1 AA compliant using HeadlessUI
- **Dark Mode Support** - Seamless light/dark theme switching
- **Accounting-Specific** - Specialized components for financial applications
- **Responsive Design** - Mobile-first approach with breakpoint support
- **Unified API** - Consistent prop patterns across all components
- **Performance Optimized** - Tree-shakeable exports and efficient rendering

## 📦 Installation

```bash
# Install dependencies
npm install @headlessui/react @heroicons/react clsx tailwind-merge

# Install TailwindCSS plugins
npm install @tailwindcss/aspect-ratio @tailwindcss/container-queries
```

## 🎨 Setup

### 1. TailwindCSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { /* your primary colors */ },
        asset: { /* green palette for assets */ },
        liability: { /* red palette for liabilities */ },
        equity: { /* blue palette for equity */ },
        revenue: { /* green palette for revenue */ },
        expense: { /* orange palette for expenses */ },
      },
      zIndex: {
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        modal: '1040',
        popover: '1050',
        tooltip: '1060',
        toast: '1070',
        loading: '1080',
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ],
}
```

### 2. CSS Setup

```css
/* app.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: 59 130 246;
    /* ... other CSS variables */
  }
}
```

## 🧩 Component Categories

### Form Components
Complete form system with validation and accessibility:

```tsx
import { 
  FormField, 
  Input, 
  NumberInput, 
  CurrencyInput, 
  TextArea, 
  Checkbox, 
  DatePicker, 
  TimePicker, 
  FileUpload 
} from '@/shared/components/ui';

// Basic form field
<FormField label="Account Name" required error={errors.name}>
  <Input 
    value={accountName}
    onChange={setAccountName}
    placeholder="Enter account name"
  />
</FormField>

// Currency input with symbol
<CurrencyInput
  label="Amount"
  value={amount}
  onChange={setAmount}
  currency="USD"
  showSymbol
/>

// File upload with drag & drop
<FileUpload
  label="Upload Documents"
  accept=".pdf,.jpg,.png"
  multiple
  onFileSelect={handleFiles}
  dragAndDrop
/>
```

### Data Display Components
Rich data visualization and display:

```tsx
import { 
  DataTable, 
  Card, 
  Badge, 
  Avatar, 
  Stat, 
  List 
} from '@/shared/components/ui';

// Advanced data table
<DataTable
  columns={[
    { key: 'name', title: 'Name', sortable: true },
    { key: 'amount', title: 'Amount', align: 'right', render: (value) => formatCurrency(value) }
  ]}
  data={transactions}
  pagination={{
    current: page,
    pageSize: 10,
    total: totalRecords,
    onChange: handlePageChange
  }}
/>

// KPI stat card
<Stat
  title="Total Revenue"
  value={125000}
  change={{ value: 12.5, type: 'increase', period: 'vs last month' }}
  icon={<ChartBarIcon />}
  colorScheme="revenue"
/>
```

### Feedback Components
User communication and state management:

```tsx
import { 
  ToastProvider, 
  useToast, 
  Alert, 
  Progress, 
  Loading, 
  Skeleton, 
  Empty 
} from '@/shared/components/ui';

// Toast system
function App() {
  return (
    <ToastProvider>
      <YourApp />
    </ToastProvider>
  );
}

function MyComponent() {
  const { addToast } = useToast();
  
  const showSuccess = () => {
    addToast({
      title: 'Success!',
      description: 'Transaction saved successfully',
      colorScheme: 'success'
    });
  };
}

// Loading states
<Skeleton loading={isLoading} avatar paragraph={{ rows: 3 }}>
  <UserProfile />
</Skeleton>
```

### Layout Components
Flexible layout system:

```tsx
import { 
  Container, 
  Grid, 
  GridItem, 
  Flex, 
  Stack, 
  HStack, 
  Center 
} from '@/shared/components/ui';

// Responsive grid
<Container size="xl">
  <Grid cols={3} gap={6} responsive={{ sm: 1, md: 2, lg: 3 }}>
    <GridItem colSpan={2}>
      <MainContent />
    </GridItem>
    <GridItem>
      <Sidebar />
    </GridItem>
  </Grid>
</Container>

// Flexible layouts
<Stack spacing={4}>
  <Header />
  <HStack justify="between" align="center">
    <Title />
    <Actions />
  </HStack>
  <Content />
</Stack>
```

### Navigation Components
Complete navigation system:

```tsx
import { 
  Sidebar, 
  Breadcrumb, 
  Navbar, 
  Pagination 
} from '@/shared/components/ui';

// Collapsible sidebar
<Sidebar
  items={navigationItems}
  collapsed={isCollapsed}
  onToggle={() => setIsCollapsed(!isCollapsed)}
  width="md"
/>

// Breadcrumb navigation
<Breadcrumb
  items={[
    { label: 'Dashboard', href: '/' },
    { label: 'Accounts', href: '/accounts' },
    { label: 'Chart of Accounts', current: true }
  ]}
/>
```

### Accounting Components
Specialized financial components:

```tsx
import { 
  AccountSelector, 
  TransactionRow, 
  FinancialSummary, 
  ChartOfAccountsTree, 
  JournalEntryForm, 
  CurrencyDisplay 
} from '@/shared/components/ui';

// Account selection with search
<AccountSelector
  accounts={chartOfAccounts}
  value={selectedAccountId}
  onChange={handleAccountChange}
  showBalance
  filterByType={['asset', 'liability']}
/>

// Financial summary card
<FinancialSummary
  title="Net Income"
  amount={{ amount: 45000, currency: 'USD' }}
  change={{ amount: 5000, percentage: 12.5, period: 'vs last quarter' }}
  trend="up"
/>

// Journal entry form
<JournalEntryForm
  lines={journalLines}
  accounts={accounts}
  onLinesChange={setJournalLines}
  onSubmit={handleSubmit}
/>
```

## 🎯 Advanced Features

### Theme System

```tsx
import { cn, getColorClasses, getSizeClasses } from '@/shared/components/ui';

// Use utility functions for consistent styling
const MyComponent = ({ colorScheme = 'primary', size = 'md' }) => {
  const colors = getColorClasses(colorScheme);
  const sizes = getSizeClasses(size);
  
  return (
    <div className={cn(
      'rounded-lg border',
      colors.bg,
      colors.text,
      sizes.padding
    )}>
      Content
    </div>
  );
};
```

### Responsive Design

```tsx
// Responsive props
<Grid 
  cols={1}
  responsive={{
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4
  }}
/>

// Responsive utilities
<div className={cn(
  'text-sm md:text-base lg:text-lg',
  'p-4 md:p-6 lg:p-8'
)}>
  Responsive content
</div>
```

### Accounting-Specific Utilities

```tsx
import { formatCurrency, getAccountingColorClasses } from '@/shared/components/ui';

// Format currency with proper accounting colors
<span className={getAccountingColorClasses('balance', amount)}>
  {formatCurrency(amount, 'USD')}
</span>

// Debit/Credit display
<CurrencyDisplay
  amount={1250.50}
  type="debit"
  currency="USD"
  showSign
/>
```

## 📱 Responsive Breakpoints

```typescript
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Breakpoint values
xs: '475px'   // Mobile
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1536px' // Extra large
```

## 🎨 Color Schemes

```typescript
type ColorScheme = 
  | 'primary'     // Brand colors
  | 'secondary'   // Gray colors
  | 'success'     // Green
  | 'warning'     // Yellow
  | 'error'       // Red
  | 'info'        // Blue
  | 'asset'       // Accounting: Assets (green)
  | 'liability'   // Accounting: Liabilities (red)
  | 'equity'      // Accounting: Equity (blue)
  | 'revenue'     // Accounting: Revenue (green)
  | 'expense';    // Accounting: Expenses (orange)
```

## 🔧 Customization

### Custom Components

```tsx
import { forwardRef } from 'react';
import { cn, getSizeClasses, getColorClasses } from '@/shared/components/ui';
import type { BaseProps, SizeProps, ColorProps } from '@/shared/components/ui';

interface MyComponentProps extends BaseProps, SizeProps, ColorProps {
  variant?: 'solid' | 'outline';
}

export const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  ({ size = 'md', colorScheme = 'primary', variant = 'solid', className, ...props }, ref) => {
    const sizeStyles = getSizeClasses(size);
    const colorStyles = getColorClasses(colorScheme);
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg',
          sizeStyles.padding,
          variant === 'solid' ? colorStyles.bg : colorStyles.border,
          className
        )}
        {...props}
      />
    );
  }
);
```

### Extending Types

```typescript
import type { ComponentProps } from '@/shared/components/ui';

interface ExtendedProps extends ComponentProps {
  customProp?: string;
}
```

## 🧪 Testing

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/shared/components/ui';

test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});
```

## 📈 Performance

- **Tree Shaking**: Import only what you need
- **Bundle Size**: Optimized for minimal impact
- **Runtime**: Efficient re-renders with React best practices
- **Accessibility**: Screen reader optimized

## 🤝 Contributing

1. Follow the established patterns
2. Include TypeScript types
3. Add accessibility features
4. Test across breakpoints
5. Document new components

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for modern accounting applications**
