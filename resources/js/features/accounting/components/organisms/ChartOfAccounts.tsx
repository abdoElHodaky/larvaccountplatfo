import React from 'react';

interface ChartOfAccountsProps {
  className?: string;
  onAccountSelect?: (account: any) => void;
}

const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({ className, onAccountSelect }) => {
  return (
    <div className={`bg-white shadow rounded-lg ${className || ''}`}>
      <h1 className="text-2xl font-bold text-gray-900 p-6">Chart of Accounts</h1>
      <p className="text-gray-600 p-6">Component placeholder - implementation in progress</p>

      {/* Example usage of onAccountSelect prop */}
      <button
        onClick={() => onAccountSelect?.({id: '1', name: 'Sample Account', code: '1000', type: 'asset', balance: 1000, isActive: true})}
        className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
      >
        Select Sample Account
      </button>
    </div>
  );
};

export default ChartOfAccounts;