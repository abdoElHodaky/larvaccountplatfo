import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthLayout from '@/shared/components/layouts/AuthLayout';
import PrimaryButton from '@/Components/PrimaryButton';

interface Tenant {
    id: number;
    name: string;
    subdomain: string;
    plan: string;
    role: string;
    permissions: string[];
    last_accessed_at?: string;
}

interface TenantSelectProps {
    user: {
        id: number;
        name: string;
        email: string;
    };
    tenants: Tenant[];
}

interface TenantSelectData {
    tenant_id: number;
}

export default function TenantSelect({ user, tenants }: TenantSelectProps) {
    const { data, setData, post, processing } = useForm<TenantSelectData>({
        tenant_id: 0,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        
        if (data.tenant_id) {
            post(route('tenant.switch'));
        }
    };

    const selectTenant = (tenantId: number) => {
        setData('tenant_id', tenantId);
        post(route('tenant.switch'), {
            data: { tenant_id: tenantId }
        });
    };

    const getRoleColor = (role: string) => {
        const colors = {
            admin: 'bg-red-100 text-red-800',
            manager: 'bg-blue-100 text-blue-800',
            accountant: 'bg-green-100 text-green-800',
            user: 'bg-gray-100 text-gray-800',
            viewer: 'bg-yellow-100 text-yellow-800',
        };
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getPlanIcon = (plan: string) => {
        const icons = {
            free: '🆓',
            basic: '📊',
            professional: '💼',
            enterprise: '🏢',
        };
        return icons[plan as keyof typeof icons] || '📊';
    };

    return (
        <AuthLayout>
            <Head title="Select Organization" />

            <div className="w-full max-w-4xl mx-auto">
                <div className="bg-white shadow-lg rounded-lg px-8 py-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">👋</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
                        <p className="text-gray-600 mt-2">Select an organization to continue</p>
                    </div>

                    {tenants.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">🏢</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Organizations Found</h3>
                            <p className="text-gray-600 mb-6">
                                You don't have access to any organizations yet. Create one to get started.
                            </p>
                            <Link
                                href={route('register')}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Create Organization
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tenants.map((tenant) => (
                                <div
                                    key={tenant.id}
                                    className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                                    onClick={() => selectTenant(tenant.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                                {tenant.name.charAt(0).toUpperCase()}
                                            </div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                                                        {tenant.name}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(tenant.role)}`}>
                                                        {tenant.role}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center space-x-4 mt-1">
                                                    <p className="text-sm text-gray-500">
                                                        {tenant.subdomain}.yourapp.com
                                                    </p>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-sm">{getPlanIcon(tenant.plan)}</span>
                                                        <span className="text-sm text-gray-500 capitalize">{tenant.plan} Plan</span>
                                                    </div>
                                                </div>
                                                
                                                {tenant.last_accessed_at && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Last accessed: {new Date(tenant.last_accessed_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500">
                                                    {tenant.permissions.length} permissions
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1 max-w-48">
                                                    {tenant.permissions.slice(0, 3).map((permission) => (
                                                        <span
                                                            key={permission}
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                                        >
                                                            {permission.replace('access-', '').replace('manage-', '')}
                                                        </span>
                                                    ))}
                                                    {tenant.permissions.length > 3 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                            +{tenant.permissions.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tenants.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Need to create a new organization?
                                </div>
                                <Link
                                    href={route('register')}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Create Organization
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Sign out
                        </Link>
                    </div>
                </div>

                {/* Quick Stats */}
                {tenants.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow text-center">
                            <div className="text-2xl font-bold text-blue-600">{tenants.length}</div>
                            <div className="text-sm text-gray-600">Organizations</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {tenants.filter(t => t.role === 'admin').length}
                            </div>
                            <div className="text-sm text-gray-600">Admin Access</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {tenants.filter(t => t.plan !== 'free').length}
                            </div>
                            <div className="text-sm text-gray-600">Paid Plans</div>
                        </div>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
