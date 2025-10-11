/**
 * Quick Actions Component
 * Provide quick access to common dashboard actions
 */

import React from 'react';

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

interface QuickActionsProps {
    actions?: QuickAction[];
    className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions = [], className = '' }) => {
    const defaultActions: QuickAction[] = [
        {
            id: '1',
            title: 'Create Invoice',
            description: 'Generate a new invoice for a client',
            color: 'blue',
        },
        {
            id: '2',
            title: 'Add Transaction',
            description: 'Record a new financial transaction',
            color: 'green',
        },
        {
            id: '3',
            title: 'Manage Inventory',
            description: 'Update product stock levels',
            color: 'purple',
        },
        {
            id: '4',
            title: 'View Reports',
            description: 'Access financial and business reports',
            color: 'orange',
        },
    ];

    const displayActions = actions.length > 0 ? actions : defaultActions;

    const getColorClasses = (color: string = 'blue') => {
        const colorMap = {
            blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
            green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
            purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
            orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
            red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
        };
        return colorMap[color as keyof typeof colorMap] || colorMap.blue;
    };

    const handleActionClick = (action: QuickAction) => {
        if (action.onClick) {
            action.onClick();
        } else if (action.href) {
            window.location.href = action.href;
        }
    };

    return (
        <div className={`quick-actions ${className}`}>
            <div className='bg-white rounded-lg shadow-sm border'>
                <div className='p-6 border-b'>
                    <h3 className='text-lg font-semibold text-gray-900'>Quick Actions</h3>
                </div>
                <div className='p-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {displayActions.map((action) => (
                            <button
                                key={action.id}
                                onClick={() => handleActionClick(action)}
                                className={`
                  p-4 rounded-lg border-2 text-left transition-colors duration-200
                  ${getColorClasses(action.color)}
                `}
                            >
                                <div className='flex items-start space-x-3'>
                                    {action.icon && (
                                        <div className='flex-shrink-0'>{action.icon}</div>
                                    )}
                                    <div>
                                        <h4 className='font-medium'>{action.title}</h4>
                                        <p className='text-sm opacity-75 mt-1'>
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickActions;
