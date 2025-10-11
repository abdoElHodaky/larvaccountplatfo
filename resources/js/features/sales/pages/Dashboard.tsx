import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/shared/components/layouts/AppLayout';
import { formatCurrency, formatDate, formatNumber, formatPercentage } from '@/shared/utils';
import { SalesOrder, Customer, SalesStats, SalesTrends } from '../types';

interface DashboardProps {
    overview: SalesStats;
    recentOrders: SalesOrder[];
    topCustomers: Customer[];
    salesTrends: SalesTrends;
    organization: {
        id: number;
        name: string;
    };
    error?: string;
}

export default function Dashboard({ 
    overview, 
    recentOrders = [], 
    topCustomers = [], 
    salesTrends,
    organization,
    error 
}: DashboardProps) {
    if (error) {
        return (
            <AppLayout>
                <Head title="Sales Dashboard" />
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Error Loading Dashboard
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Using shared formatters from utils

    return (
        <AppLayout>
            <Head title="Sales Dashboard" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Sales Dashboard
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {organization.name} - Sales Overview
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Link
                            href="/sales/customers/create"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Add Customer
                        </Link>
                        <Link
                            href="/sales/orders/create"
                            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Create Order
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                {overview && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Customers
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {formatNumber(overview.totalCustomers)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Revenue
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {formatCurrency(overview.totalRevenue)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Orders
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {formatNumber(overview.totalOrders)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Avg Order Value
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {formatCurrency(overview.averageOrderValue)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Monthly Performance */}
                {overview && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Monthly Revenue
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {formatCurrency(overview.monthlyRevenue)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className={`w-8 h-8 ${overview.monthlyGrowth >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded-md flex items-center justify-center`}>
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Monthly Growth
                                            </dt>
                                            <dd className={`text-lg font-medium ${overview.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {overview.monthlyGrowth >= 0 ? '+' : ''}{overview.monthlyGrowth.toFixed(1)}%
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Orders */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Recent Orders
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Latest sales orders
                        </p>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {recentOrders.length > 0 ? (
                            recentOrders.map((order) => (
                                <li key={order.id}>
                                    <Link 
                                        href={`/sales/orders/${order.id}`}
                                        className="block hover:bg-gray-50"
                                    >
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {order.order_number}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {order.customer?.name || 'Unknown Customer'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="text-sm text-gray-900 mr-4">
                                                        {formatCurrency(order.total_amount)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatDate(order.order_date)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))
                        ) : (
                            <li>
                                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                                    No recent orders found
                                </div>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Top Customers */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Top Customers
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Your best customers by total spent
                        </p>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {topCustomers.length > 0 ? (
                            topCustomers.map((customer) => (
                                <li key={customer.id}>
                                    <Link 
                                        href={`/sales/customers/${customer.id}`}
                                        className="block hover:bg-gray-50"
                                    >
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className={`w-3 h-3 rounded-full ${
                                                            customer.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                                                        }`} />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {customer.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {customer.email || 'No email'} • {customer.type}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="text-sm text-gray-900 mr-4">
                                                        {formatNumber(customer.total_orders || 0)} orders
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatCurrency(customer.total_spent || 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))
                        ) : (
                            <li>
                                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                                    No customers found
                                </div>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </AppLayout>
    );
}
