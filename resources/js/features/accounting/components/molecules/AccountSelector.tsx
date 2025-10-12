import React from 'react';
import { Account } from '@/shared/ICONSIZES';

interface Props {
    accounts: Account[];
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    error?: string;
    allowEmpty?: boolean;
    filterType?: string;
    showBalance?: boolean;
}

export default function AccountSelector({
    accounts,
    value,
    onChange,
    placeholder = "Select an account",
    className = "",
    disabled = false,
    error,
    allowEmpty = true,
    filterType,
    showBalance = false
}: Props) {
    const filteredAccounts = filterType 
        ? accounts.filter(account => account.type === filterType)
        : accounts;

    const formatBalance = (balance: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(balance);
    };

    const renderAccountOption = (account: Account, level: number = 0) => {
        const indent = '  '.repeat(level);
        const balanceText = showBalance ? ` (${formatBalance(account.current_balance, account.currency)})` : '';
        
        return (
            <React.Fragment key={account.id}>
                <option value={account.id}>
                    {indent}{account.code} - {account.name}{balanceText}
                </option>
                {account.children?.map(child => renderAccountOption(child, level + 1))}
            </React.Fragment>
        );
    };

    return (
        <div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    error ? 'border-red-300' : ''
                } ${disabled ? 'bg-gray-100' : ''} ${className}`}
            >
                {allowEmpty && <option value="">{placeholder}</option>}
                {filteredAccounts.map(account => renderAccountOption(account))}
            </select>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
