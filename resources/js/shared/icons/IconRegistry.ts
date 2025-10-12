/**
 * Icon Registry - Centralized Icon Management
 * Provides a unified registry for all icons with lazy loading and tree-shaking support
 */

import React from 'react';
import type { IconRegistryEntry, IconCategory } from './ICONSIZES';

// Lazy loading imports for better performance

// Navigation Icons Registry
const NAV_ICONS: Record<string, Omit<IconRegistryEntry, 'component'> & { import: () => Promise<any> }> = {
  'nav-home': {
    name: 'nav-home',
    category: 'nav',
    defaultAnimation: 'pulse',
    description: 'Home navigation icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.HomeIcon }))
  },
  'nav-back': {
    name: 'nav-back',
    category: 'nav',
    defaultAnimation: 'bounce',
    description: 'Back navigation icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ArrowLeftIcon }))
  },
  'nav-forward': {
    name: 'nav-forward',
    category: 'nav',
    defaultAnimation: 'bounce',
    description: 'Forward navigation icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ArrowRightIcon }))
  },
  'nav-up': {
    name: 'nav-up',
    category: 'nav',
    defaultAnimation: 'bounce',
    description: 'Up navigation icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ChevronUpIcon }))
  },
  'nav-down': {
    name: 'nav-down',
    category: 'nav',
    defaultAnimation: 'bounce',
    description: 'Down navigation icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ChevronDownIcon }))
  },
  'nav-left': {
    name: 'nav-left',
    category: 'nav',
    defaultAnimation: 'bounce',
    description: 'Left navigation icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ChevronLeftIcon }))
  },
  'nav-right': {
    name: 'nav-right',
    category: 'nav',
    defaultAnimation: 'bounce',
    description: 'Right navigation icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ChevronRightIcon }))
  },
  'nav-menu': {
    name: 'nav-menu',
    category: 'nav',
    defaultAnimation: 'rotate',
    description: 'Menu toggle icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.Bars3Icon }))
  },
  'nav-close': {
    name: 'nav-close',
    category: 'nav',
    defaultAnimation: 'rotate',
    description: 'Close/X icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.XMarkIcon }))
  }
};

// Action Icons Registry
const ACTION_ICONS: Record<string, Omit<IconRegistryEntry, 'component'> & { import: () => Promise<any> }> = {
  'action-edit': {
    name: 'action-edit',
    category: 'action',
    defaultAnimation: 'bounce',
    description: 'Edit/pencil icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.PencilIcon }))
  },
  'action-delete': {
    name: 'action-delete',
    category: 'action',
    defaultAnimation: 'shake',
    description: 'Delete/trash icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.TrashIcon }))
  },
  'action-copy': {
    name: 'action-copy',
    category: 'action',
    defaultAnimation: 'pulse',
    description: 'Copy/duplicate icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.DocumentDuplicateIcon }))
  },
  'action-share': {
    name: 'action-share',
    category: 'action',
    defaultAnimation: 'bounce',
    description: 'Share icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ShareIcon }))
  },
  'action-download': {
    name: 'action-download',
    category: 'action',
    defaultAnimation: 'pulse',
    description: 'Download icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ArrowDownTrayIcon }))
  },
  'action-upload': {
    name: 'action-upload',
    category: 'action',
    defaultAnimation: 'pulse',
    description: 'Upload icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ArrowUpTrayIcon }))
  },
  'action-add': {
    name: 'action-add',
    category: 'action',
    defaultAnimation: 'bounce',
    description: 'Add/plus icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.PlusIcon }))
  },
  'action-view': {
    name: 'action-view',
    category: 'action',
    defaultAnimation: 'pulse',
    description: 'View/eye icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.EyeIcon }))
  },
  'action-settings': {
    name: 'action-settings',
    category: 'action',
    defaultAnimation: 'rotate',
    description: 'Settings/cog icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.Cog6ToothIcon }))
  }
};

// Form Icons Registry
const FORM_ICONS: Record<string, Omit<IconRegistryEntry, 'component'> & { import: () => Promise<any> }> = {
  'form-search': {
    name: 'form-search',
    category: 'form',
    defaultAnimation: 'pulse',
    description: 'Search/magnifying glass icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.MagnifyingGlassIcon }))
  },
  'form-filter': {
    name: 'form-filter',
    category: 'form',
    defaultAnimation: 'bounce',
    description: 'Filter/funnel icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.FunnelIcon }))
  },
  'form-calendar': {
    name: 'form-calendar',
    category: 'form',
    defaultAnimation: 'pulse',
    description: 'Calendar icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.CalendarIcon }))
  },
  'form-clock': {
    name: 'form-clock',
    category: 'form',
    defaultAnimation: 'pulse',
    description: 'Clock/time icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ClockIcon }))
  },
  'form-user': {
    name: 'form-user',
    category: 'form',
    defaultAnimation: 'pulse',
    description: 'User icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.UserIcon }))
  },
  'form-email': {
    name: 'form-email',
    category: 'form',
    defaultAnimation: 'pulse',
    description: 'Email/envelope icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.EnvelopeIcon }))
  }
};

// Status Icons Registry
const STATUS_ICONS: Record<string, Omit<IconRegistryEntry, 'component'> & { import: () => Promise<any> }> = {
  'status-success': {
    name: 'status-success',
    category: 'status',
    defaultAnimation: 'success',
    description: 'Success/check icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.CheckCircleIcon }))
  },
  'status-error': {
    name: 'status-error',
    category: 'status',
    defaultAnimation: 'error',
    description: 'Error/X icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.XCircleIcon }))
  },
  'status-warning': {
    name: 'status-warning',
    category: 'status',
    defaultAnimation: 'shake',
    description: 'Warning/exclamation icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ExclamationTriangleIcon }))
  },
  'status-info': {
    name: 'status-info',
    category: 'status',
    defaultAnimation: 'pulse',
    description: 'Info/information icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.InformationCircleIcon }))
  },
  'status-loading': {
    name: 'status-loading',
    category: 'status',
    defaultAnimation: 'loading',
    description: 'Loading/spinner icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ArrowPathIcon }))
  },
  'status-chart': {
    name: 'status-chart',
    category: 'status',
    defaultAnimation: 'pulse',
    description: 'Chart/analytics icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ChartBarIcon }))
  },
  'status-document': {
    name: 'status-document',
    category: 'status',
    defaultAnimation: 'pulse',
    description: 'Document icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.DocumentIcon }))
  },
  'status-bank': {
    name: 'status-bank',
    category: 'status',
    defaultAnimation: 'pulse',
    description: 'Bank/building icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.BuildingLibraryIcon }))
  },
  'status-box': {
    name: 'status-box',
    category: 'status',
    defaultAnimation: 'bounce',
    description: 'Box/package icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.CubeIcon }))
  },
  'status-trend-up': {
    name: 'status-trend-up',
    category: 'status',
    defaultAnimation: 'bounce',
    description: 'Trending up icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.TrendingUpIcon }))
  },
  'status-trend-down': {
    name: 'status-trend-down',
    category: 'status',
    defaultAnimation: 'bounce',
    description: 'Trending down icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.TrendingDownIcon }))
  },
  'status-trend-right': {
    name: 'status-trend-right',
    category: 'status',
    defaultAnimation: 'bounce',
    description: 'Trending right icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ArrowRightIcon }))
  },
  'status-free': {
    name: 'status-free',
    category: 'status',
    defaultAnimation: 'pulse',
    description: 'Free/gift icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.GiftIcon }))
  },
  'status-business': {
    name: 'status-business',
    category: 'status',
    defaultAnimation: 'pulse',
    description: 'Business/briefcase icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.BriefcaseIcon }))
  },
  'status-enterprise': {
    name: 'status-enterprise',
    category: 'status',
    defaultAnimation: 'pulse',
    description: 'Enterprise/building icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.BuildingOfficeIcon }))
  },
  'status-wave': {
    name: 'status-wave',
    category: 'status',
    defaultAnimation: 'wave',
    description: 'Wave/greeting icon',
    import: () => import('@heroicons/react/24/outline').then(m => ({ default: m.HandRaisedIcon }))
  }
};

// Combined registry
const ICON_REGISTRY_DATA = {
  ...NAV_ICONS,
  ...ACTION_ICONS,
  ...FORM_ICONS,
  ...STATUS_ICONS
};

// Icon registry class for managing icons
export class IconRegistryManager {
  private static instance: IconRegistryManager;
  private loadedIcons: Map<string, React.ComponentType<any>> = new Map();
  private loadingPromises: Map<string, Promise<React.ComponentType<any>>> = new Map();

  private constructor() {}

  static getInstance(): IconRegistryManager {
    if (!IconRegistryManager.instance) {
      IconRegistryManager.instance = new IconRegistryManager();
    }
    return IconRegistryManager.instance;
  }

  // Get all available icon names
  getAvailableIcons(): string[] {
    return Object.keys(ICON_REGISTRY_DATA);
  }

  // Get icons by category
  getIconsByCategory(category: IconCategory): string[] {
    return Object.entries(ICON_REGISTRY_DATA)
      .filter(([_, entry]) => entry.category === category)
      .map(([name]) => name);
  }

  // Get icon metadata
  getIconMetadata(iconName: string): Omit<IconRegistryEntry, 'component'> | null {
    const entry = ICON_REGISTRY_DATA[iconName];
    if (!entry) return null;
    
    return {
      name: entry.name,
      category: entry.category,
      defaultAnimation: entry.defaultAnimation,
      description: entry.description
    };
  }

  // Load icon component (with caching)
  async loadIcon(iconName: string): Promise<React.ComponentType<any> | null> {
    // Return cached component if available
    if (this.loadedIcons.has(iconName)) {
      return this.loadedIcons.get(iconName)!;
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(iconName)) {
      return this.loadingPromises.get(iconName)!;
    }

    // Check if icon exists in registry
    const entry = ICON_REGISTRY_DATA[iconName];
    if (!entry) {
      console.warn(`Icon "${iconName}" not found in registry`);
      return null;
    }

    // Create loading promise
    const loadingPromise = entry.import()
      .then(module => {
        const component = module.default;
        this.loadedIcons.set(iconName, component);
        this.loadingPromises.delete(iconName);
        return component;
      })
      .catch(error => {
        console.error(`Failed to load icon "${iconName}":`, error);
        this.loadingPromises.delete(iconName);
        return null;
      });

    this.loadingPromises.set(iconName, loadingPromise);
    return loadingPromise;
  }

  // Preload icons for better performance
  async preloadIcons(iconNames: string[]): Promise<void> {
    const loadPromises = iconNames.map(name => this.loadIcon(name));
    await Promise.all(loadPromises);
  }

  // Preload icons by category
  async preloadCategory(category: IconCategory): Promise<void> {
    const iconNames = this.getIconsByCategory(category);
    await this.preloadIcons(iconNames);
  }
}

// Export singleton instance
export const iconRegistry = IconRegistryManager.getInstance();

// Export registry data for static analysis
export { ICON_REGISTRY_DATA };
