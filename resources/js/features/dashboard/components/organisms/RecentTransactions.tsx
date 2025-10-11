/**
 * Recent Transactions Component
 * Display recent financial transactions
 */

import React from 'react';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
    category?: string;
}

interface RecentTransactionsProps {
    transactions?: Transaction[];
    className?: string;
    limit?: number;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
    transactions = [],
    className = '',
    limit = 5,
}) => {
    const defaultTransactions: Transaction[] = [
        {
            id: '1',
            description: 'Payment from Client ABC',
            amount: 2500.0,
            date: '2023-12-25',
            type: 'income',
            category: 'Services',
        },
        {
            id: '2',
            description: 'Office Supplies Purchase',
            amount: -150.0,
            date: '2023-12-24',
            type: 'expense',
            category: 'Office',
        },
        {
            id: '3',
            description: 'Software Subscription',
            amount: -99.0,
            date: '2023-12-23',
            type: 'expense',
            category: 'Software',
        },
        {
            id: '4',
            description: 'Product Sale #1234',
            amount: 450.0,
            date: '2023-12-22',
            type: 'income',
            category: 'Sales',
        },
        {
            id: '5',
            description: 'Marketing Campaign',
            amount: -300.0,
            date: '2023-12-21',
            type: 'expense',
            category: 'Marketing',
        },
    ];

    const displayTransactions = transactions.length > 0 ? transactions : defaultTransactions;
    const limitedTransactions = displayTransactions.slice(0, limit);

    return (
        <div className={`recent-transactions ${className}`}>
            <div className='bg-white rounded-lg shadow-sm border'>
                <div className='p-6 border-b'>
                    <h3 className='text-lg font-semibold text-gray-900'>Recent Transactions</h3>
                </div>
                <div className='divide-y'>
                    {limitedTransactions.map((transaction) => (
                        <div key={transaction.id} className='p-4 hover:bg-gray-50'>
                            <div className='flex items-center justify-between'>
                                <div className='flex-1'>
                                    <p className='text-sm font-medium text-gray-900'>
                                        {transaction.description}
                                    </p>
                                    <p className='text-xs text-gray-500'>
                                        {transaction.category} •{' '}
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className='text-right'>
                                    <p
                                        className={`text-sm font-semibold ${
                                            transaction.type === 'income'
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}
                                    >
                                        {transaction.type === 'income' ? '+' : ''}$
                                        {Math.abs(transaction.amount).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className='p-4 border-t bg-gray-50'>
                    <button className='text-sm text-blue-600 hover:text-blue-800 font-medium'>
                        View all transactions →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecentTransactions;
