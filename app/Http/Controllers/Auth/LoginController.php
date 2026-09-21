<?php

namespace App\Http\Controllers\Auth;

use App\Features\Authentication\Auth\TenantAwareAuthManager;
use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    /**
     * The authentication service.
     */
    protected AuthService $authService;

    /**
     * The tenant-aware authentication manager.
     */
    protected TenantAwareAuthManager $tenantAuth;

    /**
     * Create a new controller instance.
     */
    public function __construct(AuthService $authService, TenantAwareAuthManager $tenantAuth)
    {
        $this->middleware('guest')->except('logout', 'destroy', 'apiLogout');
        $this->authService = $authService;
        $this->tenantAuth = $tenantAuth;
    }

    /**
     * Show the application's login form.
     */
    public function showLoginForm(): Response
    {
        $tenant = app()->bound('tenant') ? app('tenant') : null;

        return Inertia::render('Auth/Login', [
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'logo' => $tenant->logo,
            ] : null,
            'canResetPassword' => true,
            'status' => session('status'),
        ]);
    }

    /**
     * Display the login view (Inertia route alias)
     */
    public function create(): Response
    {
        return $this->showLoginForm();
    }

    /**
     * Handle login form submission (Inertia route alias)
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        return $this->login($request);
    }

    /**
     * Handle logout (Inertia route alias)
     */
    public function destroy(Request $request): JsonResponse|RedirectResponse
    {
        return $this->logout($request);
    }

    /**
     * Handle a login request to the application.
     */
    public function login(Request $request): JsonResponse|RedirectResponse
    {
        $this->validateLogin($request);

        // Check rate limiting / throttling
        if ($this->hasTooManyLoginAttempts($request)) {
            return $this->sendLockoutResponse($request);
        }

        if ($this->attemptLogin($request)) {
            if ($request->hasSession()) {
                $request->session()->put('auth.password_confirmed_at', time());
            }

            return $this->sendLoginResponse($request);
        }

        // Increment rate limit attempts on failure
        $this->incrementLoginAttempts($request);

        return $this->sendFailedLoginResponse($request);
    }

    /**
     * Attempt to log the user into the application.
     */
    protected function attemptLogin(Request $request): bool
    {
        $credentials = $this->credentials($request);
        $remember = $request->boolean('remember');

        return $this->authService->attemptLogin($credentials, $remember);
    }

    /**
     * Get the needed authorization credentials from the request.
     */
    protected function credentials(Request $request): array
    {
        return $request->only($this->username(), 'password');
    }

    /**
     * Get the login username to be used by the controller.
     */
    public function username(): string
    {
        return 'email';
    }

    /**
     * Send the response after the user was authenticated.
     */
    protected function sendLoginResponse(Request $request): JsonResponse|RedirectResponse
    {
        $request->session()->regenerate();

        $this->clearLoginAttempts($request);

        if ($response = $this->authenticated($request, $this->guard()->user())) {
            return $response;
        }

        return $request->wantsJson()
            ? new JsonResponse([], 204)
            : redirect()->intended($this->redirectPath());
    }

    /**
     * The user has been authenticated.
     */
    protected function authenticated(Request $request, $user): mixed
    {
        if (method_exists($user, 'updateLastLogin')) {
            $user->updateLastLogin();
        }

        Log::info('User authenticated', [
            'user_id' => $user->id,
            'email' => $user->email,
            'tenant_id' => app('tenant_id', null),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return null;
    }

    /**
     * Get the failed login response instance.
     */
    protected function sendFailedLoginResponse(Request $request): never
    {
        throw ValidationException::withMessages([
            $this->username() => [trans('auth.failed')],
        ]);
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request): JsonResponse|RedirectResponse
    {
        $user = $this->guard()->user();

        $this->guard()->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($user) {
            Log::info('User logged out', [
                'user_id' => $user->id,
                'email' => $user->email,
                'tenant_id' => app('tenant_id', null),
                'ip' => $request->ip(),
            ]);
        }

        return $request->wantsJson()
            ? new JsonResponse([], 204)
            : redirect('/');
    }

    /**
     * Get the guard to be used during authentication.
     */
    protected function guard()
    {
        return $this->tenantAuth->resolveGuard();
    }

    /**
     * Get the post-register / post-login redirect path.
     */
    public function redirectPath(): string
    {
        $tenant = app('tenant', null);

        if ($tenant) {
            return route('dashboard');
        }

        $user = Auth::user();
        $tenants = $user->tenants ?? collect();

        if ($tenants->count() > 1) {
            return route('tenant.select');
        } elseif ($tenants->count() === 1) {
            session(['tenant_id' => $tenants->first()->id]);
            return route('dashboard');
        }

        return route('tenant.select');
    }

    /**
     * Validate the user login request.
     */
    protected function validateLogin(Request $request): void
    {
        $request->validate([
            $this->username() => 'required|string|email',
            'password' => 'required|string',
        ]);
    }

    /**
     * Handle tenant-specific login.
     */
    public function tenantLogin(Request $request): JsonResponse|RedirectResponse
    {
        $tenant = app('tenant', null);
        if (! $tenant) {
            return redirect()->route('tenant.select')
                ->withErrors(['tenant' => 'Please select a tenant first.']);
        }

        return $this->login($request);
    }

    /**
     * Handle landlord login.
     */
    public function landlordLogin(Request $request): JsonResponse|RedirectResponse
    {
        if (app('tenant', null)) {
            return redirect()->route('landlord.login');
        }

        return $this->login($request);
    }

    /**
     * Show tenant selection form.
     */
    public function showTenantSelection(): Response
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
                ];
            }),
        ]);
    }

    /**
     * Handle tenant selection.
     */
    public function selectTenant(Request $request): RedirectResponse
    {
        $request->validate([
            'subdomain' => 'required|string|max:255',
        ]);

        $subdomain = $request->input('subdomain');
        $protocol = $request->isSecure() ? 'https' : 'http';
        $domain = config('app.domain', $request->getHost());

        return redirect()->to("{$protocol}://{$subdomain}.{$domain}/login");
    }

    /**
     * Handle API login.
     */
    public function apiLogin(Request $request): JsonResponse
    {
        $this->validateLogin($request);

        $credentials = $this->credentials($request);

        if ($this->authService->attemptLogin($credentials)) {
            $user = $this->guard()->user();
            $token = $user->createToken('API Token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
                'tenant' => app('tenant', null),
            ]);
        }

        return response()->json([
            'message' => 'Invalid credentials',
        ], 401);
    }

    /**
     * Handle API logout.
     */
    public function apiLogout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }

    /* -------------------------------------------------------------------------- */
    /*                        Rate Limiting (Throttling)                          */
    /* -------------------------------------------------------------------------- */

    /**
     * Determine if the user has too many failed login attempts.
     */
    protected function hasTooManyLoginAttempts(Request $request): bool
    {
        return RateLimiter::tooManyAttempts($this->throttleKey($request), 5);
    }

    /**
     * Increment the login attempts for the user.
     */
    protected function incrementLoginAttempts(Request $request): void
    {
        RateLimiter::hit($this->throttleKey($request), 60);
    }

    /**
     * Clear the login locks for the given user credentials.
     */
    protected function clearLoginAttempts(Request $request): void
    {
        RateLimiter::clear($this->throttleKey($request));
    }

    /**
     * Redirect the user after determining they are locked out.
     */
    protected function sendLockoutResponse(Request $request): never
    {
        $seconds = RateLimiter::availableIn($this->throttleKey($request));

        throw ValidationException::withMessages([
            $this->username() => [
                trans('auth.throttle', [
                    'seconds' => $seconds,
                    'minutes' => ceil($seconds / 60),
                ]),
            ],
        ])->status(429);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    protected function throttleKey(Request $request): string
    {
        return Str::transliterate(Str::lower($request->input($this->username())).'|'.$request->ip());
    }
}
