import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/shared/components/layouts/AppLayout';
import { Transaction, Account, PageProps, PaginatedData } from '@/shared/types';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    DocumentDuplicateIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface Props extends PageProps {
    transactions: PaginatedData<Transaction>;
    accounts: Account[];
    filters: {
        search?: string;
        type?: string;
        status?: string;
        account_id?: string;
        date_from?: string;
        date_to?: string;
    };
    transactionTypes: Record<string, string>;
    transactionStatuses: Record<string, string>;
}

export default function TransactionsIndex({
    transactions,
    accounts,
    filters,
    transactionTypes,
    transactionStatuses,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedAccount, setSelectedAccount] = useState(filters.account_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('accounting.transactions.index'),
            {
                search,
                type: selectedType,
                status: selectedStatus,
                account_id: selectedAccount,
                date_from: dateFrom,
                date_to: dateTo,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleClearFilters = () => {
        setSearch('');
        setSelectedType('');
        setSelectedStatus('');
        setSelectedAccount('');
        setDateFrom('');
        setDateTo('');
        router.get(route('accounting.transactions.index'));
    };

    const formatBalance = (balance: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(balance);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getTransactionTypeColor = (type: string) => {
        const colors = {
            journal_entry: 'bg-blue-100 text-blue-800',
            invoice: 'bg-green-100 text-green-800',
            payment: 'bg-purple-100 text-purple-800',
            receipt: 'bg-indigo-100 text-indigo-800',
            transfer: 'bg-yellow-100 text-yellow-800',
            adjustment: 'bg-orange-100 text-orange-800',
            opening_balance: 'bg-gray-100 text-gray-800',
            closing_entry: 'bg-red-100 text-red-800',
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getStatusColor = (status: string) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-blue-100 text-blue-800',
            posted: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            reversed: 'bg-orange-100 text-orange-800',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const handleDuplicate = (transactionId: number) => {
        router.post(route('accounting.transactions.duplicate', transactionId));
    };

    const handleReverse = (transactionId: number) => {
        if (
            confirm(
                'Are you sure you want to reverse this transaction? This action cannot be undone.'
            )
        ) {
            router.post(route('accounting.transactions.reverse', transactionId));
        }
    };

    return (
        <AppLayout>
            <Head title='Transactions' />

            <div className='py-6'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    {/* Header */}
                    <div className='md:flex md:items-center md:justify-between'>
                        <div className='flex-1 min-w-0'>
                            <h2 className='text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate'>
                                Transactions
                            </h2>
                            <p className='mt-1 text-sm text-gray-500'>
                                Manage your organization's financial transactions
                            </p>
                        </div>
                        <div className='mt-4 flex md:mt-0 md:ml-4'>
                            <Link
                                href={route('accounting.transactions.create')}
                                className='ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            >
                                <PlusIcon className='-ml-1 mr-2 h-5 w-5' />
                                New Transaction
                            </Link>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className='mt-6 bg-white shadow rounded-lg'>
                        <div className='px-6 py-4 border-b border-gray-200'>
                            <form onSubmit={handleSearch} className='space-y-4'>
                                <div className='flex flex-wrap items-center gap-4'>
                                    <div className='flex-1 min-w-0'>
                                        <div className='relative'>
                                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                                <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' />
                                            </div>
                                            <input
                                                type='text'
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder='Search transactions...'
                                                className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                                            />
                                        </div>
                                    </div>
                                    <div className='flex items-center space-x-4'>
                                        <select
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                            className='block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'
                                        >
                                            <option value=''>All Types</option>
                                            {Object.entries(transactionTypes).map(
                                                ([value, label]) => (
                                                    <option key={value} value={value}>
                                                        {label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className='block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'
                                        >
                                            <option value=''>All Status</option>
                                            {Object.entries(transactionStatuses).map(
                                                ([value, label]) => (
                                                    <option key={value} value={value}>
                                                        {label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                        <select
                                            value={selectedAccount}
                                            onChange={(e) => setSelectedAccount(e.target.value)}
                                            className='block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'
                                        >
                                            <option value=''>All Accounts</option>
                                            {accounts.map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.code} - {account.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className='flex flex-wrap items-center gap-4'>
                                    <div className='flex items-center space-x-2'>
                                        <label
                                            htmlFor='date_from'
                                            className='text-sm font-medium text-gray-700'
                                        >
                                            From:
                                        </label>
                                        <input
                                            type='date'
                                            id='date_from'
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className='border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                                        />
                                    </div>
                                    <div className='flex items-center space-x-2'>
                                        <label
                                            htmlFor='date_to'
                                            className='text-sm font-medium text-gray-700'
                                        >
                                            To:
                                        </label>
                                        <input
                                            type='date'
                                            id='date_to'
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className='border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                                        />
                                    </div>
                                    <div className='flex items-center space-x-2'>
                                        <button
                                            type='submit'
                                            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                        >
                                            <FunnelIcon className='-ml-1 mr-2 h-4 w-4' />
                                            Filter
                                        </button>
                                        {(search ||
                                            selectedType ||
                                            selectedStatus ||
                                            selectedAccount ||
                                            dateFrom ||
                                            dateTo) && (
                                            <button
                                                type='button'
                                                onClick={handleClearFilters}
                                                className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Transactions Table */}
                        <div className='overflow-hidden'>
                            <div className='overflow-x-auto'>
                                <table className='min-w-full divide-y divide-gray-200'>
                                    <thead className='bg-gray-50'>
                                        <tr>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                Date
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                Reference
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                Description
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                Type
                                            </th>
                                            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                Amount
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                Status
                                            </th>
                                            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className='bg-white divide-y divide-gray-200'>
                                        {transactions.data.length > 0 ? (
                                            transactions.data.map((transaction) => (
                                                <tr
                                                    key={transaction.id}
                                                    className='hover:bg-gray-50'
                                                >
                                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                        {formatDate(transaction.transaction_date)}
                                                    </td>
                                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                        <Link
                                                            href={route(
                                                                'accounting.transactions.show',
                                                                transaction.id
                                                            )}
                                                            className='text-indigo-600 hover:text-indigo-900 font-medium'
                                                        >
                                                            {transaction.transaction_number}
                                                        </Link>
                                                        {transaction.reference && (
                                                            <div className='text-xs text-gray-500'>
                                                                {transaction.reference}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className='px-6 py-4 text-sm text-gray-900'>
                                                        <div className='max-w-xs truncate'>
                                                            {transaction.description}
                                                        </div>
                                                        {transaction.notes && (
                                                            <div className='text-xs text-gray-500 max-w-xs truncate'>
                                                                {transaction.notes}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className='px-6 py-4 whitespace-nowrap'>
                                                        <span
                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}
                                                        >
                                                            {transactionTypes[transaction.type] ||
                                                                transaction.type.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium'>
                                                        {formatBalance(
                                                            transaction.total_amount,
                                                            transaction.currency
                                                        )}
                                                    </td>
                                                    <td className='px-6 py-4 whitespace-nowrap'>
                                                        <span
                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}
                                                        >
                                                            {transactionStatuses[
                                                                transaction.status
                                                            ] || transaction.status}
                                                        </span>
                                                    </td>
                                                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                        <div className='flex items-center justify-end space-x-2'>
                                                            <Link
                                                                href={route(
                                                                    'accounting.transactions.show',
                                                                    transaction.id
                                                                )}
                                                                className='text-indigo-600 hover:text-indigo-900'
                                                                title='View Transaction'
                                                            >
                                                                <EyeIcon className='h-4 w-4' />
                                                            </Link>
                                                            {transaction.status === 'draft' && (
                                                                <Link
                                                                    href={route(
                                                                        'accounting.transactions.edit',
                                                                        transaction.id
                                                                    )}
                                                                    className='text-yellow-600 hover:text-yellow-900'
                                                                    title='Edit Transaction'
                                                                >
                                                                    <PencilIcon className='h-4 w-4' />
                                                                </Link>
                                                            )}
                                                            <button
                                                                onClick={() =>
                                                                    handleDuplicate(transaction.id)
                                                                }
                                                                className='text-blue-600 hover:text-blue-900'
                                                                title='Duplicate Transaction'
                                                            >
                                                                <DocumentDuplicateIcon className='h-4 w-4' />
                                                            </button>
                                                            {transaction.status === 'posted' &&
                                                                !transaction.reversed_at && (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleReverse(
                                                                                transaction.id
                                                                            )
                                                                        }
                                                                        className='text-orange-600 hover:text-orange-900'
                                                                        title='Reverse Transaction'
                                                                    >
                                                                        <ArrowPathIcon className='h-4 w-4' />
                                                                    </button>
                                                                )}
                                                            {transaction.status === 'draft' && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (
                                                                            confirm(
                                                                                'Are you sure you want to delete this transaction?'
                                                                            )
                                                                        ) {
                                                                            router.delete(
                                                                                route(
                                                                                    'accounting.transactions.destroy',
                                                                                    transaction.id
                                                                                )
                                                                            );
                                                                        }
                                                                    }}
                                                                    className='text-red-600 hover:text-red-900'
                                                                    title='Delete Transaction'
                                                                >
                                                                    <TrashIcon className='h-4 w-4' />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className='px-6 py-12 text-center text-sm text-gray-500'
                                                >
                                                    <div className='flex flex-col items-center'>
                                                        <svg
                                                            className='h-12 w-12 text-gray-400 mb-4'
                                                            fill='none'
                                                            viewBox='0 0 24 24'
                                                            stroke='currentColor'
                                                        >
                                                            <path
                                                                strokeLinecap='round'
                                                                strokeLinejoin='round'
                                                                strokeWidth={2}
                                                                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                                            />
                                                        </svg>
                                                        <p className='text-lg font-medium text-gray-900 mb-2'>
                                                            No transactions found
                                                        </p>
                                                        <p className='text-gray-500 mb-4'>
                                                            Get started by creating your first
                                                            transaction.
                                                        </p>
                                                        <Link
                                                            href={route(
                                                                'accounting.transactions.create'
                                                            )}
                                                            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700'
                                                        >
                                                            <PlusIcon className='-ml-1 mr-2 h-4 w-4' />
                                                            Create Transaction
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {transactions.data.length > 0 && (
                            <div className='bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6'>
                                <div className='flex-1 flex justify-between sm:hidden'>
                                    {transactions.prev_page_url && (
                                        <Link
                                            href={transactions.prev_page_url}
                                            className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {transactions.next_page_url && (
                                        <Link
                                            href={transactions.next_page_url}
                                            className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                                <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                                    <div>
                                        <p className='text-sm text-gray-700'>
                                            Showing{' '}
                                            <span className='font-medium'>{transactions.from}</span>{' '}
                                            to{' '}
                                            <span className='font-medium'>{transactions.to}</span>{' '}
                                            of{' '}
                                            <span className='font-medium'>
                                                {transactions.total}
                                            </span>{' '}
                                            results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'>
                                            {transactions.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        link.active
                                                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    } ${index === 0 ? 'rounded-l-md' : ''} ${
                                                        index === transactions.links.length - 1
                                                            ? 'rounded-r-md'
                                                            : ''
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
