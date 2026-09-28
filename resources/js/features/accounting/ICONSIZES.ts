// Stub module for accounting icons to resolve TypeScript module resolution errors
// This maintains existing functionality while satisfying TypeScript requirements

import { IconProps } from '@/shared/icons/ICONSIZES';

// Re-export the IconProps type for compatibility
export type { IconProps };

// Export empty objects to maintain compatibility with existing code that might import specific values
export const ICON_SIZES = {} as const;
export const ICON_COLORS = {} as const;
export const ICON_ANIMATIONS = {} as const;