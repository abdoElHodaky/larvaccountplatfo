import { DocumentHead } from '@/shared/components/seo/DocumentHead';
import AppLayout from '@/shared/components/layouts/AppLayout';
import { 
  StatusChartIcon, 
  StatusDocumentIcon, 
  StatusBankIcon, 
  StatusBoxIcon, 
  StatusTrendUpIcon,
  ActionSettingsIcon 
} from '@/shared/icons';
import { useState, useEffect } from 'react';
import { dashboardRestApi } from '../services/dashboardRestApi';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { useRealTimeConnection } from '../hooks/useRealTimeUpdates';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions: string[];
}

interface Tenant {
    id: number;
    name: string;
    subdomain: string;
    plan: string;
    enabled_modules: string[];
    settings: Record<string, any>;
}

interface Stats {
    organization: {
        total_users: number;
        enabled_modules: number;
        plan: string;
        created_at: string;
    };
    accounting?: {
        total_accounts: number;
        recent_transactions: number;
        pending_reconciliations: number;
    };
    invoicing?: {
        total_invoices: number;
        pending_invoices: number;
        overdue_invoices: number;
        total_revenue: number;
    };
    banking?: {
        connected_accounts: number;
        total_balance: number;
        pending_transactions: number;
    };
    inventory?: {
        total_products: number;
        low_stock_items: number;
        total_value: number;
    };
}

interface Activity {
    type: string;
    user: string;
    description: string;
    timestamp: string;
}

interface QuickAction {
    title: string;
    description: string;
    icon: string;
    route: string;
    color: string;
}

interface DashboardProps {
    tenant?: Tenant;
    user?: User;
    stats?: Stats;
    recentActivity?: Activity[];
    quickActions?: QuickAction[];
}

interface DashboardData {
    tenant: Tenant;
    user: User;
    stats: Stats;
    recentActivity: Activity[];
    quickActions: QuickAction[];
}

export default function Dashboard({ tenant, user, stats, recentActivity, quickActions }: DashboardProps) {
    const { isRestApiEnabled, isRealTimeEnabled } = useFeatureFlags();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Real-time connection for live updates
    const { isConnected } = useRealTimeConnection({
        enabled: isRealTimeEnabled,
        autoConnect: true,
        onConnectionChange: (connected) => {
            console.log('Dashboard real-time connection:', connected ? 'Connected' : 'Disconnected');
        }
    });

    // Load dashboard data using REST API if feature flag is enabled
    useEffect(() => {
        if (isRestApiEnabled && !tenant) {
            loadDashboardData();
        }
    }, [isRestApiEnabled]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data = await dashboardRestApi.getDashboard();
            setDashboardData(data);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Use REST API data if available, otherwise fall back to props
    const currentData: DashboardData = dashboardData || {
        tenant: tenant!,
        user: user!,
        stats: stats!,
        recentActivity: recentActivity || [],
        quickActions: quickActions || []
    };

    // Show loading state for REST API
    if (isRestApiEnabled && !tenant && loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading dashboard...</p>
                        {isRealTimeEnabled && (
                            <p className="mt-2 text-sm text-gray-500">
                                Real-time: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                            </p>
                        )}
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Show error state
    if (error) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={loadDashboardData}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Ensure we have data before rendering
    if (!currentData.tenant || !currentData.user || !currentData.stats) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="text-gray-400 text-6xl mb-4">📊</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Dashboard Data</h2>
                        <p className="text-gray-600">Dashboard data is not available.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }
    const formatCurrency = (amount: number) => {
        const currency = currentData.tenant.settings?.currency || 'USD';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getModuleIcon = (module: string) => {
        const iconProps = { size: 'md' as const, animated: true };
        
        switch (module) {
            case 'accounting':
                return <StatusChartIcon {...iconProps} color="primary" />;
            case 'invoicing':
                return <StatusDocumentIcon {...iconProps} color="warning" />;
            case 'banking':
                return <StatusBankIcon {...iconProps} color="success" />;
            case 'inventory':
                return <StatusBoxIcon {...iconProps} color="secondary" />;
            case 'reporting':
                return <StatusTrendUpIcon {...iconProps} color="primary" />;
            default:
                return <ActionSettingsIcon {...iconProps} color="gray" />;
        }
    };

    return (
        <AppLayout>
            <DocumentHead 
                title="Dashboard" 
                description="Main dashboard with organization overview and quick actions"
            />

            <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Welcome back, {currentData.user.name}!</h1>
                            <p className="text-blue-100 mt-1">
                                {currentData.tenant.name} • {currentData.user.role} • {currentData.tenant.plan} Plan
                            </p>
                            {isRealTimeEnabled && (
                                <p className="text-blue-200 text-xs mt-1">
                                    Real-time: {isConnected ? '🟢 Live' : '🔴 Offline'}
                                </p>
                            )}
                        </div>
                        <div className="hidden md:block">
                            <div className="text-right">
                                <div className="text-3xl font-bold">{currentData.stats.organization.total_users}</div>
                                <div className="text-blue-100 text-sm">Team Members</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Organization Stats */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <span className="text-2xl">🏢</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Modules</p>
                                <p className="text-2xl font-semibold text-gray-900">{currentData.stats.organization.enabled_modules}</p>
                            </div>
                        </div>
                    </div>

                    {/* Accounting Stats */}
                    {currentData.stats.accounting && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <StatusChartIcon size="lg" color="success" animated />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Accounts</p>
                                    <p className="text-2xl font-semibold text-gray-900">{currentData.stats.accounting.total_accounts}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Invoicing Stats */}
                    {currentData.stats.invoicing && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <StatusDocumentIcon size="lg" color="warning" animated />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {formatCurrency(currentData.stats.invoicing.total_revenue)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Banking Stats */}
                    {currentData.stats.banking && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <span className="text-2xl">🏦</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Balance</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {formatCurrency(currentData.stats.banking.total_balance)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                                <p className="text-sm text-gray-500">Common tasks based on your permissions</p>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentData.quickActions.map((action, index) => (
                                        <a
                                            key={index}
                                            href={`#${action.route}`}
                                            className={`p-4 rounded-lg border-2 border-gray-200 hover:border-${action.color}-300 hover:bg-${action.color}-50 transition-all duration-200 group`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 bg-${action.color}-100 rounded-lg group-hover:bg-${action.color}-200`}>
                                                    <span className="text-xl">{action.icon === 'cog' ? '⚙️' : action.icon === 'users' ? '👥' : action.icon === 'calculator' ? '🧮' : action.icon === 'plus-circle' ? '➕' : action.icon === 'receipt' ? '🧾' : action.icon === 'user-group' ? '👥' : action.icon === 'credit-card' ? '💳' : action.icon === 'chart-bar' ? '📊' : '⚙️'}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 group-hover:text-gray-700">
                                                        {action.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 group-hover:text-gray-600">
                                                        {action.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                            <p className="text-sm text-gray-500">Latest team activity</p>
                        </div>
                        <div className="p-6">
                            {currentData.recentActivity.length > 0 ? (
                                <div className="space-y-4">
                                    {currentData.recentActivity.map((activity, index) => (
                                        <div key={index} className="flex items-start space-x-3">
                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-medium text-gray-600">
                                                    {activity.user.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900">
                                                    <span className="font-medium">{activity.user}</span>{' '}
                                                    {activity.description}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(activity.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="text-4xl mb-2">📝</div>
                                    <p className="text-sm text-gray-500">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Enabled Modules */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Enabled Modules</h3>
                        <p className="text-sm text-gray-500">Active features for your organization</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {currentData.tenant.enabled_modules.map((module) => (
                                <div key={module} className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-3xl mb-2">{getModuleIcon(module)}</div>
                                    <div className="text-sm font-medium text-gray-900 capitalize">
                                        {module}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
