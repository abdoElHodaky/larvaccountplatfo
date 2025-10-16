/**
 * Inventory Overview Page
 * Main inventory management dashboard
 */

import React from 'react';
import { Head } from '@inertiajs/react';

interface InventoryProps {
  products: any[];
  categories: any[];
  summary: {
    totalProducts: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    topSellingProducts: any[];
  };
}

export default function InventoryIndex({ products, categories, summary }: InventoryProps) {
  return (
    <>
      <Head title="Inventory Management" />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Inventory Management</h1>
                <div className="space-x-3">
                  <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Add Product
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Stock Adjustment
                  </button>
                </div>
              </div>
              
              {/* Inventory Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800">Total Products</h3>
                  <p className="text-2xl font-bold text-blue-900">{summary.totalProducts}</p>
                  <p className="text-sm text-blue-600">Active items</p>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800">Total Value</h3>
                  <p className="text-2xl font-bold text-green-900">
                    ${summary.totalValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600">Current inventory</p>
                </div>
                
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-800">Low Stock</h3>
                  <p className="text-2xl font-bold text-yellow-900">{summary.lowStockItems}</p>
                  <p className="text-sm text-yellow-600">Items need reorder</p>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800">Out of Stock</h3>
                  <p className="text-2xl font-bold text-red-900">{summary.outOfStockItems}</p>
                  <p className="text-sm text-red-600">Items unavailable</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Product Management</h3>
                  <p className="text-gray-600 mb-4">Add, edit, or remove products</p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Manage Products
                  </button>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Stock Movements</h3>
                  <p className="text-gray-600 mb-4">Track inventory changes</p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    View Movements
                  </button>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Inventory Reports</h3>
                  <p className="text-gray-600 mb-4">Generate inventory reports</p>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                    View Reports
                  </button>
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {summary.topSellingProducts.slice(0, 6).map((product, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4">
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                      <div className="mt-2 flex justify-between">
                        <span className="text-sm">Sold: {product.soldQuantity}</span>
                        <span className="text-sm font-medium">${product.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Products */}
              <div className="bg-white border rounded-lg">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">Recent Products</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
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
                      {products.slice(0, 10).map((product, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gray-200 rounded-lg mr-3"></div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.description?.substring(0, 50)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`${product.stock < product.minStock ? 'text-red-600 font-semibold' : ''}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.stock === 0 ? 'bg-red-100 text-red-800' :
                              product.stock < product.minStock ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {product.stock === 0 ? 'Out of Stock' :
                               product.stock < product.minStock ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                            <button className="text-green-600 hover:text-green-900">Adjust Stock</button>
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

