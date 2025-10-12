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
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'email_verified_at' => $request->user()->email_verified_at,
                    'avatar' => $request->user()->avatar ?? null,
                    'role' => $request->user()->role ?? null,
                    'permissions' => $request->user()->getAllPermissions()->pluck('name')->toArray(),
                    'created_at' => $request->user()->created_at,
                    'updated_at' => $request->user()->updated_at,
                ] : null,
                'tenant' => app('tenant') ? [
                    'id' => app('tenant')->id,
                    'name' => app('tenant')->name,
                    'slug' => app('tenant')->slug ?? null,
                    'domain' => app('tenant')->domain ?? null,
                    'subdomain' => app('tenant')->subdomain ?? null,
                    'logo' => app('tenant')->logo ?? null,
                    'settings' => app('tenant')->settings ?? [],
                    'subscription_status' => app('tenant')->subscription_status ?? null,
                    'created_at' => app('tenant')->created_at,
                    'updated_at' => app('tenant')->updated_at,
                ] : null,
                'organization' => app('organization') ? [
                    'id' => app('organization')->id,
                    'name' => app('organization')->name,
                    'slug' => app('organization')->slug ?? null,
                    'description' => app('organization')->description ?? null,
                    'logo' => app('organization')->logo ?? null,
                    'website' => app('organization')->website ?? null,
                    'industry' => app('organization')->industry ?? null,
                    'size' => app('organization')->size ?? null,
                    'settings' => app('organization')->settings ?? [],
                    'created_at' => app('organization')->created_at,
                    'updated_at' => app('organization')->updated_at,
                ] : null,
                'permissions' => $request->user() ? $request->user()->getAllPermissions()->pluck('name')->toArray() : [],
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
