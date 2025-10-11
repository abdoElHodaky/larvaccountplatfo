/**
 * Phase 10A/10B: Animated Fragment Component
 * Fragment-compatible animation wrapper that doesn't add unnecessary DOM nodes
 */

import React, { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation, AnimationConfig } from '../../hooks/useAnimation';
import { useAnimationContext } from './AnimationProvider';

interface AnimatedFragmentProps {
  children: ReactNode;
  animation?: AnimationConfig;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  priority?: 'low' | 'medium' | 'high';
  staggerChildren?: number;
  [key: string]: any;
}

/**
 * AnimatedFragment - A wrapper that provides animations without unnecessary DOM nodes
 * When animations are disabled, it renders children directly without wrapper
 */
export const AnimatedFragment: React.FC<AnimatedFragmentProps> = ({
  children,
  animation = { type: 'fadeIn', duration: 'normal' },
  className,
  as = 'div',
  priority = 'medium',
  staggerChildren,
  ...props
}) => {
  const { shouldAnimate, registerAnimation, unregisterAnimation } = useAnimationContext();
  const { variants, controls } = useAnimation(animation);

  useEffect(() => {
    if (shouldAnimate(priority)) {
      registerAnimation();
      return () => unregisterAnimation();
    }
  }, [shouldAnimate, priority, registerAnimation, unregisterAnimation]);

  // If animations are disabled, render children directly
  if (!shouldAnimate(priority)) {
    return <>{children}</>;
  }

  // Create motion component dynamically
  const MotionComponent = motion[as as keyof typeof motion] as any;

  const containerVariants = staggerChildren ? {
    initial: variants.initial,
    animate: {
      ...variants.animate,
      transition: {
        staggerChildren,
        delayChildren: 0.1
      }
    },
    exit: variants.exit
  } : variants;

  return (
    <MotionComponent
      initial="initial"
      animate="animate"
      exit="exit"
      variants={containerVariants}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

/**
 * AnimatedList - Specialized component for list animations with staggering
 */
interface AnimatedListProps {
  children: ReactNode;
  stagger?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  stagger = 0.1,
  className,
  as = 'div'
}) => {
  return (
    <AnimatedFragment
      animation={{ type: 'fadeIn', duration: 'normal' }}
      staggerChildren={stagger}
      className={className}
      as={as}
      priority="medium"
    >
      {children}
    </AnimatedFragment>
  );
};

/**
 * AnimatedFormField - Specialized component for form field animations
 */
interface AnimatedFormFieldProps {
  children: ReactNode;
  error?: boolean;
  className?: string;
}

export const AnimatedFormField: React.FC<AnimatedFormFieldProps> = ({
  children,
  error = false,
  className
}) => {
  const errorAnimation = {
    type: 'custom' as const,
    custom: {
      initial: { opacity: 1, x: 0 },
      animate: error ? { opacity: 1, x: [0, -5, 5, -5, 5, 0] } : { opacity: 1, x: 0 },
      exit: { opacity: 1, x: 0 }
    },
    duration: 'fast' as const
  };

  return (
    <AnimatedFragment
      animation={error ? errorAnimation : { type: 'slideUp', duration: 'fast' }}
      className={className}
      priority="high"
    >
      {children}
    </AnimatedFragment>
  );
};

/**
 * AnimatedPageTransition - For page-level transitions
 */
interface AnimatedPageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedPageTransition: React.FC<AnimatedPageTransitionProps> = ({
  children,
  className
}) => {
  return (
    <AnimatePresence mode="wait">
      <AnimatedFragment
        animation={{ type: 'slideIn', duration: 'normal', easing: 'easeInOut' }}
        className={className}
        priority="high"
      >
        {children}
      </AnimatedFragment>
    </AnimatePresence>
  );
};

/**
 * ConditionalAnimation - Only animates when condition is met
 */
interface ConditionalAnimationProps {
  children: ReactNode;
  condition: boolean;
  animation?: AnimationConfig;
  className?: string;
}

export const ConditionalAnimation: React.FC<ConditionalAnimationProps> = ({
  children,
  condition,
  animation = { type: 'fadeIn', duration: 'fast' },
  className
}) => {
  if (!condition) {
    return <>{children}</>;
  }

  return (
    <AnimatedFragment
      animation={animation}
      className={className}
      priority="medium"
    >
      {children}
    </AnimatedFragment>
  );
};

/**
 * StaggeredChildren - For staggered animations of child elements
 */
interface StaggeredChildrenProps {
  children: ReactNode;
  stagger?: number;
  className?: string;
  delay?: number;
}

export const StaggeredChildren: React.FC<StaggeredChildrenProps> = ({
  children,
  stagger = 0.1,
  className,
  delay = 0
}) => {
  const { shouldAnimate } = useAnimationContext();

  if (!shouldAnimate('medium')) {
    return <>{children}</>;
  }

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
