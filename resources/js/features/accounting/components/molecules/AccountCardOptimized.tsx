/**
 * Optimized Account Card Component
 * Migrated from Chakra UI to Headless UI + Tailwind CSS
 * Maintains performance optimizations while reducing bundle size
 */

import React, { memo, useMemo } from 'react';
import { cn } from '@/shared/components/ui/HeadlessUIComponents';
import { FinancialPerformanceUtils } from '@/shared/utils/performance';

interface Account {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  currency: string;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

interface AccountCardProps {
  account: Account;
  onClick?: (account: Account) => void;
  className?: string;
}

// Type-specific styling configurations
const typeStyles = {
  asset: {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    balance: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-700',
  },
  liability: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    balance: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-700',
  },
  equity: {
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    balance: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-700',
  },
  revenue: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    balance: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-700',
  },
  expense: {
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    balance: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-700',
  },
};

export const AccountCard: React.FC<AccountCardProps> = memo(({
  account,
  onClick,
  className,
}) => {
  // Memoized formatted values to prevent recalculation
  const formattedBalance = useMemo(() => 
    FinancialPerformanceUtils.formatCurrency(account.balance, account.currency),
    [account.balance, account.currency]
  );

  const formattedChange = useMemo(() => 
    FinancialPerformanceUtils.formatCurrency(Math.abs(account.change), account.currency),
    [account.change, account.currency]
  );

  const formattedChangePercent = useMemo(() => 
    FinancialPerformanceUtils.formatPercentage(Math.abs(account.changePercent)),
    [account.changePercent]
  );

  // Memoized click handler
  const handleClick = useMemo(() => 
    onClick ? () => onClick(account) : undefined,
    [onClick, account]
  );

  const styles = typeStyles[account.type];
  const isPositiveChange = account.change >= 0;
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        // Base card styles
        'bg-white dark:bg-gray-800 rounded-lg border shadow-sm',
        'transition-all duration-200 ease-in-out',
        
        // Border styling based on account type
        styles.border,
        
        // Interactive styles
        isClickable && [
          'cursor-pointer',
          'hover:bg-gray-50 dark:hover:bg-gray-700',
          'hover:shadow-md hover:-translate-y-0.5',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        ],
        
        className
      )}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick?.();
        }
      } : undefined}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {account.name}
            </h3>
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1',
              styles.badge
            )}>
              {account.type.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Balance Section */}
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Current Balance
            </p>
            <p className={cn(
              'text-2xl font-bold font-mono tabular-nums',
              styles.balance
            )}>
              {formattedBalance}
            </p>
          </div>

          {/* Change Indicator */}
          <div className="flex items-center space-x-1 text-sm">
            <svg
              className={cn(
                'w-4 h-4',
                isPositiveChange 
                  ? 'text-green-500 dark:text-green-400' 
                  : 'text-red-500 dark:text-red-400'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {isPositiveChange ? (
                <path
                  fillRule="evenodd"
                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            <span className={cn(
              'font-medium',
              isPositiveChange 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            )}>
              {formattedChange} ({formattedChangePercent})
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {new Date(account.lastUpdated).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
});

AccountCard.displayName = 'AccountCard';

/**
 * Optimized Account Card List Component
 * Grid layout with responsive design
 */
interface AccountCardListProps {
  accounts: Account[];
  onAccountClick?: (account: Account) => void;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export const AccountCardList: React.FC<AccountCardListProps> = memo(({
  accounts,
  onAccountClick,
  className,
  columns = 3,
}) => {
  // Memoized account cards to prevent unnecessary re-renders
  const accountCards = useMemo(() => 
    accounts.map((account) => (
      <AccountCard
        key={account.id}
        account={account}
        onClick={onAccountClick}
      />
    )),
    [accounts, onAccountClick]
  );

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No accounts found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Create your first account to get started with financial tracking.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      'grid gap-6',
      gridClasses[columns],
      className
    )}>
      {accountCards}
    </div>
  );
});

AccountCardList.displayName = 'AccountCardList';

export default AccountCard;

