/**
 * Phase 10B: List Animation Components
 * Specialized animation components for lists, grids, and layout elements
 */

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useListAnimation } from '../../hooks/useAnimation';
import { useAnimationContext } from './AnimationProvider';

interface AnimatedGridProps {
  children: ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
  stagger?: number;
}

/**
 * AnimatedGrid - For grid layouts with staggered item animations
 */
export const AnimatedGrid: React.FC<AnimatedGridProps> = ({
  children,
  columns = 3,
  gap = 4,
  className = '',
  stagger = 0.1
}) => {
  const { shouldAnimate } = useAnimationContext();
  const { variants } = useListAnimation(stagger);

  const gridClasses = `
    grid grid-cols-1 md:grid-cols-${columns} gap-${gap} ${className}
  `;

  if (!shouldAnimate('medium')) {
    return <div className={gridClasses}>{children}</div>;
  }

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.div
      className={gridClasses}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

interface AnimatedTableRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  delay?: number;
}

/**
 * AnimatedTableRow - For table row animations
 */
export const AnimatedTableRow: React.FC<AnimatedTableRowProps> = ({
  children,
  onClick,
  className = '',
  delay = 0
}) => {
  const { shouldAnimate } = useAnimationContext();

  const rowVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
        delay
      }
    },
    hover: {
      backgroundColor: '#F9FAFB',
      transition: { duration: 0.2 }
    }
  };

  if (!shouldAnimate('low')) {
    return (
      <tr className={className} onClick={onClick}>
        {children}
      </tr>
    );
  }

  return (
    <motion.tr
      className={className}
      onClick={onClick}
      variants={rowVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      {children}
    </motion.tr>
  );
};

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
  hover?: boolean;
}

/**
 * AnimatedCard - For card-based layouts
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  onClick,
  delay = 0,
  hover = true
}) => {
  const { shouldAnimate } = useAnimationContext();

  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        delay
      }
    },
    hover: hover ? {
      y: -4,
      scale: 1.02,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    } : {},
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  if (!shouldAnimate('medium')) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      onClick={onClick}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={hover ? "hover" : undefined}
      whileTap={onClick ? "tap" : undefined}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedListContainerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  direction?: 'vertical' | 'horizontal';
}

/**
 * AnimatedListContainer - For vertical or horizontal lists
 */
export const AnimatedListContainer: React.FC<AnimatedListContainerProps> = ({
  children,
  className = '',
  stagger = 0.1,
  direction = 'vertical'
}) => {
  const { shouldAnimate } = useAnimationContext();

  if (!shouldAnimate('medium')) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { 
      opacity: 0, 
      [direction === 'vertical' ? 'y' : 'x']: direction === 'vertical' ? 20 : -20 
    },
    animate: { 
      opacity: 1, 
      [direction === 'vertical' ? 'y' : 'x']: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

interface FadeInListProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * FadeInList - Simple fade-in animation for lists
 */
export const FadeInList: React.FC<FadeInListProps> = ({
  children,
  className = '',
  delay = 0
}) => {
  const { shouldAnimate } = useAnimationContext();

  if (!shouldAnimate('low')) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: 'easeOut',
        delay 
      }}
    >
      {children}
    </motion.div>
  );
};

interface SlideInListProps {
  children: ReactNode;
  className?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
}

/**
 * SlideInList - Slide-in animation for lists
 */
export const SlideInList: React.FC<SlideInListProps> = ({
  children,
  className = '',
  direction = 'up',
  delay = 0
}) => {
  const { shouldAnimate } = useAnimationContext();

  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: -30, y: 0 };
      case 'right': return { x: 30, y: 0 };
      case 'up': return { x: 0, y: 20 };
      case 'down': return { x: 0, y: -20 };
      default: return { x: 0, y: 20 };
    }
  };

  if (!shouldAnimate('medium')) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ 
        opacity: 0, 
        ...getInitialPosition() 
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      transition={{ 
        duration: 0.4, 
        ease: 'easeOut',
        delay 
      }}
    >
      {children}
    </motion.div>
  );
};
