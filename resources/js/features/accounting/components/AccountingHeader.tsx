/**
 * Accounting Header Component
 * Header for accounting dashboard with filters and actions
 */

import React from 'react';

interface AccountingHeaderProps {
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
    filters?: React.ReactNode;
    className?: string;
    onRefresh?: () => void;
    isLoading?: boolean;
    showPeriodSelector?: boolean;
    selectedPeriod?: string;
    onPeriodChange?: (period: string) => void;
}

export const AccountingHeader: React.FC<AccountingHeaderProps> = ({
    title = 'Accounting Dashboard',
    subtitle,
    actions,
    filters,
    className = '',
    onRefresh,
    isLoading = false,
    showPeriodSelector = true,
    selectedPeriod = 'current-month',
    onPeriodChange,
}) => {
    const periodOptions = [
        { value: 'current-month', label: 'Current Month' },
        { value: 'last-month', label: 'Last Month' },
        { value: 'current-quarter', label: 'Current Quarter' },
        { value: 'last-quarter', label: 'Last Quarter' },
        { value: 'current-year', label: 'Current Year' },
        { value: 'last-year', label: 'Last Year' },
        { value: 'custom', label: 'Custom Range' },
    ];

    return (
        <div className={`accounting-header ${className}`}>
            <div className='header-content'>
                <div className='header-info'>
                    <h1 className='accounting-title'>{title}</h1>
                    {subtitle && <p className='accounting-subtitle'>{subtitle}</p>}
                </div>

                <div className='header-controls'>
                    {showPeriodSelector && (
                        <div className='period-selector'>
                            <label htmlFor='period-select' className='period-label'>
                                Period:
                            </label>
                            <select
                                id='period-select'
                                value={selectedPeriod}
                                onChange={(e) => onPeriodChange?.(e.target.value)}
                                className='period-select'
                            >
                                {periodOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className={`refresh-button ${isLoading ? 'loading' : ''}`}
                            title='Refresh accounting data'
                        >
                            {isLoading ? '⟳' : '↻'}
                        </button>
                    )}

                    {actions && <div className='custom-actions'>{actions}</div>}
                </div>
            </div>

            {filters && <div className='header-filters'>{filters}</div>}
        </div>
    );
};

export default AccountingHeader;
