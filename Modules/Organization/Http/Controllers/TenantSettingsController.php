<?php

namespace Modules\Organization\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TenantSettingsController extends Controller
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
     * Display the organization settings page.
     */
    public function index(): Response
    {
        /** @var Tenant $tenant */
        $tenant = app('tenant');
        
        $this->authorize('update', $tenant);

        return Inertia::render('Organization/Settings/Index', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'plan' => $tenant->plan,
                'status' => $tenant->status,
                'settings' => $tenant->settings,
                'enabled_modules' => $tenant->enabled_modules,
                'created_at' => $tenant->created_at,
                'updated_at' => $tenant->updated_at,
            ],
            'availableModules' => $this->getAvailableModules(),
            'currencies' => $this->getAvailableCurrencies(),
            'timezones' => $this->getAvailableTimezones(),
            'dateFormats' => $this->getAvailableDateFormats(),
            'timeFormats' => $this->getAvailableTimeFormats(),
        ]);
    }

    /**
     * Update organization basic information.
     */
    public function updateBasicInfo(Request $request): \Illuminate\Http\RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = app('tenant');
        
        $this->authorize('update', $tenant);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'settings.company_email' => 'nullable|email|max:255',
            'settings.company_phone' => 'nullable|string|max:50',
            'settings.company_website' => 'nullable|url|max:255',
            'settings.company_address' => 'nullable|string|max:500',
            'settings.company_city' => 'nullable|string|max:100',
            'settings.company_state' => 'nullable|string|max:100',
            'settings.company_country' => 'nullable|string|max:100',
            'settings.company_postal_code' => 'nullable|string|max:20',
        ]);

        $settings = $tenant->settings ?? [];
        
        // Update basic info
        $tenant->update([
            'name' => $validated['name'],
            'settings' => array_merge($settings, $validated['settings'] ?? []),
        ]);

        return back()->with('success', 'Company information updated successfully.');
    }

    /**
     * Update organization tax and financial settings.
     */
    public function updateTaxSettings(Request $request): \Illuminate\Http\RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = app('tenant');
        
        $this->authorize('update', $tenant);

        $validated = $request->validate([
            'settings.tax_number' => 'nullable|string|max:50',
            'settings.vat_number' => 'nullable|string|max:50',
            'settings.tax_rate' => 'nullable|numeric|min:0|max:100',
            'settings.currency' => 'required|string|size:3',
            'settings.fiscal_year_start' => 'required|string|regex:/^\d{2}-\d{2}$/',
            'settings.enable_tax_inclusive' => 'boolean',
        ]);

        $settings = $tenant->settings ?? [];
        
        $tenant->update([
            'settings' => array_merge($settings, $validated['settings']),
        ]);

        return back()->with('success', 'Tax and financial settings updated successfully.');
    }

    /**
     * Update organization preferences.
     */
    public function updatePreferences(Request $request): \Illuminate\Http\RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = app('tenant');
        
        $this->authorize('update', $tenant);

        $validated = $request->validate([
            'settings.timezone' => 'required|string|max:50',
            'settings.date_format' => 'required|string|max:20',
            'settings.time_format' => 'required|string|max:20',
            'settings.number_format' => 'required|string|max:20',
            'settings.language' => 'required|string|max:10',
        ]);

        $settings = $tenant->settings ?? [];
        
        $tenant->update([
            'settings' => array_merge($settings, $validated['settings']),
        ]);

        return back()->with('success', 'Preferences updated successfully.');
    }

    /**
     * Update enabled modules.
     */
    public function updateModules(Request $request): \Illuminate\Http\RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = app('tenant');
        
        $this->authorize('update', $tenant);

        $validated = $request->validate([
            'enabled_modules' => 'required|array',
            'enabled_modules.*' => 'string|in:accounting,invoicing,banking,inventory,reporting,organization',
        ]);

        // Always ensure organization module is enabled
        $enabledModules = $validated['enabled_modules'];
        if (!in_array('organization', $enabledModules)) {
            $enabledModules[] = 'organization';
        }

        $tenant->update([
            'enabled_modules' => $enabledModules,
        ]);

        return back()->with('success', 'Module settings updated successfully.');
    }

    /**
     * Display user management page.
     */
    public function users(): Response
    {
        /** @var Tenant $tenant */
        $tenant = app('tenant');
        
        $this->authorize('view', $tenant);

        $users = $tenant->users()
            ->withPivot(['role', 'permissions', 'is_active', 'invited_at', 'joined_at'])
            ->orderBy('tenant_users.created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->pivot->role,
                    'permissions' => $user->pivot->permissions,
                    'is_active' => $user->pivot->is_active,
                    'invited_at' => $user->pivot->invited_at,
                    'joined_at' => $user->pivot->joined_at,
                    'last_login_at' => $user->last_login_at,
                ];
            });

        return Inertia::render('Organization/Settings/Users', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
            ],
            'users' => $users,
            'availableRoles' => $this->getAvailableRoles(),
            'availablePermissions' => $this->getAvailablePermissions(),
        ]);
    }

    /**
     * Invite a new user to the organization.
     */
    public function inviteUser(Request $request): \Illuminate\Http\RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = app('tenant');
        
        $this->authorize('update', $tenant);

        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'role' => 'required|string|in:admin,manager,accountant,user,viewer',
            'permissions' => 'required|array',
            'permissions.*' => 'string',
        ]);

        // Check if user already exists
        $existingUser = User::where('email', $validated['email'])->first();
        
        if ($existingUser) {
            // Check if already in this tenant
            if ($existingUser->tenants()->where('tenant_id', $tenant->id)->exists()) {
                return back()->withErrors(['email' => 'User is already a member of this organization.']);
            }

            // Add existing user to tenant
            $existingUser->tenants()->attach($tenant->id, [
                'role' => $validated['role'],
                'permissions' => $validated['permissions'],
                'is_active' => true,
                'invited_at' => now(),
                'joined_at' => now(),
            ]);

            return back()->with('success', 'User added to organization successfully.');
        }

        // TODO: Create invitation system for new users
        // For now, we'll just return a message
        return back()->with('info', 'Invitation system will be implemented. User will receive an email invitation.');
    }

    /**
     * Update user role and permissions.
     */
    public function updateUser(Request $request, User $user): \Illuminate\Http\RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = app('tenant');
        
        $this->authorize('update', $tenant);

        $validated = $request->validate([
            'role' => 'required|string|in:admin,manager,accountant,user,viewer',
            'permissions' => 'required|array',
            'permissions.*' => 'string',
            'is_active' => 'boolean',
        ]);

        // Update user's role and permissions in this tenant
        $tenant->users()->updateExistingPivot($user->id, [
            'role' => $validated['role'],
            'permissions' => $validated['permissions'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return back()->with('success', 'User updated successfully.');
    }

    /**
     * Remove user from organization.
     */
    public function removeUser(User $user): \Illuminate\Http\RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = app('tenant');
        
        $this->authorize('update', $tenant);

        // Prevent removing the last admin
        $adminCount = $tenant->users()
            ->wherePivot('role', 'admin')
            ->wherePivot('is_active', true)
            ->count();

        $userRole = $tenant->users()
            ->where('user_id', $user->id)
            ->first()
            ?->pivot
            ?->role;

        if ($userRole === 'admin' && $adminCount <= 1) {
            return back()->withErrors(['error' => 'Cannot remove the last admin from the organization.']);
        }

        $tenant->users()->detach($user->id);

        return back()->with('success', 'User removed from organization successfully.');
    }

    /**
     * Get available modules.
     */
    protected function getAvailableModules(): array
    {
        return [
            'accounting' => [
                'name' => 'Accounting',
                'description' => 'Chart of accounts, journal entries, and financial transactions',
                'icon' => 'calculator',
            ],
            'invoicing' => [
                'name' => 'Invoicing',
                'description' => 'Create and manage invoices, quotes, and billing',
                'icon' => 'receipt',
            ],
            'banking' => [
                'name' => 'Banking',
                'description' => 'Bank account management and transaction reconciliation',
                'icon' => 'credit-card',
            ],
            'inventory' => [
                'name' => 'Inventory',
                'description' => 'Product and inventory management',
                'icon' => 'package',
            ],
            'reporting' => [
                'name' => 'Reporting',
                'description' => 'Financial reports and analytics',
                'icon' => 'chart-bar',
            ],
        ];
    }

    /**
     * Get available currencies.
     */
    protected function getAvailableCurrencies(): array
    {
        return [
            'USD' => 'US Dollar ($)',
            'EUR' => 'Euro (€)',
            'GBP' => 'British Pound (£)',
            'CAD' => 'Canadian Dollar (C$)',
            'AUD' => 'Australian Dollar (A$)',
            'JPY' => 'Japanese Yen (¥)',
            'CHF' => 'Swiss Franc (CHF)',
            'CNY' => 'Chinese Yuan (¥)',
            'INR' => 'Indian Rupee (₹)',
            'BRL' => 'Brazilian Real (R$)',
        ];
    }

    /**
     * Get available timezones.
     */
    protected function getAvailableTimezones(): array
    {
        return [
            'UTC' => 'UTC',
            'America/New_York' => 'Eastern Time (US & Canada)',
            'America/Chicago' => 'Central Time (US & Canada)',
            'America/Denver' => 'Mountain Time (US & Canada)',
            'America/Los_Angeles' => 'Pacific Time (US & Canada)',
            'Europe/London' => 'London',
            'Europe/Paris' => 'Paris',
            'Europe/Berlin' => 'Berlin',
            'Asia/Tokyo' => 'Tokyo',
            'Asia/Shanghai' => 'Shanghai',
            'Asia/Kolkata' => 'Mumbai',
            'Australia/Sydney' => 'Sydney',
        ];
    }

    /**
     * Get available date formats.
     */
    protected function getAvailableDateFormats(): array
    {
        return [
            'Y-m-d' => 'YYYY-MM-DD (2024-01-15)',
            'm/d/Y' => 'MM/DD/YYYY (01/15/2024)',
            'd/m/Y' => 'DD/MM/YYYY (15/01/2024)',
            'd-m-Y' => 'DD-MM-YYYY (15-01-2024)',
            'Y/m/d' => 'YYYY/MM/DD (2024/01/15)',
        ];
    }

    /**
     * Get available time formats.
     */
    protected function getAvailableTimeFormats(): array
    {
        return [
            'H:i:s' => '24-hour with seconds (14:30:45)',
            'H:i' => '24-hour (14:30)',
            'h:i:s A' => '12-hour with seconds (2:30:45 PM)',
            'h:i A' => '12-hour (2:30 PM)',
        ];
    }

    /**
     * Get available user roles.
     */
    protected function getAvailableRoles(): array
    {
        return [
            'admin' => [
                'name' => 'Administrator',
                'description' => 'Full access to all features and settings',
            ],
            'manager' => [
                'name' => 'Manager',
                'description' => 'Access to most features with some restrictions',
            ],
            'accountant' => [
                'name' => 'Accountant',
                'description' => 'Access to accounting and financial features',
            ],
            'user' => [
                'name' => 'User',
                'description' => 'Basic access to core features',
            ],
            'viewer' => [
                'name' => 'Viewer',
                'description' => 'Read-only access to reports and data',
            ],
        ];
    }

    /**
     * Get available permissions.
     */
    protected function getAvailablePermissions(): array
    {
        return [
            'manage-tenant' => 'Manage organization settings',
            'manage-users' => 'Manage users and permissions',
            'access-accounting' => 'Access accounting module',
            'manage-accounting' => 'Manage accounting data',
            'access-invoicing' => 'Access invoicing module',
            'manage-invoicing' => 'Manage invoices and billing',
            'access-banking' => 'Access banking module',
            'manage-banking' => 'Manage bank accounts',
            'access-inventory' => 'Access inventory module',
            'manage-inventory' => 'Manage inventory data',
            'access-reporting' => 'Access reports',
            'manage-reports' => 'Create and manage reports',
            'view-reports' => 'View financial reports',
            'manage-integrations' => 'Manage third-party integrations',
        ];
    }
}
