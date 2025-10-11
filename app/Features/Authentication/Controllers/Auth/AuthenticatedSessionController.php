<?php

namespace App\Features\Authentication\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\View\View;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();

        // Update last login timestamp
        $user->updateLastLogin();

        // Get user's active tenant
        $activeTenant = $user->getActiveTenant();

        if ($activeTenant) {
            // Set tenant in session
            session(['active_tenant_id' => $activeTenant->id]);

            // Bind tenant to container for this request
            app()->instance('tenant', $activeTenant);

            return redirect()->intended(route('dashboard'));
        }

        // If user has no tenants, redirect to tenant selection or creation
        $userTenants = $user->tenants()->wherePivot('is_active', true)->get();

        if ($userTenants->isEmpty()) {
            return redirect()->route('tenant.create')
                ->with('message', 'Welcome! Please create or join an organization to get started.');
        }

        // If user has multiple tenants, redirect to tenant selection
        if ($userTenants->count() > 1) {
            return redirect()->route('tenant.select')
                ->with('message', 'Please select an organization to continue.');
        }

        // Single tenant - set it as active
        $tenant = $userTenants->first();
        $user->setActiveTenant($tenant);

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Switch to a different tenant.
     */
    public function switchTenant(Request $request): RedirectResponse
    {
        $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
        ]);

        /** @var User $user */
        $user = Auth::user();
        $tenant = \App\Models\Tenant::findOrFail($request->tenant_id);

        if (! $user->hasAccessToTenant($tenant)) {
            abort(403, 'You do not have access to this organization.');
        }

        $user->setActiveTenant($tenant);

        return redirect()->route('dashboard')
            ->with('success', "Switched to {$tenant->name}");
    }

    /**
     * Show tenant selection page.
     */
    public function selectTenant(): Response
    {
        /** @var User $user */
        $user = Auth::user();

        $tenants = $user->tenants()
            ->wherePivot('is_active', true)
            ->with(['users' => function ($query) {
                $query->wherePivot('is_active', true)->limit(5);
            }])
            ->get()
            ->map(function ($tenant) {
                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'subdomain' => $tenant->subdomain,
                    'plan' => $tenant->plan,
                    'user_role' => $tenant->pivot->role,
                    'user_count' => $tenant->users()->wherePivot('is_active', true)->count(),
                    'is_active' => session('active_tenant_id') == $tenant->id,
                ];
            });

        return Inertia::render('Auth/SelectTenant', [
            'tenants' => $tenants,
        ]);
    }
}
