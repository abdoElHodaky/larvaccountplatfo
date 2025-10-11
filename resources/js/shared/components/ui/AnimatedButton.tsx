/**
 * AnimatedButton Component
 * Enhanced button with micro-interactions and React.Fragment optimization
 */

import React, { Fragment, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationPerformance } from '../../hooks/useAnimationPerformance';
import { FragmentAnimationWrapper } from '../animation/FragmentAnimationWrapper';

export interface AnimatedButtonProps {
    children: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    disabled?: boolean;
    loading?: boolean;
    loadingText?: string;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    className?: string;
    fullWidth?: boolean;
    rounded?: boolean;
    enableHoverEffects?: boolean;
    enableTapEffects?: boolean;
    enableLoadingAnimation?: boolean;
    rippleEffect?: boolean;
    glowEffect?: boolean;
    id?: string;
    'aria-label'?: string;
    'data-testid'?: string;
}

/**
 * Enhanced animated button with micro-interactions
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
    children,
    onClick,
    onMouseEnter,
    onMouseLeave,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    loadingText = 'Loading...',
    icon,
    rightIcon,
    className = '',
    fullWidth = false,
    rounded = false,
    enableHoverEffects = true,
    enableTapEffects = true,
    enableLoadingAnimation = true,
    rippleEffect = false,
    glowEffect = false,
    id,
    'aria-label': ariaLabel,
    'data-testid': testId,
}) => {
    const { shouldAnimate, animationLevel } = useAnimationPerformance();
    const [isHovered, setIsHovered] = useState(false);
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const rippleIdRef = useRef(0);

    // Handle mouse events
    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
        onMouseEnter?.();
    }, [onMouseEnter]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        onMouseLeave?.();
    }, [onMouseLeave]);

    // Handle click with ripple effect
    const handleClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            if (disabled || loading) return;

            // Create ripple effect
            if (rippleEffect && buttonRef.current && shouldAnimate) {
                const rect = buttonRef.current.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const newRipple = {
                    id: rippleIdRef.current++,
                    x,
                    y,
                };

                setRipples((prev) => [...prev, newRipple]);

                // Remove ripple after animation
                setTimeout(() => {
                    setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
                }, 600);
            }

            onClick?.(event);
        },
        [disabled, loading, rippleEffect, shouldAnimate, onClick]
    );

    // Variant styles
    const variantClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent focus:ring-blue-500',
        secondary:
            'bg-gray-600 hover:bg-gray-700 text-white border-transparent focus:ring-gray-500',
        outline:
            'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-blue-500',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent focus:ring-gray-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500',
        success:
            'bg-green-600 hover:bg-green-700 text-white border-transparent focus:ring-green-500',
    };

    // Size styles
    const sizeClasses = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg',
    };

    // Base button classes
    const baseClasses = `
    relative inline-flex items-center justify-center
    border font-medium transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    overflow-hidden
    ${fullWidth ? 'w-full' : ''}
    ${rounded ? 'rounded-full' : 'rounded-md'}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${glowEffect && isHovered && !disabled ? 'shadow-lg' : ''}
    ${className}
  `.trim();

    // Animation variants
    const buttonVariants = {
        initial: { scale: 1 },
        hover:
            enableHoverEffects && shouldAnimate && animationLevel === 'full'
                ? {
                      scale: 1.02,
                      y: -1,
                      transition: { duration: 0.2, ease: 'easeOut' },
                  }
                : { scale: 1 },
        tap:
            enableTapEffects && shouldAnimate
                ? {
                      scale: 0.98,
                      transition: { duration: 0.1 },
                  }
                : { scale: 1 },
        disabled: {
            scale: 1,
            transition: { duration: 0.2 },
        },
    };

    // Loading spinner component
    const LoadingSpinner = () => (
        <Fragment>
            <motion.div
                className='w-4 h-4 border-2 border-current border-t-transparent rounded-full'
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
        </Fragment>
    );

    // Ripple component
    const RippleEffect = () => (
        <Fragment>
            <AnimatePresence>
                {ripples.map((ripple) => (
                    <motion.div
                        key={ripple.id}
                        className='absolute bg-white opacity-30 rounded-full pointer-events-none'
                        style={{
                            left: ripple.x - 10,
                            top: ripple.y - 10,
                            width: 20,
                            height: 20,
                        }}
                        initial={{ scale: 0, opacity: 0.3 }}
                        animate={{ scale: 4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                ))}
            </AnimatePresence>
        </Fragment>
    );

    return (
        <Fragment>
            <motion.button
                ref={buttonRef}
                id={id}
                type={type}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                disabled={disabled || loading}
                className={baseClasses}
                variants={shouldAnimate ? buttonVariants : undefined}
                initial={shouldAnimate ? 'initial' : undefined}
                animate={
                    shouldAnimate
                        ? disabled
                            ? 'disabled'
                            : isHovered
                              ? 'hover'
                              : 'initial'
                        : undefined
                }
                whileTap={shouldAnimate ? 'tap' : undefined}
                aria-label={ariaLabel}
                data-testid={testId}
            >
                {/* Ripple Effect */}
                {rippleEffect && <RippleEffect />}

                {/* Button Content */}
                <Fragment>
                    <div className='flex items-center justify-center space-x-2'>
                        {/* Loading State */}
                        {loading && enableLoadingAnimation ? (
                            <Fragment>
                                <LoadingSpinner />
                                {loadingText && <span className='ml-2'>{loadingText}</span>}
                            </Fragment>
                        ) : (
                            <Fragment>
                                {/* Left Icon */}
                                {icon && !loading && (
                                    <Fragment>
                                        <FragmentAnimationWrapper
                                            variant='fadeIn'
                                            className='flex-shrink-0'
                                        >
                                            {icon}
                                        </FragmentAnimationWrapper>
                                    </Fragment>
                                )}

                                {/* Button Text */}
                                <span className='flex-1'>{children}</span>

                                {/* Right Icon */}
                                {rightIcon && !loading && (
                                    <Fragment>
                                        <FragmentAnimationWrapper
                                            variant='fadeIn'
                                            className='flex-shrink-0'
                                        >
                                            {rightIcon}
                                        </FragmentAnimationWrapper>
                                    </Fragment>
                                )}
                            </Fragment>
                        )}
                    </div>
                </Fragment>

                {/* Glow Effect */}
                {glowEffect && isHovered && !disabled && shouldAnimate && (
                    <Fragment>
                        <motion.div
                            className='absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20'
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                        />
                    </Fragment>
                )}
            </motion.button>
        </Fragment>
    );
};

/**
 * Icon button variant
 */
export interface AnimatedIconButtonProps
    extends Omit<AnimatedButtonProps, 'children' | 'icon' | 'rightIcon'> {
    icon: React.ReactNode;
    'aria-label': string;
    tooltip?: string;
}

export const AnimatedIconButton: React.FC<AnimatedIconButtonProps> = ({
    icon,
    size = 'md',
    variant = 'ghost',
    rounded = true,
    tooltip,
    className = '',
    ...props
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const iconSizeClasses = {
        xs: 'p-1',
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-3',
        xl: 'p-4',
    };

    return (
        <Fragment>
            <div className='relative inline-block'>
                <AnimatedButton
                    variant={variant}
                    size={size}
                    rounded={rounded}
                    className={`${iconSizeClasses[size]} ${className}`}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    {...props}
                >
                    {icon}
                </AnimatedButton>

                {/* Tooltip */}
                {tooltip && (
                    <AnimatePresence>
                        {showTooltip && (
                            <Fragment>
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-50'
                                >
                                    {tooltip}
                                    <div className='absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900' />
                                </motion.div>
                            </Fragment>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </Fragment>
    );
};

/**
 * Button group component
 */
export interface AnimatedButtonGroupProps {
    children: React.ReactNode;
    orientation?: 'horizontal' | 'vertical';
    className?: string;
    spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export const AnimatedButtonGroup: React.FC<AnimatedButtonGroupProps> = ({
    children,
    orientation = 'horizontal',
    className = '',
    spacing = 'sm',
}) => {
    const spacingClasses = {
        none: '',
        sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
        md: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
        lg: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6',
    };

    const orientationClasses =
        orientation === 'horizontal' ? 'flex flex-row items-center' : 'flex flex-col';

    return (
        <Fragment>
            <div className={`${orientationClasses} ${spacingClasses[spacing]} ${className}`}>
                {children}
            </div>
        </Fragment>
    );
};

export default AnimatedButton;
