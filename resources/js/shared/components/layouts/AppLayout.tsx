import React, { useState } from 'react';

import Sidebar from '@/shared/components/organisms/Sidebar';
import TopBar from '@/shared/components/organisms/TopBar';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className='min-h-screen bg-gray-50'>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className='fixed inset-0 z-40 lg:hidden' onClick={() => setSidebarOpen(false)}>
                    <div className='fixed inset-0 bg-gray-600 bg-opacity-75' />
                </div>
            )}

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content */}
            <div className='lg:pl-64 flex flex-col flex-1'>
                {/* Top bar */}
                <TopBar onMenuClick={() => setSidebarOpen(true)} />

                {/* Page content */}
                <main className='flex-1'>
                    <div className='py-6'>
                        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}
