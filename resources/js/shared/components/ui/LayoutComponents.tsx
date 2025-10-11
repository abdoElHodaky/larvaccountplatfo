/**
 * Layout Components
 * Responsive layout system built with TailwindCSS
 * Provides flexible grid, flex, and container components
 */

import React, { forwardRef, ReactNode } from 'react';
import { cn } from './HeadlessUIComponents';

// =============================================================================
// CONTAINER COMPONENT
// =============================================================================

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
  fluid?: boolean;
  children?: ReactNode;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ 
    size = 'lg',
    centered = true,
    fluid = false,
    className,
    children,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      '2xl': 'max-w-7xl',
      full: 'max-w-full',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'w-full px-4 sm:px-6 lg:px-8',
          !fluid && sizeClasses[size],
          centered && 'mx-auto',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

// =============================================================================
// GRID COMPONENT
// =============================================================================

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  };
  children?: ReactNode;
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ 
    cols = 1,
    gap = 4,
    responsive,
    className,
    children,
    ...props 
  }, ref) => {
    const colsClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
    };

    const gapClasses = {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      7: 'gap-7',
      8: 'gap-8',
      9: 'gap-9',
      10: 'gap-10',
      11: 'gap-11',
      12: 'gap-12',
    };

    const responsiveClasses = responsive ? [
      responsive.sm && `sm:grid-cols-${responsive.sm}`,
      responsive.md && `md:grid-cols-${responsive.md}`,
      responsive.lg && `lg:grid-cols-${responsive.lg}`,
      responsive.xl && `xl:grid-cols-${responsive.xl}`,
    ].filter(Boolean).join(' ') : '';

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          colsClasses[cols],
          gapClasses[gap],
          responsiveClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';

// =============================================================================
// GRID ITEM COMPONENT
// =============================================================================

interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'full';
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full';
  colStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
  rowStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  children?: ReactNode;
}

export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(
  ({ 
    colSpan,
    rowSpan,
    colStart,
    rowStart,
    className,
    children,
    ...props 
  }, ref) => {
    const colSpanClasses = colSpan ? {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12',
      full: 'col-span-full',
    }[colSpan] : '';

    const rowSpanClasses = rowSpan ? {
      1: 'row-span-1',
      2: 'row-span-2',
      3: 'row-span-3',
      4: 'row-span-4',
      5: 'row-span-5',
      6: 'row-span-6',
      full: 'row-span-full',
    }[rowSpan] : '';

    const colStartClasses = colStart ? {
      1: 'col-start-1',
      2: 'col-start-2',
      3: 'col-start-3',
      4: 'col-start-4',
      5: 'col-start-5',
      6: 'col-start-6',
      7: 'col-start-7',
      8: 'col-start-8',
      9: 'col-start-9',
      10: 'col-start-10',
      11: 'col-start-11',
      12: 'col-start-12',
      13: 'col-start-13',
    }[colStart] : '';

    const rowStartClasses = rowStart ? {
      1: 'row-start-1',
      2: 'row-start-2',
      3: 'row-start-3',
      4: 'row-start-4',
      5: 'row-start-5',
      6: 'row-start-6',
      7: 'row-start-7',
    }[rowStart] : '';

    return (
      <div
        ref={ref}
        className={cn(
          colSpanClasses,
          rowSpanClasses,
          colStartClasses,
          rowStartClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GridItem.displayName = 'GridItem';

// =============================================================================
// FLEX COMPONENT
// =============================================================================

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  children?: ReactNode;
}

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  ({ 
    direction = 'row',
    wrap = 'nowrap',
    justify = 'start',
    align = 'start',
    gap = 0,
    className,
    children,
    ...props 
  }, ref) => {
    const directionClasses = {
      row: 'flex-row',
      col: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'col-reverse': 'flex-col-reverse',
    };

    const wrapClasses = {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
      'wrap-reverse': 'flex-wrap-reverse',
    };

    const justifyClasses = {
      start: 'justify-start',
      end: 'justify-end',
      center: 'justify-center',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    const alignClasses = {
      start: 'items-start',
      end: 'items-end',
      center: 'items-center',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    };

    const gapClasses = {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      7: 'gap-7',
      8: 'gap-8',
      9: 'gap-9',
      10: 'gap-10',
      11: 'gap-11',
      12: 'gap-12',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          directionClasses[direction],
          wrapClasses[wrap],
          justifyClasses[justify],
          alignClasses[align],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Flex.displayName = 'Flex';

// =============================================================================
// STACK COMPONENT (Vertical Flex)
// =============================================================================

interface StackProps extends Omit<FlexProps, 'direction'> {
  spacing?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  divider?: ReactNode;
  children?: ReactNode;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ 
    spacing = 4,
    divider,
    children,
    className,
    ...props 
  }, ref) => {
    const childrenArray = React.Children.toArray(children);

    return (
      <Flex
        ref={ref}
        direction="col"
        gap={spacing}
        className={className}
        {...props}
      >
        {divider
          ? childrenArray.map((child, index) => (
              <React.Fragment key={index}>
                {child}
                {index < childrenArray.length - 1 && divider}
              </React.Fragment>
            ))
          : children
        }
      </Flex>
    );
  }
);

Stack.displayName = 'Stack';

// =============================================================================
// HSTACK COMPONENT (Horizontal Flex)
// =============================================================================

interface HStackProps extends Omit<FlexProps, 'direction'> {
  spacing?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  divider?: ReactNode;
  children?: ReactNode;
}

export const HStack = forwardRef<HTMLDivElement, HStackProps>(
  ({ 
    spacing = 4,
    divider,
    children,
    className,
    ...props 
  }, ref) => {
    const childrenArray = React.Children.toArray(children);

    return (
      <Flex
        ref={ref}
        direction="row"
        gap={spacing}
        className={className}
        {...props}
      >
        {divider
          ? childrenArray.map((child, index) => (
              <React.Fragment key={index}>
                {child}
                {index < childrenArray.length - 1 && divider}
              </React.Fragment>
            ))
          : children
        }
      </Flex>
    );
  }
);

HStack.displayName = 'HStack';

// =============================================================================
// SPACER COMPONENT
// =============================================================================

interface SpacerProps {
  size?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 16 | 20 | 24 | 32;
  axis?: 'x' | 'y' | 'both';
  className?: string;
}

export const Spacer: React.FC<SpacerProps> = ({ 
  size = 4, 
  axis = 'both',
  className 
}) => {
  const sizeClasses = {
    x: {
      0: 'w-0',
      1: 'w-1',
      2: 'w-2',
      3: 'w-3',
      4: 'w-4',
      5: 'w-5',
      6: 'w-6',
      7: 'w-7',
      8: 'w-8',
      9: 'w-9',
      10: 'w-10',
      11: 'w-11',
      12: 'w-12',
      16: 'w-16',
      20: 'w-20',
      24: 'w-24',
      32: 'w-32',
    },
    y: {
      0: 'h-0',
      1: 'h-1',
      2: 'h-2',
      3: 'h-3',
      4: 'h-4',
      5: 'h-5',
      6: 'h-6',
      7: 'h-7',
      8: 'h-8',
      9: 'h-9',
      10: 'h-10',
      11: 'h-11',
      12: 'h-12',
      16: 'h-16',
      20: 'h-20',
      24: 'h-24',
      32: 'h-32',
    },
    both: {
      0: 'w-0 h-0',
      1: 'w-1 h-1',
      2: 'w-2 h-2',
      3: 'w-3 h-3',
      4: 'w-4 h-4',
      5: 'w-5 h-5',
      6: 'w-6 h-6',
      7: 'w-7 h-7',
      8: 'w-8 h-8',
      9: 'w-9 h-9',
      10: 'w-10 h-10',
      11: 'w-11 h-11',
      12: 'w-12 h-12',
      16: 'w-16 h-16',
      20: 'w-20 h-20',
      24: 'w-24 h-24',
      32: 'w-32 h-32',
    },
  };

  return (
    <div 
      className={cn(
        'flex-shrink-0',
        sizeClasses[axis][size],
        className
      )} 
    />
  );
};

// =============================================================================
// CENTER COMPONENT
// =============================================================================

interface CenterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const Center = forwardRef<HTMLDivElement, CenterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Center.displayName = 'Center';

// =============================================================================
// ASPECT RATIO COMPONENT
// =============================================================================

interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number | string;
  children?: ReactNode;
}

export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 1, className, children, ...props }, ref) => {
    const ratioValue = typeof ratio === 'string' ? ratio : `${ratio}`;
    
    return (
      <div
        ref={ref}
        className={cn('relative w-full', className)}
        style={{ aspectRatio: ratioValue }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AspectRatio.displayName = 'AspectRatio';

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Container,
  Grid,
  GridItem,
  Flex,
  Stack,
  HStack,
  Spacer,
  Center,
  AspectRatio,
};

// Export types for external use
export type {
  ContainerProps,
  GridProps,
  GridItemProps,
  FlexProps,
  StackProps,
  HStackProps,
  SpacerProps,
  CenterProps,
  AspectRatioProps,
};
