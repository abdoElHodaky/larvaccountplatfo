/**
 * SkeletonLoader Component
 * Enhanced skeleton loading screens with React.Fragment optimization
 */

import React, { Fragment } from 'react';
import { motion } from 'framer-motion';
import { useAnimationPerformance } from '../../hooks/useAnimationPerformance';
import { FragmentAnimationWrapper } from '../animation/FragmentAnimationWrapper';

export interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'table' | 'chart' | 'avatar' | 'button' | 'custom';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
  enableAnimation?: boolean;
  rounded?: boolean;
  children?: React.ReactNode;
}

/**
 * Base skeleton component with optimized animations
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width = '100%',
  height = '1rem',
  className = '',
  count = 1,
  enableAnimation = true,
  rounded = false,
  children
}) => {
  const { shouldAnimate, animationLevel } = useAnimationPerformance();

  // Base skeleton styles
  const baseClasses = `
    bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 
    bg-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 
    dark:bg-gray-700
    ${rounded ? 'rounded-full' : 'rounded'}
    ${className}
  `.trim();

  // Animation variants
  const pulseAnimation = shouldAnimate && enableAnimation && animationLevel !== 'none' ? {
    animate: {
      opacity: [0.4, 0.8, 0.4],
      backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
      opacity: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      },
      backgroundPosition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  } : {};

  // Render single skeleton
  const renderSkeleton = (index: number = 0) => (
    <Fragment key={index}>
      <motion.div
        className={baseClasses}
        style={{ 
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          backgroundSize: '400% 100%'
        }}
        {...pulseAnimation}
      >
        {children}
      </motion.div>
    </Fragment>
  );

  // Render multiple skeletons
  if (count > 1) {
    return (
      <Fragment>
        <div className="space-y-2">
          {Array.from({ length: count }, (_, index) => renderSkeleton(index))}
        </div>
      </Fragment>
    );
  }

  return renderSkeleton();
};

/**
 * Text skeleton with multiple lines
 */
export interface TextSkeletonProps extends Omit<SkeletonLoaderProps, 'variant'> {
  lines?: number;
  lastLineWidth?: string;
}

export const TextSkeleton: React.FC<TextSkeletonProps> = ({
  lines = 3,
  lastLineWidth = '75%',
  height = '1rem',
  className = '',
  ...props
}) => (
  <Fragment>
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <Fragment key={index}>
          <SkeletonLoader
            width={index === lines - 1 ? lastLineWidth : '100%'}
            height={height}
            {...props}
          />
        </Fragment>
      ))}
    </div>
  </Fragment>
);

/**
 * Card skeleton with header and content
 */
export interface CardSkeletonProps extends Omit<SkeletonLoaderProps, 'variant'> {
  showHeader?: boolean;
  showAvatar?: boolean;
  contentLines?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showHeader = true,
  showAvatar = false,
  contentLines = 3,
  className = '',
  ...props
}) => (
  <Fragment>
    <FragmentAnimationWrapper
      variant="fadeIn"
      className={`bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-4 ${className}`}
    >
      {showHeader && (
        <Fragment>
          <div className="flex items-center space-x-3">
            {showAvatar && (
              <Fragment>
                <SkeletonLoader
                  width={40}
                  height={40}
                  rounded={true}
                  {...props}
                />
              </Fragment>
            )}
            <div className="flex-1 space-y-2">
              <SkeletonLoader
                width="60%"
                height="1.25rem"
                {...props}
              />
              <SkeletonLoader
                width="40%"
                height="0.875rem"
                {...props}
              />
            </div>
          </div>
        </Fragment>
      )}
      
      <Fragment>
        <TextSkeleton
          lines={contentLines}
          height="1rem"
          {...props}
        />
      </Fragment>
    </FragmentAnimationWrapper>
  </Fragment>
);

/**
 * Table skeleton with rows and columns
 */
export interface TableSkeletonProps extends Omit<SkeletonLoaderProps, 'variant'> {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
  ...props
}) => (
  <Fragment>
    <div className={`space-y-2 ${className}`}>
      {showHeader && (
        <Fragment>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, index) => (
              <Fragment key={`header-${index}`}>
                <SkeletonLoader
                  width="80%"
                  height="1.25rem"
                  {...props}
                />
              </Fragment>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
        </Fragment>
      )}
      
      {Array.from({ length: rows }, (_, rowIndex) => (
        <Fragment key={`row-${rowIndex}`}>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <Fragment key={`cell-${rowIndex}-${colIndex}`}>
                <SkeletonLoader
                  width={colIndex === 0 ? '90%' : '70%'}
                  height="1rem"
                  {...props}
                />
              </Fragment>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  </Fragment>
);

/**
 * Chart skeleton with bars or lines
 */
export interface ChartSkeletonProps extends Omit<SkeletonLoaderProps, 'variant'> {
  type?: 'bar' | 'line' | 'pie';
  bars?: number;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  type = 'bar',
  bars = 6,
  height = '200px',
  className = '',
  ...props
}) => {
  if (type === 'pie') {
    return (
      <Fragment>
        <div className={`flex items-center justify-center ${className}`} style={{ height }}>
          <SkeletonLoader
            width={150}
            height={150}
            rounded={true}
            {...props}
          />
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <div className={`space-y-2 ${className}`}>
        {/* Chart title */}
        <SkeletonLoader
          width="40%"
          height="1.5rem"
          {...props}
        />
        
        {/* Chart area */}
        <div className="flex items-end justify-between space-x-2" style={{ height }}>
          {Array.from({ length: bars }, (_, index) => (
            <Fragment key={index}>
              <div className="flex-1 flex flex-col items-center space-y-2">
                <SkeletonLoader
                  width="100%"
                  height={`${Math.random() * 60 + 40}%`}
                  {...props}
                />
                <SkeletonLoader
                  width="80%"
                  height="0.75rem"
                  {...props}
                />
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </Fragment>
  );
};

/**
 * Avatar skeleton
 */
export interface AvatarSkeletonProps extends Omit<SkeletonLoaderProps, 'variant'> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
}

export const AvatarSkeleton: React.FC<AvatarSkeletonProps> = ({
  size = 'md',
  showName = true,
  className = '',
  ...props
}) => {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64
  };

  const avatarSize = sizeMap[size];

  return (
    <Fragment>
      <div className={`flex items-center space-x-3 ${className}`}>
        <SkeletonLoader
          width={avatarSize}
          height={avatarSize}
          rounded={true}
          {...props}
        />
        {showName && (
          <Fragment>
            <div className="space-y-1">
              <SkeletonLoader
                width="120px"
                height="1rem"
                {...props}
              />
              <SkeletonLoader
                width="80px"
                height="0.75rem"
                {...props}
              />
            </div>
          </Fragment>
        )}
      </div>
    </Fragment>
  );
};

/**
 * Button skeleton
 */
export interface ButtonSkeletonProps extends Omit<SkeletonLoaderProps, 'variant'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

export const ButtonSkeleton: React.FC<ButtonSkeletonProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-8 px-3',
    md: 'h-10 px-4',
    lg: 'h-12 px-6'
  };

  const widthMap = {
    sm: '80px',
    md: '100px',
    lg: '120px'
  };

  return (
    <Fragment>
      <SkeletonLoader
        width={widthMap[size]}
        height={sizeClasses[size].includes('h-8') ? '2rem' : 
               sizeClasses[size].includes('h-10') ? '2.5rem' : '3rem'}
        className={`${sizeClasses[size]} rounded-md ${className}`}
        {...props}
      />
    </Fragment>
  );
};

export default SkeletonLoader;

