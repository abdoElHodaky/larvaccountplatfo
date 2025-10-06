<?php

namespace Modules\Organization\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('tenant');
    }

    /**
     * Display the main dashboard.
     */
    public function index(): Response
    {
        /** @var Tenant $tenant */
        $tenant = app('tenant');
        
        /** @var User $user */
        $user = Auth::user();

        // Get user's role and permissions in this tenant
        $userTenant = $user->tenants()->where('tenant_id', $tenant->id)->first();
        $userRole = $userTenant?->pivot?->role ?? 'user';
        $userPermissions = $userTenant?->pivot?->permissions ?? [];

        // Get dashboard statistics
        $stats = $this->getDashboardStats($tenant, $userPermissions);

        // Get recent activity
        $recentActivity = $this->getRecentActivity($tenant, $userPermissions);

        // Get quick actions based on user permissions
        $quickActions = $this->getQuickActions($userPermissions);

        return Inertia::render('Organization/Dashboard', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'plan' => $tenant->plan,
                'enabled_modules' => $tenant->enabled_modules,
                'settings' => $tenant->settings,
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $userRole,
                'permissions' => $userPermissions,
            ],
            'stats' => $stats,
            'recentActivity' => $recentActivity,
            'quickActions' => $quickActions,
        ]);
    }

    /**
     * Get dashboard statistics.
     */
    protected function getDashboardStats(Tenant $tenant, array $userPermissions): array
    {
        $stats = [];

        // Organization stats (always visible)
        $stats['organization'] = [
            'total_users' => $tenant->users()->wherePivot('is_active', true)->count(),
            'enabled_modules' => count($tenant->enabled_modules ?? []),
            'plan' => $tenant->plan,
            'created_at' => $tenant->created_at,
        ];

        // Module-specific stats based on permissions
        if (in_array('access-accounting', $userPermissions)) {
            $stats['accounting'] = [
                'total_accounts' => 0, // TODO: Implement when accounting module is ready
                'recent_transactions' => 0,
                'pending_reconciliations' => 0,
            ];
        }

        if (in_array('access-invoicing', $userPermissions)) {
            $stats['invoicing'] = [
                'total_invoices' => 0, // TODO: Implement when invoicing module is ready
                'pending_invoices' => 0,
                'overdue_invoices' => 0,
                'total_revenue' => 0,
            ];
        }

        if (in_array('access-banking', $userPermissions)) {
            $stats['banking'] = [
                'connected_accounts' => 0, // TODO: Implement when banking module is ready
                'total_balance' => 0,
                'pending_transactions' => 0,
            ];
        }

        if (in_array('access-inventory', $userPermissions)) {
            $stats['inventory'] = [
                'total_products' => 0, // TODO: Implement when inventory module is ready
                'low_stock_items' => 0,
                'total_value' => 0,
            ];
        }

        return $stats;
    }

    /**
     * Get recent activity.
     */
    protected function getRecentActivity(Tenant $tenant, array $userPermissions): array
    {
        $activities = [];

        // User activity
        $recentUsers = $tenant->users()
            ->wherePivot('is_active', true)
            ->whereNotNull('last_login_at')
            ->orderBy('last_login_at', 'desc')
            ->limit(5)
            ->get(['id', 'name', 'email', 'last_login_at'])
            ->map(function ($user) {
                return [
                    'type' => 'user_login',
                    'user' => $user->name,
                    'description' => 'Logged in',
                    'timestamp' => $user->last_login_at,
                ];
            });

        $activities = array_merge($activities, $recentUsers->toArray());

        // TODO: Add module-specific activities when modules are implemented
        // - Recent transactions (accounting)
        // - Recent invoices (invoicing)
        // - Recent bank transactions (banking)
        // - Recent inventory changes (inventory)

        // Sort by timestamp and limit
        usort($activities, function ($a, $b) {
            return $b['timestamp'] <=> $a['timestamp'];
        });

        return array_slice($activities, 0, 10);
    }

    /**
     * Get quick actions based on user permissions.
     */
    protected function getQuickActions(array $userPermissions): array
    {
        $actions = [];

        // Organization management actions
        if (in_array('manage-tenant', $userPermissions)) {
            $actions[] = [
                'title' => 'Organization Settings',
                'description' => 'Manage company information and preferences',
                'icon' => 'cog',
                'route' => 'organization.settings',
                'color' => 'blue',
            ];
        }

        if (in_array('manage-users', $userPermissions)) {
            $actions[] = [
                'title' => 'Manage Users',
                'description' => 'Invite users and manage permissions',
                'icon' => 'users',
                'route' => 'organization.users',
                'color' => 'green',
            ];
        }

        // Module-specific actions
        if (in_array('manage-accounting', $userPermissions)) {
            $actions[] = [
                'title' => 'Chart of Accounts',
                'description' => 'Manage your chart of accounts',
                'icon' => 'calculator',
                'route' => 'accounting.accounts',
                'color' => 'purple',
            ];

            $actions[] = [
                'title' => 'New Transaction',
                'description' => 'Record a new financial transaction',
                'icon' => 'plus-circle',
                'route' => 'accounting.transactions.create',
                'color' => 'indigo',
            ];
        }

        if (in_array('manage-invoicing', $userPermissions)) {
            $actions[] = [
                'title' => 'Create Invoice',
                'description' => 'Create a new invoice for a customer',
                'icon' => 'receipt',
                'route' => 'invoicing.invoices.create',
                'color' => 'yellow',
            ];

            $actions[] = [
                'title' => 'Manage Customers',
                'description' => 'Add and manage your customers',
                'icon' => 'user-group',
                'route' => 'invoicing.customers',
                'color' => 'pink',
            ];
        }

        if (in_array('manage-banking', $userPermissions)) {
            $actions[] = [
                'title' => 'Connect Bank Account',
                'description' => 'Link your bank accounts for automatic sync',
                'icon' => 'credit-card',
                'route' => 'banking.accounts.create',
                'color' => 'teal',
            ];
        }

        if (in_array('access-reporting', $userPermissions)) {
            $actions[] = [
                'title' => 'Financial Reports',
                'description' => 'View profit & loss, balance sheet, and more',
                'icon' => 'chart-bar',
                'route' => 'reporting.financial',
                'color' => 'red',
            ];
        }

        return $actions;
    }

    /**
     * Get organization overview data for API.
     */
    public function overview(): \Illuminate\Http\JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app('tenant');
        
        /** @var User $user */
        $user = Auth::user();

        // Get user's permissions in this tenant
        $userTenant = $user->tenants()->where('tenant_id', $tenant->id)->first();
        $userPermissions = $userTenant?->pivot?->permissions ?? [];

        $overview = [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'plan' => $tenant->plan,
                'enabled_modules' => $tenant->enabled_modules,
                'user_count' => $tenant->users()->wherePivot('is_active', true)->count(),
            ],
            'modules_status' => $this->getModulesStatus($tenant, $userPermissions),
            'setup_progress' => $this->getSetupProgress($tenant),
        ];

        return response()->json($overview);
    }

    /**
     * Get modules status.
     */
    protected function getModulesStatus(Tenant $tenant, array $userPermissions): array
    {
        $enabledModules = $tenant->enabled_modules ?? [];
        $modules = [];

        $availableModules = [
            'accounting' => 'Accounting',
            'invoicing' => 'Invoicing', 
            'banking' => 'Banking',
            'inventory' => 'Inventory',
            'reporting' => 'Reporting',
        ];

        foreach ($availableModules as $key => $name) {
            $modules[$key] = [
                'name' => $name,
                'enabled' => in_array($key, $enabledModules),
                'accessible' => in_array("access-{$key}", $userPermissions),
                'setup_complete' => false, // TODO: Implement setup checks for each module
            ];
        }

        return $modules;
    }

    /**
     * Get setup progress.
     */
    protected function getSetupProgress(Tenant $tenant): array
    {
        $progress = [];
        $totalSteps = 0;
        $completedSteps = 0;

        // Basic organization setup
        $steps = [
            'company_info' => [
                'title' => 'Company Information',
                'completed' => !empty($tenant->settings['company_email'] ?? null),
            ],
            'tax_settings' => [
                'title' => 'Tax Settings',
                'completed' => !empty($tenant->settings['tax_number'] ?? null),
            ],
            'preferences' => [
                'title' => 'Preferences',
                'completed' => !empty($tenant->settings['timezone'] ?? null),
            ],
            'users' => [
                'title' => 'Team Members',
                'completed' => $tenant->users()->wherePivot('is_active', true)->count() > 1,
            ],
            'modules' => [
                'title' => 'Enable Modules',
                'completed' => count($tenant->enabled_modules ?? []) > 1,
            ],
        ];

        foreach ($steps as $key => $step) {
            $progress[$key] = $step;
            $totalSteps++;
            if ($step['completed']) {
                $completedSteps++;
            }
        }

        return [
            'steps' => $progress,
            'total_steps' => $totalSteps,
            'completed_steps' => $completedSteps,
            'percentage' => $totalSteps > 0 ? round(($completedSteps / $totalSteps) * 100) : 0,
        ];
    }
}
