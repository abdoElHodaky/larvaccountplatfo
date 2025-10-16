<?php

namespace App\Features\TenantManagement\Controllers;

use App\Features\TenantManagement\Services\TenantService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    protected $tenantService;

    public function __construct(TenantService $tenantService)
    {
        $this->tenantService = $tenantService;
    }

    /**
     * Show tenant selection page
     */
    public function select(): Response
    {
        $user = Auth::user();
        $tenants = $this->tenantService->getUserTenants($user);

        return Inertia::render('Auth/TenantSelect', [
            'tenants' => $tenants,
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

        $result = $this->tenantService->switchTenant($user, $tenantId);

        if (! $result['success']) {
            return back()->withErrors([
                'tenant_id' => $result['message'],
            ]);
        }

        return redirect()->route('dashboard')->with('success', $result['message']);
    }

    /**
     * Show tenant settings
     */
    public function settings(): Response
    {
        $tenant = app('tenant');

        if (! $tenant) {
            return redirect()->route('tenant.select');
        }

        $tenantData = $this->tenantService->getTenantData($tenant);

        return Inertia::render('Tenant/Settings', [
            'tenant' => $tenantData,
        ]);
    }

    /**
     * Update tenant settings
     */
    public function updateSettings(Request $request): RedirectResponse
    {
        $tenant = app('tenant');

        if (! $tenant) {
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

        $result = $this->tenantService->updateTenantSettings($tenant, $request);

        if (! $result['success']) {
            return back()->withErrors(['error' => $result['message']]);
        }

        return back()->with('success', $result['message']);
    }

    /**
     * Show tenant users
     */
    public function users(): Response
    {
        $tenant = app('tenant');

        if (! $tenant) {
            return redirect()->route('tenant.select');
        }

        $users = $this->tenantService->getTenantUsers($tenant);

        return Inertia::render('Tenant/Users', [
            'users' => $users,
        ]);
    }

    /**
     * Invite a user to the tenant
     */
    public function inviteUser(Request $request): RedirectResponse
    {
        $tenant = app('tenant');

        if (! $tenant) {
            return redirect()->route('tenant.select');
        }

        $request->validate([
            'email' => 'required|email|max:255',
            'role' => 'required|string|in:admin,manager,user,viewer',
            'message' => 'nullable|string|max:500',
        ]);

        $result = $this->tenantService->inviteUser($tenant, $request);

        if (! $result['success']) {
            return back()->withErrors(['error' => $result['message']]);
        }

        return back()->with('success', $result['message']);
    }
}
