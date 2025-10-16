/**
 * Main Dashboard Page
 * Central hub for all business metrics and quick actions
 */

import React from 'react';
import { Head } from '@inertiajs/react';

interface DashboardProps {
  metrics: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    cashFlow: number;
    activeCustomers: number;
    pendingInvoices: number;
    overdueInvoices: number;
    inventoryValue: number;
  };
  recentTransactions: any[];
  alerts: any[];
}

export default function DashboardIndex({ metrics, recentTransactions, alerts }: DashboardProps) {
  return (
    <>
      <Head title="Dashboard" />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h1 className="text-3xl font-bold mb-6">Business Dashboard</h1>
              
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-green-400 to-green-600 p-6 rounded-lg text-white">
                  <h3 className="text-lg font-semibold">Total Revenue</h3>
                  <p className="text-3xl font-bold">${metrics.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm opacity-90">This month</p>
                </div>
                
                <div className="bg-gradient-to-r from-red-400 to-red-600 p-6 rounded-lg text-white">
                  <h3 className="text-lg font-semibold">Total Expenses</h3>
                  <p className="text-3xl font-bold">${metrics.totalExpenses.toLocaleString()}</p>
                  <p className="text-sm opacity-90">This month</p>
                </div>
                
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-6 rounded-lg text-white">
                  <h3 className="text-lg font-semibold">Net Income</h3>
                  <p className="text-3xl font-bold">${metrics.netIncome.toLocaleString()}</p>
                  <p className="text-sm opacity-90">This month</p>
                </div>
                
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 p-6 rounded-lg text-white">
                  <h3 className="text-lg font-semibold">Cash Flow</h3>
                  <p className="text-3xl font-bold">${metrics.cashFlow.toLocaleString()}</p>
                  <p className="text-sm opacity-90">Current</p>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700">Active Customers</h4>
                  <p className="text-2xl font-bold text-gray-900">{metrics.activeCustomers}</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-700">Pending Invoices</h4>
                  <p className="text-2xl font-bold text-yellow-900">{metrics.pendingInvoices}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-700">Overdue Invoices</h4>
                  <p className="text-2xl font-bold text-red-900">{metrics.overdueInvoices}</p>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-indigo-700">Inventory Value</h4>
                  <p className="text-2xl font-bold text-indigo-900">${metrics.inventoryValue.toLocaleString()}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white border-2 border-gray-200 p-6 rounded-lg hover:border-blue-300 transition-colors">
                  <h3 className="text-lg font-semibold mb-2">Create Invoice</h3>
                  <p className="text-gray-600 mb-4">Generate a new invoice for customers</p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    New Invoice
                  </button>
                </div>
                
                <div className="bg-white border-2 border-gray-200 p-6 rounded-lg hover:border-green-300 transition-colors">
                  <h3 className="text-lg font-semibold mb-2">Record Transaction</h3>
                  <p className="text-gray-600 mb-4">Add income or expense transaction</p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Add Transaction
                  </button>
                </div>
                
                <div className="bg-white border-2 border-gray-200 p-6 rounded-lg hover:border-purple-300 transition-colors">
                  <h3 className="text-lg font-semibold mb-2">View Reports</h3>
                  <p className="text-gray-600 mb-4">Generate financial reports</p>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                    View Reports
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-600">{transaction.date}</p>
                      </div>
                      <div className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

