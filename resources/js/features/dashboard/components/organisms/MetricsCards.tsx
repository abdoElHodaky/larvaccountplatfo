/**
 * Metrics Cards Component
 * Display key performance metrics in card format
 */

import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    change,
    changeType = 'neutral',
    icon,
}) => {
    const changeColorClass = {
        positive: 'text-green-600',
        negative: 'text-red-600',
        neutral: 'text-gray-500',
    }[changeType];

    return (
        <div className='bg-white p-6 rounded-lg shadow-sm border'>
            <div className='flex items-center justify-between'>
                <div>
                    <p className='text-sm font-medium text-gray-600'>{title}</p>
                    <p className='text-2xl font-bold text-gray-900'>{value}</p>
                    {change && <p className={`text-sm ${changeColorClass}`}>{change}</p>}
                </div>
                {icon && <div className='text-gray-400'>{icon}</div>}
            </div>
        </div>
    );
};

interface MetricsCardsProps {
    metrics?: MetricCardProps[];
    className?: string;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics = [], className = '' }) => {
    const defaultMetrics: MetricCardProps[] = [
        {
            title: 'Total Revenue',
            value: '$124,500',
            change: '+12% from last month',
            changeType: 'positive',
        },
        {
            title: 'Active Users',
            value: '1,234',
            change: '+5% from last month',
            changeType: 'positive',
        },
        {
            title: 'Conversion Rate',
            value: '3.2%',
            change: '-0.5% from last month',
            changeType: 'negative',
        },
        {
            title: 'Average Order',
            value: '$89.50',
            change: '+2% from last month',
            changeType: 'positive',
        },
    ];

    const displayMetrics = metrics.length > 0 ? metrics : defaultMetrics;

    return (
        <div className={`metrics-cards ${className}`}>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                {displayMetrics.map((metric, index) => (
                    <MetricCard key={index} {...metric} />
                ))}
            </div>
        </div>
    );
};

export default MetricsCards;
