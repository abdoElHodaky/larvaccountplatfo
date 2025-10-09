import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import TenantSwitcher from '@/features/organization/components/molecules/TenantSwitcher';

interface TopBarProps {
    onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
    const { props } = usePage();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    // Mock data - in real app this would come from props
    const user = {
        name: 'John Doe',
        email: 'john@example.com',
        avatar: null,
    };

    const tenant = {
        name: 'Acme Corp',
        subdomain: 'acme',
    };

    const notifications = [
        {
            id: 1,
            title: 'New invoice created',
            message: 'Invoice #INV-001 has been created',
            time: '2 minutes ago',
            unread: true,
        },
        {
            id: 2,
            title: 'Payment received',
            message: 'Payment of $1,250.00 received',
            time: '1 hour ago',
            unread: true,
        },
        {
            id: 3,
            title: 'Monthly report ready',
            message: 'Your monthly financial report is ready',
            time: '3 hours ago',
            unread: false,
        },
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                {/* Left side */}
                <div className="flex items-center space-x-4">
                    {/* Mobile menu button */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Breadcrumb */}
                    <nav className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                        <Link href="/dashboard" className="hover:text-gray-700">
                            Dashboard
                        </Link>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-900">Current Page</span>
                    </nav>
                </div>

                {/* Right side */}
                <div className="flex items-center space-x-4">
                    {/* Search */}
                    <div className="hidden md:block">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Tenant Switcher */}
                    <TenantSwitcher />

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md relative"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.97 4.97a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 01-1.06-1.06L13.44 8.5H3a.75.75 0 010-1.5h10.44L10.97 4.97z" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications dropdown */}
                        {notificationsOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                                <div className="py-1">
                                    <div className="px-4 py-2 border-b border-gray-200">
                                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`px-4 py-3 hover:bg-gray-50 ${notification.unread ? 'bg-blue-50' : ''}`}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {notification.time}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-4 py-2 border-t border-gray-200">
                                        <Link
                                            href="/notifications"
                                            className="text-sm text-blue-600 hover:text-blue-500"
                                        >
                                            View all notifications
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="hidden md:block text-left">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">{tenant.name}</div>
                            </div>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* User dropdown */}
                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                                <div className="py-1">
                                    <div className="px-4 py-2 border-b border-gray-200">
                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                    <Link
                                        href="/profile"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Your Profile
                                    </Link>
                                    <Link
                                        href="/organization/settings"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Organization Settings
                                    </Link>
                                    <Link
                                        href="/tenant/select"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Switch Organization
                                    </Link>
                                    <div className="border-t border-gray-200"></div>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Sign out
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
