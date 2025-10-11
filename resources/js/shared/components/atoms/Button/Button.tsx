import React, { memo, forwardRef } from 'react';
import {
    Button as ChakraButton,
    ButtonProps as ChakraButtonProps,
    Spinner,
} from '@chakra-ui/react';

export interface ButtonProps extends Omit<ChakraButtonProps, 'size'> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
    children: React.ReactNode;
}

/**
 * Enhanced Button component with consistent styling and loading states
 * Optimized with React.memo for performance
 */
export const Button = memo(
    forwardRef<HTMLButtonElement, ButtonProps>(
        (
            {
                variant = 'primary',
                size = 'md',
                loading = false,
                disabled = false,
                leftIcon,
                rightIcon,
                fullWidth = false,
                children,
                onClick,
                ...props
            },
            ref
        ) => {
            // Variant mapping to Chakra UI variants
            const variantMap = {
                primary: 'solid',
                secondary: 'outline',
                danger: 'solid',
                ghost: 'ghost',
                outline: 'outline',
            };

            // Color scheme mapping
            const colorSchemeMap = {
                primary: 'blue',
                secondary: 'gray',
                danger: 'red',
                ghost: 'gray',
                outline: 'blue',
            };

            // Size mapping
            const sizeMap = {
                sm: 'sm',
                md: 'md',
                lg: 'lg',
            };

            const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
                if (loading || disabled) {
                    event.preventDefault();
                    return;
                }
                onClick?.(event);
            };

            return (
                <ChakraButton
                    ref={ref}
                    variant={variantMap[variant]}
                    colorScheme={colorSchemeMap[variant]}
                    size={sizeMap[size]}
                    isDisabled={disabled || loading}
                    isLoading={loading}
                    loadingText={loading ? children : undefined}
                    spinner={loading ? <Spinner size='sm' /> : undefined}
                    leftIcon={!loading ? leftIcon : undefined}
                    rightIcon={!loading ? rightIcon : undefined}
                    width={fullWidth ? 'full' : 'auto'}
                    onClick={handleClick}
                    {...props}
                >
                    {children}
                </ChakraButton>
            );
        }
    )
);

Button.displayName = 'Button';
