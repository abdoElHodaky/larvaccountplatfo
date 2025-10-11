import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/shared/components/layouts/AppLayout';
import { Account, AccountBalance, Transaction, PageProps, PaginatedData } from '@/shared/types';
import {
    ArrowLeftIcon,
    PencilIcon,
    // ChartBarIcon,
    // CalendarIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

interface Props extends PageProps {
    account: Account & {
        parent?: Account;
        children?: Account[];
        balances?: AccountBalance[];
    };
    transactions: PaginatedData<Transaction>;
    balanceHistory: AccountBalance[];
    filters: {
        period?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function ShowAccount({ account, transactions, balanceHistory, filters }: Props) {
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period || 'monthly');

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

    const getAccountTypeColor = (type: string) => {
        const colors = {
            asset: 'bg-green-100 text-green-800',
            liability: 'bg-red-100 text-red-800',
            equity: 'bg-blue-100 text-blue-800',
            revenue: 'bg-purple-100 text-purple-800',
            expense: 'bg-orange-100 text-orange-800',
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getTransactionTypeColor = (type: string) => {
        const colors = {
            journal_entry: 'bg-blue-100 text-blue-800',
            invoice: 'bg-green-100 text-green-800',
            payment: 'bg-purple-100 text-purple-800',
            receipt: 'bg-indigo-100 text-indigo-800',
            transfer: 'bg-yellow-100 text-yellow-800',
            adjustment: 'bg-orange-100 text-orange-800',
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

    return (
        <AppLayout>
            <Head title={`Account: ${account.name}`} />

            <div className='py-6'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    {/* Header */}
                    <div className='mb-6'>
                        <div className='flex items-center space-x-4'>
                            <Link
                                href={route('accounting.accounts.index')}
                                className='inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700'
                            >
                                <ArrowLeftIcon className='h-4 w-4 mr-1' />
                                Back to Accounts
                            </Link>
                        </div>
                        <div className='mt-4 md:flex md:items-center md:justify-between'>
                            <div className='flex-1 min-w-0'>
                                <h1 className='text-2xl font-bold text-gray-900'>{account.name}</h1>
                                <div className='mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6'>
                                    <div className='mt-2 flex items-center text-sm text-gray-500'>
                                        <DocumentTextIcon className='flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400' />
                                        {account.code}
                                    </div>
                                    <div className='mt-2 flex items-center text-sm text-gray-500'>
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.type)}`}
                                        >
                                            {account.type} - {account.subtype}
                                        </span>
                                    </div>
                                    <div className='mt-2 flex items-center text-sm text-gray-500'>
                                        <CurrencyDollarIcon className='flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400' />
                                        {formatBalance(account.current_balance, account.currency)}
                                    </div>
                                </div>
                            </div>
                            <div className='mt-4 flex md:mt-0 md:ml-4'>
                                <Link
                                    href={route('accounting.accounts.edit', account.id)}
                                    className='inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                >
                                    <PencilIcon className='-ml-1 mr-2 h-5 w-5' />
                                    Edit Account
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                        {/* Account Details */}
                        <div className='lg:col-span-1'>
                            <div className='bg-white shadow rounded-lg'>
                                <div className='px-6 py-4 border-b border-gray-200'>
                                    <h3 className='text-lg font-medium text-gray-900'>
                                        Account Details
                                    </h3>
                                </div>
                                <div className='px-6 py-4 space-y-4'>
                                    <div>
                                        <dt className='text-sm font-medium text-gray-500'>
                                            Account Code
                                        </dt>
                                        <dd className='mt-1 text-sm text-gray-900'>
                                            {account.code}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='text-sm font-medium text-gray-500'>
                                            Account Type
                                        </dt>
                                        <dd className='mt-1'>
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.type)}`}
                                            >
                                                {account.type}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='text-sm font-medium text-gray-500'>
                                            Subtype
                                        </dt>
                                        <dd className='mt-1 text-sm text-gray-900'>
                                            {account.subtype}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='text-sm font-medium text-gray-500'>
                                            Normal Balance
                                        </dt>
                                        <dd className='mt-1 text-sm text-gray-900 capitalize'>
                                            {account.normal_balance}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='text-sm font-medium text-gray-500'>
                                            Currency
                                        </dt>
                                        <dd className='mt-1 text-sm text-gray-900'>
                                            {account.currency}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='text-sm font-medium text-gray-500'>
                                            Current Balance
                                        </dt>
                                        <dd className='mt-1 text-lg font-semibold text-gray-900'>
                                            {formatBalance(
                                                account.current_balance,
                                                account.currency
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='text-sm font-medium text-gray-500'>
                                            Opening Balance
                                        </dt>
                                        <dd className='mt-1 text-sm text-gray-900'>
                                            {formatBalance(
                                                account.opening_balance,
                                                account.currency
                                            )}
                                        </dd>
                                    </div>
                                    {account.description && (
                                        <div>
                                            <dt className='text-sm font-medium text-gray-500'>
                                                Description
                                            </dt>
                                            <dd className='mt-1 text-sm text-gray-900'>
                                                {account.description}
                                            </dd>
                                        </div>
                                    )}
                                    {account.parent && (
                                        <div>
                                            <dt className='text-sm font-medium text-gray-500'>
                                                Parent Account
                                            </dt>
                                            <dd className='mt-1'>
                                                <Link
                                                    href={route(
                                                        'accounting.accounts.show',
                                                        account.parent.id
                                                    )}
                                                    className='text-sm text-indigo-600 hover:text-indigo-900'
                                                >
                                                    {account.parent.code} - {account.parent.name}
                                                </Link>
                                            </dd>
                                        </div>
                                    )}
                                    <div>
                                        <dt className='text-sm font-medium text-gray-500'>
                                            Status
                                        </dt>
                                        <dd className='mt-1'>
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    account.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {account.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='text-sm font-medium text-gray-500'>
                                            Manual Entries
                                        </dt>
                                        <dd className='mt-1'>
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    account.allow_manual_entries
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {account.allow_manual_entries
                                                    ? 'Allowed'
                                                    : 'Not Allowed'}
                                            </span>
                                        </dd>
                                    </div>
                                </div>
                            </div>

                            {/* Child Accounts */}
                            {account.children && account.children.length > 0 && (
                                <div className='mt-6 bg-white shadow rounded-lg'>
                                    <div className='px-6 py-4 border-b border-gray-200'>
                                        <h3 className='text-lg font-medium text-gray-900'>
                                            Sub-Accounts
                                        </h3>
                                    </div>
                                    <div className='px-6 py-4'>
                                        <ul className='space-y-3'>
                                            {account.children.map((child) => (
                                                <li key={child.id}>
                                                    <Link
                                                        href={route(
                                                            'accounting.accounts.show',
                                                            child.id
                                                        )}
                                                        className='block hover:bg-gray-50 rounded-md p-2 -m-2'
                                                    >
                                                        <div className='flex items-center justify-between'>
                                                            <div>
                                                                <p className='text-sm font-medium text-gray-900'>
                                                                    {child.name}
                                                                </p>
                                                                <p className='text-xs text-gray-500'>
                                                                    {child.code}
                                                                </p>
                                                            </div>
                                                            <div className='text-sm text-gray-900'>
                                                                {formatBalance(
                                                                    child.current_balance,
                                                                    child.currency
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Balance History & Transactions */}
                        <div className='lg:col-span-2 space-y-6'>
                            {/* Balance History */}
                            {balanceHistory.length > 0 && (
                                <div className='bg-white shadow rounded-lg'>
                                    <div className='px-6 py-4 border-b border-gray-200'>
                                        <div className='flex items-center justify-between'>
                                            <h3 className='text-lg font-medium text-gray-900'>
                                                Balance History
                                            </h3>
                                            <select
                                                value={selectedPeriod}
                                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                                className='text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500'
                                            >
                                                <option value='daily'>Daily</option>
                                                <option value='monthly'>Monthly</option>
                                                <option value='quarterly'>Quarterly</option>
                                                <option value='yearly'>Yearly</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className='overflow-x-auto'>
                                        <table className='min-w-full divide-y divide-gray-200'>
                                            <thead className='bg-gray-50'>
                                                <tr>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                        Period
                                                    </th>
                                                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                        Opening
                                                    </th>
                                                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                        Debits
                                                    </th>
                                                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                        Credits
                                                    </th>
                                                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                        Closing
                                                    </th>
                                                    <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                        Reconciled
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white divide-y divide-gray-200'>
                                                {balanceHistory.slice(0, 10).map((balance) => (
                                                    <tr
                                                        key={balance.id}
                                                        className='hover:bg-gray-50'
                                                    >
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                            {formatDate(balance.period_date)}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right'>
                                                            {formatBalance(
                                                                balance.opening_balance,
                                                                balance.currency
                                                            )}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right'>
                                                            {formatBalance(
                                                                balance.debit_total,
                                                                balance.currency
                                                            )}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right'>
                                                            {formatBalance(
                                                                balance.credit_total,
                                                                balance.currency
                                                            )}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium'>
                                                            {formatBalance(
                                                                balance.closing_balance,
                                                                balance.currency
                                                            )}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-center'>
                                                            <span
                                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                    balance.is_reconciled
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                }`}
                                                            >
                                                                {balance.is_reconciled
                                                                    ? 'Yes'
                                                                    : 'No'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Recent Transactions */}
                            <div className='bg-white shadow rounded-lg'>
                                <div className='px-6 py-4 border-b border-gray-200'>
                                    <div className='flex items-center justify-between'>
                                        <h3 className='text-lg font-medium text-gray-900'>
                                            Recent Transactions
                                        </h3>
                                        <Link
                                            href={route('accounting.transactions.index', {
                                                account_id: account.id,
                                            })}
                                            className='text-sm text-indigo-600 hover:text-indigo-900'
                                        >
                                            View all transactions
                                        </Link>
                                    </div>
                                </div>
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
                                                            {formatDate(
                                                                transaction.transaction_date
                                                            )}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                            <Link
                                                                href={route(
                                                                    'accounting.transactions.show',
                                                                    transaction.id
                                                                )}
                                                                className='text-indigo-600 hover:text-indigo-900'
                                                            >
                                                                {transaction.transaction_number}
                                                            </Link>
                                                        </td>
                                                        <td className='px-6 py-4 text-sm text-gray-900'>
                                                            {transaction.description}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <span
                                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}
                                                            >
                                                                {transaction.type.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right'>
                                                            {formatBalance(
                                                                transaction.total_amount,
                                                                transaction.currency
                                                            )}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <span
                                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}
                                                            >
                                                                {transaction.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className='px-6 py-12 text-center text-sm text-gray-500'
                                                    >
                                                        <div className='flex flex-col items-center'>
                                                            <ClockIcon className='h-12 w-12 text-gray-400 mb-4' />
                                                            <p>
                                                                No transactions found for this
                                                                account
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
