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
    public function version(Request $request): string|null
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
                'user' => $request->user(),
                'tenant' => app('tenant'),
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
                'success' => fn () => $request->session()->get('success'),
            ],
            'tenant' => fn () => app('tenant') ? [
                'id' => app('tenant')->id,
                'name' => app('tenant')->name,
                'subdomain' => app('tenant')->subdomain,
                'plan' => app('tenant')->plan,
                'modules' => app('tenant')->enabled_modules ?? [],
            ] : null,
            'modules' => fn () => config('modules.enabled', []),
            'permissions' => fn () => $request->user() ? [
                'can_manage_tenant' => $request->user()->can('manage-tenant', app('tenant')),
                'can_access_modules' => collect(config('modules.enabled', []))
                    ->mapWithKeys(fn ($module) => [
                        $module => $request->user()->can('access-module', $module)
                    ]),
            ] : [],
        ];
    }
}
