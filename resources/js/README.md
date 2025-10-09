# Frontend Architecture Documentation

## 📁 Directory Structure

This frontend follows a clean, feature-based architecture with clear separation of concerns:

```
resources/js/
├── __tests__/              # Test files
├── features/               # Feature-specific code (business domains)
│   ├── accounting/         # Accounting feature
│   │   ├── components/     # Accounting-specific components
│   │   ├── pages/          # Accounting pages
│   │   └── index.ts        # Feature exports
│   ├── auth/               # Authentication feature
│   ├── dashboard/          # Dashboard feature
│   ├── inventory/          # Inventory feature
│   ├── organization/       # Organization management feature
│   ├── reporting/          # Reporting feature
│   └── index.ts            # All features exports
├── shared/                 # Reusable code across features
│   ├── components/         # Shared UI components
│   │   ├── atoms/          # Basic building blocks
│   │   ├── molecules/      # Composed components
│   │   ├── organisms/      # Complex components
│   │   ├── layouts/        # Layout components
│   │   ├── ui/             # UI utility components
│   │   └── index.ts        # Component exports
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # State management
│   ├── services/           # API and external services
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # Application constants
│   ├── providers/          # React context providers
│   └── index.ts            # All shared exports
├── app.tsx                 # Main application component
├── app.js                  # Legacy app entry
├── bootstrap.ts            # Application bootstrap
└── bootstrap.js            # Legacy bootstrap
```

## 🏗️ Architecture Principles

### 1. Feature-Based Organization
- Each business domain has its own feature directory
- Features are self-contained with their own components, pages, and logic
- Features can import from `shared/` but not from other features directly

### 2. Atomic Design System
Components are organized using atomic design principles:
- **Atoms**: Basic building blocks (Button, Input, etc.)
- **Molecules**: Simple combinations of atoms (FormField, Card, etc.)
- **Organisms**: Complex components (DataTable, Navigation, etc.)
- **Layouts**: Page layout components

### 3. Clean Import Paths
```typescript
// ✅ Good - Use barrel exports
import { Button, CardContainer, DataTable } from '@/shared/components';
import { AccountForm } from '@/features/accounting/components';

// ✅ Good - Direct imports for specific components
import { Button } from '@/shared/components/atoms/Button';
import { FormInput } from '@/shared/components/molecules/FormInput';

// ❌ Avoid - Legacy paths (these have been removed)
import Button from '@/Components/UI/Button';
import { CardContainer } from '@/Components/Base';
```

## 📦 Key Components

### Shared Components

#### Atoms
- `Button` - Basic button component
- `PrimaryButton` - Primary action button
- `TextInput` - Text input field
- `InputLabel` - Form input label
- `InputError` - Form error display

#### Molecules
- `Container` - Generic container component
- `CardContainer` - Card-style container with header/footer
- `DataTable` - Data table component
- `FormInput` - Enhanced form input with validation
- `FormField` - Complete form field with label and error
- `AccountCard` - Account display card
- `MetricCard` - Metric display card

#### Organisms
- `Sidebar` - Application sidebar navigation
- `TopBar` - Application top navigation
- `ChartContainer` - Chart display container
- `UserManagement` - User management interface

#### Layouts
- `AppLayout` - Main application layout

### Feature Components

Each feature directory contains:
- `components/` - Feature-specific components
- `pages/` - Feature page components
- `index.ts` - Feature exports

## 🔧 Development Guidelines

### Adding New Components

1. **Determine the right location**:
   - Feature-specific? → `features/{feature}/components/`
   - Reusable across features? → `shared/components/{atoms|molecules|organisms}/`

2. **Follow naming conventions**:
   - Use PascalCase for component files: `MyComponent.tsx`
   - Use camelCase for utility files: `myUtility.ts`

3. **Update barrel exports**:
   - Add exports to the appropriate `index.ts` file
   - This enables clean imports throughout the app

### Import Guidelines

```typescript
// ✅ Preferred - Use barrel exports
import { Button, CardContainer } from '@/shared/components';

// ✅ Acceptable - Direct imports for tree-shaking
import { Button } from '@/shared/components/atoms/Button';

// ✅ Feature imports
import { AccountForm } from '@/features/accounting/components';

// ❌ Avoid - Cross-feature imports
import { SomeComponent } from '@/features/other-feature/components';
```

### State Management

- Global state: `shared/stores/`
- Feature-specific state: `features/{feature}/stores/` (if needed)
- Component state: Use React hooks

### Testing

- Test files: `__tests__/`
- Co-locate feature tests: `features/{feature}/__tests__/`
- Use descriptive test names and organize by component/feature

## 🚀 Migration Notes

This architecture represents a complete reorganization from the previous structure:

### What Changed
- ✅ Removed duplicate directories (`src/`, `Components/`, `Pages/`, etc.)
- ✅ Consolidated features under `features/` directory
- ✅ Organized shared code under `shared/` directory
- ✅ Updated all import paths to use new structure
- ✅ Added comprehensive barrel exports
- ✅ Implemented atomic design principles

### Benefits
- 🎯 **Clear separation of concerns**: Features vs shared code
- 📦 **Better code organization**: Atomic design system
- 🔍 **Easier navigation**: Predictable file locations
- 🚀 **Improved maintainability**: Less duplication, cleaner imports
- 📈 **Scalability**: Easy to add new features and components

## 🛠️ Available Scripts

The application uses standard React/TypeScript tooling. Refer to the main project README for build and development scripts.

## 📚 Further Reading

- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/)
- [Feature-Driven Development](https://en.wikipedia.org/wiki/Feature-driven_development)
- [React TypeScript Best Practices](https://react-typescript-cheatsheet.netlify.app/)
