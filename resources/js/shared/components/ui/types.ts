/**
 * Unified Component Types
 * Centralized type definitions for consistent component APIs
 */

import { ReactNode, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// =============================================================================
// BASE TYPES
// =============================================================================

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
export type ColorScheme =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'asset'
    | 'liability'
    | 'equity'
    | 'revenue'
    | 'expense';
export type Status = 'idle' | 'loading' | 'success' | 'error';

// =============================================================================
// COMMON PROPS
// =============================================================================

export interface BaseProps {
    className?: string;
    children?: ReactNode;
}

export interface SizeProps {
    size?: Size;
}

export interface VariantProps {
    variant?: Variant;
}

export interface ColorProps {
    colorScheme?: ColorScheme;
}

export interface StatusProps {
    status?: Status;
}

export interface LoadingProps {
    loading?: boolean;
}

export interface DisabledProps {
    disabled?: boolean;
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface FormFieldProps extends BaseProps {
    label?: string;
    description?: string;
    error?: string;
    required?: boolean;
    optional?: boolean;
}

export interface InputProps
    extends FormFieldProps,
        SizeProps,
        Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    leftElement?: ReactNode;
    rightElement?: ReactNode;
}

export interface SelectOption {
    value: string | number;
    label: string;
    description?: string;
    icon?: ReactNode;
    disabled?: boolean;
    group?: string;
}

export interface SelectProps extends FormFieldProps, SizeProps {
    options: SelectOption[];
    value?: string | number | (string | number)[];
    onChange?: (value: string | number | (string | number)[]) => void;
    placeholder?: string;
    multiple?: boolean;
    searchable?: boolean;
    clearable?: boolean;
    loading?: boolean;
}

// =============================================================================
// DATA DISPLAY TYPES
// =============================================================================

export interface TableColumn<T = any> {
    key: string;
    title: string;
    dataIndex?: keyof T;
    render?: (value: any, record: T, index: number) => ReactNode;
    width?: number | string;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    filterable?: boolean;
    fixed?: 'left' | 'right';
}

export interface TableProps<T = any> extends BaseProps {
    columns: TableColumn<T>[];
    data: T[];
    loading?: boolean;
    pagination?:
        | boolean
        | {
              current: number;
              pageSize: number;
              total: number;
              onChange: (page: number, pageSize: number) => void;
          };
    rowKey?: string | ((record: T) => string);
    onRow?: (record: T, index: number) => HTMLAttributes<HTMLTableRowElement>;
    scroll?: { x?: number | string; y?: number | string };
    size?: Size;
}

export interface CardProps extends BaseProps, SizeProps {
    title?: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
    cover?: ReactNode;
    hoverable?: boolean;
    loading?: boolean;
}

export interface BadgeProps extends BaseProps, SizeProps, ColorProps {
    count?: number;
    dot?: boolean;
    showZero?: boolean;
    offset?: [number, number];
}

export interface AvatarProps extends BaseProps, SizeProps {
    src?: string;
    alt?: string;
    name?: string;
    icon?: ReactNode;
    shape?: 'circle' | 'square';
}

// =============================================================================
// FEEDBACK TYPES
// =============================================================================

export interface ToastProps extends BaseProps, ColorProps {
    title?: string;
    description?: string;
    duration?: number;
    closable?: boolean;
    onClose?: () => void;
    action?: ReactNode;
}

export interface AlertProps extends BaseProps, SizeProps, ColorProps {
    title?: string;
    description?: string;
    closable?: boolean;
    onClose?: () => void;
    icon?: ReactNode;
    action?: ReactNode;
}

export interface ProgressProps extends BaseProps, SizeProps, ColorProps {
    value: number;
    max?: number;
    showValue?: boolean;
    format?: (value: number, max: number) => string;
    indeterminate?: boolean;
}

export interface SkeletonProps extends BaseProps {
    active?: boolean;
    avatar?: boolean | { size?: Size; shape?: 'circle' | 'square' };
    paragraph?: boolean | { rows?: number; width?: number | string | (number | string)[] };
    title?: boolean | { width?: number | string };
    loading?: boolean;
    children?: ReactNode;
}

// =============================================================================
// LAYOUT TYPES
// =============================================================================

export interface FlexProps extends BaseProps, HTMLAttributes<HTMLDivElement> {
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
    align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
    gap?: number | string;
}

export interface GridProps extends BaseProps, HTMLAttributes<HTMLDivElement> {
    columns?: number | string;
    rows?: number | string;
    gap?: number | string;
    areas?: string;
}

// =============================================================================
// NAVIGATION TYPES
// =============================================================================

export interface MenuItem {
    key: string;
    label: string;
    icon?: ReactNode;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
    children?: MenuItem[];
    badge?: string | number;
}

export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: ReactNode;
    onClick?: () => void;
}

// =============================================================================
// ACCOUNTING TYPES
// =============================================================================

export interface AccountingAmount {
    amount: number;
    currency?: string;
    type?: 'debit' | 'credit';
    formatted?: string;
}

export interface TransactionRowProps extends BaseProps {
    date: string;
    description: string;
    account: string;
    debit?: AccountingAmount;
    credit?: AccountingAmount;
    balance?: AccountingAmount;
    reference?: string;
    onClick?: () => void;
}

export interface FinancialSummaryProps extends BaseProps {
    title: string;
    amount: AccountingAmount;
    change?: {
        amount: number;
        percentage: number;
        period: string;
    };
    trend?: 'up' | 'down' | 'neutral';
    loading?: boolean;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type ComponentSize = Size;
export type ComponentVariant = Variant;
export type ComponentColor = ColorScheme;
export type ComponentStatus = Status;

// Generic component props that can be extended
export interface ComponentProps
    extends BaseProps,
        SizeProps,
        VariantProps,
        ColorProps,
        LoadingProps,
        DisabledProps {}

// Event handler types
export type ClickHandler = () => void;
export type ChangeHandler<T = any> = (value: T) => void;
export type SelectHandler<T = any> = (value: T, option?: SelectOption) => void;

// Responsive breakpoint types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

// Animation and transition types
export type AnimationDuration = 'fast' | 'normal' | 'slow';
export type AnimationType = 'fade' | 'slide' | 'scale' | 'bounce';

// Theme types
export interface ThemeConfig {
    colors: Record<ColorScheme, string>;
    sizes: Record<Size, string>;
    spacing: Record<string, string>;
    borderRadius: Record<string, string>;
    shadows: Record<string, string>;
    fonts: Record<string, string>;
    animations: Record<AnimationType, string>;
}

export interface ThemeContextValue {
    theme: ThemeConfig;
    colorMode: 'light' | 'dark';
    toggleColorMode: () => void;
    setColorMode: (mode: 'light' | 'dark') => void;
}
