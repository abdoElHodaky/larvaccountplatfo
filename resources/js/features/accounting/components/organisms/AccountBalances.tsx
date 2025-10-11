/**
 * Account Balances Component
 * Displays account balances with filtering and sorting
 */

import React, { useState, useMemo } from 'react';

interface AccountBalance {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  currency: string;
  lastUpdated: Date;
  isActive: boolean;
}

interface AccountBalancesProps {
  balances: AccountBalance[];
  loading?: boolean;
  error?: string | null;
  onAccountClick?: (account: AccountBalance) => void;
  showInactive?: boolean;
  filterByType?: string;
  className?: string;
}

export const AccountBalances: React.FC<AccountBalancesProps> = ({
  balances = [],
  loading = false,
  error = null,
  onAccountClick,
  showInactive = false,
  filterByType,
  className = ''
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'balance' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort balances
  const filteredBalances = useMemo(() => {
    const filtered = balances.filter(balance => {
      // Filter by active status
      if (!showInactive && !balance.isActive) return false;
      
      // Filter by account type
      if (filterByType && balance.accountType !== filterByType) return false;
      
      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          balance.accountName.toLowerCase().includes(term) ||
          balance.accountCode.toLowerCase().includes(term)
        );
      }
      
      return true;
    });

    // Sort balances
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.accountName.toLowerCase();
          bValue = b.accountName.toLowerCase();
          break;
        case 'code':
          aValue = a.accountCode;
          bValue = b.accountCode;
          break;
        case 'balance':
          aValue = Math.abs(a.balance);
          bValue = Math.abs(b.balance);
          break;
        case 'type':
          aValue = a.accountType;
          bValue = b.accountType;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [balances, showInactive, filterByType, searchTerm, sortBy, sortOrder]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatBalance = (balance: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2
    });
    return formatter.format(balance);
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      asset: 'text-green-600',
      liability: 'text-red-600',
      equity: 'text-blue-600',
      revenue: 'text-purple-600',
      expense: 'text-orange-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className={`account-balances loading ${className}`}>
        <div className="loading-skeleton">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-cell"></div>
              <div className="skeleton-cell"></div>
              <div className="skeleton-cell"></div>
              <div className="skeleton-cell"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`account-balances error ${className}`}>
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>Failed to load account balances: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`account-balances ${className}`}>
      <div className="balances-header">
        <div className="search-controls">
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filterByType || ''}
            onChange={(e) => console.log('Filter change:', e.target.value)}
            className="type-filter"
            disabled
          >
            <option value="">All Types</option>
            <option value="asset">Assets</option>
            <option value="liability">Liabilities</option>
            <option value="equity">Equity</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expenses</option>
          </select>
        </div>
      </div>

      <div className="balances-table">
        <div className="table-header">
          <div 
            className="header-cell sortable"
            onClick={() => handleSort('code')}
          >
            Code {sortBy === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className="header-cell sortable"
            onClick={() => handleSort('name')}
          >
            Account Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className="header-cell sortable"
            onClick={() => handleSort('type')}
          >
            Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className="header-cell sortable"
            onClick={() => handleSort('balance')}
          >
            Balance {sortBy === 'balance' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
        </div>

        <div className="table-body">
          {filteredBalances.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <p>No account balances found</p>
            </div>
          ) : (
            filteredBalances.map((balance) => (
              <div
                key={balance.id}
                className={`table-row ${onAccountClick ? 'clickable' : ''} ${!balance.isActive ? 'inactive' : ''}`}
                onClick={() => onAccountClick?.(balance)}
              >
                <div className="table-cell code">{balance.accountCode}</div>
                <div className="table-cell name">{balance.accountName}</div>
                <div className={`table-cell type ${getAccountTypeColor(balance.accountType)}`}>
                  {balance.accountType.charAt(0).toUpperCase() + balance.accountType.slice(1)}
                </div>
                <div className={`table-cell balance ${balance.balance >= 0 ? 'positive' : 'negative'}`}>
                  {formatBalance(balance.balance, balance.currency)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {filteredBalances.length > 0 && (
        <div className="balances-summary">
          <p className="summary-text">
            Showing {filteredBalances.length} of {balances.length} accounts
          </p>
        </div>
      )}
    </div>
  );
};

export default AccountBalances;
