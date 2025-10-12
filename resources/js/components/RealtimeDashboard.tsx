import React from 'react';
import { useRealtimeDashboard } from '../hooks/useRealtime';
import { useDashboardMetrics } from '../hooks/useGraphQL';

interface RealtimeDashboardProps {
  organizationId: string;
}

// Example component showing real-time integration
export function RealtimeDashboard({ organizationId }: RealtimeDashboardProps) {
  // GraphQL data fetching
  const { data: initialMetrics, loading, error, refetch } = useDashboardMetrics(organizationId);
  
  // Real-time updates
  const { metrics: realtimeMetrics, connected } = useRealtimeDashboard(organizationId);

  // Use real-time metrics if available, otherwise use initial data
  const metrics = realtimeMetrics && Object.keys(realtimeMetrics).length > 0 
    ? realtimeMetrics 
    : initialMetrics;

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error loading dashboard: {error.message}</div>;

  return (
    <div className="realtime-dashboard">
      <div className="connection-status">
        <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      <div className="metrics-grid">
        {/* Accounting Metrics */}
        <div className="metric-card">
          <h3>Total Revenue</h3>
          <p className="metric-value">
            ${metrics?.accountingDashboard?.total_revenue?.toLocaleString() || '0'}
          </p>
        </div>

        <div className="metric-card">
          <h3>Total Expenses</h3>
          <p className="metric-value">
            ${metrics?.accountingDashboard?.total_expenses?.toLocaleString() || '0'}
          </p>
        </div>

        <div className="metric-card">
          <h3>Net Income</h3>
          <p className="metric-value">
            ${metrics?.accountingDashboard?.net_income?.toLocaleString() || '0'}
          </p>
        </div>

        <div className="metric-card">
          <h3>Cash Flow</h3>
          <p className="metric-value">
            ${metrics?.accountingDashboard?.cash_flow?.toLocaleString() || '0'}
          </p>
        </div>

        {/* Inventory Metrics */}
        <div className="metric-card">
          <h3>Total Products</h3>
          <p className="metric-value">
            {metrics?.inventoryDashboard?.total_products || '0'}
          </p>
        </div>

        <div className="metric-card">
          <h3>Low Stock Items</h3>
          <p className="metric-value warning">
            {metrics?.inventoryDashboard?.low_stock_items || '0'}
          </p>
        </div>

        <div className="metric-card">
          <h3>Out of Stock</h3>
          <p className="metric-value danger">
            {metrics?.inventoryDashboard?.out_of_stock_items || '0'}
          </p>
        </div>

        <div className="metric-card">
          <h3>Total Inventory Value</h3>
          <p className="metric-value">
            ${metrics?.inventoryDashboard?.total_value?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      <div className="actions">
        <button onClick={() => refetch()}>
          Refresh Data
        </button>
      </div>
    </div>
  );
}

// Example transaction list with real-time updates
export function RealtimeTransactionList({ organizationId }: { organizationId: string }) {
  const { transactions, connected } = useRealtimeDashboard(organizationId);

  return (
    <div className="realtime-transactions">
      <div className="header">
        <h3>Recent Transactions</h3>
        <span className={`status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? 'Live' : 'Offline'}
        </span>
      </div>

      <div className="transaction-list">
        {transactions.length === 0 ? (
          <p>No transactions yet</p>
        ) : (
          transactions.slice(0, 10).map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-info">
                <span className="description">{transaction.description}</span>
                <span className="account">{transaction.account?.name}</span>
              </div>
              <div className="transaction-amount">
                <span className={`amount ${transaction.type}`}>
                  {transaction.type === 'credit' ? '+' : '-'}
                  ${transaction.amount}
                </span>
                <span className="date">{transaction.date}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
