/**
 * Financial Performance Utilities
 * Optimized utilities for financial calculations and formatting
 */

import { memoize } from './memoization';

/**
 * Financial Performance Utilities Collection
 */
export const FinancialPerformanceUtils = {
  /**
   * Memoized currency formatter
   */
  formatCurrency: memoize((
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
  ): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }),

  /**
   * Memoized percentage formatter
   */
  formatPercentage: memoize((
    value: number,
    decimals: number = 2,
    locale: string = 'en-US'
  ): string => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  }),

  /**
   * Memoized number formatter for financial data
   */
  formatNumber: memoize((
    value: number,
    decimals: number = 2,
    locale: string = 'en-US'
  ): string => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }),

  /**
   * Optimized calculation for financial totals
   */
  calculateTotals: memoize((
    items: Array<{ amount: number; type: string }>
  ) => {
    return items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + item.amount;
      acc.total = (acc.total || 0) + item.amount;
      return acc;
    }, {} as Record<string, number>);
  }, (items) => `${items.length}-${items.map(i => `${i.amount}-${i.type}`).join(',')}`),

  /**
   * Calculate compound interest with memoization
   */
  calculateCompoundInterest: memoize((
    principal: number,
    rate: number,
    time: number,
    compoundingFrequency: number = 1
  ): number => {
    return principal * Math.pow(1 + (rate / compoundingFrequency), compoundingFrequency * time);
  }),

  /**
   * Calculate present value with memoization
   */
  calculatePresentValue: memoize((
    futureValue: number,
    rate: number,
    periods: number
  ): number => {
    return futureValue / Math.pow(1 + rate, periods);
  }),

  /**
   * Calculate future value with memoization
   */
  calculateFutureValue: memoize((
    presentValue: number,
    rate: number,
    periods: number
  ): number => {
    return presentValue * Math.pow(1 + rate, periods);
  }),

  /**
   * Calculate loan payment (PMT) with memoization
   */
  calculateLoanPayment: memoize((
    principal: number,
    rate: number,
    periods: number
  ): number => {
    if (rate === 0) return principal / periods;
    return principal * (rate * Math.pow(1 + rate, periods)) / (Math.pow(1 + rate, periods) - 1);
  }),

  /**
   * Calculate net present value (NPV) with memoization
   */
  calculateNPV: memoize((
    rate: number,
    cashFlows: number[]
  ): number => {
    return cashFlows.reduce((npv, cashFlow, index) => {
      return npv + cashFlow / Math.pow(1 + rate, index);
    }, 0);
  }),

  /**
   * Calculate internal rate of return (IRR) approximation
   */
  calculateIRR: memoize((
    cashFlows: number[],
    guess: number = 0.1,
    maxIterations: number = 100,
    tolerance: number = 0.0001
  ): number => {
    let rate = guess;
    
    for (let i = 0; i < maxIterations; i++) {
      const npv = FinancialPerformanceUtils.calculateNPV(rate, cashFlows);
      const derivative = cashFlows.reduce((sum, cashFlow, index) => {
        return sum - (index * cashFlow) / Math.pow(1 + rate, index + 1);
      }, 0);
      
      const newRate = rate - npv / derivative;
      
      if (Math.abs(newRate - rate) < tolerance) {
        return newRate;
      }
      
      rate = newRate;
    }
    
    return rate;
  }),

  /**
   * Calculate depreciation (straight-line method)
   */
  calculateStraightLineDepreciation: memoize((
    cost: number,
    salvageValue: number,
    usefulLife: number
  ): number => {
    return (cost - salvageValue) / usefulLife;
  }),

  /**
   * Calculate depreciation (declining balance method)
   */
  calculateDecliningBalanceDepreciation: memoize((
    bookValue: number,
    rate: number
  ): number => {
    return bookValue * rate;
  }),

  /**
   * Calculate break-even point
   */
  calculateBreakEvenPoint: memoize((
    fixedCosts: number,
    variableCostPerUnit: number,
    pricePerUnit: number
  ): number => {
    return fixedCosts / (pricePerUnit - variableCostPerUnit);
  }),

  /**
   * Calculate return on investment (ROI)
   */
  calculateROI: memoize((
    gain: number,
    cost: number
  ): number => {
    return ((gain - cost) / cost) * 100;
  }),

  /**
   * Calculate gross profit margin
   */
  calculateGrossProfitMargin: memoize((
    revenue: number,
    costOfGoodsSold: number
  ): number => {
    return ((revenue - costOfGoodsSold) / revenue) * 100;
  }),

  /**
   * Calculate net profit margin
   */
  calculateNetProfitMargin: memoize((
    netIncome: number,
    revenue: number
  ): number => {
    return (netIncome / revenue) * 100;
  }),

  /**
   * Calculate debt-to-equity ratio
   */
  calculateDebtToEquityRatio: memoize((
    totalDebt: number,
    totalEquity: number
  ): number => {
    return totalDebt / totalEquity;
  }),

  /**
   * Calculate current ratio
   */
  calculateCurrentRatio: memoize((
    currentAssets: number,
    currentLiabilities: number
  ): number => {
    return currentAssets / currentLiabilities;
  }),

  /**
   * Calculate quick ratio (acid-test ratio)
   */
  calculateQuickRatio: memoize((
    currentAssets: number,
    inventory: number,
    currentLiabilities: number
  ): number => {
    return (currentAssets - inventory) / currentLiabilities;
  }),

  /**
   * Batch financial calculations for performance
   */
  batchCalculations: memoize((
    data: Array<{
      type: 'currency' | 'percentage' | 'number';
      value: number;
      options?: any;
    }>
  ) => {
    return data.map(item => {
      switch (item.type) {
        case 'currency':
          return FinancialPerformanceUtils.formatCurrency(
            item.value,
            item.options?.currency,
            item.options?.locale
          );
        case 'percentage':
          return FinancialPerformanceUtils.formatPercentage(
            item.value,
            item.options?.decimals,
            item.options?.locale
          );
        case 'number':
          return FinancialPerformanceUtils.formatNumber(
            item.value,
            item.options?.decimals,
            item.options?.locale
          );
        default:
          return item.value.toString();
      }
    });
  })
};

