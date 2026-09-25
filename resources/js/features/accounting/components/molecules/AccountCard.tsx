import React, { Fragment, memo, useMemo } from 'react';
import {
  Box,
  Text,
  Heading,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  HStack,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { CardContainer } from '@/shared/components/molecules/Container';
import { FinancialPerformanceUtils } from '@/shared/utils/Debounce';

/**
 * Performance-Optimized Account Card Component
 * Demonstrates React.Fragment, memoization, and Chakra UI integration
 */

// Import consolidated types
import { Account, AccountCardProps } from '@/shared/types/ACCOUNTTYPES';

export const AccountCard: React.FC<AccountCardProps> = memo(({
  account,
  onClick,
  className,
}) => {
  // Memoized color values for performance
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Memoized formatted values to prevent recalculation
  const formattedBalance = useMemo(() =>
    FinancialPerformanceUtils.formatCurrency(account.balance ?? 0, account.currency ?? 'USD'),
    [account.balance, account.currency]
  );

  const formattedChange = useMemo(() =>
    FinancialPerformanceUtils.formatCurrency(Math.abs(account.change ?? 0), account.currency ?? 'USD'),
    [account.change, account.currency]
  );

  const formattedChangePercent = useMemo(() =>
    FinancialPerformanceUtils.formatPercentage(Math.abs(account.changePercent ?? 0)),
    [account.changePercent]
  );

  // Memoized click handler
  const handleClick = useMemo(() => 
    onClick ? () => onClick(account) : undefined,
    [onClick, account]
  );

  // Memoized card content to prevent unnecessary re-renders
  const cardHeader = useMemo(() => (
    <Fragment>
      <HStack justify="space-between" align="flex-start">
        <VStack align="flex-start" spacing={1} flex={1}>
          <Heading size="sm" color="text-default" noOfLines={1}>
            {account.name}
          </Heading>
          <Badge variant={account.type} size="sm">
            {account.type.toUpperCase()}
          </Badge>
        </VStack>
      </HStack>
    </Fragment>
  ), [account.name, account.type]);

  const cardBody = useMemo(() => (
    <Fragment>
      <VStack align="stretch" spacing={4}>
        {/* Balance Display */}
        <Stat>
          <StatLabel fontSize="sm" color="text-muted">
            Current Balance
          </StatLabel>
          <StatNumber 
            fontSize="2xl" 
            fontWeight="bold"
            color={`${account.type}.600`}
          >
            {formattedBalance}
          </StatNumber>
          <StatHelpText mb={0}>
            <StatArrow type={account.change >= 0 ? 'increase' : 'decrease'} />
            {formattedChange} ({formattedChangePercent})
          </StatHelpText>
        </Stat>

        {/* Additional Info */}
        <Box>
          <Text fontSize="xs" color="text-subtle">
            Last updated: {new Date(account.lastUpdated).toLocaleDateString()}
          </Text>
        </Box>
      </VStack>
    </Fragment>
  ), [
    account.type,
    account.change,
    account.lastUpdated,
    formattedBalance,
    formattedChange,
    formattedChangePercent,
  ]);

  return (
    <CardContainer
      header={cardHeader}
      className={className}
      cursor={onClick ? 'pointer' : 'default'}
      transition="all 0.2s ease-in-out"
      _hover={onClick ? { bg: hoverBg, transform: 'translateY(-2px)' } : undefined}
      onClick={handleClick}
    >
      {cardBody}
    </CardContainer>
  );
});

AccountCard.displayName = 'AccountCard';

/**
 * Account Card List Component
 * Optimized for rendering multiple account cards with virtualization support
 */
interface AccountCardListProps {
  accounts: Account[];
  onAccountClick?: (account: Account) => void;
  className?: string;
}

export const AccountCardList: React.FC<AccountCardListProps> = memo(({
  accounts,
  onAccountClick,
  className,
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

  return (
    <VStack spacing={4} align="stretch" className={className}>
      {accountCards}
    </VStack>
  );
});

AccountCardList.displayName = 'AccountCardList';

export default AccountCard;
