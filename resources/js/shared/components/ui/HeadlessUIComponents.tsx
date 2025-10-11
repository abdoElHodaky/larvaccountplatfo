/**
 * Headless UI + Tailwind CSS Components
 * Replaces Chakra UI components with optimized Headless UI alternatives
 * Maintains API compatibility while reducing bundle size
 */

import React, { forwardRef, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import { Dialog, Transition, Switch, Listbox, Combobox } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { ChevronUpDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { clsx } from 'clsx';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Utility function to combine class names
 */
const cn = (...classes: (string | undefined | null | false)[]): string => {
    return clsx(classes);
};

/**
 * Color mode utilities (replaces useColorModeValue)
 */
export const useColorModeValue = (lightValue: string, darkValue: string): string => {
    // Check if dark mode is enabled via data-theme attribute or class
    const isDark =
        typeof window !== 'undefined' &&
        (document.documentElement.getAttribute('data-theme') === 'dark' ||
            document.documentElement.classList.contains('dark'));

    return isDark ? darkValue : lightValue;
};

// =============================================================================
// BOX COMPONENT (replaces Chakra UI Box)
// =============================================================================

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
    as?: keyof JSX.IntrinsicElements;
    children?: ReactNode;
}

export const Box = forwardRef<HTMLDivElement, BoxProps>(
    ({ as: Component = 'div', className, children, ...props }, ref) => {
        return (
            <Component ref={ref} className={cn(className)} {...props}>
                {children}
            </Component>
        );
    }
);

Box.displayName = 'Box';

// =============================================================================
// BUTTON COMPONENT (replaces Chakra UI Button)
// =============================================================================

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'solid' | 'outline' | 'ghost' | 'link';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    colorScheme?: 'primary' | 'asset' | 'liability' | 'gray' | 'red' | 'green' | 'blue';
    isLoading?: boolean;
    isDisabled?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'solid',
            size = 'md',
            colorScheme = 'primary',
            isLoading = false,
            isDisabled = false,
            leftIcon,
            rightIcon,
            className,
            children,
            ...props
        },
        ref
    ) => {
        const baseClasses =
            'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

        const sizeClasses = {
            xs: 'px-2.5 py-1.5 text-xs rounded',
            sm: 'px-3 py-2 text-sm rounded-md',
            md: 'px-4 py-2 text-sm rounded-md',
            lg: 'px-4 py-2 text-base rounded-md',
            xl: 'px-6 py-3 text-base rounded-md',
        };

        const variantClasses = {
            solid: {
                primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
                asset: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
                liability: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
                gray: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
                red: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
                green: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
                blue: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
            },
            outline: {
                primary:
                    'border border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
                asset: 'border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
                liability: 'border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
                gray: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
                red: 'border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
                green: 'border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
                blue: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
            },
            ghost: {
                primary: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
                asset: 'text-green-600 hover:bg-green-50 focus:ring-green-500',
                liability: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
                gray: 'text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
                red: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
                green: 'text-green-600 hover:bg-green-50 focus:ring-green-500',
                blue: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
            },
            link: {
                primary:
                    'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline focus:ring-primary-500',
                asset: 'text-green-600 hover:text-green-700 underline-offset-4 hover:underline focus:ring-green-500',
                liability:
                    'text-red-600 hover:text-red-700 underline-offset-4 hover:underline focus:ring-red-500',
                gray: 'text-gray-700 hover:text-gray-800 underline-offset-4 hover:underline focus:ring-gray-500',
                red: 'text-red-600 hover:text-red-700 underline-offset-4 hover:underline focus:ring-red-500',
                green: 'text-green-600 hover:text-green-700 underline-offset-4 hover:underline focus:ring-green-500',
                blue: 'text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline focus:ring-blue-500',
            },
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseClasses,
                    sizeClasses[size],
                    variantClasses[variant][colorScheme],
                    className
                )}
                disabled={isDisabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <svg
                        className='animate-spin -ml-1 mr-2 h-4 w-4'
                        fill='none'
                        viewBox='0 0 24 24'
                    >
                        <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                        />
                        <path
                            className='opacity-75'
                            fill='currentColor'
                            d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        />
                    </svg>
                )}
                {leftIcon && <span className='mr-2'>{leftIcon}</span>}
                {children}
                {rightIcon && <span className='ml-2'>{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';

// =============================================================================
// INPUT COMPONENT (replaces Chakra UI Input)
// =============================================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'outline' | 'filled' | 'flushed';
    isInvalid?: boolean;
    isDisabled?: boolean;
    leftElement?: ReactNode;
    rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            size = 'md',
            variant = 'outline',
            isInvalid = false,
            isDisabled = false,
            leftElement,
            rightElement,
            className,
            ...props
        },
        ref
    ) => {
        const baseClasses =
            'block w-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';

        const sizeClasses = {
            xs: 'px-2 py-1 text-xs',
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-3 py-2 text-sm',
            lg: 'px-4 py-2 text-base',
        };

        const variantClasses = {
            outline: cn(
                'border rounded-md bg-white',
                isInvalid
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            ),
            filled: cn(
                'border-0 rounded-md',
                isInvalid
                    ? 'bg-red-50 focus:bg-red-100 focus:ring-red-500'
                    : 'bg-gray-50 focus:bg-white focus:ring-primary-500'
            ),
            flushed: cn(
                'border-0 border-b-2 rounded-none px-0',
                isInvalid
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            ),
        };

        if (leftElement || rightElement) {
            return (
                <div className='relative'>
                    {leftElement && (
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            {leftElement}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            baseClasses,
                            sizeClasses[size],
                            variantClasses[variant],
                            leftElement && 'pl-10',
                            rightElement && 'pr-10',
                            className
                        )}
                        disabled={isDisabled}
                        {...props}
                    />
                    {rightElement && (
                        <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                            {rightElement}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <input
                ref={ref}
                className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
                disabled={isDisabled}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';

// =============================================================================
// MODAL COMPONENT (replaces Chakra UI Modal)
// =============================================================================

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
    isCentered?: boolean;
    closeOnOverlayClick?: boolean;
    children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    size = 'md',
    isCentered = true,
    closeOnOverlayClick = true,
    children,
}) => {
    const sizeClasses = {
        xs: 'max-w-xs',
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        full: 'max-w-full',
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as='div'
                className='relative z-modal'
                onClose={closeOnOverlayClick ? onClose : () => {}}
            >
                <Transition.Child
                    as={Fragment}
                    enter='ease-out duration-300'
                    enterFrom='opacity-0'
                    enterTo='opacity-100'
                    leave='ease-in duration-200'
                    leaveFrom='opacity-100'
                    leaveTo='opacity-0'
                >
                    <div className='fixed inset-0 bg-black bg-opacity-25' />
                </Transition.Child>

                <div className='fixed inset-0 overflow-y-auto'>
                    <div
                        className={cn(
                            'flex min-h-full items-center justify-center p-4 text-center',
                            !isCentered && 'items-start pt-16'
                        )}
                    >
                        <Transition.Child
                            as={Fragment}
                            enter='ease-out duration-300'
                            enterFrom='opacity-0 scale-95'
                            enterTo='opacity-100 scale-100'
                            leave='ease-in duration-200'
                            leaveFrom='opacity-100 scale-100'
                            leaveTo='opacity-0 scale-95'
                        >
                            <Dialog.Panel
                                className={cn(
                                    'w-full transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all',
                                    sizeClasses[size]
                                )}
                            >
                                {children}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

// Modal sub-components
export const ModalHeader: React.FC<{ children: ReactNode; onClose?: () => void }> = ({
    children,
    onClose,
}) => (
    <div className='flex items-center justify-between mb-4'>
        <Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900'>
            {children}
        </Dialog.Title>
        {onClose && (
            <button
                type='button'
                className='rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
                onClick={onClose}
            >
                <XMarkIcon className='h-6 w-6' />
            </button>
        )}
    </div>
);

export const ModalBody: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div className='mb-4'>{children}</div>
);

export const ModalFooter: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div className='flex justify-end space-x-2 pt-4 border-t border-gray-200'>{children}</div>
);

// =============================================================================
// TEXT COMPONENT (replaces Chakra UI Text)
// =============================================================================

interface TextProps extends React.HTMLAttributes<HTMLElement> {
    as?: keyof JSX.IntrinsicElements;
    fontSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
    color?: string;
    children?: ReactNode;
}

export const Text = forwardRef<HTMLElement, TextProps>(
    (
        {
            as: Component = 'p',
            fontSize = 'md',
            fontWeight = 'normal',
            color,
            className,
            children,
            ...props
        },
        ref
    ) => {
        const fontSizeClasses = {
            xs: 'text-xs',
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-lg',
            xl: 'text-xl',
            '2xl': 'text-2xl',
            '3xl': 'text-3xl',
            '4xl': 'text-4xl',
            '5xl': 'text-5xl',
        };

        const fontWeightClasses = {
            normal: 'font-normal',
            medium: 'font-medium',
            semibold: 'font-semibold',
            bold: 'font-bold',
        };

        return (
            <Component
                ref={ref}
                className={cn(
                    fontSizeClasses[fontSize],
                    fontWeightClasses[fontWeight],
                    color && `text-${color}`,
                    className
                )}
                {...props}
            >
                {children}
            </Component>
        );
    }
);

Text.displayName = 'Text';

// =============================================================================
// EXPORTS
// =============================================================================

export { cn };

// Re-export Headless UI components for convenience
export { Dialog, Transition, Switch, Listbox, Combobox } from '@headlessui/react';
