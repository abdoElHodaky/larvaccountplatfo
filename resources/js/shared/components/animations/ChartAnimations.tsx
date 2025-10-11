/**
 * Phase 10C: Chart & Data Visualization Animations
 * Enhanced animations for charts, graphs, and data displays
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAnimationContext } from './AnimationProvider';

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/**
 * AnimatedCounter - Smooth number counting animation
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from = 0,
  to,
  duration = 2,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0
}) => {
  const [count, setCount] = useState(from);
  const { shouldAnimate } = useAnimationContext();

  useEffect(() => {
    if (!shouldAnimate('medium')) {
      setCount(to);
      return;
    }

    const startTime = Date.now();
    const startValue = from;
    const endValue = to;
    const totalChange = endValue - startValue;

    const animateCount = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (totalChange * easeOut);
      
      setCount(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animateCount);
  }, [from, to, duration, shouldAnimate]);

  const formatNumber = (num: number) => {
    return num.toFixed(decimals);
  };

  return (
    <span className={className}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
};

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * SkeletonLoader - Animated loading placeholder
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'rectangular',
  animation = 'pulse'
}) => {
  const { shouldAnimate } = useAnimationContext();

  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  if (!shouldAnimate('low') || animation === 'none') {
    return (
      <div
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={style}
      />
    );
  }

  const pulseVariants = {
    pulse: {
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const waveVariants = {
    wave: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  if (animation === 'wave') {
    return (
      <motion.div
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={{
          ...style,
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%'
        }}
        animate={waveVariants.wave}
      />
    );
  }

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      animate={pulseVariants.pulse}
    />
  );
};

interface ChartBarProps {
  value: number;
  maxValue: number;
  label?: string;
  color?: string;
  className?: string;
  delay?: number;
}

/**
 * ChartBar - Animated bar chart component
 */
export const ChartBar: React.FC<ChartBarProps> = ({
  value,
  maxValue,
  label,
  color = '#3B82F6',
  className = '',
  delay = 0
}) => {
  const { shouldAnimate } = useAnimationContext();
  const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));

  if (!shouldAnimate('medium')) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="w-8 bg-gray-200 rounded-t flex flex-col justify-end" style={{ height: '200px' }}>
          <div
            className="w-full rounded-t transition-colors duration-200"
            style={{
              height: `${percentage}%`,
              backgroundColor: color
            }}
          />
        </div>
        {label && <span className="mt-2 text-sm text-gray-600">{label}</span>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="w-8 bg-gray-200 rounded-t flex flex-col justify-end" style={{ height: '200px' }}>
        <motion.div
          className="w-full rounded-t"
          style={{ backgroundColor: color }}
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{
            duration: 1,
            ease: 'easeOut',
            delay
          }}
        />
      </div>
      {label && (
        <motion.span
          className="mt-2 text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.5 }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
};

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
  showPercentage?: boolean;
}

/**
 * ProgressRing - Animated circular progress indicator
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#3B82F6',
  backgroundColor = '#E5E7EB',
  className = '',
  showPercentage = true
}) => {
  const { shouldAnimate } = useAnimationContext();
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  if (!shouldAnimate('medium')) {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold">{Math.round(clampedProgress)}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          initial={{
            strokeDasharray: circumference,
            strokeDashoffset: circumference
          }}
          animate={{
            strokeDashoffset
          }}
          transition={{
            duration: 1.5,
            ease: 'easeOut'
          }}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatedCounter
            to={clampedProgress}
            duration={1.5}
            suffix="%"
            className="text-lg font-semibold"
          />
        </div>
      )}
    </div>
  );
};

interface DataCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * DataCard - Animated data display card
 */
export const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  className = '',
  delay = 0
}) => {
  const { shouldAnimate } = useAnimationContext();

  const changeColors = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-600'
  };

  const changeIcons = {
    increase: '↗',
    decrease: '↘',
    neutral: '→'
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        delay
      }
    }
  };

  if (!shouldAnimate('medium')) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow border ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <p className={`text-sm ${changeColors[changeType]} flex items-center mt-1`}>
                <span className="mr-1">{changeIcons[changeType]}</span>
                {Math.abs(change)}%
              </p>
            )}
          </div>
          {icon && (
            <div className="text-gray-400">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`bg-white p-6 rounded-lg shadow border ${className}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        y: -2,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: { duration: 0.2 }
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <motion.p
            className="text-sm font-medium text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
          >
            {title}
          </motion.p>
          <motion.p
            className="text-2xl font-bold text-gray-900"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.4, duration: 0.3 }}
          >
            {typeof value === 'number' ? (
              <AnimatedCounter to={value} duration={1} />
            ) : (
              value
            )}
          </motion.p>
          {change !== undefined && (
            <motion.p
              className={`text-sm ${changeColors[changeType]} flex items-center mt-1`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.6 }}
            >
              <span className="mr-1">{changeIcons[changeType]}</span>
              <AnimatedCounter to={Math.abs(change)} duration={1} suffix="%" />
            </motion.p>
          )}
        </div>
        {icon && (
          <motion.div
            className="text-gray-400"
            initial={{ opacity: 0, rotate: -10 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: delay + 0.3 }}
          >
            {icon}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

/**
 * LoadingDots - Animated loading dots
 */
export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = '#3B82F6',
  className = ''
}) => {
  const { shouldAnimate } = useAnimationContext();

  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  if (!shouldAnimate('low')) {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${sizeClasses[size]} rounded-full`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizeClasses[size]} rounded-full`}
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};
