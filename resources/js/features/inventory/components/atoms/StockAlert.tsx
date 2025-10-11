/**
 * Stock Alert Component
 * Phase 9: Basic inventory structure
 */

import React from 'react';

export type StockLevel = 'high' | 'medium' | 'low' | 'out';

interface StockAlertProps {
    level: StockLevel;
    quantity: number;
    threshold?: number;
    className?: string;
}

const StockAlert: React.FC<StockAlertProps> = ({
    level,
    quantity,
    threshold = 10,
    className = '',
}) => {
    const getAlertConfig = (level: StockLevel) => {
        switch (level) {
            case 'high':
                return {
                    color: 'text-green-800 bg-green-100',
                    icon: '✓',
                    message: 'In Stock',
                };
            case 'medium':
                return {
                    color: 'text-yellow-800 bg-yellow-100',
                    icon: '⚠',
                    message: 'Low Stock',
                };
            case 'low':
                return {
                    color: 'text-orange-800 bg-orange-100',
                    icon: '⚠',
                    message: 'Very Low Stock',
                };
            case 'out':
                return {
                    color: 'text-red-800 bg-red-100',
                    icon: '✕',
                    message: 'Out of Stock',
                };
            default:
                return {
                    color: 'text-gray-800 bg-gray-100',
                    icon: '?',
                    message: 'Unknown',
                };
        }
    };

    const config = getAlertConfig(level);

    return (
        <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className}`}
        >
            <span className='mr-1'>{config.icon}</span>
            <span>{config.message}</span>
            {quantity > 0 && <span className='ml-1'>({quantity})</span>}
        </div>
    );
};

export default StockAlert;
