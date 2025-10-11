/**
 * Dashboard Overview Component
 * Main dashboard overview with key metrics and charts
 */

import React from 'react';

interface DashboardOverviewProps {
    className?: string;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ className = '' }) => {
    return (
        <div className={`dashboard-overview ${className}`}>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <h3 className='text-lg font-semibold text-gray-900'>Total Revenue</h3>
                    <p className='text-3xl font-bold text-green-600'>$124,500</p>
                    <p className='text-sm text-gray-500'>+12% from last month</p>
                </div>

                <div className='bg-white p-6 rounded-lg shadow'>
                    <h3 className='text-lg font-semibold text-gray-900'>Active Customers</h3>
                    <p className='text-3xl font-bold text-blue-600'>1,234</p>
                    <p className='text-sm text-gray-500'>+5% from last month</p>
                </div>

                <div className='bg-white p-6 rounded-lg shadow'>
                    <h3 className='text-lg font-semibold text-gray-900'>Pending Orders</h3>
                    <p className='text-3xl font-bold text-orange-600'>56</p>
                    <p className='text-sm text-gray-500'>-8% from last month</p>
                </div>

                <div className='bg-white p-6 rounded-lg shadow'>
                    <h3 className='text-lg font-semibold text-gray-900'>Inventory Items</h3>
                    <p className='text-3xl font-bold text-purple-600'>2,847</p>
                    <p className='text-sm text-gray-500'>+3% from last month</p>
                </div>
            </div>

            <div className='bg-white p-6 rounded-lg shadow'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Recent Activity</h3>
                <div className='space-y-3'>
                    <div className='flex items-center justify-between py-2 border-b'>
                        <span className='text-gray-700'>New order #1234 received</span>
                        <span className='text-sm text-gray-500'>2 minutes ago</span>
                    </div>
                    <div className='flex items-center justify-between py-2 border-b'>
                        <span className='text-gray-700'>Payment processed for order #1233</span>
                        <span className='text-sm text-gray-500'>15 minutes ago</span>
                    </div>
                    <div className='flex items-center justify-between py-2 border-b'>
                        <span className='text-gray-700'>Inventory updated for Product ABC</span>
                        <span className='text-sm text-gray-500'>1 hour ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
