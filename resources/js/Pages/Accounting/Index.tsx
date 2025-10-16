/**
 * Accounting Overview Page
 * Main accounting dashboard and navigation
 */

import React from 'react';
import { Head } from '@inertiajs/react';

interface Props {
  accounts: any[];
  transactions: any[];
  summary: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    monthlyRevenue: number;
  };
}

export default function AccountingIndex({ accounts, transactions, summary }: Props) {
  return (
    <>
      <Head title="Accounting Overview" />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h1 className="text-3xl font-bold mb-6">Accounting Overview</h1>
              
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800">Total Assets</h3>
                  <p className="text-2xl font-bold text-blue-900">
                    ${summary.totalAssets.toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800">Total Liabilities</h3>
                  <p className="text-2xl font-bold text-red-900">
                    ${summary.totalLiabilities.toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800">Total Equity</h3>
                  <p className="text-2xl font-bold text-green-900">
                    ${summary.totalEquity.toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800">Monthly Revenue</h3>
                  <p className="text-2xl font-bold text-purple-900">
                    ${summary.monthlyRevenue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Chart of Accounts</h3>
                  <p className="text-gray-600 mb-4">Manage your account structure</p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    View Accounts
                  </button>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Transactions</h3>
                  <p className="text-gray-600 mb-4">Record and manage transactions</p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Add Transaction
                  </button>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Financial Reports</h3>
                  <p className="text-gray-600 mb-4">Generate financial statements</p>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

