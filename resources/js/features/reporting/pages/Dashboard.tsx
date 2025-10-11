import React from 'react';
import { Head } from '@inertiajs/react';

/**
 * Reporting Dashboard Page
 * Main dashboard for financial reports and analytics
 */
const ReportingDashboard: React.FC = () => {
    return (
        <>
            <Head title='Reports Dashboard' />
            <div className='min-h-screen bg-gray-50'>
                <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
                    <div className='px-4 py-6 sm:px-0'>
                        <div className='border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center'>
                            <div className='text-center'>
                                <h1 className='text-2xl font-bold text-gray-900 mb-4'>
                                    Reports Dashboard
                                </h1>
                                <p className='text-gray-600'>
                                    Financial reports and analytics will be displayed here.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReportingDashboard;
