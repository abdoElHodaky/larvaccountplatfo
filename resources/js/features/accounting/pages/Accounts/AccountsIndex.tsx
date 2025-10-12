import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/shared/components/layouts/AppLayout';
import { Account, PageProps, PaginatedData } from '@/shared/ICONSIZES';
import { 
    PlusIcon, 
    MagnifyingGlassIcon,
    FunnelIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    ChevronRightIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';

interface Props extends PageProps {
    accounts: PaginatedData<Account>;
    filters: {
        search?: string;
        type?: string;
        status?: string;
    };
    accountTypes: Record<string, string>;
}

export default function AccountsIndex({ accounts, filters, accountTypes }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('accounting.accounts.index'), {
            search,
            type: selectedType,
            status: selectedStatus,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setSelectedType('');
        setSelectedStatus('');
        router.get(route('accounting.accounts.index'));
    };

    const toggleAccountExpansion = (accountId: number) => {
        const newExpanded = new Set(expandedAccounts);
        if (newExpanded.has(accountId)) {
            newExpanded.delete(accountId);
        } else {
            newExpanded.add(accountId);
        }
        setExpandedAccounts(newExpanded);
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

    const formatBalance = (balance: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(balance);
    };

    const renderAccountRow = (account: Account, level: number = 0) => {
        const hasChildren = account.children && account.children.length > 0;
        const isExpanded = expandedAccounts.has(account.id);
        const indent = level * 24;

        return (
            <React.Fragment key={account.id}>
                <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
                            {hasChildren && (
                                <button
                                    onClick={() => toggleAccountExpansion(account.id)}
                                    className="mr-2 p-1 hover:bg-gray-200 rounded"
                                >
                                    {isExpanded ? (
                                        <ChevronDownIcon className="h-4 w-4" />
                                    ) : (
                                        <ChevronRightIcon className="h-4 w-4" />
                                    )}
                                </button>
                            )}
                            {!hasChildren && <div className="w-6 mr-2" />}
                            <div>
                                <div className="font-medium">{account.name}</div>
                                <div className="text-xs text-gray-500">{account.code}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.type)}`}>
                            {accountTypes[account.type] || account.type}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.subtype}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatBalance(account.current_balance, account.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            account.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                            <Link
                                href={route('accounting.accounts.show', account.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="View Account"
                            >
                                <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                                href={route('accounting.accounts.edit', account.id)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Edit Account"
                            >
                                <PencilIcon className="h-4 w-4" />
                            </Link>
                            {!account.is_system && (
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this account?')) {
                                            router.delete(route('accounting.accounts.destroy', account.id));
                                        }
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete Account"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </td>
                </tr>
                {hasChildren && isExpanded && account.children?.map(child => 
                    renderAccountRow(child, level + 1)
                )}
            </React.Fragment>
        );
    };

    return (
        <AppLayout>
            <Head title="Chart of Accounts" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                Chart of Accounts
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage your organization's chart of accounts and account hierarchy
                            </p>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <Link
                                href={route('accounting.accounts.create')}
                                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                New Account
                            </Link>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search accounts..."
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    >
                                        <option value="">All Types</option>
                                        {Object.entries(accountTypes).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <FunnelIcon className="-ml-1 mr-2 h-4 w-4" />
                                        Filter
                                    </button>
                                    {(search || selectedType || selectedStatus) && (
                                        <button
                                            type="button"
                                            onClick={handleClearFilters}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Accounts Table */}
                        <div className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Account
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Subtype
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Balance
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {accounts.data.length > 0 ? (
                                            accounts.data.map(account => renderAccountRow(account))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                                    <div className="flex flex-col items-center">
                                                        <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <p className="text-lg font-medium text-gray-900 mb-2">No accounts found</p>
                                                        <p className="text-gray-500 mb-4">Get started by creating your first account.</p>
                                                        <Link
                                                            href={route('accounting.accounts.create')}
                                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                                        >
                                                            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                                                            Create Account
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
                        {accounts.data.length > 0 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    {accounts.prev_page_url && (
                                        <Link
                                            href={accounts.prev_page_url}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {accounts.next_page_url && (
                                        <Link
                                            href={accounts.next_page_url}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{accounts.from}</span> to{' '}
                                            <span className="font-medium">{accounts.to}</span> of{' '}
                                            <span className="font-medium">{accounts.total}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {accounts.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        link.active
                                                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    } ${
                                                        index === 0 ? 'rounded-l-md' : ''
                                                    } ${
                                                        index === accounts.links.length - 1 ? 'rounded-r-md' : ''
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
