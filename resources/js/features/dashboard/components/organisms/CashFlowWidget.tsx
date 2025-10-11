/**
 * Cash Flow Widget Component
 * Display cash flow information and trends
 */

import React from 'react';
import AnimatedButton from '../../../shared/components/AnimatedButton';

interface CashFlowData {
  period: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}

interface CashFlowWidgetProps {
  data?: CashFlowData[];
  className?: string;
  title?: string;
}

export const CashFlowWidget: React.FC<CashFlowWidgetProps> = ({
  data = [],
  className = '',
  title = 'Cash Flow Overview'
}) => {
  const defaultData: CashFlowData[] = [
    {
      period: 'This Month',
      inflow: 45000,
      outflow: 32000,
      netFlow: 13000
    },
    {
      period: 'Last Month',
      inflow: 38000,
      outflow: 29000,
      netFlow: 9000
    },
    {
      period: 'This Quarter',
      inflow: 125000,
      outflow: 98000,
      netFlow: 27000
    }
  ];

  const displayData = data.length > 0 ? data : defaultData;
  const currentPeriod = displayData[0];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getNetFlowColor = (netFlow: number): string => {
    if (netFlow > 0) return 'text-green-600';
    if (netFlow < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getNetFlowIcon = (netFlow: number): string => {
    if (netFlow > 0) return '↗';
    if (netFlow < 0) return '↘';
    return '→';
  };

  return (
    <div className={`cash-flow-widget ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <div className="p-6">
          {/* Current Period Summary */}
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">{currentPeriod.period}</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(currentPeriod.inflow)}
                </div>
                <div className="text-sm text-gray-500">Cash In</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(currentPeriod.outflow)}
                </div>
                <div className="text-sm text-gray-500">Cash Out</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${getNetFlowColor(currentPeriod.netFlow)}`}>
                  {getNetFlowIcon(currentPeriod.netFlow)} {formatCurrency(Math.abs(currentPeriod.netFlow))}
                </div>
                <div className="text-sm text-gray-500">Net Flow</div>
              </div>
            </div>
          </div>

          {/* Historical Data */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Recent Periods</h4>
            {displayData.slice(1).map((period, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="text-sm text-gray-600">{period.period}</div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-green-600">+{formatCurrency(period.inflow)}</span>
                  <span className="text-red-600">-{formatCurrency(period.outflow)}</span>
                  <span className={`font-medium ${getNetFlowColor(period.netFlow)}`}>
                    {getNetFlowIcon(period.netFlow)} {formatCurrency(Math.abs(period.netFlow))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex space-x-3">
              <AnimatedButton
                variant="info"
                size="sm"
                animationType="fade"
                className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                View Details
              </AnimatedButton>
              <AnimatedButton
                variant="secondary"
                size="sm"
                animationType="fade"
                className="flex-1 bg-gray-50 text-gray-700 hover:bg-gray-100"
              >
                Export Report
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowWidget;
