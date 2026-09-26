import React from 'react';

interface ChartOfAccountsProps {
  className?: string;
}

const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({ className }) => {
  return (
    <div className={`bg-white shadow rounded-lg ${className || ''}`}>
      <h1 className="text-2xl font-bold text-gray-900 p-6">Chart of Accounts</h1>
      <p className="text-gray-600 p-6">Component placeholder - implementation in progress</p>
    </div>
  );
};

export default ChartOfAccounts;