import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';

interface Tenant {
    id: number;
    name: string;
    subdomain: string;
    plan: string;
    role: string;
}

export default function TenantSwitcher() {
    const [isOpen, setIsOpen] = useState(false);

    // Mock data - in real app this would come from props or context
    const currentTenant = {
        id: 1,
        name: 'Acme Corp',
        subdomain: 'acme',
        plan: 'professional',
        role: 'admin',
    };

    const availableTenants: Tenant[] = [
        {
            id: 1,
            name: 'Acme Corp',
            subdomain: 'acme',
            plan: 'professional',
            role: 'admin',
        },
        {
            id: 2,
            name: 'Tech Startup Inc',
            subdomain: 'techstartup',
            plan: 'basic',
            role: 'manager',
        },
        {
            id: 3,
            name: 'Consulting LLC',
            subdomain: 'consulting',
            plan: 'enterprise',
            role: 'accountant',
        },
    ];

    const switchTenant = (tenantId: number) => {
        router.post('/tenant/switch', { tenant_id: tenantId });
        setIsOpen(false);
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
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                        {currentTenant.name.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div className="hidden sm:block text-left">
                    <div className="font-medium text-gray-900">{currentTenant.name}</div>
                    <div className="text-xs text-gray-500">{currentTenant.subdomain}.yourapp.com</div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-900">Switch Organization</h3>
                            <p className="text-xs text-gray-500">Select an organization to work with</p>
                        </div>
                        
                        <div className="max-h-64 overflow-y-auto">
                            {availableTenants.map((tenant) => (
                                <button
                                    key={tenant.id}
                                    onClick={() => switchTenant(tenant.id)}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                                        tenant.id === currentTenant.id ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-sm">
                                                {tenant.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {tenant.name}
                                                </p>
                                                {tenant.id === currentTenant.id && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center space-x-2 mt-1">
                                                <p className="text-xs text-gray-500 truncate">
                                                    {tenant.subdomain}.yourapp.com
                                                </p>
                                                <span className="text-xs">{getPlanIcon(tenant.plan)}</span>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(tenant.role)}`}>
                                                    {tenant.role}
                                                </span>
                                                <span className="text-xs text-gray-500 capitalize">
                                                    {tenant.plan} plan
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {tenant.id === currentTenant.id && (
                                            <div className="flex-shrink-0">
                                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                        
                        <div className="border-t border-gray-200 px-4 py-3">
                            <Link
                                href="/tenant/select"
                                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                                onClick={() => setIsOpen(false)}
                            >
                                View all organizations →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
