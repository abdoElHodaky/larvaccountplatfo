import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/shared/components/layouts/AppLayout';

interface OrganizationIndexProps {
    organization: {
        id: number;
        name: string;
        description?: string;
        email?: string;
        phone?: string;
        address?: string;
        website?: string;
        created_at: string;
        updated_at: string;
    };
    stats: {
        totalUsers: number;
        totalProjects: number;
        totalRevenue: number;
        monthlyGrowth: number;
    };
    recentActivity: Array<{
        id: number;
        type: string;
        description: string;
        user_name: string;
        created_at: string;
    }>;
    error?: string;
}

export default function Index({
    organization,
    stats,
    recentActivity = [],
    error,
}: OrganizationIndexProps) {
    if (error) {
        return (
            <AppLayout>
                <Head title='Organization' />
                <div className='bg-red-50 border border-red-200 rounded-md p-4'>
                    <div className='flex'>
                        <div className='ml-3'>
                            <h3 className='text-sm font-medium text-red-800'>
                                Error Loading Organization
                            </h3>
                            <div className='mt-2 text-sm text-red-700'>
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    return (
        <AppLayout>
            <Head title='Organization Overview' />

            <div className='space-y-6'>
                {/* Header */}
                <div className='md:flex md:items-center md:justify-between'>
                    <div className='flex-1 min-w-0'>
                        <h2 className='text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate'>
                            {organization.name}
                        </h2>
                        <p className='mt-1 text-sm text-gray-500'>
                            Organization Overview & Management
                        </p>
                    </div>
                    <div className='mt-4 flex md:mt-0 md:ml-4'>
                        <Link
                            href='/organization/settings'
                            className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        >
                            Settings
                        </Link>
                        <Link
                            href='/organization/profile'
                            className='ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        >
                            Edit Profile
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                {stats && (
                    <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='bg-white overflow-hidden shadow rounded-lg'>
                            <div className='p-5'>
                                <div className='flex items-center'>
                                    <div className='flex-shrink-0'>
                                        <div className='w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center'>
                                            <svg
                                                className='w-5 h-5 text-white'
                                                fill='currentColor'
                                                viewBox='0 0 20 20'
                                            >
                                                <path
                                                    fillRule='evenodd'
                                                    d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
                                                    clipRule='evenodd'
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className='ml-5 w-0 flex-1'>
                                        <dl>
                                            <dt className='text-sm font-medium text-gray-500 truncate'>
                                                Total Users
                                            </dt>
                                            <dd className='text-lg font-medium text-gray-900'>
                                                {formatNumber(stats.totalUsers)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white overflow-hidden shadow rounded-lg'>
                            <div className='p-5'>
                                <div className='flex items-center'>
                                    <div className='flex-shrink-0'>
                                        <div className='w-8 h-8 bg-green-500 rounded-md flex items-center justify-center'>
                                            <svg
                                                className='w-5 h-5 text-white'
                                                fill='currentColor'
                                                viewBox='0 0 20 20'
                                            >
                                                <path
                                                    fillRule='evenodd'
                                                    d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                                                    clipRule='evenodd'
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className='ml-5 w-0 flex-1'>
                                        <dl>
                                            <dt className='text-sm font-medium text-gray-500 truncate'>
                                                Total Projects
                                            </dt>
                                            <dd className='text-lg font-medium text-gray-900'>
                                                {formatNumber(stats.totalProjects)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white overflow-hidden shadow rounded-lg'>
                            <div className='p-5'>
                                <div className='flex items-center'>
                                    <div className='flex-shrink-0'>
                                        <div className='w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center'>
                                            <svg
                                                className='w-5 h-5 text-white'
                                                fill='currentColor'
                                                viewBox='0 0 20 20'
                                            >
                                                <path
                                                    fillRule='evenodd'
                                                    d='M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z'
                                                    clipRule='evenodd'
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className='ml-5 w-0 flex-1'>
                                        <dl>
                                            <dt className='text-sm font-medium text-gray-500 truncate'>
                                                Total Revenue
                                            </dt>
                                            <dd className='text-lg font-medium text-gray-900'>
                                                {formatCurrency(stats.totalRevenue)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white overflow-hidden shadow rounded-lg'>
                            <div className='p-5'>
                                <div className='flex items-center'>
                                    <div className='flex-shrink-0'>
                                        <div
                                            className={`w-8 h-8 ${stats.monthlyGrowth >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded-md flex items-center justify-center`}
                                        >
                                            <svg
                                                className='w-5 h-5 text-white'
                                                fill='currentColor'
                                                viewBox='0 0 20 20'
                                            >
                                                <path
                                                    fillRule='evenodd'
                                                    d='M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z'
                                                    clipRule='evenodd'
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className='ml-5 w-0 flex-1'>
                                        <dl>
                                            <dt className='text-sm font-medium text-gray-500 truncate'>
                                                Monthly Growth
                                            </dt>
                                            <dd
                                                className={`text-lg font-medium ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {stats.monthlyGrowth >= 0 ? '+' : ''}
                                                {stats.monthlyGrowth.toFixed(1)}%
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Organization Details */}
                <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
                    <div className='px-4 py-5 sm:px-6'>
                        <h3 className='text-lg leading-6 font-medium text-gray-900'>
                            Organization Information
                        </h3>
                        <p className='mt-1 max-w-2xl text-sm text-gray-500'>
                            Basic details and contact information
                        </p>
                    </div>
                    <div className='border-t border-gray-200'>
                        <dl>
                            <div className='bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                                <dt className='text-sm font-medium text-gray-500'>
                                    Organization Name
                                </dt>
                                <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                                    {organization.name}
                                </dd>
                            </div>
                            <div className='bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                                <dt className='text-sm font-medium text-gray-500'>Description</dt>
                                <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                                    {organization.description || 'No description provided'}
                                </dd>
                            </div>
                            <div className='bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                                <dt className='text-sm font-medium text-gray-500'>Email</dt>
                                <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                                    {organization.email || 'Not provided'}
                                </dd>
                            </div>
                            <div className='bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                                <dt className='text-sm font-medium text-gray-500'>Phone</dt>
                                <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                                    {organization.phone || 'Not provided'}
                                </dd>
                            </div>
                            <div className='bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                                <dt className='text-sm font-medium text-gray-500'>Address</dt>
                                <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                                    {organization.address || 'Not provided'}
                                </dd>
                            </div>
                            <div className='bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                                <dt className='text-sm font-medium text-gray-500'>Website</dt>
                                <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                                    {organization.website ? (
                                        <a
                                            href={organization.website}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-indigo-600 hover:text-indigo-500'
                                        >
                                            {organization.website}
                                        </a>
                                    ) : (
                                        'Not provided'
                                    )}
                                </dd>
                            </div>
                            <div className='bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                                <dt className='text-sm font-medium text-gray-500'>Created</dt>
                                <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                                    {formatDate(organization.created_at)}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                    <div className='px-4 py-5 sm:px-6'>
                        <h3 className='text-lg leading-6 font-medium text-gray-900'>
                            Recent Activity
                        </h3>
                        <p className='mt-1 max-w-2xl text-sm text-gray-500'>
                            Latest activities in your organization
                        </p>
                    </div>
                    <ul className='divide-y divide-gray-200'>
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity) => (
                                <li key={activity.id}>
                                    <div className='px-4 py-4 sm:px-6'>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center'>
                                                <div className='flex-shrink-0'>
                                                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                                                        {activity.type}
                                                    </span>
                                                </div>
                                                <div className='ml-4'>
                                                    <div className='text-sm font-medium text-gray-900'>
                                                        {activity.description}
                                                    </div>
                                                    <div className='text-sm text-gray-500'>
                                                        by {activity.user_name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='text-sm text-gray-500'>
                                                {formatDate(activity.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li>
                                <div className='px-4 py-4 sm:px-6 text-center text-gray-500'>
                                    No recent activity found
                                </div>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Quick Actions */}
                <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
                    <div className='px-4 py-5 sm:px-6'>
                        <h3 className='text-lg leading-6 font-medium text-gray-900'>
                            Quick Actions
                        </h3>
                        <p className='mt-1 max-w-2xl text-sm text-gray-500'>
                            Common organization management tasks
                        </p>
                    </div>
                    <div className='border-t border-gray-200'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6'>
                            <Link
                                href='/organization/settings'
                                className='relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500'
                            >
                                <div className='flex-shrink-0'>
                                    <svg
                                        className='h-6 w-6 text-gray-400'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                                        />
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                        />
                                    </svg>
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <span className='absolute inset-0' aria-hidden='true' />
                                    <p className='text-sm font-medium text-gray-900'>
                                        Organization Settings
                                    </p>
                                    <p className='text-sm text-gray-500 truncate'>
                                        Configure organization preferences
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href='/organization/profile'
                                className='relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500'
                            >
                                <div className='flex-shrink-0'>
                                    <svg
                                        className='h-6 w-6 text-gray-400'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                        />
                                    </svg>
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <span className='absolute inset-0' aria-hidden='true' />
                                    <p className='text-sm font-medium text-gray-900'>
                                        Edit Profile
                                    </p>
                                    <p className='text-sm text-gray-500 truncate'>
                                        Update organization information
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href='/tenant/users'
                                className='relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500'
                            >
                                <div className='flex-shrink-0'>
                                    <svg
                                        className='h-6 w-6 text-gray-400'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                                        />
                                    </svg>
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <span className='absolute inset-0' aria-hidden='true' />
                                    <p className='text-sm font-medium text-gray-900'>
                                        Manage Users
                                    </p>
                                    <p className='text-sm text-gray-500 truncate'>
                                        Invite and manage team members
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
