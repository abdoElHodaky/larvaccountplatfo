/**
 * Container Component - Phase 6 Unified Design System
 *
 * A responsive container component that provides consistent max-width
 * and horizontal padding across different screen sizes.
 */

import React from 'react';
import { cn } from '@/shared/utils/cn';
import { designTokens } from '../tokens';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Maximum width variant */
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    /** Whether to center the container */
    centerContent?: boolean;
    /** Custom padding */
    padding?: keyof typeof designTokens.spacing;
    /** Whether to apply responsive padding */
    responsivePadding?: boolean;
}

const sizeClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
} as const;

export const Container: React.FC<ContainerProps> = ({
    size = 'xl',
    centerContent = true,
    padding,
    responsivePadding = true,
    className,
    children,
    ...props
}) => {
    const containerClasses = cn(
        // Base styles
        'w-full',

        // Size classes
        sizeClasses[size],

        // Centering
        centerContent && 'mx-auto',

        // Padding
        padding && `p-${padding}`,
        !padding && responsivePadding && 'px-4 sm:px-6 lg:px-8',

        // Custom classes
        className
    );

    return (
        <div className={containerClasses} {...props}>
            {children}
        </div>
    );
};
