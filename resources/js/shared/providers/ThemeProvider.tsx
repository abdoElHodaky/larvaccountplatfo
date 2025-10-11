/**
 * Theme Provider for Headless UI + Tailwind CSS
 * Replaces Chakra UI's ChakraProvider with lightweight theme context
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeContextType, designTokens, themeUtils } from '../theme/headlessTheme';

// Theme Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider Props
interface ThemeProviderProps {
    children: ReactNode;
    defaultColorMode?: 'light' | 'dark';
    useSystemColorMode?: boolean;
}

// Theme Provider Component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
    defaultColorMode = 'light',
    useSystemColorMode = true,
}) => {
    const [colorMode, setColorMode] = useState<'light' | 'dark'>(() => {
        // Check for saved preference
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme-color-mode');
            if (saved === 'light' || saved === 'dark') {
                return saved;
            }

            // Use system preference if enabled
            if (useSystemColorMode && window.matchMedia) {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
        }

        return defaultColorMode;
    });

    // Toggle color mode
    const toggleColorMode = () => {
        setColorMode((prev) => {
            const newMode = prev === 'light' ? 'dark' : 'light';

            // Save to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('theme-color-mode', newMode);
            }

            return newMode;
        });
    };

    // Apply theme to document
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;

        // Set data-theme attribute
        root.setAttribute('data-theme', colorMode);

        // Add/remove dark class for Tailwind
        if (colorMode === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Inject CSS variables
        const styleId = 'theme-css-variables';
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = themeUtils.generateCSSVariables();
    }, [colorMode]);

    // Listen for system color mode changes
    useEffect(() => {
        if (!useSystemColorMode || typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            // Only update if no manual preference is saved
            const saved = localStorage.getItem('theme-color-mode');
            if (!saved) {
                setColorMode(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [useSystemColorMode]);

    const contextValue: ThemeContextType = {
        colorMode,
        toggleColorMode,
        colors: designTokens.colors,
        spacing: designTokens.spacing,
        fontSize: designTokens.fontSize,
        borderRadius: designTokens.borderRadius,
        boxShadow: designTokens.boxShadow,
        zIndex: designTokens.zIndex,
    };

    return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

// Hook to use theme context
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Hook for color mode (replaces Chakra UI's useColorMode)
export const useColorMode = () => {
    const { colorMode, toggleColorMode } = useTheme();
    return { colorMode, toggleColorMode };
};

// Utility hook to replace Chakra UI's useColorModeValue
export const useColorModeValue = <T,>(lightValue: T, darkValue: T): T => {
    const { colorMode } = useTheme();
    return colorMode === 'light' ? lightValue : darkValue;
};

// Color mode toggle button component
interface ColorModeToggleProps {
    className?: string;
}

export const ColorModeToggle: React.FC<ColorModeToggleProps> = ({ className }) => {
    const { colorMode, toggleColorMode } = useColorMode();

    return (
        <button
            onClick={toggleColorMode}
            className={`p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${className || ''}`}
            aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
        >
            {colorMode === 'light' ? (
                // Moon icon for dark mode
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
                    />
                </svg>
            ) : (
                // Sun icon for light mode
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                    />
                </svg>
            )}
        </button>
    );
};

export default ThemeProvider;
