/**
 * Unified LiveIcons Integration - Phase 6 (Simplified & Enhanced)
 * Centralized icon system with improved performance and simplified naming
 */

// Re-export types for convenience
export type { IconProps, IconCategory, IconRegistryEntry } from './ICONSIZES';

// Legacy type alias for backward compatibility
export type LiveIconProps = IconProps;

// Re-export core icon creation utilities from CreateLiveIcon
export {
  createLiveIcon,
  DynamicIcon,
  preloadIcons,
  iconExists,
  getIconSuggestions,
  iconRegistry,
  createIconPerformanceMonitor
} from './CreateLiveIcon';

// Re-export icon sets from NavIcons.ts (the source of truth)
export { NavIcons, ActionIcons, FormIcons, StatusIcons } from './NavIcons';

// Individual icon exports for tree-shaking (from NavIcons.ts)
// Navigation Icons
export {
  NavHomeIcon,
  NavBackIcon,
  NavForwardIcon,
  NavUpIcon,
  NavDownIcon,
  NavLeftIcon,
  NavRightIcon,
  NavMenuIcon,
  NavCloseIcon
} from './NavIcons';

// Action Icons (from ActionAnimations.tsx)
export {
  ActionEditIcon,
  ActionDeleteIcon,
  ActionCopyIcon,
  ActionShareIcon,
  ActionDownloadIcon,
  ActionUploadIcon,
  ActionAddIcon,
  ActionViewIcon,
  ActionSettingsIcon,
  LiveEditIcon,
  LiveDeleteIcon,
  LiveShareIcon
} from './ActionAnimations';

// Form Icons (from FormAnimations.tsx)
export {
  FormSearchIcon,
  FormFilterIcon,
  FormCalendarIcon,
  FormClockIcon,
  FormUserIcon,
  FormEmailIcon,
  ValidationIcon,
  PasswordToggleIcon,
  SearchInputIcon,
  AddRemoveIcon
} from './FormAnimations';

// Status Icons (from StatusAnimations.tsx)
export {
  StatusSuccessIcon,
  StatusErrorIcon,
  StatusWarningIcon,
  StatusInfoIcon,
  StatusLoadingIcon,
  StatusChartIcon,
  StatusDocumentIcon,
  StatusBankIcon,
  StatusBoxIcon,
  StatusTrendUpIcon,
  StatusTrendDownIcon,
  StatusTrendRightIcon,
  StatusFreeIcon,
  StatusBusinessIcon,
  StatusEnterpriseIcon,
  StatusWaveIcon
} from './StatusAnimations';

// Convenience aliases for common icons (backward compatibility)
export { HomeIcon } from './NavIcons';
export { BackIcon } from './NavIcons';
export { EditIcon } from './ActionAnimations';
export { DeleteIcon } from './ActionAnimations';
export { AddIcon } from './ActionAnimations';
export { SearchIcon } from './FormAnimations';
export { LoadingIcon } from './StatusAnimations';
export { SuccessIcon } from './StatusAnimations';
export { ErrorIcon } from './StatusAnimations';

// Constants for backward compatibility
export { ICON_SIZES, ICON_COLORS, ICON_ANIMATIONS } from './ICONSIZES';

// Type exports (already exported above, but keep for clarity if needed)
// export type { IconProps, IconCategory, IconRegistryEntry } from './ICONSIZES';

// All available icons map for dynamic access
export const ALL_ICONS = {
  // Navigation
  'nav-home': NavHomeIcon,
  'nav-back': NavBackIcon,
  'nav-forward': NavForwardIcon,
  'nav-up': NavUpIcon,
  'nav-down': NavDownIcon,
  'nav-left': NavLeftIcon,
  'nav-right': NavRightIcon,
  'nav-menu': NavMenuIcon,
  'nav-close': NavCloseIcon,

  // Actions
  'action-edit': ActionEditIcon,
  'action-delete': ActionDeleteIcon,
  'action-copy': ActionCopyIcon,
  'action-share': ActionShareIcon,
  'action-download': ActionDownloadIcon,
  'action-upload': ActionUploadIcon,
  'action-add': ActionAddIcon,
  'action-view': ActionViewIcon,
  'action-settings': ActionSettingsIcon,

  // Forms
  'form-search': FormSearchIcon,
  'form-filter': FormFilterIcon,
  'form-calendar': FormCalendarIcon,
  'form-clock': FormClockIcon,
  'form-user': FormUserIcon,
  'form-email': FormEmailIcon,

  // Status
  'status-success': StatusSuccessIcon,
  'status-error': StatusErrorIcon,
  'status-warning': StatusWarningIcon,
  'status-info': StatusInfoIcon,
  'status-loading': StatusLoadingIcon
} as const;

// Helper function to get icon by name
export const getIcon = (iconName: keyof typeof ALL_ICONS) => {
  return ALL_ICONS[iconName];
};

// Helper function to check if icon exists
export const hasIcon = (iconName: string): iconName is keyof typeof ALL_ICONS => {
  return iconName in ALL_ICONS;
};