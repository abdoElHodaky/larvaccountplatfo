import React, { memo, forwardRef } from 'react';
import { Button as ChakraButton, Spinner } from '@chakra-ui/react';

type ChakraButtonProps = React.ComponentProps<typeof ChakraButton>;

export type ButtonProps =
  Omit<ChakraButtonProps, 'variant' | 'size'> & {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
    children: React.ReactNode;
  };

/**
 * Enhanced Button component with consistent styling and loading states
 * Optimized with React.memo for performance
 */
export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    onClick,
    colorScheme,
    ...props
  }, ref) => {
    const getChakraVariant = (v: ButtonProps['variant'] | undefined): NonNullable<ChakraButtonProps['variant']> => {
      switch (v) {
        case 'primary': return 'solid';
        case 'secondary': return 'outline';
        case 'danger': return 'solid';
        case 'ghost': return 'ghost';
        case 'outline': return 'outline';
        default: return 'solid';
      }
    };

    const getChakraColorScheme = (v: ButtonProps['variant'] | undefined, cs: ButtonProps['colorScheme'] | undefined): NonNullable<ChakraButtonProps['colorScheme']> => {
      if (cs !== undefined) {
        return cs;
      }
      switch (v) {
        case 'primary': return 'blue';
        case 'secondary': return 'gray';
        case 'danger': return 'red';
        case 'ghost': return 'gray';
        case 'outline': return 'blue';
        default: return 'blue';
      }
    };

    const getChakraSize = (s: ButtonProps['size'] | undefined): NonNullable<ChakraButtonProps['size']> => {
      switch (s) {
        case 'sm': return 'sm';
        case 'md': return 'md';
        case 'lg': return 'lg';
        default: return 'md';
      }
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
        variant={getChakraVariant(variant)}
        colorScheme={getChakraColorScheme(variant, colorScheme)}
        size={getChakraSize(size)}
        isDisabled={disabled || loading}
        isLoading={loading}
        loadingText={loading ? children : undefined}
        spinner={loading ? <Spinner size="sm" /> : undefined}
        leftIcon={!loading ? leftIcon : undefined}
        rightIcon={!loading ? rightIcon : undefined}
        width={fullWidth ? 'full' : 'auto'}
        onClick={handleClick}
        {...props}
      >
        {children}
      </ChakraButton>
    );
  })
);

Button.displayName = 'Button';