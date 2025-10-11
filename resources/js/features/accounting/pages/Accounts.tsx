/**
 * Accounts Page
 * Main page for managing chart of accounts
 */

import React, { useEffect } from 'react';
import { ChartOfAccounts } from '../components/organisms/ChartOfAccounts';
import { useAccounting } from '../hooks/useAccounting';
import { AnimatedButton } from '../../shared/components/AnimatedButton';
import type { Account } from '../stores/accountingModel';

interface AccountsPageProps {
  className?: string;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ className = '' }) => {
  const { initializeAccounting, setCurrentView } = useAccounting();

  useEffect(() => {
    setCurrentView('accounts');
    initializeAccounting();
  }, []);

  const handleAccountSelect = (account: Account) => {
    console.log('Selected account:', account);
    // Could navigate to account detail view or open sidebar
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your company's chart of accounts and account structure
                </p>
              </div>
              
              {/* Quick Actions */}
              <div className="flex space-x-3">
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  animationType="slide"
                  className="border border-gray-300 shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export
                </AnimatedButton>
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  animationType="slide"
                  className="border border-gray-300 shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Import
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ChartOfAccounts 
          onAccountSelect={handleAccountSelect}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default AccountsPage;
