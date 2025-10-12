/**
 * Transaction Form Component
 * Form for creating and editing accounting transactions
 */

import React, { useState } from 'react';
import AnimatedFormInput from '@/shared/components/AnimatedFormInput';

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

interface TransactionFormProps {
  initialData?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => void;
  onCancel?: () => void;
  className?: string;
  isEditing?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  className = '',
  isEditing = false
}) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    date: initialData.date || new Date().toISOString().split('T')[0],
    description: initialData.description || '',
    account: initialData.account || '',
    amount: initialData.amount || 0,
    type: initialData.type || 'debit',
    reference: initialData.reference || '',
    category: initialData.category || '',
    notes: initialData.notes || ''
  });

  const [errors, setErrors] = useState<Partial<TransactionFormData>>({});

  const accounts = [
    'Cash',
    'Accounts Receivable',
    'Accounts Payable',
    'Office Expenses',
    'Software Expenses',
    'Marketing Expenses',
    'Revenue',
    'Equipment',
    'Inventory',
    'Bank Account'
  ];

  const categories = [
    'Revenue',
    'Expenses',
    'Assets',
    'Liabilities',
    'Equity',
    'Transfer'
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<TransactionFormData> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.account) {
      newErrors.account = 'Account is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof TransactionFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className={`transaction-form ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Transaction' : 'New Transaction'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date and Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <AnimatedFormInput
                type="date"
                label="Date *"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                error={errors.date}
                animationType="focus"
                className="w-full"
              />
            </div>

            <div>
              <AnimatedFormInput
                type="text"
                label="Reference"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                placeholder="e.g., INV-001, PAY-001"
                animationType="slide"
                className="w-full"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <AnimatedFormInput
              type="text"
              label="Description *"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter transaction description"
              error={errors.description}
              animationType="glow"
              className="w-full"
            />
          </div>

          {/* Account and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-2">
                Account *
              </label>
              <select
                id="account"
                value={formData.account}
                onChange={(e) => handleInputChange('account', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.account ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select an account</option>
                {accounts.map(account => (
                  <option key={account} value={account}>{account}</option>
                ))}
              </select>
              {errors.account && (
                <p className="mt-1 text-sm text-red-600">{errors.account}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                <AnimatedFormInput
                  type="number"
                  label="Amount *"
                  value={formData.amount.toString()}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  error={errors.amount}
                  animationType="bounce"
                  className="w-full pl-8"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="debit"
                    checked={formData.type === 'debit'}
                    onChange={(e) => handleInputChange('type', e.target.value as 'debit' | 'credit')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Debit</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="credit"
                    checked={formData.type === 'credit'}
                    onChange={(e) => handleInputChange('type', e.target.value as 'debit' | 'credit')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Credit</span>
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Additional notes or comments"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isEditing ? 'Update Transaction' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
