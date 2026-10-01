// Icon size constants for accounting module
export const ICON_SIZES = {
  SMALL: 16,
  MEDIUM: 24,
  LARGE: 32,
  EXTRA_LARGE: 48,
} as const;

export type IconSize = typeof ICON_SIZES[keyof typeof ICON_SIZES];

export default ICON_SIZES;