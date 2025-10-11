
import { Head } from '@inertiajs/react';
import AppLayout from '@/shared/components/layouts/AppLayout';
import { formatCurrency, formatDate } from '@/shared/utils';
import { Account, Transaction } from '../types';

interface DashboardProps {
    accounts: Account[];
    recentTransactions: Transaction[];
    stats: {
        totalAccounts: number;
        totalTransactions: number;
        totalAssets: number;
        totalLiabilities: number;
        totalEquity: number;
        totalRevenue: number;
        totalExpenses: number;
        netIncome: number;
    };
    organization: {
        id: number;
        name: string;
    };
    error?: string;
}

export default function Dashboard({
    accounts = [],
    recentTransactions = [],
    stats,
    organization,
    error,
}: DashboardProps) {
    if (error) {
        return (
            <AppLayout>
                <Head title='Accounting Dashboard' />
                <div className='bg-red-50 border border-red-200 rounded-md p-4'>
                    <div className='flex'>
                        <div className='ml-3'>
                            <h3 className='text-sm font-medium text-red-800'>
                                Error Loading Dashboard
                            </h3>
                            <div className='mt-2 text-sm text-red-700'>
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
            <Head title='Accounting Dashboard' />

            <div className='space-y-6'>
                {/* Header */}
                <div className='md:flex md:items-center md:justify-between'>
                    <div className='flex-1 min-w-0'>
                        <h2 className='text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate'>
                            Accounting Dashboard
                        </h2>
                        <p className='mt-1 text-sm text-gray-500'>
                            {organization.name} - Financial Overview
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                {stats && (
                    <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='bg-white overflow-hidden shadow rounded-lg'>
                            <div className='p-5'>
                                <div className='flex items-center'>
                                    <div className='flex-shrink-0'>
                                        <div className='w-8 h-8 bg-green-500 rounded-md flex items-center justify-center'>
                                            <svg
                                                className='w-5 h-5 text-white'
                                                fill='currentColor'
                                                viewBox='0 0 20 20'
                                            >
                                                <path
                                                    fillRule='evenodd'
                                                    d='M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z'
                                                    clipRule='evenodd'
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className='ml-5 w-0 flex-1'>
                                        <dl>
                                            <dt className='text-sm font-medium text-gray-500 truncate'>
                                                Total Assets
                                            </dt>
                                            <dd className='text-lg font-medium text-gray-900'>
                                                {formatCurrency(stats.totalAssets)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white overflow-hidden shadow rounded-lg'>
                            <div className='p-5'>
                                <div className='flex items-center'>
                                    <div className='flex-shrink-0'>
                                        <div className='w-8 h-8 bg-red-500 rounded-md flex items-center justify-center'>
                                            <svg
                                                className='w-5 h-5 text-white'
                                                fill='currentColor'
                                                viewBox='0 0 20 20'
                                            >
                                                <path
                                                    fillRule='evenodd'
                                                    d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                                                    clipRule='evenodd'
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className='ml-5 w-0 flex-1'>
                                        <dl>
                                            <dt className='text-sm font-medium text-gray-500 truncate'>
                                                Total Liabilities
                                            </dt>
                                            <dd className='text-lg font-medium text-gray-900'>
                                                {formatCurrency(stats.totalLiabilities)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white overflow-hidden shadow rounded-lg'>
                            <div className='p-5'>
                                <div className='flex items-center'>
                                    <div className='flex-shrink-0'>
                                        <div className='w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center'>
                                            <svg
                                                className='w-5 h-5 text-white'
                                                fill='currentColor'
                                                viewBox='0 0 20 20'
                                            >
                                                <path
                                                    fillRule='evenodd'
                                                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                                    clipRule='evenodd'
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className='ml-5 w-0 flex-1'>
                                        <dl>
                                            <dt className='text-sm font-medium text-gray-500 truncate'>
                                                Total Revenue
                                            </dt>
                                            <dd className='text-lg font-medium text-gray-900'>
                                                {formatCurrency(stats.totalRevenue)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white overflow-hidden shadow rounded-lg'>
                            <div className='p-5'>
                                <div className='flex items-center'>
                                    <div className='flex-shrink-0'>
                                        <div
                                            className={`w-8 h-8 ${stats.netIncome >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded-md flex items-center justify-center`}
                                        >
                                            <svg
                                                className='w-5 h-5 text-white'
                                                fill='currentColor'
                                                viewBox='0 0 20 20'
                                            >
                                                <path
                                                    fillRule='evenodd'
                                                    d='M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z'
                                                    clipRule='evenodd'
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className='ml-5 w-0 flex-1'>
                                        <dl>
                                            <dt className='text-sm font-medium text-gray-500 truncate'>
                                                Net Income
                                            </dt>
                                            <dd
                                                className={`text-lg font-medium ${stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {formatCurrency(stats.netIncome)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Transactions */}
                <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                    <div className='px-4 py-5 sm:px-6'>
                        <h3 className='text-lg leading-6 font-medium text-gray-900'>
                            Recent Transactions
                        </h3>
                        <p className='mt-1 max-w-2xl text-sm text-gray-500'>
                            Latest accounting transactions
                        </p>
                    </div>
                    <ul className='divide-y divide-gray-200'>
                        {recentTransactions.length > 0 ? (
                            recentTransactions.map((transaction) => (
                                <li key={transaction.id}>
                                    <div className='px-4 py-4 sm:px-6'>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center'>
                                                <div className='flex-shrink-0'>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            transaction.status === 'posted'
                                                                ? 'bg-green-100 text-green-800'
                                                                : transaction.status === 'pending'
                                                                  ? 'bg-yellow-100 text-yellow-800'
                                                                  : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {transaction.status}
                                                    </span>
                                                </div>
                                                <div className='ml-4'>
                                                    <div className='text-sm font-medium text-gray-900'>
                                                        {transaction.transaction_number}
                                                    </div>
                                                    <div className='text-sm text-gray-500'>
                                                        {transaction.description}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='flex items-center'>
                                                <div className='text-sm text-gray-900 mr-4'>
                                                    {formatCurrency(transaction.total_amount)}
                                                </div>
                                                <div className='text-sm text-gray-500'>
                                                    {formatDate(transaction.transaction_date)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li>
                                <div className='px-4 py-4 sm:px-6 text-center text-gray-500'>
                                    No recent transactions found
                                </div>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Account Summary */}
                <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                    <div className='px-4 py-5 sm:px-6'>
                        <h3 className='text-lg leading-6 font-medium text-gray-900'>
                            Account Summary
                        </h3>
                        <p className='mt-1 max-w-2xl text-sm text-gray-500'>
                            Overview of your chart of accounts
                        </p>
                    </div>
                    <div className='border-t border-gray-200'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6'>
                            {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => {
                                const typeAccounts = accounts.filter(
                                    (account) => account.type === type
                                );
                                const totalBalance = typeAccounts.reduce(
                                    (sum, account) => sum + account.current_balance,
                                    0
                                );

                                return (
                                    <div key={type} className='bg-gray-50 rounded-lg p-4'>
                                        <div className='text-sm font-medium text-gray-900 capitalize mb-2'>
                                            {type}s ({typeAccounts.length})
                                        </div>
                                        <div className='text-lg font-semibold text-gray-900'>
                                            {formatCurrency(totalBalance)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
