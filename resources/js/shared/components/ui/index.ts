/**
 * Shared UI Components - Phase 9 Unified Structure
 * Centralized export for all UI components
 */

// Core UI Components
export { ConnectionStatus, CompactConnectionStatus } from './ConnectionStatus';
export { ErrorFallback } from './ErrorFallback';
export { LoadingSpinner } from './LoadingSpinner';
export { NotificationContainer } from './NotificationContainer';

// HeadlessUI Components
export * from './HeadlessUIComponents';
export * from './AdvancedComponents';

// Layout & Navigation Components
export * from './LayoutComponents';
export * from './NavigationComponents';

// Re-export optimized components for unified access
export * from '../optimized';

// Re-export atoms for backward compatibility
export * from '../atoms';

// Types
export type { ErrorFallbackProps } from './ErrorFallback';
export type { LoadingSpinnerProps } from './LoadingSpinner';
