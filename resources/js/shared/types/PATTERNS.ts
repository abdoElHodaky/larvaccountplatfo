/**
 * Core Type Definitions
 * 
 * Base interfaces and types used throughout the application.
 * These provide consistent patterns for all domain-specific types.
 */

// Base entity interface for all database entities
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Organization scoping for multi-tenant entities
export interface OrganizationScoped {
  organizationId: number;
}

// User scoping for user-specific entities
export interface UserScoped {
  userId: number;
}

// Soft delete support
export interface SoftDeletable {
  deletedAt?: string;
}

// Timestamp tracking
export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

// Full audit trail support
export interface Auditable extends Timestamped {
  createdBy: number;
  updatedBy: number;
}

// Hierarchical entities (parent-child relationships)
export interface Hierarchical {
  parentId?: number;
  children?: this[];
  level?: number;
  path?: string;
}

// Entities with status/state
export interface Stateful<T = string> {
  status: T;
  statusChangedAt?: string;
  statusChangedBy?: number;
}

// Entities with metadata
export interface WithMetadata {
  metadata?: Record<string, any>;
}

// Entities with tags/labels
export interface Taggable {
  tags?: string[];
}

// Entities with permissions
export interface Permissioned {
  permissions?: Permission[];
  isPublic?: boolean;
  ownerId?: number;
}

// Permission structure
export interface Permission {
  userId: number;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  grantedAt: string;
  grantedBy: number;
}

// Common status types
export type EntityStatus = 'active' | 'inactive' | 'pending' | 'archived';
export type ProcessStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PublishStatus = 'draft' | 'published' | 'scheduled' | 'archived';

// Common sort directions
export type SortDirection = 'asc' | 'desc';

// Common filter operators
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'not_in' | 'between';

// Generic filter interface
export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

// Generic sort interface
export interface Sort {
  field: string;
  direction: SortDirection;
}

// Generic search interface
export interface Search {
  term: string;
  fields?: string[];
}

// Date range interface
export interface DateRange {
  startDate: string;
  endDate: string;
}

// Numeric range interface
export interface NumericRange {
  min: number;
  max: number;
}

// Selection interface for lists
export interface Selectable {
  isSelected?: boolean;
  isSelectable?: boolean;
}

// Expandable interface for tree structures
export interface Expandable {
  isExpanded?: boolean;
  isExpandable?: boolean;
}

// Loading state interface
export interface LoadingState {
  isLoading?: boolean;
  loadingMessage?: string;
}

// Error state interface
export interface ErrorState {
  hasError?: boolean;
  error?: string | Error;
}

// Combined state interface
export interface AsyncState extends LoadingState, ErrorState {
  isInitialized?: boolean;
  lastUpdated?: string;
}

// Generic key-value pair
export interface KeyValuePair<T = any> {
  key: string;
  value: T;
  label?: string;
}

// Option interface for selects/dropdowns
export interface Option<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
  icon?: string;
  description?: string;
}

// Menu item interface
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  onClick?: () => void;
  children?: MenuItem[];
  disabled?: boolean;
  badge?: string | number;
  separator?: boolean;
}

// Breadcrumb item interface
export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
  icon?: string;
}

// Notification interface
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  createdAt: string;
}

// Notification action interface
export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

// Theme interface
export interface Theme {
  name: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
}

// User preferences interface
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  notifications: NotificationPreferences;
}

// Notification preferences interface
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: Record<string, boolean>;
}

// File interface
export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: number;
}

// Address interface
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Contact information interface
export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  address?: Address;
}

// Money/currency interface
export interface Money {
  amount: number;
  currency: string;
  formatted?: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Generic ID type (can be string or number)
export type ID = string | number;

// Generic callback types
export type Callback<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;
export type EventCallback<T = any> = (event: T) => void;
export type ChangeCallback<T = any> = (value: T) => void;

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Environment types
export type Environment = 'development' | 'staging' | 'production' | 'testing';

// Log level types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// MIME type aliases
export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'image/svg+xml';
export type DocumentMimeType = 'application/pdf' | 'application/msword' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export type SpreadsheetMimeType = 'application/vnd.ms-excel' | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Common regex patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-()]+$/,
  URL: /^https?:\/\/.+/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const;
