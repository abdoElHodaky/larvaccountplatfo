/**
 * Transaction List Component
 * Display and manage accounting transactions
 */

import React, { useState } from 'react';
import { AnimatedList } from '@/shared/components/animations/AnimatedFragment';

interface Transaction {
  id: string;
  date: string;
  description: string;
  account: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
  category?: string;
}

interface TransactionListProps {
  transactions?: Transaction[];
  className?: string;
  onTransactionClick?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions = [],
  className = '',
  onTransactionClick,
  onEdit,
  onDelete
}) => {
  const [sortField, setSortField] = useState<keyof Transaction>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterAccount, setFilterAccount] = useState<string>('');

  const defaultTransactions: Transaction[] = [
    {
      id: '1',
      date: '2023-12-25',
      description: 'Office Supplies Purchase',
      account: 'Office Expenses',
      debit: 150.00,
      credit: 0,
      balance: 150.00,
      reference: 'INV-001',
      category: 'Expenses'
    },
    {
      id: '2',
      date: '2023-12-24',
      description: 'Client Payment Received',
      account: 'Accounts Receivable',
      debit: 0,
      credit: 2500.00,
      balance: -2500.00,
      reference: 'PAY-001',
      category: 'Revenue'
    },
    {
      id: '3',
      date: '2023-12-23',
      description: 'Software Subscription',
      account: 'Software Expenses',
      debit: 99.00,
      credit: 0,
      balance: 99.00,
      reference: 'SUB-001',
      category: 'Expenses'
    },
    {
      id: '4',
      date: '2023-12-22',
      description: 'Bank Transfer',
      account: 'Cash',
      debit: 1000.00,
      credit: 0,
      balance: 1000.00,
      reference: 'TRF-001',
      category: 'Transfer'
    }
  ];

  const displayTransactions = transactions.length > 0 ? transactions : defaultTransactions;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = [...displayTransactions].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const filteredTransactions = filterAccount
    ? sortedTransactions.filter(t => 
        t.account.toLowerCase().includes(filterAccount.toLowerCase())
      )
    : sortedTransactions;

  const getSortIcon = (field: keyof Transaction) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className={`transaction-list ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Filter by account..."
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                Add Transaction
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  Date {getSortIcon('date')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('description')}
                >
                  Description {getSortIcon('description')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('account')}
                >
                  Account {getSortIcon('account')}
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('debit')}
                >
                  Debit {getSortIcon('debit')}
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('credit')}
                >
                  Credit {getSortIcon('credit')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <AnimatedList as="tbody" className="bg-white divide-y divide-gray-200" stagger={0.05}>
              {filteredTransactions.map((transaction) => (
                <tr 
                  key={transaction.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  onClick={() => onTransactionClick?.(transaction)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <>
                      <div className="font-medium">{transaction.description}</div>
                      {transaction.reference && (
                        <div className="text-xs text-gray-500">Ref: {transaction.reference}</div>
                      )}
                    </>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <>
                      <div>{transaction.account}</div>
                      {transaction.category && (
                        <div className="text-xs text-gray-500">{transaction.category}</div>
                      )}
                    </>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {transaction.debit > 0 ? (
                      <span className="text-red-600 font-medium">
                        {formatCurrency(transaction.debit)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {transaction.credit > 0 ? (
                      <span className="text-green-600 font-medium">
                        {formatCurrency(transaction.credit)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(transaction);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-150"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(transaction.id);
                          }}
                          className="text-red-600 hover:text-red-900 transition-colors duration-150"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </AnimatedList>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredTransactions.length} transactions</span>
            <div className="flex items-center space-x-4">
              <span>Total Debits: {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.debit, 0))}</span>
              <span>Total Credits: {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.credit, 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
