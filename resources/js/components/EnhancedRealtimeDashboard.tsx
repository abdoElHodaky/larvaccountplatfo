import React, { useRef, useEffect } from 'react';
import { useRealtimeDashboardWithRetry } from '../hooks/useRealtimeWithRetry';
import { useOptimizedGraphQLQuery } from '../hooks/useOptimizedGraphQL';
import { useAnimation } from '../animations/transitions';
import { 
  LiveStatus, 
  TransactionIcon, 
  InventoryIcon, 
  DashboardIcon,
  NotificationIcon,
  icons 
} from '../icons/LiveIcons';
import { GET_DASHBOARD_METRICS } from '../graphql/client';

interface EnhancedRealtimeDashboardProps {
  organizationId: string;
}

// Enhanced dashboard with animations and live icons
export function EnhancedRealtimeDashboard({ organizationId }: EnhancedRealtimeDashboardProps) {
  // Data fetching
  const { data: initialMetrics, loading, error, refetch } = useOptimizedGraphQLQuery(
    GET_DASHBOARD_METRICS, 
    { organizationId },
    { cacheTime: 120000, staleTime: 60000 } // 2min cache, 1min stale
  );
  
  // Real-time updates with retry logic
  const { 
    metrics: realtimeMetrics, 
    connected, 
    error: connectionError, 
    retry, 
    isRetrying 
  } = useRealtimeDashboardWithRetry(organizationId);

  // Animation utilities
  const { highlightUpdate, transitions } = useAnimation();
  
  // Refs for animation targets
  const revenueRef = useRef<HTMLDivElement>(null);
  const expensesRef = useRef<HTMLDivElement>(null);
  const inventoryRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);

  // Use real-time metrics if available, otherwise use initial data
  const metrics = realtimeMetrics && Object.keys(realtimeMetrics).length > 0 
    ? realtimeMetrics 
    : initialMetrics;

  // Highlight updates when real-time data changes
  useEffect(() => {
    if (realtimeMetrics && Object.keys(realtimeMetrics).length > 0) {
      highlightUpdate(metricsRef);
      
      // Highlight specific metrics that changed
      if (realtimeMetrics.total_revenue !== undefined) {
        highlightUpdate(revenueRef);
      }
      if (realtimeMetrics.total_expenses !== undefined) {
        highlightUpdate(expensesRef);
      }
      if (realtimeMetrics.total_products !== undefined) {
        highlightUpdate(inventoryRef);
      }
    }
  }, [realtimeMetrics, highlightUpdate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <icons.loading size="lg" className="text-blue-500" />
        <span className="ml-3 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg">
        <icons.error size="lg" className="text-red-500" />
        <div className="ml-3">
          <p className="text-lg text-red-700">Error loading dashboard</p>
          <p className="text-sm text-red-600">{error.message}</p>
          <button 
            onClick={() => refetch()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-realtime-dashboard space-y-6" ref={metricsRef}>
      {/* Connection Status Header */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center space-x-3">
          <DashboardIcon size="lg" className="text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Live Dashboard</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <LiveStatus 
            connected={connected} 
            loading={isRetrying} 
            error={connectionError} 
            size="md" 
          />
          
          {connectionError && (
            <button
              onClick={retry}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reconnect
            </button>
          )}
          
          <button
            onClick={() => refetch()}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div 
          ref={revenueRef}
          className={`metric-card bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-sm border border-green-200 ${transitions.dataUpdate.fadeIn}`}
        >
          <div className="flex items-center justify-between mb-4">
            <TransactionIcon size="lg" className="text-green-600" />
            {connected && <icons.liveData size="sm" className="text-green-500" />}
          </div>
          <h3 className="text-sm font-medium text-green-800 mb-2">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-900">
            ${metrics?.accountingDashboard?.total_revenue?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-green-600 mt-1">This month</p>
        </div>

        {/* Expenses Card */}
        <div 
          ref={expensesRef}
          className={`metric-card bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg shadow-sm border border-red-200 ${transitions.dataUpdate.fadeIn}`}
        >
          <div className="flex items-center justify-between mb-4">
            <TransactionIcon size="lg" className="text-red-600" />
            {connected && <icons.liveData size="sm" className="text-red-500" />}
          </div>
          <h3 className="text-sm font-medium text-red-800 mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-900">
            ${metrics?.accountingDashboard?.total_expenses?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-red-600 mt-1">This month</p>
        </div>

        {/* Net Income Card */}
        <div className={`metric-card bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-sm border border-blue-200 ${transitions.dataUpdate.fadeIn}`}>
          <div className="flex items-center justify-between mb-4">
            <DashboardIcon size="lg" className="text-blue-600" />
            {connected && <icons.liveData size="sm" className="text-blue-500" />}
          </div>
          <h3 className="text-sm font-medium text-blue-800 mb-2">Net Income</h3>
          <p className="text-2xl font-bold text-blue-900">
            ${metrics?.accountingDashboard?.net_income?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-blue-600 mt-1">This month</p>
        </div>

        {/* Inventory Card */}
        <div 
          ref={inventoryRef}
          className={`metric-card bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-sm border border-purple-200 ${transitions.dataUpdate.fadeIn}`}
        >
          <div className="flex items-center justify-between mb-4">
            <InventoryIcon size="lg" className="text-purple-600" />
            {connected && <icons.liveData size="sm" className="text-purple-500" />}
          </div>
          <h3 className="text-sm font-medium text-purple-800 mb-2">Total Products</h3>
          <p className="text-2xl font-bold text-purple-900">
            {metrics?.inventoryDashboard?.total_products?.toLocaleString() || '0'}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-purple-600">Active items</span>
            {metrics?.inventoryDashboard?.low_stock_items > 0 && (
              <span className="flex items-center text-xs text-orange-600">
                <NotificationIcon size="sm" className="mr-1" animated />
                {metrics.inventoryDashboard.low_stock_items} low stock
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cash Flow */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Cash Flow</h3>
            {connected && <icons.liveData size="sm" className="text-gray-500" />}
          </div>
          <p className="text-xl font-semibold text-gray-900">
            ${metrics?.accountingDashboard?.cash_flow?.toLocaleString() || '0'}
          </p>
        </div>

        {/* Inventory Value */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Inventory Value</h3>
            {connected && <icons.liveData size="sm" className="text-gray-500" />}
          </div>
          <p className="text-xl font-semibold text-gray-900">
            ${metrics?.inventoryDashboard?.total_value?.toLocaleString() || '0'}
          </p>
        </div>

        {/* Out of Stock Alert */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Stock Alerts</h3>
            {metrics?.inventoryDashboard?.out_of_stock_items > 0 && (
              <NotificationIcon size="sm" className="text-red-500" animated />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-orange-600">Low Stock:</span>
              <span className="font-medium">{metrics?.inventoryDashboard?.low_stock_items || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Out of Stock:</span>
              <span className="font-medium">{metrics?.inventoryDashboard?.out_of_stock_items || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Activity Feed */}
      {connected && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">Live Activity</h3>
            <icons.liveData size="md" className="text-green-500" />
          </div>
          <div className="text-sm text-gray-600">
            <p className="flex items-center">
              <icons.connection size="sm" className="text-green-500 mr-2" animated />
              Connected to real-time updates
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Dashboard will automatically update when new transactions or inventory changes occur
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
