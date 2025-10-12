/**
 * Unified LiveIcons Integration - Phase 6 (Simplified & Enhanced)
 * Centralized icon system with improved performance and simplified naming
 */

// Export everything from the new unified system
export * from './exports';

// Re-export types for convenience
export type { IconProps, IconCategory, IconRegistryEntry } from './types';

// Re-export utilities
export { 
  createLiveIcon, 
  DynamicIcon, 
  preloadIcons,
  iconExists,
  getIconSuggestions,
  iconRegistry
} from './exports';

// Legacy compatibility exports (deprecated - use new naming convention)
/** @deprecated Use NavHomeIcon instead */
export { NavHomeIcon as LiveHomeIcon } from './exports';
/** @deprecated Use NavLeftIcon instead */
export { NavLeftIcon as LiveChevronLeftIcon } from './exports';
/** @deprecated Use NavRightIcon instead */
export { NavRightIcon as LiveChevronRightIcon } from './exports';
/** @deprecated Use NavUpIcon instead */
export { NavUpIcon as LiveChevronUpIcon } from './exports';
/** @deprecated Use NavDownIcon instead */
export { NavDownIcon as LiveChevronDownIcon } from './exports';
/** @deprecated Use NavBackIcon instead */
export { NavBackIcon as LiveArrowLeftIcon } from './exports';
/** @deprecated Use NavForwardIcon instead */
export { NavForwardIcon as LiveArrowRightIcon } from './exports';

// Constants for backward compatibility
/** @deprecated Use ICON_SIZES from './types' instead */
export { ICON_SIZES as iconSizes } from './types';
/** @deprecated Use ICON_COLORS from './types' instead */
export { ICON_COLORS as iconColors } from './types';
/** @deprecated Use ICON_ANIMATIONS from './types' instead */
export { ICON_ANIMATIONS as iconAnimations } from './types';
