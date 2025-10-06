import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { JournalEntry, PageProps, PaginatedData } from '@/Types';
import { 
    PlusIcon, 
    MagnifyingGlassIcon,
    FunnelIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Props extends PageProps {
    journalEntries: PaginatedData<JournalEntry & {
        entry_number: string;
        entry_date: string;
        description: string;
        total_debits: number;
        total_credits: number;
        status: 'draft' | 'posted' | 'reversed';
        currency: string;
        is_balanced: boolean;
    }>;
    filters: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
    journalEntryStatuses: Record<string, string>;
}

export default function JournalEntriesIndex({ 
    journalEntries, 
    filters, 
    journalEntryStatuses 
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('accounting.journal-entries.index'), {
            search,
            status: selectedStatus,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setSelectedStatus('');
        setDateFrom('');
        setDateTo('');
        router.get(route('accounting.journal-entries.index'));
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

    const getStatusColor = (status: string) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            posted: 'bg-green-100 text-green-800',
            reversed: 'bg-orange-100 text-orange-800',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const handlePost = (entryId: number) => {
        if (confirm('Are you sure you want to post this journal entry? This action cannot be undone.')) {
            router.post(route('accounting.journal-entries.post', entryId));
        }
    };

    const handleReverse = (entryId: number) => {
        const reason = prompt('Please enter a reason for reversing this journal entry:');
        if (reason) {
            router.post(route('accounting.journal-entries.reverse', entryId), {
                reason: reason
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Journal Entries" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                Journal Entries
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage your organization's journal entries and double-entry bookkeeping
                            </p>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <Link
                                href={route('accounting.journal-entries.create')}
                                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                New Journal Entry
                            </Link>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="Search journal entries..."
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        >
                                            <option value="">All Status</option>
                                            {Object.entries(journalEntryStatuses).map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor="date_from" className="text-sm font-medium text-gray-700">
                                            From:
                                        </label>
                                        <input
                                            type="date"
                                            id="date_from"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor="date_to" className="text-sm font-medium text-gray-700">
                                            To:
                                        </label>
                                        <input
                                            type="date"
                                            id="date_to"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <FunnelIcon className="-ml-1 mr-2 h-4 w-4" />
                                            Filter
                                        </button>
                                        {(search || selectedStatus || dateFrom || dateTo) && (
                                            <button
                                                type="button"
                                                onClick={handleClearFilters}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Journal Entries Table */}
                        <div className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Entry #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Debits
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Credits
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Balanced
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
                                        {journalEntries.data.length > 0 ? (
                                            journalEntries.data.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <Link
                                                            href={route('accounting.journal-entries.show', entry.id)}
                                                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                                                        >
                                                            {entry.entry_number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(entry.entry_date)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        <div className="max-w-xs truncate">{entry.description}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                                        {formatBalance(entry.total_debits, entry.currency)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                                        {formatBalance(entry.total_credits, entry.currency)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {entry.is_balanced ? (
                                                            <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                                                        ) : (
                                                            <div className="h-5 w-5 rounded-full bg-red-500 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                                                            {journalEntryStatuses[entry.status] || entry.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <Link
                                                                href={route('accounting.journal-entries.show', entry.id)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title="View Journal Entry"
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                            </Link>
                                                            {entry.status === 'draft' && (
                                                                <>
                                                                    <Link
                                                                        href={route('accounting.journal-entries.edit', entry.id)}
                                                                        className="text-yellow-600 hover:text-yellow-900"
                                                                        title="Edit Journal Entry"
                                                                    >
                                                                        <PencilIcon className="h-4 w-4" />
                                                                    </Link>
                                                                    {entry.is_balanced && (
                                                                        <button
                                                                            onClick={() => handlePost(entry.id)}
                                                                            className="text-green-600 hover:text-green-900"
                                                                            title="Post Journal Entry"
                                                                        >
                                                                            <CheckCircleIcon className="h-4 w-4" />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => {
                                                                            if (confirm('Are you sure you want to delete this journal entry?')) {
                                                                                router.delete(route('accounting.journal-entries.destroy', entry.id));
                                                                            }
                                                                        }}
                                                                        className="text-red-600 hover:text-red-900"
                                                                        title="Delete Journal Entry"
                                                                    >
                                                                        <TrashIcon className="h-4 w-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {entry.status === 'posted' && (
                                                                <button
                                                                    onClick={() => handleReverse(entry.id)}
                                                                    className="text-orange-600 hover:text-orange-900"
                                                                    title="Reverse Journal Entry"
                                                                >
                                                                    <ArrowPathIcon className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                                                    <div className="flex flex-col items-center">
                                                        <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <p className="text-lg font-medium text-gray-900 mb-2">No journal entries found</p>
                                                        <p className="text-gray-500 mb-4">Get started by creating your first journal entry.</p>
                                                        <Link
                                                            href={route('accounting.journal-entries.create')}
                                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                                        >
                                                            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                                                            Create Journal Entry
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
                        {journalEntries.data.length > 0 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    {journalEntries.prev_page_url && (
                                        <Link
                                            href={journalEntries.prev_page_url}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {journalEntries.next_page_url && (
                                        <Link
                                            href={journalEntries.next_page_url}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{journalEntries.from}</span> to{' '}
                                            <span className="font-medium">{journalEntries.to}</span> of{' '}
                                            <span className="font-medium">{journalEntries.total}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {journalEntries.links.map((link, index) => (
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
                                                        index === journalEntries.links.length - 1 ? 'rounded-r-md' : ''
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
