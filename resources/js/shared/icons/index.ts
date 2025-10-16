/**
 * Unified LiveIcons Integration - Phase 6 (Simplified & Enhanced)
 * Centralized icon system with improved performance and simplified naming
 */

// Export everything from the new unified system
export * from './NavConnectionIcon';
export * from './NavBackIcon';

// Re-export types for convenience
export type { IconProps, IconCategory, IconRegistryEntry } from './ICONSIZES';

// Legacy type alias for backward compatibility
export type LiveIconProps = IconProps;

// Re-export utilities
export { 
  createLiveIcon, 
  DynamicIcon, 
  preloadIcons,
  iconExists,
  getIconSuggestions,
  iconRegistry
} from './NavConnectionIcon';

// Legacy compatibility exports (deprecated - use new naming convention)
/** @deprecated Use NavHomeIcon instead */
export { NavHomeIcon as LiveHomeIcon } from './NavConnectionIcon';
/** @deprecated Use NavLeftIcon instead */
export { NavLeftIcon as LiveChevronLeftIcon } from './NavConnectionIcon';
/** @deprecated Use NavRightIcon instead */
export { NavRightIcon as LiveChevronRightIcon } from './NavConnectionIcon';
/** @deprecated Use NavUpIcon instead */
export { NavUpIcon as LiveChevronUpIcon } from './NavConnectionIcon';
/** @deprecated Use NavDownIcon instead */
export { NavDownIcon as LiveChevronDownIcon } from './NavConnectionIcon';
/** @deprecated Use NavBackIcon instead */
export { NavBackIcon as LiveArrowLeftIcon } from './NavConnectionIcon';
/** @deprecated Use NavForwardIcon instead */
export { NavForwardIcon as LiveArrowRightIcon } from './NavConnectionIcon';

// Additional legacy exports for dialog components
export { LiveXMarkIcon } from './FormConnectionIcon';
export { LiveInfoIcon } from './StatusConnectionIcon';
export { LiveWarningIcon } from './StatusConnectionIcon';
export { LiveErrorIcon } from './StatusConnectionIcon';
export { LiveSuccessIcon } from './StatusConnectionIcon';

// Status icons
export { 
  StatusIndicator, 
  ConnectionStatus, 
  BatteryStatus, 
  ProgressStatus,
  StatusChartIcon,
  StatusDocumentIcon,
  StatusBankIcon,
  StatusBoxIcon,
  StatusTrendUpIcon,
  StatusTrendDownIcon,
  StatusTrendRightIcon,
  ActionSettingsIcon,
  StatusFreeIcon,
  StatusBusinessIcon,
  StatusEnterpriseIcon,
  StatusWaveIcon
} from './StatusConnectionIcon';

// Navigation icons
export { LiveMenuToggleIcon, LiveBackIcon } from './NavigationConnectionIcon';

// Form icons
export { ValidationIcon, PasswordToggleIcon, SearchInputIcon, AddRemoveIcon } from './FormConnectionIcon';

// Action icons
export { LikeIcon, BookmarkIcon, StarRating, ThumbsVote, SendIcon, ActionButton } from './ActionConnectionIcon';
export { LiveEditIcon, LiveDeleteIcon, LiveShareIcon, LiveCopyIcon } from './ActionConnectionIcon';

// Constants for backward compatibility
/** @deprecated Use ICON_SIZES from './ICONSIZES' instead */
export { ICON_SIZES as iconSizes } from './ICONSIZES';
/** @deprecated Use ICON_COLORS from './ICONSIZES' instead */
export { ICON_COLORS as iconColors } from './ICONSIZES';
/** @deprecated Use ICON_ANIMATIONS from './ICONSIZES' instead */
export { ICON_ANIMATIONS as iconAnimations } from './ICONSIZES';
