import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/shared/components/layouts/AppLayout';
import { Account, PageProps, SelectOption } from '@/shared/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AnimatedFormInput from '@/shared/components/AnimatedFormInput';

interface Props extends PageProps {
    parentAccounts: Account[];
    accountTypes: Record<string, string>;
    accountSubtypes: Record<string, string[]>;
    currencies: SelectOption[];
}

export default function CreateAccount({ parentAccounts, accountTypes, accountSubtypes, currencies }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        parent_id: '',
        code: '',
        name: '',
        description: '',
        type: '',
        subtype: '',
        normal_balance: 'debit' as 'debit' | 'credit',
        is_active: true,
        allow_manual_entries: true,
        currency: 'USD',
        opening_balance: '0.00',
        tax_code: '',
        reporting_categories: [] as string[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('accounting.accounts.store'), {
            onSuccess: () => reset(),
        });
    };

    const getAvailableSubtypes = () => {
        return data.type ? accountSubtypes[data.type] || [] : [];
    };

    const handleTypeChange = (type: string) => {
        setData(prev => ({
            ...prev,
            type,
            subtype: '',
            normal_balance: ['asset', 'expense'].includes(type) ? 'debit' : 'credit'
        }));
    };

    return (
        <AppLayout>
            <Head title="Create Account" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                href={route('accounting.accounts.index')}
                                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                                Back to Accounts
                            </Link>
                        </div>
                        <div className="mt-4">
                            <h1 className="text-2xl font-bold text-gray-900">Create New Account</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Add a new account to your chart of accounts
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="bg-white shadow rounded-lg">
                        <form onSubmit={handleSubmit} className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {/* Account Code */}
                                <div>
                                    <AnimatedFormInput
                                        type="text"
                                        label="Account Code *"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        error={errors.code}
                                        placeholder="e.g., 1000"
                                        animationType="focus"
                                        className="mt-1"
                                    />
                                </div>

                                {/* Account Name */}
                                <div>
                                    <AnimatedFormInput
                                        type="text"
                                        label="Account Name *"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={errors.name}
                                        placeholder="e.g., Cash in Bank"
                                        animationType="glow"
                                        className="mt-1"
                                    />
                                </div>

                                {/* Account Type */}
                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                        Account Type *
                                    </label>
                                    <select
                                        id="type"
                                        value={data.type}
                                        onChange={(e) => handleTypeChange(e.target.value)}
                                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                            errors.type ? 'border-red-300' : ''
                                        }`}
                                    >
                                        <option value="">Select account type</option>
                                        {Object.entries(accountTypes).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                    {errors.type && (
                                        <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                                    )}
                                </div>

                                {/* Account Subtype */}
                                <div>
                                    <label htmlFor="subtype" className="block text-sm font-medium text-gray-700">
                                        Account Subtype *
                                    </label>
                                    <select
                                        id="subtype"
                                        value={data.subtype}
                                        onChange={(e) => setData('subtype', e.target.value)}
                                        disabled={!data.type}
                                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                            errors.subtype ? 'border-red-300' : ''
                                        } ${!data.type ? 'bg-gray-100' : ''}`}
                                    >
                                        <option value="">Select account subtype</option>
                                        {getAvailableSubtypes().map((subtype) => (
                                            <option key={subtype} value={subtype}>{subtype}</option>
                                        ))}
                                    </select>
                                    {errors.subtype && (
                                        <p className="mt-1 text-sm text-red-600">{errors.subtype}</p>
                                    )}
                                </div>

                                {/* Parent Account */}
                                <div>
                                    <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
                                        Parent Account
                                    </label>
                                    <select
                                        id="parent_id"
                                        value={data.parent_id}
                                        onChange={(e) => setData('parent_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option value="">No parent (top-level account)</option>
                                        {parentAccounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.code} - {account.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.parent_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.parent_id}</p>
                                    )}
                                </div>

                                {/* Normal Balance */}
                                <div>
                                    <label htmlFor="normal_balance" className="block text-sm font-medium text-gray-700">
                                        Normal Balance *
                                    </label>
                                    <select
                                        id="normal_balance"
                                        value={data.normal_balance}
                                        onChange={(e) => setData('normal_balance', e.target.value as 'debit' | 'credit')}
                                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                            errors.normal_balance ? 'border-red-300' : ''
                                        }`}
                                    >
                                        <option value="debit">Debit</option>
                                        <option value="credit">Credit</option>
                                    </select>
                                    {errors.normal_balance && (
                                        <p className="mt-1 text-sm text-red-600">{errors.normal_balance}</p>
                                    )}
                                </div>

                                {/* Currency */}
                                <div>
                                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                                        Currency *
                                    </label>
                                    <select
                                        id="currency"
                                        value={data.currency}
                                        onChange={(e) => setData('currency', e.target.value)}
                                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                            errors.currency ? 'border-red-300' : ''
                                        }`}
                                    >
                                        {currencies.map((currency) => (
                                            <option key={currency.value} value={currency.value}>
                                                {currency.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.currency && (
                                        <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
                                    )}
                                </div>

                                {/* Opening Balance */}
                                <div>
                                    <label htmlFor="opening_balance" className="block text-sm font-medium text-gray-700">
                                        Opening Balance
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        id="opening_balance"
                                        value={data.opening_balance}
                                        onChange={(e) => setData('opening_balance', e.target.value)}
                                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                            errors.opening_balance ? 'border-red-300' : ''
                                        }`}
                                        placeholder="0.00"
                                    />
                                    {errors.opening_balance && (
                                        <p className="mt-1 text-sm text-red-600">{errors.opening_balance}</p>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Optional description for this account"
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>

                            {/* Tax Code */}
                            <div>
                                <label htmlFor="tax_code" className="block text-sm font-medium text-gray-700">
                                    Tax Code
                                </label>
                                <input
                                    type="text"
                                    id="tax_code"
                                    value={data.tax_code}
                                    onChange={(e) => setData('tax_code', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Optional tax code"
                                />
                                {errors.tax_code && (
                                    <p className="mt-1 text-sm text-red-600">{errors.tax_code}</p>
                                )}
                            </div>

                            {/* Checkboxes */}
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input
                                        id="is_active"
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                        Active account
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="allow_manual_entries"
                                        type="checkbox"
                                        checked={data.allow_manual_entries}
                                        onChange={(e) => setData('allow_manual_entries', e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="allow_manual_entries" className="ml-2 block text-sm text-gray-900">
                                        Allow manual journal entries
                                    </label>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                <Link
                                    href={route('accounting.accounts.index')}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {processing ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
