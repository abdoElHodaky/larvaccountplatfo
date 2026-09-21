<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $permissions = $user ? $user->getAllPermissions()->pluck('name')->toArray() : [];

        // Safely resolve tenant and organization without throwing exceptions if unbound
        $tenant = app()->bound('tenant') ? app('tenant') : null;
        $organization = app()->bound('organization') ? app('organization') : null;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'avatar' => $user->avatar ?? null,
                    'role' => $user->role ?? null,
                    'permissions' => $permissions,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ] : null,
                'tenant' => $tenant ? [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug ?? null,
                    'domain' => $tenant->domain ?? null,
                    'subdomain' => $tenant->subdomain ?? null,
                    'logo' => $tenant->logo ?? null,
                    'settings' => $tenant->settings ?? [],
                    'subscription_status' => $tenant->subscription_status ?? null,
                    'created_at' => $tenant->created_at,
                    'updated_at' => $tenant->updated_at,
                ] : null,
                'organization' => $organization ? [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'slug' => $organization->slug ?? null,
                    'description' => $organization->description ?? null,
                    'logo' => $organization->logo ?? null,
                    'website' => $organization->website ?? null,
                    'industry' => $organization->industry ?? null,
                    'size' => $organization->size ?? null,
                    'settings' => $organization->settings ?? [],
                    'created_at' => $organization->created_at,
                    'updated_at' => $organization->updated_at,
                ] : null,
                'permissions' => $permissions,
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
                'success' => fn () => $request->session()->get('success'),
                'warning' => fn () => $request->session()->get('warning'),
            ],
            'errors' => fn () => $request->session()->get('errors')
                ? $request->session()->get('errors')->getBag('default')->getMessages()
                : (object) [],
        ];
    }
}
