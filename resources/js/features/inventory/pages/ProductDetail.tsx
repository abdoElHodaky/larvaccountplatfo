
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/shared/components/layouts/AppLayout';
import type { Product, ProductCategory } from '@/features/inventory/types';

interface ProductDetailProps {
    product: {
        id: number;
        name: string;
        sku: string;
        description?: string;
        price: number;
        cost: number;
        category?: ProductCategory;
        stock_levels?: Array<{
            id: number;
            warehouse_id: number;
            quantity: number;
            reserved_quantity: number;
            available_quantity: number;
            warehouse?: {
                id: number;
                name: string;
                code: string;
            };
        }>;
        stock_movements?: Array<{
            id: number;
            type: 'in' | 'out' | 'adjustment' | 'transfer';
            quantity: number;
            reference?: string;
            notes?: string;
            created_at: string;
            warehouse?: {
                id: number;
                name: string;
                code: string;
            };
        }>;
        total_stock: number;
        low_stock_threshold: number;
        is_low_stock: boolean;
        created_at: string;
        updated_at: string;
    } | null;
    relatedProducts: Product[];
    categories: ProductCategory[];
    organization: {
        id: number;
        name: string;
    };
    error?: string;
}

export default function ProductDetail({ 
    product, 
    relatedProducts = [], 
    categories: _categories = [], 
    organization: _organization,
    error 
}: ProductDetailProps) {
    if (error || !product) {
        return (
            <AppLayout>
                <Head title="Product Detail" />
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Error Loading Product
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error || 'Product not found'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    const totalStockValue = product.total_stock * product.cost;
    const profitMargin = product.price > 0 ? ((product.price - product.cost) / product.price * 100) : 0;

    return (
        <AppLayout>
            <Head title={`${product.name} - Product Detail`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <nav className="flex" aria-label="Breadcrumb">
                            <ol className="flex items-center space-x-4">
                                <li>
                                    <div>
                                        <Link href="/inventory" className="text-gray-400 hover:text-gray-500">
                                            <svg className="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                                            </svg>
                                            <span className="sr-only">Inventory</span>
                                        </Link>
                                    </div>
                                </li>
                                <li>
                                    <div className="flex items-center">
                                        <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <Link href="/inventory/products" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                                            Products
                                        </Link>
                                    </div>
                                </li>
                                <li>
                                    <div className="flex items-center">
                                        <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="ml-4 text-sm font-medium text-gray-500" aria-current="page">
                                            {product.name}
                                        </span>
                                    </div>
                                </li>
                            </ol>
                        </nav>
                        <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            {product.name}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            SKU: {product.sku} • {product.category?.name || 'No Category'}
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Link
                            href={`/inventory/products/${product.id}/edit`}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Edit Product
                        </Link>
                        <Link
                            href={`/inventory/products/${product.id}/stock-movement`}
                            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Adjust Stock
                        </Link>
                    </div>
                </div>

                {/* Stock Status Alert */}
                {product.is_low_stock && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    Low Stock Warning
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>
                                        This product is running low on stock. Current stock: {formatNumber(product.total_stock)}, 
                                        Threshold: {formatNumber(product.low_stock_threshold)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Product Overview */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Product Information
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Detailed information about this product
                        </p>
                    </div>
                    <div className="border-t border-gray-200">
                        <dl>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Description
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {product.description || 'No description available'}
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Selling Price
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {formatCurrency(product.price)}
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Cost Price
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {formatCurrency(product.cost)}
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Profit Margin
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {profitMargin.toFixed(2)}%
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Total Stock
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {formatNumber(product.total_stock)} units
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Stock Value
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {formatCurrency(totalStockValue)}
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Low Stock Threshold
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {formatNumber(product.low_stock_threshold)} units
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Stock Levels by Warehouse */}
                {product.stock_levels && product.stock_levels.length > 0 && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Stock Levels by Warehouse
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Current stock levels across all warehouses
                            </p>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {product.stock_levels.map((stockLevel) => (
                                <li key={stockLevel.id}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        stockLevel.quantity <= product.low_stock_threshold ? 'bg-red-400' : 'bg-green-400'
                                                    }`} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {stockLevel.warehouse?.name || 'Unknown Warehouse'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Code: {stockLevel.warehouse?.code || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-sm text-gray-900">
                                                    <span className="font-medium">Available:</span> {formatNumber(stockLevel.available_quantity)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    <span className="font-medium">Reserved:</span> {formatNumber(stockLevel.reserved_quantity)}
                                                </div>
                                                <div className="text-sm text-gray-900 font-medium">
                                                    <span className="font-medium">Total:</span> {formatNumber(stockLevel.quantity)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Recent Stock Movements */}
                {product.stock_movements && product.stock_movements.length > 0 && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Recent Stock Movements
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Latest stock movements for this product
                            </p>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {product.stock_movements.map((movement) => (
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
                                                        {movement.warehouse?.name || 'Unknown Warehouse'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {movement.reference && `Ref: ${movement.reference}`}
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
                            ))}
                        </ul>
                    </div>
                )}

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Related Products
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Products in the same category
                            </p>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {relatedProducts.map((relatedProduct) => (
                                <li key={relatedProduct.id}>
                                    <Link 
                                        href={`/inventory/products/${relatedProduct.id}`}
                                        className="block hover:bg-gray-50"
                                    >
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className={`w-3 h-3 rounded-full ${
                                                            relatedProduct.is_low_stock ? 'bg-red-400' : 'bg-green-400'
                                                        }`} />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {relatedProduct.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            SKU: {relatedProduct.sku}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="text-sm text-gray-900 mr-4">
                                                        Stock: {formatNumber(relatedProduct.total_stock || 0)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatCurrency(relatedProduct.price)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
