<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'organization_name' => 'required|string|max:255',
            'organization_subdomain' => 'required|string|max:50|unique:tenants,subdomain|regex:/^[a-z0-9-]+$/',
            'phone' => 'nullable|string|max:20',
            'timezone' => 'nullable|string|max:50',
        ]);

        // Create the user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'timezone' => $request->timezone ?? 'UTC',
            'locale' => app()->getLocale(),
            'is_active' => true,
        ]);

        // Create the organization/tenant
        $tenant = Tenant::create([
            'name' => $request->organization_name,
            'subdomain' => $request->organization_subdomain,
            'plan' => 'starter',
            'status' => 'active',
            'settings' => [
                'currency' => 'USD',
                'date_format' => 'Y-m-d',
                'time_format' => '24h',
                'fiscal_year_start' => '01-01',
            ],
            'enabled_modules' => [
                'accounting',
                'reporting',
                'organization',
            ],
        ]);

        // Attach user to tenant as admin
        $user->tenants()->attach($tenant->id, [
            'role' => 'admin',
            'permissions' => [
                'manage-tenant',
                'manage-users',
                'access-all-modules',
                'manage-settings',
                'view-reports',
                'manage-integrations',
            ],
            'is_active' => true,
            'joined_at' => now(),
        ]);

        event(new Registered($user));

        Auth::login($user);

        // Set the tenant as active
        $user->setActiveTenant($tenant);

        return redirect()->route('dashboard')
            ->with('success', 'Welcome! Your account and organization have been created successfully.');
    }

    /**
     * Show the invitation registration form.
     */
    public function createFromInvitation(Request $request): Response
    {
        $token = $request->query('token');
        $email = $request->query('email');

        if (! $token || ! $email) {
            abort(404);
        }

        // Verify invitation token (you might want to create an Invitation model)
        // For now, we'll just pass the data to the view

        return Inertia::render('Auth/RegisterFromInvitation', [
            'token' => $token,
            'email' => $email,
        ]);
    }

    /**
     * Handle registration from invitation.
     */
    public function storeFromInvitation(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'token' => 'required|string',
            'tenant_id' => 'required|exists:tenants,id',
            'phone' => 'nullable|string|max:20',
            'timezone' => 'nullable|string|max:50',
        ]);

        // TODO: Verify invitation token and get invitation details
        // For now, we'll create a basic user

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'timezone' => $request->timezone ?? 'UTC',
            'locale' => app()->getLocale(),
            'is_active' => true,
        ]);

        $tenant = Tenant::findOrFail($request->tenant_id);

        // Attach user to tenant with default role
        $user->tenants()->attach($tenant->id, [
            'role' => 'user',
            'permissions' => [
                'access-accounting',
                'access-reporting',
            ],
            'is_active' => true,
            'joined_at' => now(),
        ]);

        event(new Registered($user));

        Auth::login($user);

        // Set the tenant as active
        $user->setActiveTenant($tenant);

        return redirect()->route('dashboard')
            ->with('success', "Welcome to {$tenant->name}! Your account has been created successfully.");
    }
}
