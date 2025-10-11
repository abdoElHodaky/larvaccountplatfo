/**
 * Phase 10C: Micro-Interactions & Feedback Components
 * Advanced button interactions, loading states, and user feedback animations
 */

import React, { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { useAnimationContext } from './AnimationProvider';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * AnimatedButton - Enhanced button with micro-interactions
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button'
}) => {
  const { shouldAnimate } = useAnimationContext();
  const controls = useAnimation();

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1 }
    },
    loading: {
      scale: 1,
      transition: { duration: 0.2 }
    }
  };

  const handleClick = async () => {
    if (disabled || loading) return;
    
    if (shouldAnimate('medium')) {
      await controls.start('tap');
      await controls.start('idle');
    }
    
    onClick?.();
  };

  if (!shouldAnimate('medium')) {
    return (
      <button
        type={type}
        onClick={handleClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
          disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      variants={buttonVariants}
      initial="idle"
      animate={controls}
      whileHover={!disabled && !loading ? "hover" : "idle"}
      whileTap={!disabled && !loading ? "tap" : "idle"}
    >
      {loading && (
        <motion.svg
          className="-ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </motion.svg>
      )}
      {children}
    </motion.button>
  );
};

interface FloatingActionButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * FloatingActionButton - FAB with smooth animations
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  children,
  onClick,
  className = '',
  position = 'bottom-right'
}) => {
  const { shouldAnimate } = useAnimationContext();

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const fabVariants = {
    idle: { 
      scale: 1,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    },
    hover: { 
      scale: 1.1,
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.25)',
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  };

  if (!shouldAnimate('medium')) {
    return (
      <button
        onClick={onClick}
        className={`fixed ${positionClasses[position]} w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={`fixed ${positionClasses[position]} w-14 h-14 bg-blue-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      variants={fabVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
    >
      {children}
    </motion.button>
  );
};

interface PulseIndicatorProps {
  children?: ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * PulseIndicator - Animated pulse for notifications/status
 */
export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  children,
  color = 'blue',
  size = 'md',
  className = ''
}) => {
  const { shouldAnimate } = useAnimationContext();

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  if (!shouldAnimate('low')) {
    return (
      <div className={`relative inline-flex ${className}`}>
        <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`} />
        {children}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      <motion.div
        className={`absolute ${sizeClasses[size]} ${colorClasses[color]} rounded-full opacity-75`}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.7, 0, 0.7]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5
        }}
      />
      {children}
    </div>
  );
};

interface ProgressBarProps {
  progress: number;
  className?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
  animated?: boolean;
  showPercentage?: boolean;
}

/**
 * ProgressBar - Animated progress indicator
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  color = 'blue',
  animated = true,
  showPercentage = false
}) => {
  const { shouldAnimate } = useAnimationContext();

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  if (!shouldAnimate('low') || !animated) {
    return (
      <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
        <div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${clampedProgress}%` }}
        />
        {showPercentage && (
          <div className="text-sm text-gray-600 mt-1">
            {Math.round(clampedProgress)}%
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <motion.div
        className={`h-2 rounded-full ${colorClasses[color]}`}
        initial={{ width: 0 }}
        animate={{ width: `${clampedProgress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      {showPercentage && (
        <motion.div
          className="text-sm text-gray-600 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {Math.round(clampedProgress)}%
        </motion.div>
      )}
    </div>
  );
};

interface DragIndicatorProps {
  isDragging: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * DragIndicator - Visual feedback for drag operations
 */
export const DragIndicator: React.FC<DragIndicatorProps> = ({
  isDragging,
  children,
  className = ''
}) => {
  const { shouldAnimate } = useAnimationContext();

  const dragVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    dragging: {
      scale: 1.05,
      rotate: 2,
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      transition: { duration: 0.2 }
    }
  };

  if (!shouldAnimate('medium')) {
    return (
      <div className={`${className} ${isDragging ? 'shadow-lg' : 'shadow'}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={dragVariants}
      animate={isDragging ? 'dragging' : 'idle'}
    >
      {children}
    </motion.div>
  );
};

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * Tooltip - Animated tooltip component
 */
export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { shouldAnimate } = useAnimationContext();

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const tooltipVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0,
      x: position === 'left' ? 10 : position === 'right' ? -10 : 0
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  };

  if (!shouldAnimate('low')) {
    return (
      <div
        className={`relative inline-block ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        {isVisible && (
          <div className={`absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded whitespace-nowrap ${positionClasses[position]}`}>
            {content}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <motion.div
        className={`absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded whitespace-nowrap ${positionClasses[position]}`}
        variants={tooltipVariants}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
      >
        {content}
      </motion.div>
    </div>
  );
};
