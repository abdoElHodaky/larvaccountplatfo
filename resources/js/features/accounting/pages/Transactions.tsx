/**
 * Transactions Page
 * Main page for managing accounting transactions
 */

import React, { useState } from 'react';
import { TransactionList } from '../components/organisms/TransactionList';
import { TransactionForm } from '../components/organisms/TransactionForm';

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

interface TransactionFormData {
  date: string;
  description: string;
  account: string;
  amount: number;
  type: 'debit' | 'credit';
  reference?: string;
  category?: string;
  notes?: string;
}

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleCreateTransaction = (formData: TransactionFormData) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: formData.date,
      description: formData.description,
      account: formData.account,
      debit: formData.type === 'debit' ? formData.amount : 0,
      credit: formData.type === 'credit' ? formData.amount : 0,
      balance: formData.type === 'debit' ? formData.amount : -formData.amount,
      reference: formData.reference,
      category: formData.category
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setShowForm(false);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleUpdateTransaction = (formData: TransactionFormData) => {
    if (!editingTransaction) return;

    const updatedTransaction: Transaction = {
      ...editingTransaction,
      date: formData.date,
      description: formData.description,
      account: formData.account,
      debit: formData.type === 'debit' ? formData.amount : 0,
      credit: formData.type === 'credit' ? formData.amount : 0,
      balance: formData.type === 'debit' ? formData.amount : -formData.amount,
      reference: formData.reference,
      category: formData.category
    };

    setTransactions(prev => 
      prev.map(t => t.id === editingTransaction.id ? updatedTransaction : t)
    );
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const getFormInitialData = (): Partial<TransactionFormData> => {
    if (!editingTransaction) return {};

    return {
      date: editingTransaction.date,
      description: editingTransaction.description,
      account: editingTransaction.account,
      amount: editingTransaction.debit > 0 ? editingTransaction.debit : editingTransaction.credit,
      type: editingTransaction.debit > 0 ? 'debit' : 'credit',
      reference: editingTransaction.reference,
      category: editingTransaction.category
    };
  };

  return (
    <div className="transactions-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="mt-2 text-gray-600">
                Manage your accounting transactions and financial records
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              New Transaction
            </button>
          </div>
        </div>

        {/* Transaction Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <TransactionForm
                initialData={getFormInitialData()}
                onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
                onCancel={handleCancelForm}
                isEditing={!!editingTransaction}
              />
            </div>
          </div>
        )}

        {/* Transaction List */}
        <TransactionList
          transactions={transactions}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
        />

        {/* Empty State */}
        {transactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first transaction
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Create Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
