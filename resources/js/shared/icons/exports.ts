/**
 * Unified Icon Export System
 * Centralized exports with tree-shaking support and convenient access patterns
 */

import { createLiveIcon, createIconSet, DynamicIcon } from './utils';
import { iconRegistry } from './IconRegistry';

// Pre-created icon sets for common usage patterns
export const NavIcons = createIconSet([
  'nav-home',
  'nav-back',
  'nav-forward',
  'nav-up',
  'nav-down',
  'nav-left',
  'nav-right',
  'nav-menu',
  'nav-close'
]);

export const ActionIcons = createIconSet([
  'action-edit',
  'action-delete',
  'action-copy',
  'action-share',
  'action-download',
  'action-upload',
  'action-add',
  'action-view',
  'action-settings'
]);

export const FormIcons = createIconSet([
  'form-search',
  'form-filter',
  'form-calendar',
  'form-clock',
  'form-user',
  'form-email'
]);

export const StatusIcons = createIconSet([
  'status-success',
  'status-error',
  'status-warning',
  'status-info',
  'status-loading'
]);

// Individual icon exports for tree-shaking
// Navigation Icons
export const NavHomeIcon = createLiveIcon('nav-home');
export const NavBackIcon = createLiveIcon('nav-back');
export const NavForwardIcon = createLiveIcon('nav-forward');
export const NavUpIcon = createLiveIcon('nav-up');
export const NavDownIcon = createLiveIcon('nav-down');
export const NavLeftIcon = createLiveIcon('nav-left');
export const NavRightIcon = createLiveIcon('nav-right');
export const NavMenuIcon = createLiveIcon('nav-menu');
export const NavCloseIcon = createLiveIcon('nav-close');

// Action Icons
export const ActionEditIcon = createLiveIcon('action-edit');
export const ActionDeleteIcon = createLiveIcon('action-delete');
export const ActionCopyIcon = createLiveIcon('action-copy');
export const ActionShareIcon = createLiveIcon('action-share');
export const ActionDownloadIcon = createLiveIcon('action-download');
export const ActionUploadIcon = createLiveIcon('action-upload');
export const ActionAddIcon = createLiveIcon('action-add');
export const ActionViewIcon = createLiveIcon('action-view');
export const ActionSettingsIcon = createLiveIcon('action-settings');

// Form Icons
export const FormSearchIcon = createLiveIcon('form-search');
export const FormFilterIcon = createLiveIcon('form-filter');
export const FormCalendarIcon = createLiveIcon('form-calendar');
export const FormClockIcon = createLiveIcon('form-clock');
export const FormUserIcon = createLiveIcon('form-user');
export const FormEmailIcon = createLiveIcon('form-email');

// Status Icons
export const StatusSuccessIcon = createLiveIcon('status-success');
export const StatusErrorIcon = createLiveIcon('status-error');
export const StatusWarningIcon = createLiveIcon('status-warning');
export const StatusInfoIcon = createLiveIcon('status-info');
export const StatusLoadingIcon = createLiveIcon('status-loading');

// Convenience aliases for common icons (backward compatibility)
export const HomeIcon = NavHomeIcon;
export const BackIcon = NavBackIcon;
export const EditIcon = ActionEditIcon;
export const DeleteIcon = ActionDeleteIcon;
export const AddIcon = ActionAddIcon;
export const SearchIcon = FormSearchIcon;
export const LoadingIcon = StatusLoadingIcon;
export const SuccessIcon = StatusSuccessIcon;
export const ErrorIcon = StatusErrorIcon;

// Dynamic icon component export
export { DynamicIcon };

// Icon registry access
export { iconRegistry };

// Utility exports
export {
  createLiveIcon,
  createIconSet,
  preloadIcons,
  iconExists,
  getIconSuggestions,
  createIconPerformanceMonitor,
  ICON_SIZES,
  ICON_COLORS,
  ICON_ANIMATIONS
} from './utils';

// Type exports
export type {
  IconProps,
  IconCategory,
  IconRegistryEntry,
  IconRegistry
} from './types';

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
