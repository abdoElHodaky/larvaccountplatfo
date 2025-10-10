/**
 * Journal Entries Component
 * Display and manage journal entries for accounting
 */

import React, { useState } from 'react';

interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  entries: {
    account: string;
    debit: number;
    credit: number;
  }[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

interface JournalEntriesProps {
  entries?: JournalEntry[];
  className?: string;
  onEntryClick?: (entry: JournalEntry) => void;
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (entryId: string) => void;
}

export const JournalEntries: React.FC<JournalEntriesProps> = ({
  entries = [],
  className = '',
  onEntryClick: _onEntryClick,
  onEdit,
  onDelete
}) => {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [filterPeriod, setFilterPeriod] = useState<string>('');

  const defaultEntries: JournalEntry[] = [
    {
      id: '1',
      date: '2023-12-25',
      reference: 'JE-001',
      description: 'Office supplies purchase',
      entries: [
        { account: 'Office Expenses', debit: 150.00, credit: 0 },
        { account: 'Cash', debit: 0, credit: 150.00 }
      ],
      totalDebit: 150.00,
      totalCredit: 150.00,
      isBalanced: true
    },
    {
      id: '2',
      date: '2023-12-24',
      reference: 'JE-002',
      description: 'Client payment received',
      entries: [
        { account: 'Cash', debit: 2500.00, credit: 0 },
        { account: 'Accounts Receivable', debit: 0, credit: 2500.00 }
      ],
      totalDebit: 2500.00,
      totalCredit: 2500.00,
      isBalanced: true
    },
    {
      id: '3',
      date: '2023-12-23',
      reference: 'JE-003',
      description: 'Software subscription payment',
      entries: [
        { account: 'Software Expenses', debit: 99.00, credit: 0 },
        { account: 'Cash', debit: 0, credit: 99.00 }
      ],
      totalDebit: 99.00,
      totalCredit: 99.00,
      isBalanced: true
    }
  ];

  const displayEntries = entries.length > 0 ? entries : defaultEntries;

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

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const filteredEntries = filterPeriod
    ? displayEntries.filter(entry => 
        entry.date.includes(filterPeriod)
      )
    : displayEntries;

  return (
    <div className={`journal-entries ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Journal Entries</h3>
            <div className="flex items-center space-x-4">
              <input
                type="month"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                New Entry
              </button>
            </div>
          </div>
        </div>

        {/* Entries List */}
        <div className="divide-y divide-gray-200">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="p-6">
              {/* Entry Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleExpanded(entry.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedEntries.has(entry.id) ? '▼' : '▶'}
                  </button>
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{entry.reference}</span>
                      <span className="text-sm text-gray-500">{formatDate(entry.date)}</span>
                      {!entry.isBalanced && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Unbalanced
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(entry.totalDebit)}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(entry)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(entry.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Entry Details */}
              {expandedEntries.has(entry.id) && (
                <div className="ml-8 bg-gray-50 rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-medium text-gray-700">Account</th>
                          <th className="text-right py-2 font-medium text-gray-700">Debit</th>
                          <th className="text-right py-2 font-medium text-gray-700">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.entries.map((line, index) => (
                          <tr key={index} className="border-b border-gray-100 last:border-b-0">
                            <td className="py-2 text-gray-900">{line.account}</td>
                            <td className="py-2 text-right">
                              {line.debit > 0 ? (
                                <span className="text-red-600 font-medium">
                                  {formatCurrency(line.debit)}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-2 text-right">
                              {line.credit > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {formatCurrency(line.credit)}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 font-medium">
                          <td className="py-2 text-gray-900">Total</td>
                          <td className="py-2 text-right text-red-600">
                            {formatCurrency(entry.totalDebit)}
                          </td>
                          <td className="py-2 text-right text-green-600">
                            {formatCurrency(entry.totalCredit)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  {!entry.isBalanced && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center">
                        <span className="text-red-800 text-sm">
                          ⚠️ This entry is not balanced. Debits and credits must be equal.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredEntries.length} journal entries</span>
            <div className="flex items-center space-x-6">
              <span>
                Total Debits: {formatCurrency(filteredEntries.reduce((sum, entry) => sum + entry.totalDebit, 0))}
              </span>
              <span>
                Total Credits: {formatCurrency(filteredEntries.reduce((sum, entry) => sum + entry.totalCredit, 0))}
              </span>
              <span className={`font-medium ${
                filteredEntries.every(entry => entry.isBalanced) 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {filteredEntries.every(entry => entry.isBalanced) ? '✓ All Balanced' : '⚠️ Some Unbalanced'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalEntries;
