import { Head } from '@inertiajs/react';
import AppLayout from '@/shared/components/layouts/AppLayout';
import { 
  StatusChartIcon, 
  StatusDocumentIcon, 
  StatusBankIcon, 
  StatusBoxIcon, 
  StatusTrendUpIcon,
  ActionSettingsIcon 
} from '@/shared/icons';

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
    tenant: Tenant;
    user: User;
    stats: Stats;
    recentActivity: Activity[];
    quickActions: QuickAction[];
}

export default function Dashboard({ tenant, user, stats, recentActivity, quickActions }: DashboardProps) {
    const formatCurrency = (amount: number) => {
        const currency = tenant.settings?.currency || 'USD';
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
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Welcome back, {user.name}!</h1>
                            <p className="text-blue-100 mt-1">
                                {tenant.name} • {user.role} • {tenant.plan} Plan
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="text-right">
                                <div className="text-3xl font-bold">{stats.organization.total_users}</div>
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
                                <p className="text-2xl font-semibold text-gray-900">{stats.organization.enabled_modules}</p>
                            </div>
                        </div>
                    </div>

                    {/* Accounting Stats */}
                    {stats.accounting && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <StatusChartIcon size="lg" color="success" animated />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Accounts</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.accounting.total_accounts}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Invoicing Stats */}
                    {stats.invoicing && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <StatusDocumentIcon size="lg" color="warning" animated />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {formatCurrency(stats.invoicing.total_revenue)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Banking Stats */}
                    {stats.banking && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <span className="text-2xl">🏦</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Balance</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {formatCurrency(stats.banking.total_balance)}
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
                                    {quickActions.map((action, index) => (
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
                            {recentActivity.length > 0 ? (
                                <div className="space-y-4">
                                    {recentActivity.map((activity, index) => (
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
                            {tenant.enabled_modules.map((module) => (
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
