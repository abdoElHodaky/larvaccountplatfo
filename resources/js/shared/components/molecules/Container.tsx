import React, { Fragment, memo, useMemo } from 'react';
import { Box, BoxProps, useColorModeValue } from '@chakra-ui/react';

/**
 * Performance-Optimized Container Component
 * Uses React.Fragment patterns and memoization for financial data containers
 */

interface ContainerProps extends Omit<BoxProps, 'children'> {
    children: React.ReactNode;
    variant?: 'default' | 'card' | 'section' | 'financial';
    withBorder?: boolean;
    withShadow?: boolean;
    withPadding?: boolean;
    className?: string;
}

export const Container: React.FC<ContainerProps> = memo(
    ({
        children,
        variant = 'default',
        withBorder = false,
        withShadow = false,
        withPadding = true,
        className,
        ...boxProps
    }) => {
        // Memoized color values for performance
        const bgColor = useColorModeValue('bg-surface', 'bg-surface');
        const borderColor = useColorModeValue('border-default', 'border-default');

        // Memoized variant styles to prevent unnecessary recalculations
        const variantStyles = useMemo(() => {
            const baseStyles = {
                bg: bgColor,
                borderRadius: 'lg',
            };

            switch (variant) {
                case 'card':
                    return {
                        ...baseStyles,
                        boxShadow: 'sm',
                        border: '1px solid',
                        borderColor,
                        p: withPadding ? 6 : 0,
                    };

                case 'section':
                    return {
                        ...baseStyles,
                        border: withBorder ? '1px solid' : 'none',
                        borderColor: withBorder ? borderColor : 'transparent',
                        boxShadow: withShadow ? 'sm' : 'none',
                        p: withPadding ? 8 : 0,
                    };

                case 'financial':
                    return {
                        ...baseStyles,
                        boxShadow: 'data-card',
                        border: '1px solid',
                        borderColor,
                        p: withPadding ? 6 : 0,
                        fontVariantNumeric: 'lining-nums tabular-nums',
                    };

                default:
                    return {
                        ...baseStyles,
                        border: withBorder ? '1px solid' : 'none',
                        borderColor: withBorder ? borderColor : 'transparent',
                        boxShadow: withShadow ? 'sm' : 'none',
                        p: withPadding ? 4 : 0,
                    };
            }
        }, [variant, bgColor, borderColor, withBorder, withShadow, withPadding]);

        return (
            <Box {...variantStyles} {...boxProps} className={className}>
                {children}
            </Box>
        );
    }
);

Container.displayName = 'Container';

/**
 * Specialized Financial Container Component
 * Optimized for displaying financial data with proper number formatting
 */
export const FinancialContainer: React.FC<Omit<ContainerProps, 'variant'>> = memo((props) => {
    return <Container {...props} variant='financial' />;
});

FinancialContainer.displayName = 'FinancialContainer';

/**
 * Card Container Component with Fragment optimization
 * Uses React.Fragment for header, body, and footer sections
 */
interface CardContainerProps extends Omit<ContainerProps, 'variant'> {
    header?: React.ReactNode;
    footer?: React.ReactNode;
}

export const CardContainer: React.FC<CardContainerProps> = memo(
    ({ children, header, footer, ...props }) => {
        const borderColor = useColorModeValue('border-default', 'border-default');

        return (
            <Container {...props} variant='card' withPadding={false}>
                {/* Header Section - Use Fragment to avoid unnecessary wrapper */}
                {header && (
                    <Fragment>
                        <Box px={6} py={4} borderBottom='1px solid' borderColor={borderColor}>
                            {header}
                        </Box>
                    </Fragment>
                )}

                {/* Body Section */}
                <Box px={6} py={4}>
                    {children}
                </Box>

                {/* Footer Section - Use Fragment to avoid unnecessary wrapper */}
                {footer && (
                    <Fragment>
                        <Box px={6} py={4} borderTop='1px solid' borderColor={borderColor}>
                            {footer}
                        </Box>
                    </Fragment>
                )}
            </Container>
        );
    }
);

CardContainer.displayName = 'CardContainer';

export default Container;
