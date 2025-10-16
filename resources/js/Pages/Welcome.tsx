import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-gray-100">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
                        Welcome to Laravel Accounting Platform
                    </h1>
                    <div className="max-w-2xl mx-auto text-center">
                        <p className="text-lg text-gray-600 mb-6">
                            A modern, modular accounting platform built with Laravel and React.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
