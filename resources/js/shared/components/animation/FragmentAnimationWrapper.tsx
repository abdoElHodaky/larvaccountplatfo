import React, { Fragment, ReactNode, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Animation variants for different types of animations
const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const slideInVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Props interface
interface FragmentAnimationWrapperProps {
  children: ReactNode;
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  duration?: number;
  delay?: number;
  className?: string;
  reduceMotion?: boolean;
  key?: string | number;
}

interface StaggerAnimationProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  reduceMotion?: boolean;
}

// Check for reduced motion preference
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Fragment Animation Wrapper Component
export const FragmentAnimationWrapper: React.FC<FragmentAnimationWrapperProps> = ({
  children,
  animation = 'fade',
  duration = 0.3,
  delay = 0,
  className,
  reduceMotion,
  key
}) => {
  const shouldReduceMotion = useMemo(() => {
    return reduceMotion ?? prefersReducedMotion();
  }, [reduceMotion]);

  // If motion should be reduced, return children wrapped in Fragment
  if (shouldReduceMotion || animation === 'none') {
    return <Fragment key={key}>{children}</Fragment>;
  }

  // Select animation variants based on animation type
  const variants = useMemo(() => {
    switch (animation) {
      case 'slide':
        return slideInVariants;
      case 'scale':
        return scaleVariants;
      case 'fade':
      default:
        return fadeInVariants;
    }
  }, [animation]);

  // Animation transition configuration
  const transition = useMemo(() => ({
    duration,
    delay,
    ease: 'easeOut'
  }), [duration, delay]);

  return (
    <motion.div
      key={key}
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={transition}
      style={{ display: 'contents' }} // Ensures the wrapper doesn't affect layout
    >
      {children}
    </motion.div>
  );
};

// Stagger Animation Component for animating lists/grids
export const StaggerAnimation: React.FC<StaggerAnimationProps> = ({
  children,
  className,
  staggerDelay = 0.1,
  reduceMotion
}) => {
  const shouldReduceMotion = useMemo(() => {
    return reduceMotion ?? prefersReducedMotion();
  }, [reduceMotion]);

  // If motion should be reduced, return children wrapped in Fragment
  if (shouldReduceMotion) {
    return <Fragment>{children}</Fragment>;
  }

  // Clone children and wrap each in motion.div with stagger variants
  const animatedChildren = React.Children.map(children, (child, index) => (
    <motion.div
      key={index}
      variants={staggerItemVariants}
      style={{ display: 'contents' }}
    >
      {child}
    </motion.div>
  ));

  return (
    <motion.div
      className={className}
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ display: 'contents' }}
    >
      {animatedChildren}
    </motion.div>
  );
};

// Higher-order component for wrapping components with animation
export const withFragmentAnimation = <P extends object>(
  Component: React.ComponentType<P>,
  animationProps?: Partial<FragmentAnimationWrapperProps>
) => {
  const AnimatedComponent = React.forwardRef<any, P>((props, ref) => (
    <FragmentAnimationWrapper {...animationProps}>
      <Component {...props} ref={ref} />
    </FragmentAnimationWrapper>
  ));

  AnimatedComponent.displayName = `withFragmentAnimation(${Component.displayName || Component.name})`;
  
  return AnimatedComponent;
};

// Utility hook for animation performance monitoring
export const useFragmentAnimationPerformance = () => {
  const [animationMetrics, setAnimationMetrics] = React.useState({
    frameRate: 0,
    droppedFrames: 0,
    animationDuration: 0
  });

  const measureAnimation = React.useCallback((animationName: string) => {
    if (typeof window === 'undefined' || !window.performance) return;

    const startTime = performance.now();
    let frameCount = 0;
    let lastFrameTime = startTime;

    const measureFrame = () => {
      const currentTime = performance.now();
      frameCount++;
      
      // Calculate frame rate
      const frameRate = 1000 / (currentTime - lastFrameTime);
      lastFrameTime = currentTime;

      // Continue measuring for animation duration
      if (currentTime - startTime < 1000) { // Measure for 1 second
        requestAnimationFrame(measureFrame);
      } else {
        const totalDuration = currentTime - startTime;
        const avgFrameRate = (frameCount * 1000) / totalDuration;
        const droppedFrames = Math.max(0, (totalDuration / 16.67) - frameCount); // 60fps = 16.67ms per frame

        setAnimationMetrics({
          frameRate: Math.round(avgFrameRate),
          droppedFrames: Math.round(droppedFrames),
          animationDuration: Math.round(totalDuration)
        });
      }
    };

    requestAnimationFrame(measureFrame);
  }, []);

  return { animationMetrics, measureAnimation };
};

export default FragmentAnimationWrapper;
