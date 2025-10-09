/**
 * Income Statement Component
 * Display income statement financial report
 */

import React from 'react';

interface IncomeStatementData {
  period: string;
  revenue: {
    [key: string]: number;
  };
  expenses: {
    [key: string]: number;
  };
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface IncomeStatementProps {
  data?: IncomeStatementData;
  className?: string;
}

export const IncomeStatement: React.FC<IncomeStatementProps> = ({
  data,
  className = ''
}) => {
  const defaultData: IncomeStatementData = {
    period: 'For the Year Ended December 31, 2023',
    revenue: {
      'Sales Revenue': 125000,
      'Service Revenue': 45000,
      'Other Revenue': 5000
    },
    expenses: {
      'Cost of Goods Sold': 65000,
      'Salaries and Wages': 35000,
      'Rent Expense': 12000,
      'Utilities Expense': 3000,
      'Marketing Expense': 8000,
      'Other Expenses': 2000
    },
    totalRevenue: 175000,
    totalExpenses: 125000,
    netIncome: 50000
  };

  const displayData = data || defaultData;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`income-statement ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b text-center">
          <h2 className="text-2xl font-bold text-gray-900">Income Statement</h2>
          <p className="text-gray-600 mt-1">{displayData.period}</p>
        </div>

        <div className="p-6">
          {/* Revenue Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h3>
            <div className="space-y-2">
              {Object.entries(displayData.revenue).map(([account, amount]) => (
                <div key={account} className="flex justify-between items-center py-1">
                  <span className="text-gray-700">{account}</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Revenue</span>
                  <span>{formatCurrency(displayData.totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses</h3>
            <div className="space-y-2">
              {Object.entries(displayData.expenses).map(([account, amount]) => (
                <div key={account} className="flex justify-between items-center py-1">
                  <span className="text-gray-700">{account}</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Expenses</span>
                  <span>{formatCurrency(displayData.totalExpenses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Income Section */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Net Income</span>
              <span className={displayData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(displayData.netIncome)}
              </span>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-500">Revenue</div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(displayData.totalRevenue)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Expenses</div>
              <div className="text-lg font-semibold text-red-600">
                {formatCurrency(displayData.totalExpenses)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Net Margin</div>
              <div className="text-lg font-semibold">
                {((displayData.netIncome / displayData.totalRevenue) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatement;
