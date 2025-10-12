import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/shared/components/layouts/AppLayout';
import { formatCurrency, formatDate, formatNumber } from '@/shared/CreateLiveIcon';
import { Product, StockMovement, InventoryStats } from '../ICONSIZES';

interface DashboardProps {
    products: Product[];
    lowStockProducts: Product[];
    recentMovements: StockMovement[];
    stats: InventoryStats;
    organization: {
        id: number;
        name: string;
    };
    error?: string;
}

export default function Dashboard({ 
    products = [], 
    lowStockProducts = [], 
    recentMovements = [], 
    stats, 
    organization,
    error 
}: DashboardProps) {
    if (error) {
        return (
            <AppLayout>
                <Head title="Inventory Dashboard" />
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
            <Head title="Inventory Dashboard" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Inventory Dashboard
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {organization.name} - Inventory Overview
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Link
                            href="/inventory/products/create"
                            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Add Product
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Products
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {formatNumber(stats.totalProducts)}
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
                                                Total Stock Value
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {formatCurrency(stats.totalStockValue)}
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
                                                Total Quantity
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {formatNumber(stats.totalStockQuantity)}
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
                                        <div className={`w-8 h-8 ${stats.lowStockProducts > 0 ? 'bg-red-500' : 'bg-gray-500'} rounded-md flex items-center justify-center`}>
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Low Stock Items
                                            </dt>
                                            <dd className={`text-lg font-medium ${stats.lowStockProducts > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                {formatNumber(stats.lowStockProducts)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Low Stock Alert */}
                {lowStockProducts.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    Low Stock Alert
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>
                                        {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} running low on stock.
                                        <Link href="/inventory/low-stock" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                                            View details
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Stock Movements */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Recent Stock Movements
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Latest inventory transactions
                        </p>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {recentMovements.length > 0 ? (
                            recentMovements.map((movement) => (
                                <li key={movement.id}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        movement.type === 'in' ? 'bg-green-100 text-green-800' :
                                                        movement.type === 'out' ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {movement.type.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {movement.product?.name || 'Unknown Product'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {movement.product?.sku} • {movement.warehouse?.name || 'Unknown Warehouse'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="text-sm text-gray-900 mr-4">
                                                    {movement.type === 'out' ? '-' : '+'}{formatNumber(movement.quantity)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formatDate(movement.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                        {movement.notes && (
                                            <div className="mt-2 text-sm text-gray-500 ml-12">
                                                {movement.notes}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li>
                                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                                    No recent stock movements found
                                </div>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Top Products */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Product Overview
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Your inventory products
                        </p>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {products.length > 0 ? (
                            products.slice(0, 10).map((product) => (
                                <li key={product.id}>
                                    <Link 
                                        href={`/inventory/products/${product.id}`}
                                        className="block hover:bg-gray-50"
                                    >
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className={`w-3 h-3 rounded-full ${
                                                            product.is_low_stock ? 'bg-red-400' : 'bg-green-400'
                                                        }`} />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            SKU: {product.sku} • {product.category?.name || 'No Category'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="text-sm text-gray-900 mr-4">
                                                        Stock: {formatNumber(product.total_stock || 0)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatCurrency(product.price)}
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
                                    No products found
                                </div>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </AppLayout>
    );
}
