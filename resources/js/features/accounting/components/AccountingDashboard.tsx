/**
 * Modern Accounting Dashboard Component
 * Updated to use Alova.js GraphQL and real-time Socket.io integration
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { 
  useAccounts, 
  useTransactions, 
  useAccountBalances, 
  useTrialBalance 
} from '../services/accountingApiAlova';
import { useRealtimeAccounting } from '../../../shared/hooks/useSocket';
import { useCollaborativeAccount } from '../../../shared/hooks/useCollaboration';
import { performanceMonitor } from '../../../shared/services/analytics/PerformanceMonitor';
import { getCurrentOrganizationId } from '../../../shared/services/alova/alova.config';
import { ChartOfAccounts } from './organisms/ChartOfAccounts';
import { TransactionList } from './organisms/TransactionList';
import { AccountBalances } from './organisms/AccountBalances';
import { TrialBalance } from './organisms/TrialBalance';
import { AccountingHeader } from './AccountingHeader';
import { QuickActions } from '../../dashboard/components/organisms/QuickActions';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { ErrorFallback } from '../../../shared/components/ui/ErrorFallback';

// Types
interface AccountingDashboardProps {
  organizationId?: number;
  selectedAccountId?: string;
  enableRealtime?: boolean;
  enableCollaboration?: boolean;
}

interface AccountingState {
  selectedDateRange: {
    start: string;
    end: string;
  };
  selectedAccountTypes: string[];
  viewMode: 'overview' | 'accounts' | 'transactions' | 'reports';
  filterOptions: {
    searchTerm: string;
    reconciled?: boolean;
    accountId?: string;
  };
}

/**
 * Main Accounting Dashboard Component
 * Integrates Alova.js API calls with real-time Socket.io updates
 */
export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({
  organizationId,
  selectedAccountId,
  enableRealtime = true,
  enableCollaboration = true,
}) => {
  // Performance monitoring
  const renderStartTime = performance.now();

  // State management
  const [state, setState] = useState<AccountingState>({
    selectedDateRange: {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
      end: new Date().toISOString().split('T')[0],
    },
    selectedAccountTypes: ['asset', 'liability', 'equity', 'revenue', 'expense'],
    viewMode: 'overview',
    filterOptions: {
      searchTerm: '',
      reconciled: undefined,
      accountId: selectedAccountId,
    },
  });

  const orgId = organizationId || getCurrentOrganizationId();

  // API hooks with Alova.js
  const {
    accounts,
    loading: accountsLoading,
    error: accountsError,
    refetch: refetchAccounts,
  } = useAccounts(
    {
      organizationId: orgId ?? undefined,
      accountType: state.selectedAccountTypes,
      isActive: true,
      searchTerm: state.filterOptions.searchTerm,
    },
    { enabled: !!orgId }
  );

  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactions(
    {
      organizationId: orgId ?? undefined,
      dateRange: state.selectedDateRange,
      accountId: state.filterOptions.accountId,
      reconciled: state.filterOptions.reconciled,
      searchTerm: state.filterOptions.searchTerm,
    },
    { enabled: !!orgId }
  );

  const {
    balances,
    loading: balancesLoading,
    error: balancesError,
    refetch: refetchBalances,
  } = useAccountBalances(
    orgId ?? 0,
    state.selectedDateRange.end,
    { enabled: !!orgId }
  );

  const {
    trialBalance,
    loading: trialBalanceLoading,
    refetch: refetchTrialBalance,
  } = useTrialBalance(
    orgId ?? 0,
    state.selectedDateRange.end,
    { enabled: !!orgId && state.viewMode === 'reports' }
  );

  // Real-time hooks
  const {
    transactions: realtimeTransactions,
    accounts: realtimeAccounts,
    lastUpdate: realtimeLastUpdate,
    isConnected: socketConnected,
  } = useRealtimeAccounting(orgId ?? undefined);

  // Collaboration hooks for selected account
  const {
    collaborators: accountCollaborators,
    updateData: updateCollaborativeAccount,
    isLocked: accountLocked,
  } = useCollaborativeAccount(selectedAccountId || '');

  // Memoized combined data
  const combinedTransactions = useMemo(() => {
    if (!enableRealtime) return transactions;
    
    // Merge static transactions with real-time updates
    const transactionsMap = new Map(transactions.map((t: any) => [t.id, t]));
    
    realtimeTransactions.forEach((rtTransaction: any) => {
      const existing = transactionsMap.get(rtTransaction.id);
      if (existing) {
        transactionsMap.set(rtTransaction.id, {
          ...existing,
          ...rtTransaction,
          isRealtime: true,
        });
      }
    });
    
    return Array.from(transactionsMap.values())
      .sort((a: any, b: any) => new Date(b.transaction_date || b.date).getTime() - new Date(a.transaction_date || a.date).getTime());
  }, [transactions, realtimeTransactions, enableRealtime]);

  const combinedAccounts = useMemo(() => {
    if (!enableRealtime) return accounts;
    
    // Merge static accounts with real-time balance updates
    const accountsMap = new Map(accounts.map((a: any) => [a.id, a]));
    
    realtimeAccounts.forEach((rtAccount: any) => {
      const existingAccount = accountsMap.get(rtAccount.id);
      if (existingAccount) {
        accountsMap.set(rtAccount.id, {
          ...existingAccount,
          balance: rtAccount.balance,
          isRealtime: true,
        });
      }
    });
    
    return Array.from(accountsMap.values());
  }, [accounts, realtimeAccounts, enableRealtime]);

  // Performance monitoring
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime;
    performanceMonitor.recordUIMetric({
      component: 'AccountingDashboard',
      action: 'render',
      renderTime,
      componentProps: {
        organizationId: orgId,
        viewMode: state.viewMode,
        accountCount: combinedAccounts.length,
        transactionCount: combinedTransactions.length,
      },
    });
  }, [orgId, state.viewMode, combinedAccounts.length, combinedTransactions.length, renderStartTime]);

  // Error handling
  const handleError = useCallback((error: Error, errorInfo: any) => {
    performanceMonitor.recordError({
      type: 'javascript',
      message: error.message,
      stack: error.stack,
      severity: 'high',
      context: {
        component: 'AccountingDashboard',
        organizationId: orgId,
        viewMode: state.viewMode,
        errorInfo,
      },
    });
  }, [orgId, state.viewMode]);

  // Event handlers

  const handleAccountSelect = useCallback((accountId: string) => {
    setState(prev => ({
      ...prev,
      filterOptions: { ...prev.filterOptions, accountId },
    }));
    
    performanceMonitor.recordInteraction({
      type: 'click',
      element: 'account-select',
      page: '/accounting',
      metadata: { accountId },
    });
  }, []);

  const handleTransactionCreate = useCallback(async (transactionData: any) => {
    try {
      // This would typically call a mutation
      console.log('Creating transaction:', transactionData);
      
      // Refetch data to ensure consistency
      refetchTransactions();
      refetchBalances();
      
      performanceMonitor.recordInteraction({
        type: 'click',
        element: 'create-transaction',
        page: '/accounting',
        metadata: { transactionData },
      });
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  }, [refetchTransactions, refetchBalances]);



  const handleRefresh = useCallback(() => {
    refetchAccounts();
    refetchTransactions();
    refetchBalances();
    if (state.viewMode === 'reports') {
      refetchTrialBalance();
    }
    
    performanceMonitor.recordInteraction({
      type: 'click',
      element: 'refresh-accounting',
      page: '/accounting',
    });
  }, [refetchAccounts, refetchTransactions, refetchBalances, refetchTrialBalance, state.viewMode]);

  // Loading state
  const isLoading = accountsLoading || transactionsLoading || balancesLoading;

  // Error state
  const hasError = accountsError || transactionsError || balancesError;

  if (isLoading && combinedAccounts.length === 0 && combinedTransactions.length === 0) {
    return (
      <div className="accounting-dashboard">
        <LoadingSpinner 
          label="Loading accounting data..." 
          size="lg"
          overlay={true}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      resetKeys={[orgId, state.viewMode]}
    >
      <div className="accounting-dashboard">
        {/* Accounting Header */}
        <AccountingHeader
          title="Accounting Dashboard"
          subtitle={`${combinedAccounts.length} accounts, ${combinedTransactions.length} transactions`}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          showPeriodSelector={true}
          selectedPeriod="current-month"
          onPeriodChange={(period: string) => console.log('Period changed:', period)}
        />

        {/* Quick Actions */}
        <QuickActions
          actions={[
            {
              id: 'create-transaction',
              title: 'Create Transaction',
              description: 'Add a new financial transaction',
              color: 'blue',
              onClick: () => handleTransactionCreate({})
            },
            {
              id: 'create-account',
              title: 'Create Account',
              description: 'Add a new account to chart of accounts',
              color: 'green',
              onClick: () => console.log('Create account')
            },
            {
              id: 'import-transactions',
              title: 'Import Transactions',
              description: 'Import transactions from file',
              color: 'purple',
              onClick: () => console.log('Import transactions')
            }
          ]}
        />

        {/* Error Display */}
        {hasError && (
          <div className="accounting-error">
            <div className="error-message">
              {accountsError?.message || transactionsError?.message || balancesError?.message || 'An error occurred'}
            </div>
            <button onClick={handleRefresh} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="accounting-content">
          {state.viewMode === 'overview' && (
            <div className="accounting-overview">
              <div className="overview-grid">
                <div className="overview-section">
                  <h3>Account Balances</h3>
                  <AccountBalances
                    balances={balances}
                    loading={balancesLoading}
                    error={balancesError?.message || null}
                  />
                </div>
                
                <div className="overview-section">
                  <h3>Recent Transactions</h3>
                  <TransactionList
                    transactions={combinedTransactions.slice(0, 10)}
                    onTransactionClick={(transaction: any) => console.log('Transaction selected:', transaction.id)}
                    onEdit={(transaction: any) => console.log('Edit transaction:', transaction.id)}
                    onDelete={(transactionId: string) => console.log('Delete transaction:', transactionId)}
                  />
                </div>
              </div>
            </div>
          )}

          {state.viewMode === 'accounts' && (
            <div className="accounts-view">
              <ChartOfAccounts
                onAccountSelect={(account: any) => handleAccountSelect(account.id)}
              />
            </div>
          )}

          {state.viewMode === 'transactions' && (
            <div className="transactions-view">
              <TransactionList
                transactions={combinedTransactions}
                onTransactionClick={(transaction: any) => console.log('Transaction selected:', transaction.id)}
                onEdit={(transaction: any) => console.log('Edit transaction:', transaction.id)}
                onDelete={(transactionId: string) => console.log('Delete transaction:', transactionId)}
              />
            </div>
          )}

          {state.viewMode === 'reports' && (
            <div className="reports-view">
              <div className="reports-grid">
                <div className="report-section">
                  <h3>Trial Balance</h3>
                  <TrialBalance
                    data={trialBalance || { accounts: [], totalDebits: 0, totalCredits: 0, asOfDate: state.selectedDateRange.end }}
                    loading={trialBalanceLoading}
                    onAccountClick={(account: any) => console.log('Account clicked:', account)}
                    onExport={(format: 'pdf' | 'excel' | 'csv') => console.log('Export:', format)}
                  />
                </div>
                
                <div className="report-section">
                  <h3>Account Balances Summary</h3>
                  <AccountBalances
                    balances={balances}
                    loading={balancesLoading}
                    error={balancesError?.message || null}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Status */}
        {enableRealtime && (
          <div className="realtime-status">
            <div className={`connection-indicator ${socketConnected ? 'connected' : 'disconnected'}`}>
              {socketConnected ? '🟢 Live' : '🔴 Offline'}
            </div>
            {realtimeLastUpdate && (
              <div className="last-update">
                Last update: {new Date(realtimeLastUpdate).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* Collaboration Status */}
        {enableCollaboration && selectedAccountId && accountCollaborators.length > 0 && (
          <div className="collaboration-status">
            <div className="collaborators">
              {accountCollaborators.map(collaborator => (
                <div key={collaborator.id} className="collaborator" style={{ color: collaborator.color }}>
                  {collaborator.name}
                </div>
              ))}
            </div>
            {accountLocked && (
              <div className="locked-indicator">
                🔒 Account locked for editing
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

// Memoized export for performance
export default React.memo(AccountingDashboard);
