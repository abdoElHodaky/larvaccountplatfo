/**
 * Balance Sheet Report Component
 * Display balance sheet financial report
 */

import React from 'react';

interface BalanceSheetData {
  period: string;
  assets: {
    current: { [key: string]: number };
    nonCurrent: { [key: string]: number };
  };
  liabilities: {
    current: { [key: string]: number };
    nonCurrent: { [key: string]: number };
  };
  equity: {
    [key: string]: number;
  };
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

interface BalanceSheetProps {
  data?: BalanceSheetData;
  className?: string;
}

export const BalanceSheet: React.FC<BalanceSheetProps> = ({
  data,
  className = ''
}) => {
  const defaultData: BalanceSheetData = {
    period: 'As of December 31, 2023',
    assets: {
      current: {
        'Cash and Cash Equivalents': 45000,
        'Accounts Receivable': 25000,
        'Inventory': 15000,
        'Prepaid Expenses': 3000
      },
      nonCurrent: {
        'Property, Plant & Equipment': 85000,
        'Intangible Assets': 12000,
        'Long-term Investments': 8000
      }
    },
    liabilities: {
      current: {
        'Accounts Payable': 18000,
        'Short-term Debt': 10000,
        'Accrued Expenses': 5000
      },
      nonCurrent: {
        'Long-term Debt': 35000,
        'Deferred Tax Liabilities': 3000
      }
    },
    equity: {
      'Common Stock': 50000,
      'Retained Earnings': 72000
    },
    totalAssets: 193000,
    totalLiabilities: 71000,
    totalEquity: 122000
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

  const calculateSubtotal = (items: { [key: string]: number }): number => {
    return Object.values(items).reduce((sum, value) => sum + value, 0);
  };

  return (
    <div className={`balance-sheet ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b text-center">
          <h2 className="text-2xl font-bold text-gray-900">Balance Sheet</h2>
          <p className="text-gray-600 mt-1">{displayData.period}</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assets Column */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Assets</h3>
              
              {/* Current Assets */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Current Assets</h4>
                <div className="space-y-2 ml-4">
                  {Object.entries(displayData.assets.current).map(([account, amount]) => (
                    <div key={account} className="flex justify-between items-center py-1">
                      <span className="text-gray-700">{account}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Current Assets</span>
                      <span>{formatCurrency(calculateSubtotal(displayData.assets.current))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Non-Current Assets */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Non-Current Assets</h4>
                <div className="space-y-2 ml-4">
                  {Object.entries(displayData.assets.nonCurrent).map(([account, amount]) => (
                    <div key={account} className="flex justify-between items-center py-1">
                      <span className="text-gray-700">{account}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Non-Current Assets</span>
                      <span>{formatCurrency(calculateSubtotal(displayData.assets.nonCurrent))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Assets */}
              <div className="border-t-2 border-gray-300 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Assets</span>
                  <span>{formatCurrency(displayData.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities & Equity Column */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Liabilities & Equity</h3>
              
              {/* Current Liabilities */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Current Liabilities</h4>
                <div className="space-y-2 ml-4">
                  {Object.entries(displayData.liabilities.current).map(([account, amount]) => (
                    <div key={account} className="flex justify-between items-center py-1">
                      <span className="text-gray-700">{account}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Current Liabilities</span>
                      <span>{formatCurrency(calculateSubtotal(displayData.liabilities.current))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Non-Current Liabilities */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Non-Current Liabilities</h4>
                <div className="space-y-2 ml-4">
                  {Object.entries(displayData.liabilities.nonCurrent).map(([account, amount]) => (
                    <div key={account} className="flex justify-between items-center py-1">
                      <span className="text-gray-700">{account}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Non-Current Liabilities</span>
                      <span>{formatCurrency(calculateSubtotal(displayData.liabilities.nonCurrent))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Liabilities */}
              <div className="mb-6 border-t pt-3">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Liabilities</span>
                  <span>{formatCurrency(displayData.totalLiabilities)}</span>
                </div>
              </div>

              {/* Equity */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Equity</h4>
                <div className="space-y-2 ml-4">
                  {Object.entries(displayData.equity).map(([account, amount]) => (
                    <div key={account} className="flex justify-between items-center py-1">
                      <span className="text-gray-700">{account}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Equity</span>
                      <span>{formatCurrency(displayData.totalEquity)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Liabilities & Equity */}
              <div className="border-t-2 border-gray-300 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Liabilities & Equity</span>
                  <span>{formatCurrency(displayData.totalLiabilities + displayData.totalEquity)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Balance Check</div>
              <div className={`text-lg font-semibold ${
                displayData.totalAssets === (displayData.totalLiabilities + displayData.totalEquity)
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {displayData.totalAssets === (displayData.totalLiabilities + displayData.totalEquity)
                  ? '✓ Balance Sheet is Balanced'
                  : '⚠️ Balance Sheet is Not Balanced'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
