/**
 * Accounting-Specific Components
 * Specialized components for accounting and financial applications
 * Built with HeadlessUI and unified design patterns
 */

import React, { forwardRef, useState, useMemo, ReactNode } from 'react';
import { Combobox, Disclosure } from '@headlessui/react';
import {
    ChevronDownIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    DocumentTextIcon,
    CalendarIcon,
    FunnelIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    MinusIcon,
    PlusIcon,
    CheckIcon,
} from '@heroicons/react/20/solid';
import {
    cn,
    getSizeClasses,
    getColorClasses,
    formatCurrency,
    getAccountingColorClasses,
} from './utils';
import {
    AccountingAmount,
    TransactionRowProps,
    FinancialSummaryProps,
    Size,
    ColorScheme,
} from './types';

// =============================================================================
// ACCOUNT SELECTOR COMPONENT
// =============================================================================

interface Account {
    id: string;
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    subtype?: string;
    parentId?: string;
    level: number;
    balance?: number;
    children?: Account[];
    isActive: boolean;
}

interface AccountSelectorProps {
    accounts: Account[];
    value?: string;
    onChange?: (accountId: string, account: Account) => void;
    placeholder?: string;
    size?: Size;
    disabled?: boolean;
    showBalance?: boolean;
    filterByType?: Account['type'][];
    allowInactive?: boolean;
    className?: string;
}

export const AccountSelector = forwardRef<HTMLDivElement, AccountSelectorProps>(
    (
        {
            accounts,
            value,
            onChange,
            placeholder = 'Select account...',
            size = 'md',
            disabled = false,
            showBalance = false,
            filterByType,
            allowInactive = false,
            className,
            ...props
        },
        ref
    ) => {
        const [query, setQuery] = useState('');
        const sizeStyles = getSizeClasses(size);

        // Filter and flatten accounts
        const filteredAccounts = useMemo(() => {
            let result = accounts.filter((account) => {
                if (!allowInactive && !account.isActive) return false;
                if (filterByType && !filterByType.includes(account.type)) return false;
                return true;
            });

            // Apply search filter
            if (query) {
                result = result.filter(
                    (account) =>
                        account.name.toLowerCase().includes(query.toLowerCase()) ||
                        account.code.toLowerCase().includes(query.toLowerCase())
                );
            }

            return result;
        }, [accounts, query, filterByType, allowInactive]);

        const selectedAccount = accounts.find((account) => account.id === value);

        const getAccountTypeColor = (type: Account['type']) => {
            const colorMap: Record<Account['type'], ColorScheme> = {
                asset: 'asset',
                liability: 'liability',
                equity: 'equity',
                revenue: 'revenue',
                expense: 'expense',
            };
            return getColorClasses(colorMap[type]);
        };

        return (
            <Combobox
                value={value}
                onChange={(accountId) => {
                    const account = accounts.find((a) => a.id === accountId);
                    if (account) onChange?.(accountId, account);
                }}
                disabled={disabled}
            >
                <div ref={ref} className={cn('relative', className)} {...props}>
                    <div className='relative w-full cursor-default overflow-hidden rounded-md border bg-white text-left shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500'>
                        <Combobox.Input
                            className={cn(
                                'w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none',
                                disabled && 'opacity-50 cursor-not-allowed',
                                sizeStyles.text,
                                sizeStyles.padding
                            )}
                            displayValue={() =>
                                selectedAccount
                                    ? `${selectedAccount.code} - ${selectedAccount.name}`
                                    : ''
                            }
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={placeholder}
                            disabled={disabled}
                        />
                        <Combobox.Button className='absolute inset-y-0 right-0 flex items-center pr-2'>
                            <ChevronDownIcon className='h-5 w-5 text-gray-400' />
                        </Combobox.Button>
                    </div>

                    <Combobox.Options className='absolute z-dropdown mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm'>
                        {filteredAccounts.length === 0 && query !== '' ? (
                            <div className='relative cursor-default select-none py-2 px-4 text-gray-700'>
                                No accounts found.
                            </div>
                        ) : (
                            filteredAccounts.map((account) => {
                                const typeColors = getAccountTypeColor(account.type);
                                return (
                                    <Combobox.Option
                                        key={account.id}
                                        className={({ active }) =>
                                            cn(
                                                'relative cursor-default select-none py-2 pl-10 pr-4',
                                                active
                                                    ? 'bg-primary-100 text-primary-900'
                                                    : 'text-gray-900'
                                            )
                                        }
                                        value={account.id}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <div className='flex items-center justify-between'>
                                                    <div className='flex-1 min-w-0'>
                                                        <div className='flex items-center space-x-2'>
                                                            <span
                                                                className={cn(
                                                                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                                                    typeColors.light
                                                                )}
                                                            >
                                                                {account.type}
                                                            </span>
                                                            <span className='font-mono text-xs text-gray-500'>
                                                                {account.code}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className={cn(
                                                                'truncate',
                                                                selected
                                                                    ? 'font-medium'
                                                                    : 'font-normal',
                                                                'mt-1'
                                                            )}
                                                        >
                                                            {'  '.repeat(account.level)}
                                                            {account.name}
                                                        </div>
                                                    </div>
                                                    {showBalance &&
                                                        account.balance !== undefined && (
                                                            <div
                                                                className={cn(
                                                                    'text-sm font-medium',
                                                                    getAccountingColorClasses(
                                                                        'balance',
                                                                        account.balance
                                                                    )
                                                                )}
                                                            >
                                                                {formatCurrency(account.balance)}
                                                            </div>
                                                        )}
                                                </div>
                                                {selected && (
                                                    <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600'>
                                                        <CheckIcon className='h-5 w-5' />
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </Combobox.Option>
                                );
                            })
                        )}
                    </Combobox.Options>
                </div>
            </Combobox>
        );
    }
);

AccountSelector.displayName = 'AccountSelector';

// =============================================================================
// TRANSACTION ROW COMPONENT
// =============================================================================

export const TransactionRow = forwardRef<HTMLDivElement, TransactionRowProps>(
    (
        {
            date,
            description,
            account,
            debit,
            credit,
            balance,
            reference,
            onClick,
            className,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'grid grid-cols-7 gap-4 py-3 px-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                    onClick && 'cursor-pointer',
                    className
                )}
                onClick={onClick}
                {...props}
            >
                {/* Date */}
                <div className='text-sm text-gray-600 dark:text-gray-400'>
                    {new Date(date).toLocaleDateString()}
                </div>

                {/* Description */}
                <div className='col-span-2 text-sm text-gray-900 dark:text-gray-100'>
                    <div className='font-medium'>{description}</div>
                    {reference && (
                        <div className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                            Ref: {reference}
                        </div>
                    )}
                </div>

                {/* Account */}
                <div className='text-sm text-gray-700 dark:text-gray-300'>{account}</div>

                {/* Debit */}
                <div
                    className={cn(
                        'text-sm text-right font-mono',
                        debit ? getAccountingColorClasses('debit', debit.amount) : 'text-gray-400'
                    )}
                >
                    {debit ? (
                        <span>
                            {debit.formatted || formatCurrency(debit.amount, debit.currency)}
                        </span>
                    ) : (
                        <span>—</span>
                    )}
                </div>

                {/* Credit */}
                <div
                    className={cn(
                        'text-sm text-right font-mono',
                        credit
                            ? getAccountingColorClasses('credit', credit.amount)
                            : 'text-gray-400'
                    )}
                >
                    {credit ? (
                        <span>
                            {credit.formatted || formatCurrency(credit.amount, credit.currency)}
                        </span>
                    ) : (
                        <span>—</span>
                    )}
                </div>

                {/* Balance */}
                <div
                    className={cn(
                        'text-sm text-right font-mono font-medium',
                        balance
                            ? getAccountingColorClasses('balance', balance.amount)
                            : 'text-gray-400'
                    )}
                >
                    {balance ? (
                        <span>
                            {balance.formatted || formatCurrency(balance.amount, balance.currency)}
                        </span>
                    ) : (
                        <span>—</span>
                    )}
                </div>
            </div>
        );
    }
);

TransactionRow.displayName = 'TransactionRow';

// =============================================================================
// FINANCIAL SUMMARY COMPONENT
// =============================================================================

export const FinancialSummary = forwardRef<HTMLDivElement, FinancialSummaryProps>(
    ({ title, amount, change, trend, loading = false, className, ...props }, ref) => {
        if (loading) {
            return (
                <div className='animate-pulse bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
                    <div className='h-4 bg-gray-200 rounded w-1/2 mb-2'></div>
                    <div className='h-8 bg-gray-200 rounded w-3/4 mb-2'></div>
                    <div className='h-3 bg-gray-200 rounded w-1/3'></div>
                </div>
            );
        }

        const getTrendIcon = () => {
            switch (trend) {
                case 'up':
                    return <ArrowTrendingUpIcon className='h-4 w-4 text-green-500' />;
                case 'down':
                    return <ArrowTrendingDownIcon className='h-4 w-4 text-red-500' />;
                case 'neutral':
                default:
                    return <MinusIcon className='h-4 w-4 text-gray-500' />;
            }
        };

        const getTrendColor = () => {
            switch (trend) {
                case 'up':
                    return 'text-green-600 dark:text-green-400';
                case 'down':
                    return 'text-red-600 dark:text-red-400';
                case 'neutral':
                default:
                    return 'text-gray-600 dark:text-gray-400';
            }
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
                    className
                )}
                {...props}
            >
                <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                        <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                            {title}
                        </p>
                        <p
                            className={cn(
                                'text-3xl font-bold mb-2',
                                getAccountingColorClasses('balance', amount.amount)
                            )}
                        >
                            {amount.formatted || formatCurrency(amount.amount, amount.currency)}
                        </p>
                        {change && (
                            <div className='flex items-center space-x-2'>
                                {getTrendIcon()}
                                <span className={cn('text-sm font-medium', getTrendColor())}>
                                    {change.amount > 0 ? '+' : ''}
                                    {formatCurrency(change.amount)}
                                    <span className='text-gray-500 ml-1'>
                                        ({change.percentage > 0 ? '+' : ''}
                                        {change.percentage.toFixed(1)}%)
                                    </span>
                                </span>
                                {change.period && (
                                    <span className='text-xs text-gray-500'>
                                        vs {change.period}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className='ml-4'>
                        <div className='p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg'>
                            <CurrencyDollarIcon className='h-8 w-8 text-primary-600 dark:text-primary-400' />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

FinancialSummary.displayName = 'FinancialSummary';

// =============================================================================
// CHART OF ACCOUNTS TREE COMPONENT
// =============================================================================

interface ChartOfAccountsTreeProps {
    accounts: Account[];
    selectedAccountId?: string;
    onAccountSelect?: (account: Account) => void;
    showBalances?: boolean;
    expandedByDefault?: boolean;
    className?: string;
}

export const ChartOfAccountsTree = forwardRef<HTMLDivElement, ChartOfAccountsTreeProps>(
    (
        {
            accounts,
            selectedAccountId,
            onAccountSelect,
            showBalances = true,
            expandedByDefault = false,
            className,
            ...props
        },
        ref
    ) => {
        const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
            expandedByDefault ? new Set(accounts.map((a) => a.id)) : new Set()
        );

        const toggleNode = (accountId: string) => {
            const newExpanded = new Set(expandedNodes);
            if (newExpanded.has(accountId)) {
                newExpanded.delete(accountId);
            } else {
                newExpanded.add(accountId);
            }
            setExpandedNodes(newExpanded);
        };

        const renderAccount = (account: Account, level: number = 0) => {
            const hasChildren = account.children && account.children.length > 0;
            const isExpanded = expandedNodes.has(account.id);
            const isSelected = selectedAccountId === account.id;
            const typeColors = getColorClasses(account.type as ColorScheme);

            return (
                <div key={account.id}>
                    <div
                        className={cn(
                            'flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer',
                            isSelected &&
                                'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500',
                            !account.isActive && 'opacity-60'
                        )}
                        style={{ paddingLeft: `${12 + level * 20}px` }}
                        onClick={() => onAccountSelect?.(account)}
                    >
                        <div className='flex items-center space-x-2 flex-1 min-w-0'>
                            {hasChildren && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleNode(account.id);
                                    }}
                                    className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded'
                                >
                                    <ChevronRightIcon
                                        className={cn(
                                            'h-4 w-4 text-gray-400 transition-transform',
                                            isExpanded && 'rotate-90'
                                        )}
                                    />
                                </button>
                            )}
                            {!hasChildren && <div className='w-6' />}

                            <span
                                className={cn(
                                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                    typeColors.light
                                )}
                            >
                                {account.type}
                            </span>

                            <span className='font-mono text-xs text-gray-500'>{account.code}</span>

                            <span
                                className={cn(
                                    'text-sm truncate',
                                    isSelected
                                        ? 'font-medium text-primary-700 dark:text-primary-300'
                                        : 'text-gray-900 dark:text-gray-100'
                                )}
                            >
                                {account.name}
                            </span>
                        </div>

                        {showBalances && account.balance !== undefined && (
                            <div
                                className={cn(
                                    'text-sm font-mono font-medium',
                                    getAccountingColorClasses('balance', account.balance)
                                )}
                            >
                                {formatCurrency(account.balance)}
                            </div>
                        )}
                    </div>

                    {hasChildren && isExpanded && (
                        <div>
                            {account.children?.map((child) => renderAccount(child, level + 1))}
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
                    className
                )}
                {...props}
            >
                <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                        Chart of Accounts
                    </h3>
                </div>
                <div className='max-h-96 overflow-y-auto'>
                    {accounts.map((account) => renderAccount(account))}
                </div>
            </div>
        );
    }
);

ChartOfAccountsTree.displayName = 'ChartOfAccountsTree';

// =============================================================================
// JOURNAL ENTRY FORM COMPONENT
// =============================================================================

interface JournalEntryLine {
    id: string;
    accountId: string;
    accountName?: string;
    description?: string;
    debit?: number;
    credit?: number;
}

interface JournalEntryFormProps {
    lines: JournalEntryLine[];
    accounts: Account[];
    onLinesChange: (lines: JournalEntryLine[]) => void;
    onSubmit?: (lines: JournalEntryLine[]) => void;
    disabled?: boolean;
    className?: string;
}

export const JournalEntryForm = forwardRef<HTMLDivElement, JournalEntryFormProps>(
    ({ lines, accounts, onLinesChange, onSubmit, disabled = false, className, ...props }, ref) => {
        const addLine = () => {
            const newLine: JournalEntryLine = {
                id: Math.random().toString(36).substr(2, 9),
                accountId: '',
                description: '',
                debit: undefined,
                credit: undefined,
            };
            onLinesChange([...lines, newLine]);
        };

        const removeLine = (lineId: string) => {
            onLinesChange(lines.filter((line) => line.id !== lineId));
        };

        const updateLine = (lineId: string, updates: Partial<JournalEntryLine>) => {
            onLinesChange(
                lines.map((line) => (line.id === lineId ? { ...line, ...updates } : line))
            );
        };

        const totalDebits = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredits = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

        return (
            <div
                ref={ref}
                className={cn(
                    'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
                    className
                )}
                {...props}
            >
                <div className='flex items-center justify-between mb-6'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                        Journal Entry
                    </h3>
                    <button
                        onClick={addLine}
                        disabled={disabled}
                        className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50'
                    >
                        <PlusIcon className='h-4 w-4 mr-1' />
                        Add Line
                    </button>
                </div>

                <div className='space-y-4'>
                    {/* Header */}
                    <div className='grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2'>
                        <div className='col-span-4'>Account</div>
                        <div className='col-span-3'>Description</div>
                        <div className='col-span-2 text-right'>Debit</div>
                        <div className='col-span-2 text-right'>Credit</div>
                        <div className='col-span-1'></div>
                    </div>

                    {/* Lines */}
                    {lines.map((line, index) => (
                        <div key={line.id} className='grid grid-cols-12 gap-4 items-center'>
                            <div className='col-span-4'>
                                <AccountSelector
                                    accounts={accounts}
                                    value={line.accountId}
                                    onChange={(accountId, account) => {
                                        updateLine(line.id, {
                                            accountId,
                                            accountName: account.name,
                                        });
                                    }}
                                    size='sm'
                                    disabled={disabled}
                                />
                            </div>

                            <div className='col-span-3'>
                                <input
                                    type='text'
                                    value={line.description || ''}
                                    onChange={(e) =>
                                        updateLine(line.id, { description: e.target.value })
                                    }
                                    placeholder='Description'
                                    disabled={disabled}
                                    className='block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:opacity-50'
                                />
                            </div>

                            <div className='col-span-2'>
                                <input
                                    type='number'
                                    step='0.01'
                                    value={line.debit || ''}
                                    onChange={(e) => {
                                        const value = e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined;
                                        updateLine(line.id, { debit: value, credit: undefined });
                                    }}
                                    placeholder='0.00'
                                    disabled={disabled}
                                    className='block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-right font-mono disabled:opacity-50'
                                />
                            </div>

                            <div className='col-span-2'>
                                <input
                                    type='number'
                                    step='0.01'
                                    value={line.credit || ''}
                                    onChange={(e) => {
                                        const value = e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined;
                                        updateLine(line.id, { credit: value, debit: undefined });
                                    }}
                                    placeholder='0.00'
                                    disabled={disabled}
                                    className='block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-right font-mono disabled:opacity-50'
                                />
                            </div>

                            <div className='col-span-1 flex justify-end'>
                                <button
                                    onClick={() => removeLine(line.id)}
                                    disabled={disabled || lines.length <= 2}
                                    className='text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    <MinusIcon className='h-4 w-4' />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
                    <div className='grid grid-cols-12 gap-4 text-sm font-medium'>
                        <div className='col-span-7 text-right'>Totals:</div>
                        <div
                            className={cn(
                                'col-span-2 text-right font-mono',
                                getAccountingColorClasses('debit', totalDebits)
                            )}
                        >
                            {formatCurrency(totalDebits)}
                        </div>
                        <div
                            className={cn(
                                'col-span-2 text-right font-mono',
                                getAccountingColorClasses('credit', totalCredits)
                            )}
                        >
                            {formatCurrency(totalCredits)}
                        </div>
                        <div className='col-span-1 flex justify-center'>
                            {isBalanced ? (
                                <CheckIcon className='h-5 w-5 text-green-500' />
                            ) : (
                                <span className='text-red-500 text-xs'>Out of balance</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit */}
                {onSubmit && (
                    <div className='mt-6 flex justify-end'>
                        <button
                            onClick={() => onSubmit(lines)}
                            disabled={disabled || !isBalanced || lines.length < 2}
                            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            Save Journal Entry
                        </button>
                    </div>
                )}
            </div>
        );
    }
);

JournalEntryForm.displayName = 'JournalEntryForm';

// =============================================================================
// CURRENCY DISPLAY COMPONENT
// =============================================================================

interface CurrencyDisplayProps {
    amount: number;
    currency?: string;
    locale?: string;
    type?: 'debit' | 'credit' | 'balance';
    size?: Size;
    showSign?: boolean;
    className?: string;
}

export const CurrencyDisplay = forwardRef<HTMLSpanElement, CurrencyDisplayProps>(
    (
        {
            amount,
            currency = 'USD',
            locale = 'en-US',
            type = 'balance',
            size = 'md',
            showSign = false,
            className,
            ...props
        },
        ref
    ) => {
        const sizeStyles = getSizeClasses(size);
        const colorClasses = getAccountingColorClasses(type, amount);

        const formattedAmount = formatCurrency(amount, currency, locale);
        const displayAmount = showSign && amount > 0 ? `+${formattedAmount}` : formattedAmount;

        return (
            <span
                ref={ref}
                className={cn('font-mono font-medium', sizeStyles.text, colorClasses, className)}
                {...props}
            >
                {displayAmount}
            </span>
        );
    }
);

CurrencyDisplay.displayName = 'CurrencyDisplay';

// =============================================================================
// EXPORTS
// =============================================================================

export {
    AccountSelector,
    TransactionRow,
    FinancialSummary,
    ChartOfAccountsTree,
    JournalEntryForm,
    CurrencyDisplay,
};

// Export types
export type {
    Account,
    AccountSelectorProps,
    ChartOfAccountsTreeProps,
    JournalEntryLine,
    JournalEntryFormProps,
    CurrencyDisplayProps,
};
