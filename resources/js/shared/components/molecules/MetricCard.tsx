import React, { Fragment, memo, useMemo } from 'react';
import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  HStack,
  VStack,
  Icon,
  Text,
  useColorModeValue,
  Skeleton,
} from '@chakra-ui/react';
import { CardContainer } from '@/shared/components/molecules/Container';
import { FinancialPerformanceUtils } from '@/shared/utils/performance';

/**
 * Performance-Optimized Metric Card Component
 * Displays financial metrics with trend indicators and formatting
 */

export interface MetricCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
  precision?: number;
  type?: 'currency' | 'percentage' | 'number' | 'text';
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType;
  loading?: boolean;
  error?: string;
  variant?: 'default' | 'financial' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'neutral';
  showTrend?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = memo(({
  title,
  value,
  previousValue,
  change,
  changePercent,
  currency = 'USD',
  precision = 2,
  type = 'number',
  trend,
  icon,
  loading = false,
  error,
  variant = 'default',
  size = 'md',
  colorScheme = 'neutral',
  showTrend = true,
  className,
}) => {
  // Memoized color values based on color scheme
  const colors = useMemo(() => {
    const colorMap = {
      asset: {
        primary: useColorModeValue('green.600', 'green.300'),
        bg: useColorModeValue('green.50', 'green.900'),
        border: 'green.400',
      },
      liability: {
        primary: useColorModeValue('red.600', 'red.300'),
        bg: useColorModeValue('red.50', 'red.900'),
        border: 'red.400',
      },
      equity: {
        primary: useColorModeValue('blue.600', 'blue.300'),
        bg: useColorModeValue('blue.50', 'blue.900'),
        border: 'blue.400',
      },
      revenue: {
        primary: useColorModeValue('green.600', 'green.300'),
        bg: useColorModeValue('green.50', 'green.900'),
        border: 'green.400',
      },
      expense: {
        primary: useColorModeValue('orange.600', 'orange.300'),
        bg: useColorModeValue('orange.50', 'orange.900'),
        border: 'orange.400',
      },
      neutral: {
        primary: useColorModeValue('gray.700', 'gray.200'),
        bg: useColorModeValue('gray.50', 'gray.700'),
        border: 'gray.400',
      },
    };
    return colorMap[colorScheme];
  }, [colorScheme]);

  // Memoized formatted value
  const formattedValue = useMemo(() => {
    if (loading) return '';
    if (error) return 'Error';
    
    switch (type) {
      case 'currency':
        return FinancialPerformanceUtils.formatCurrency(Number(value) || 0, currency);
      case 'percentage':
        return FinancialPerformanceUtils.formatPercentage(Number(value) || 0);
      case 'number':
        return FinancialPerformanceUtils.formatNumber(Number(value) || 0, precision);
      default:
        return String(value);
    }
  }, [value, type, currency, precision, loading, error]);

  // Memoized change calculation
  const calculatedChange = useMemo(() => {
    if (change !== undefined) return change;
    if (previousValue !== undefined && typeof value === 'number') {
      return value - previousValue;
    }
    return undefined;
  }, [change, value, previousValue]);

  // Memoized change percentage calculation
  const calculatedChangePercent = useMemo(() => {
    if (changePercent !== undefined) return changePercent;
    if (calculatedChange !== undefined && previousValue !== undefined && previousValue !== 0) {
      return (calculatedChange / Math.abs(previousValue)) * 100;
    }
    return undefined;
  }, [changePercent, calculatedChange, previousValue]);

  // Memoized trend determination
  const determinedTrend = useMemo(() => {
    if (trend) return trend;
    if (calculatedChange === undefined) return 'neutral';
    if (calculatedChange > 0) return 'up';
    if (calculatedChange < 0) return 'down';
    return 'neutral';
  }, [trend, calculatedChange]);

  // Memoized trend colors
  const trendColors = useMemo(() => {
    const trendMap = {
      up: useColorModeValue('green.500', 'green.300'),
      down: useColorModeValue('red.500', 'red.300'),
      neutral: useColorModeValue('gray.500', 'gray.400'),
    };
    return trendMap[determinedTrend];
  }, [determinedTrend]);

  // Memoized size configurations
  const sizeConfig = useMemo(() => {
    const configs = {
      sm: {
        titleSize: 'xs',
        valueSize: 'lg',
        spacing: 2,
        padding: 3,
      },
      md: {
        titleSize: 'sm',
        valueSize: 'xl',
        spacing: 3,
        padding: 4,
      },
      lg: {
        titleSize: 'md',
        valueSize: '2xl',
        spacing: 4,
        padding: 6,
      },
    };
    return configs[size];
  }, [size]);

  // Memoized variant styles
  const variantStyles = useMemo(() => {
    const styles = {
      default: {},
      financial: {
        borderLeft: '4px solid',
        borderLeftColor: colors.border,
        bg: colors.bg,
      },
      compact: {
        padding: 2,
      },
    };
    return styles[variant];
  }, [variant, colors]);

  // Memoized card header
  const cardHeader = useMemo(() => (
    <Fragment>
      <HStack justify="space-between" align="flex-start">
        <VStack align="flex-start" spacing={0} flex={1}>
          <Text
            fontSize={sizeConfig.titleSize}
            color="text-muted"
            fontWeight="medium"
            noOfLines={1}
          >
            {title}
          </Text>
        </VStack>
        
        {icon && (
          <Icon
            as={icon}
            boxSize={size === 'sm' ? 4 : size === 'lg' ? 6 : 5}
            color={colors.primary}
            flexShrink={0}
          />
        )}
      </HStack>
    </Fragment>
  ), [title, icon, colors.primary, sizeConfig.titleSize, size]);

  // Memoized card content
  const cardContent = useMemo(() => {
    if (loading) {
      return (
        <VStack align="stretch" spacing={sizeConfig.spacing}>
          <Skeleton height={`${sizeConfig.valueSize === '2xl' ? '32' : sizeConfig.valueSize === 'xl' ? '28' : '24'}px`} />
          {showTrend && <Skeleton height="16px" width="60%" />}
        </VStack>
      );
    }

    if (error) {
      return (
        <VStack align="stretch" spacing={sizeConfig.spacing}>
          <Text color="red.500" fontSize={sizeConfig.valueSize} fontWeight="bold">
            Error
          </Text>
          <Text fontSize="xs" color="red.400">
            {error}
          </Text>
        </VStack>
      );
    }

    return (
      <Fragment>
        <Stat>
          <StatNumber
            fontSize={sizeConfig.valueSize}
            fontWeight="bold"
            color={colors.primary}
            fontVariantNumeric="lining-nums tabular-nums"
          >
            {formattedValue}
          </StatNumber>
          
          {showTrend && (calculatedChange !== undefined || calculatedChangePercent !== undefined) && (
            <StatHelpText mb={0} color={trendColors}>
              <StatArrow type={determinedTrend === 'up' ? 'increase' : determinedTrend === 'down' ? 'decrease' : undefined} />
              {calculatedChange !== undefined && (
                <Fragment>
                  {type === 'currency' 
                    ? FinancialPerformanceUtils.formatCurrency(Math.abs(calculatedChange), currency)
                    : FinancialPerformanceUtils.formatNumber(Math.abs(calculatedChange), precision)
                  }
                  {calculatedChangePercent !== undefined && (
                    <Text as="span" ml={1}>
                      ({FinancialPerformanceUtils.formatPercentage(Math.abs(calculatedChangePercent))})
                    </Text>
                  )}
                </Fragment>
              )}
              {calculatedChange === undefined && calculatedChangePercent !== undefined && (
                FinancialPerformanceUtils.formatPercentage(Math.abs(calculatedChangePercent))
              )}
            </StatHelpText>
          )}
        </Stat>
      </Fragment>
    );
  }, [
    loading,
    error,
    formattedValue,
    showTrend,
    calculatedChange,
    calculatedChangePercent,
    determinedTrend,
    colors.primary,
    trendColors,
    sizeConfig,
    type,
    currency,
    precision,
  ]);

  return (
    <CardContainer
      header={cardHeader}
      className={className}
      p={sizeConfig.padding}
      {...variantStyles}
    >
      {cardContent}
    </CardContainer>
  );
});

MetricCard.displayName = 'MetricCard';

/**
 * Financial Metric Card with specialized styling
 */
export const FinancialMetricCard: React.FC<Omit<MetricCardProps, 'variant'>> = memo((props) => (
  <MetricCard {...props} variant="financial" />
));

FinancialMetricCard.displayName = 'FinancialMetricCard';

/**
 * Compact Metric Card for dense layouts
 */
export const CompactMetricCard: React.FC<Omit<MetricCardProps, 'variant'>> = memo((props) => (
  <MetricCard {...props} variant="compact" size="sm" />
));

CompactMetricCard.displayName = 'CompactMetricCard';

export default MetricCard;
