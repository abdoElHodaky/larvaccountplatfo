import React, { Fragment, memo, useMemo } from 'react';
import { Box, Heading, Text, VStack, HStack, BoxProps } from '@chakra-ui/react';

/**
 * Performance-Optimized Section Component
 * Uses React.Fragment and memoization for content sections
 */

interface SectionProps extends Omit<BoxProps, 'children'> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated' | 'financial';
  spacing?: number;
  className?: string;
}

export const Section: React.FC<SectionProps> = memo(({
  children,
  title,
  subtitle,
  description,
  actions,
  variant = 'default',
  spacing = 6,
  className,
  ...boxProps
}) => {
  // Memoized variant styles to prevent unnecessary recalculations
  const variantStyles = useMemo(() => {
    switch (variant) {
      case 'bordered':
        return {
          border: '1px solid',
          borderColor: 'border-default',
          borderRadius: 'lg',
          p: 6,
        };
      
      case 'elevated':
        return {
          bg: 'bg-surface',
          boxShadow: 'sm',
          borderRadius: 'lg',
          p: 6,
        };
      
      case 'financial':
        return {
          bg: 'bg-surface',
          boxShadow: 'data-card',
          border: '1px solid',
          borderColor: 'border-default',
          borderRadius: 'lg',
          p: 6,
          fontVariantNumeric: 'lining-nums tabular-nums',
        };
      
      default:
        return {
          p: 0,
        };
    }
  }, [variant]);

  // Memoized header content to prevent unnecessary re-renders
  const headerContent = useMemo(() => {
    if (!title && !subtitle && !description && !actions) {
      return null;
    }

    return (
      <Fragment>
        <HStack justify="space-between" align="flex-start" mb={spacing}>
          <VStack align="flex-start" spacing={2} flex={1}>
            {title && (
              <Heading
                size="lg"
                color="text-default"
                fontWeight="semibold"
              >
                {title}
              </Heading>
            )}
            
            {subtitle && (
              <Heading
                size="md"
                color="text-muted"
                fontWeight="medium"
              >
                {subtitle}
              </Heading>
            )}
            
            {description && (
              <Text
                color="text-subtle"
                fontSize="sm"
                lineHeight="tall"
              >
                {description}
              </Text>
            )}
          </VStack>
          
          {actions && (
            <Box flexShrink={0}>
              {actions}
            </Box>
          )}
        </HStack>
      </Fragment>
    );
  }, [title, subtitle, description, actions, spacing]);

  return (
    <Box
      {...variantStyles}
      {...boxProps}
      className={className}
    >
      {headerContent}
      
      {/* Main content */}
      <Box>
        {children}
      </Box>
    </Box>
  );
});

Section.displayName = 'Section';

/**
 * Financial Section Component
 * Specialized for financial data with proper number formatting
 */
export const FinancialSection: React.FC<Omit<SectionProps, 'variant'>> = memo((props) => {
  return <Section {...props} variant="financial" />;
});

FinancialSection.displayName = 'FinancialSection';

/**
 * Card Section Component
 * Elevated section with card-like appearance
 */
export const CardSection: React.FC<Omit<SectionProps, 'variant'>> = memo((props) => {
  return <Section {...props} variant="elevated" />;
});

CardSection.displayName = 'CardSection';

/**
 * Bordered Section Component
 * Section with border styling
 */
export const BorderedSection: React.FC<Omit<SectionProps, 'variant'>> = memo((props) => {
  return <Section {...props} variant="bordered" />;
});

BorderedSection.displayName = 'BorderedSection';

/**
 * Section Group Component
 * Groups multiple sections with consistent spacing using Fragment
 */
interface SectionGroupProps {
  children: React.ReactNode;
  spacing?: number;
  className?: string;
}

export const SectionGroup: React.FC<SectionGroupProps> = memo(({
  children,
  spacing = 8,
  className,
}) => {
  return (
    <VStack spacing={spacing} align="stretch" className={className}>
      {children}
    </VStack>
  );
});

SectionGroup.displayName = 'SectionGroup';

export default Section;
