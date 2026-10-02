/**
 * Unified LiveIcons Integration - Phase 6 (Simplified & Enhanced)
 * Centralized icon system with improved performance and simplified naming
 */

// Re-export everything from NavIcons.ts which is the source of truth
export * from './NavIcons';

// Re-export financial formatting utilities from CreateLiveIcon for backward compatibility
export { formatCurrency, formatDate, formatNumber } from './CreateLiveIcon';

// Legacy type alias for backward compatibility
export type { IconProps as LiveIconProps } from './NavIcons';