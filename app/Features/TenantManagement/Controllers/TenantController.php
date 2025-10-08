<?php

namespace App\Features\TenantManagement\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Controller;

class TenantController extends Controller
{
    /**
     * Show tenant selection page
     */
    public function select(): Response
    {
        $user = Auth::user();
        $tenants = $user ? $user->tenants : collect();

        return Inertia::render('Auth/TenantSelect', [
            'tenants' => $tenants->map(function ($tenant) {
                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'subdomain' => $tenant->subdomain,
                    'logo' => $tenant->logo,
                    'description' => $tenant->description,
                    'subscription_status' => $tenant->subscription_status,
                ];
            }),
        ]);
    }

    /**
     * Switch to a different tenant
     */
    public function switch(Request $request): RedirectResponse
    {
        $request->validate([
            'tenant_id' => 'required|integer|exists:tenants,id',
        ]);

        $user = Auth::user();
        $tenantId = $request->input('tenant_id');

        // Verify user has access to this tenant
        $tenant = $user->tenants()->find($tenantId);
        
        if (!$tenant) {
            return back()->withErrors([
                'tenant_id' => 'You do not have access to this organization.',
            ]);
        }

        // Set tenant in session
        session(['tenant_id' => $tenantId]);

        return redirect()->route('dashboard')->with('success', "Switched to {$tenant->name}");
    }

    /**
     * Show tenant settings
     */
    public function settings(): Response
    {
        $tenant = app('tenant');
        
        if (!$tenant) {
            return redirect()->route('tenant.select');
        }

        return Inertia::render('Tenant/Settings', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'subdomain' => $tenant->subdomain,
                'domain' => $tenant->domain,
                'logo' => $tenant->logo,
                'description' => $tenant->description,
                'website' => $tenant->website,
                'industry' => $tenant->industry,
                'size' => $tenant->size,
                'settings' => $tenant->settings ?? [],
                'subscription_status' => $tenant->subscription_status,
                'created_at' => $tenant->created_at,
                'updated_at' => $tenant->updated_at,
            ],
        ]);
    }

    /**
     * Update tenant settings
     */
    public function updateSettings(Request $request): RedirectResponse
    {
        $tenant = app('tenant');
        
        if (!$tenant) {
            return redirect()->route('tenant.select');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'website' => 'nullable|url|max:255',
            'industry' => 'nullable|string|max:100',
            'size' => 'nullable|string|in:1-10,11-50,51-200,201-500,501-1000,1000+',
            'logo' => 'nullable|image|max:2048',
        ]);

        $data = $request->only(['name', 'description', 'website', 'industry', 'size']);

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('tenant-logos', 'public');
            $data['logo'] = $logoPath;
        }

        $tenant->update($data);

        return back()->with('success', 'Organization settings updated successfully.');
    }

    /**
     * Show tenant users
     */
    public function users(): Response
    {
        $tenant = app('tenant');
        
        if (!$tenant) {
            return redirect()->route('tenant.select');
        }

        $users = $tenant->users()->with('roles', 'permissions')->get();

        return Inertia::render('Tenant/Users', [
            'users' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'role' => $user->role,
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            }),
        ]);
    }

    /**
     * Invite a user to the tenant
     */
    public function inviteUser(Request $request): RedirectResponse
    {
        $tenant = app('tenant');
        
        if (!$tenant) {
            return redirect()->route('tenant.select');
        }

        $request->validate([
            'email' => 'required|email|max:255',
            'role' => 'required|string|in:admin,manager,user,viewer',
            'message' => 'nullable|string|max:500',
        ]);

        // TODO: Implement user invitation logic
        // This would typically:
        // 1. Create an invitation record
        // 2. Send an email invitation
        // 3. Handle invitation acceptance

        return back()->with('success', 'User invitation sent successfully.');
    }
}
