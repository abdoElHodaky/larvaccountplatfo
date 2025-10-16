/**
 * Sales Overview Page
 * Main sales dashboard and management interface
 */

import React from 'react';
import { Head } from '@inertiajs/react';

interface SalesProps {
  invoices: any[];
  customers: any[];
  summary: {
    totalRevenue: number;
    totalInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    averageInvoiceValue: number;
    topCustomers: any[];
  };
}

export default function SalesIndex({ invoices, customers, summary }: SalesProps) {
  return (
    <>
      <Head title="Sales Management" />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Sales Management</h1>
                <div className="space-x-3">
                  <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Create Invoice
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Add Customer
                  </button>
                </div>
              </div>
              
              {/* Sales Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800">Total Revenue</h3>
                  <p className="text-2xl font-bold text-green-900">
                    ${summary.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600">This month</p>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800">Total Invoices</h3>
                  <p className="text-2xl font-bold text-blue-900">{summary.totalInvoices}</p>
                  <p className="text-sm text-blue-600">All time</p>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800">Paid Invoices</h3>
                  <p className="text-2xl font-bold text-purple-900">{summary.paidInvoices}</p>
                  <p className="text-sm text-purple-600">This month</p>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800">Overdue</h3>
                  <p className="text-2xl font-bold text-red-900">{summary.overdueInvoices}</p>
                  <p className="text-sm text-red-600">Need attention</p>
                </div>
                
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-indigo-800">Avg Invoice</h3>
                  <p className="text-2xl font-bold text-indigo-900">
                    ${summary.averageInvoiceValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-indigo-600">Per invoice</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Create Invoice</h3>
                  <p className="text-gray-600 mb-4">Generate new customer invoice</p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    New Invoice
                  </button>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Customer Management</h3>
                  <p className="text-gray-600 mb-4">Manage customer database</p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Manage Customers
                  </button>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Payment Tracking</h3>
                  <p className="text-gray-600 mb-4">Track invoice payments</p>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                    Track Payments
                  </button>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Sales Reports</h3>
                  <p className="text-gray-600 mb-4">Generate sales analytics</p>
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    View Reports
                  </button>
                </div>
              </div>

              {/* Top Customers */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {summary.topCustomers.slice(0, 6).map((customer, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4">
                      <h4 className="font-semibold">{customer.name}</h4>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                      <div className="mt-2 flex justify-between">
                        <span className="text-sm">Invoices: {customer.invoiceCount}</span>
                        <span className="text-sm font-medium">${customer.totalRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Invoices */}
              <div className="bg-white border rounded-lg">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">Recent Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.slice(0, 10).map((invoice, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{invoice.customerName}</div>
                              <div className="text-sm text-gray-500">{invoice.customerEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invoice.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invoice.dueDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${invoice.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                            <button className="text-green-600 hover:text-green-900 mr-3">Edit</button>
                            <button className="text-purple-600 hover:text-purple-900">Send</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

