import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { accountingColors } from './colors';
import { components } from './components';

/**
 * Custom Chakra UI Theme for Laravel Accounting Platform
 * Integrates accounting-specific colors, components, and design tokens
 */

// Theme configuration
const config: ThemeConfig = {
    initialColorMode: 'light',
    useSystemColorMode: true,
    disableTransitionOnChange: false,
};

// Typography configuration
const fonts = {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
    mono: `'JetBrains Mono', 'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace`,
};

// Font sizes optimized for financial data
const fontSizes = {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    md: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem', // 72px
    '8xl': '6rem', // 96px
    '9xl': '8rem', // 128px
};

// Font weights
const fontWeights = {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
};

// Line heights optimized for readability
const lineHeights = {
    normal: 'normal',
    none: 1,
    shorter: 1.25,
    short: 1.375,
    base: 1.5,
    tall: 1.625,
    taller: '2',
    '3': '.75rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '7': '1.75rem',
    '8': '2rem',
    '9': '2.25rem',
    '10': '2.5rem',
};

// Spacing scale
const space = {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    18: '4.5rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
};

// Border radius
const radii = {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
};

// Shadows optimized for financial interfaces
const shadows = {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    outline: '0 0 0 3px rgba(66, 153, 225, 0.6)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
    // Custom shadows for financial data
    'data-card': '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 4px 12px -4px rgba(0, 0, 0, 0.05)',
    profit: '0 4px 12px -2px rgba(34, 197, 94, 0.2)',
    loss: '0 4px 12px -2px rgba(239, 68, 68, 0.2)',
    neutral: '0 4px 12px -2px rgba(100, 116, 139, 0.15)',
};

// Breakpoints for responsive design
const breakpoints = {
    base: '0em', // 0px
    sm: '30em', // 480px
    md: '48em', // 768px
    lg: '62em', // 992px
    xl: '80em', // 1280px
    '2xl': '96em', // 1536px
};

// Z-index scale
const zIndices = {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
};

// Global styles
const styles = {
    global: (props: any) => ({
        body: {
            fontFamily: 'body',
            color: props.colorMode === 'dark' ? 'white' : 'gray.800',
            bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
            lineHeight: 'base',
            fontFeatureSettings: '"tnum"', // Tabular numbers for financial data
        },
        '*::placeholder': {
            color: props.colorMode === 'dark' ? 'gray.400' : 'gray.400',
        },
        '*, *::before, &::after': {
            borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
            wordWrap: 'break-word',
        },
        // Custom scrollbar styles
        '::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
        },
        '::-webkit-scrollbar-track': {
            bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.100',
        },
        '::-webkit-scrollbar-thumb': {
            bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
            borderRadius: 'md',
        },
        '::-webkit-scrollbar-thumb:hover': {
            bg: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
        },
    }),
};

// Semantic tokens for consistent theming
const semanticTokens = {
    colors: {
        // Background colors
        'bg-canvas': {
            default: 'gray.50',
            _dark: 'gray.900',
        },
        'bg-surface': {
            default: 'white',
            _dark: 'gray.800',
        },
        'bg-subtle': {
            default: 'gray.100',
            _dark: 'gray.700',
        },
        'bg-muted': {
            default: 'gray.200',
            _dark: 'gray.600',
        },

        // Text colors
        'text-default': {
            default: 'gray.900',
            _dark: 'gray.100',
        },
        'text-muted': {
            default: 'gray.600',
            _dark: 'gray.400',
        },
        'text-subtle': {
            default: 'gray.500',
            _dark: 'gray.500',
        },

        // Border colors
        'border-default': {
            default: 'gray.200',
            _dark: 'gray.600',
        },
        'border-muted': {
            default: 'gray.100',
            _dark: 'gray.700',
        },

        // Financial semantic colors
        'financial-positive': {
            default: 'asset.600',
            _dark: 'asset.400',
        },
        'financial-negative': {
            default: 'liability.600',
            _dark: 'liability.400',
        },
        'financial-neutral': {
            default: 'gray.600',
            _dark: 'gray.400',
        },
    },
};

// Create the theme
const theme = extendTheme({
    config,
    colors: accountingColors,
    fonts,
    fontSizes,
    fontWeights,
    lineHeights,
    space,
    radii,
    shadows,
    breakpoints,
    zIndices,
    styles,
    semanticTokens,
    components,
});

export default theme;
export { accountingColors, config };
export type { ThemeConfig };
