import React from 'react';
import { Link, usePage } from '@inertiajs/react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavigationItem {
    name: string;
    href: string;
    icon: string;
    current?: boolean;
    children?: NavigationItem[];
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { url } = usePage();

    const navigation: NavigationItem[] = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: '🏠',
            current: url === '/dashboard',
        },
        {
            name: 'Accounting',
            href: '/accounting',
            icon: '📊',
            current: url.startsWith('/accounting'),
            children: [
                { name: 'Chart of Accounts', href: '/accounting/accounts', icon: '📋' },
                { name: 'Transactions', href: '/accounting/transactions', icon: '💰' },
                { name: 'Journal Entries', href: '/accounting/journal', icon: '📝' },
                { name: 'Reports', href: '/accounting/reports', icon: '📈' },
            ],
        },
        {
            name: 'Invoicing',
            href: '/invoicing',
            icon: '🧾',
            current: url.startsWith('/invoicing'),
            children: [
                { name: 'Invoices', href: '/invoicing/invoices', icon: '📄' },
                { name: 'Customers', href: '/invoicing/customers', icon: '👥' },
                { name: 'Products', href: '/invoicing/products', icon: '📦' },
                { name: 'Templates', href: '/invoicing/templates', icon: '🎨' },
            ],
        },
        {
            name: 'Banking',
            href: '/banking',
            icon: '🏦',
            current: url.startsWith('/banking'),
            children: [
                { name: 'Accounts', href: '/banking/accounts', icon: '💳' },
                { name: 'Transactions', href: '/banking/transactions', icon: '💸' },
                { name: 'Reconciliation', href: '/banking/reconciliation', icon: '⚖️' },
                { name: 'Transfers', href: '/banking/transfers', icon: '🔄' },
            ],
        },
        {
            name: 'Inventory',
            href: '/inventory',
            icon: '📦',
            current: url.startsWith('/inventory'),
            children: [
                { name: 'Products', href: '/inventory/products', icon: '📦' },
                { name: 'Categories', href: '/inventory/categories', icon: '🏷️' },
                { name: 'Stock Levels', href: '/inventory/stock', icon: '📊' },
                { name: 'Adjustments', href: '/inventory/adjustments', icon: '⚖️' },
            ],
        },
        {
            name: 'Reports',
            href: '/reports',
            icon: '📈',
            current: url.startsWith('/reports'),
            children: [
                { name: 'Financial Reports', href: '/reports/financial', icon: '💰' },
                { name: 'Tax Reports', href: '/reports/tax', icon: '📋' },
                { name: 'Custom Reports', href: '/reports/custom', icon: '🎯' },
                { name: 'Analytics', href: '/reports/analytics', icon: '📊' },
            ],
        },
    ];

    const organizationNavigation: NavigationItem[] = [
        {
            name: 'Organization Settings',
            href: '/organization/settings',
            icon: '⚙️',
            current: url.startsWith('/organization/settings'),
        },
        {
            name: 'Team Management',
            href: '/organization/users',
            icon: '👥',
            current: url.startsWith('/organization/users'),
        },
        {
            name: 'Billing & Plans',
            href: '/organization/billing',
            icon: '💳',
            current: url.startsWith('/organization/billing'),
        },
        {
            name: 'Integrations',
            href: '/organization/integrations',
            icon: '🔗',
            current: url.startsWith('/organization/integrations'),
        },
    ];

    const sidebarClasses = `
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `;

    return (
        <div className={sidebarClasses}>
            <div className='flex flex-col h-full'>
                {/* Logo */}
                <div className='flex items-center justify-between h-16 px-6 border-b border-gray-200'>
                    <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center'>
                            <span className='text-white font-bold text-sm'>A</span>
                        </div>
                        <div>
                            <h1 className='text-lg font-bold text-gray-900'>AccountPlatform</h1>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className='lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100'
                    >
                        <svg
                            className='w-6 h-6'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                            />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className='flex-1 px-4 py-6 space-y-2 overflow-y-auto'>
                    {/* Main Navigation */}
                    <div className='space-y-1'>
                        {navigation.map((item) => (
                            <div key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`
                                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
                                        ${
                                            item.current
                                                ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <span className='mr-3 text-lg'>{item.icon}</span>
                                    {item.name}
                                </Link>

                                {/* Sub-navigation */}
                                {item.children && item.current && (
                                    <div className='ml-6 mt-1 space-y-1'>
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.name}
                                                href={child.href}
                                                className={`
                                                    group flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150
                                                    ${
                                                        url === child.href
                                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                <span className='mr-3'>{child.icon}</span>
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className='border-t border-gray-200 my-6'></div>

                    {/* Organization Navigation */}
                    <div className='space-y-1'>
                        <div className='px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                            Organization
                        </div>
                        {organizationNavigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
                                    ${
                                        item.current
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <span className='mr-3'>{item.icon}</span>
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* Footer */}
                <div className='flex-shrink-0 border-t border-gray-200 p-4'>
                    <div className='text-xs text-gray-500 text-center'>© 2024 AccountPlatform</div>
                </div>
            </div>
        </div>
    );
}
