<?php

namespace App\Http\Controllers\Auth;

use App\Features\Authentication\Auth\TenantAwareAuthManager;
use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LoginController extends Controller
{
    use AuthenticatesUsers;

    /**
     * The authentication service.
     */
    protected $authService;

    /**
     * The tenant-aware authentication manager.
     */
    protected $tenantAuth;

    /**
     * Create a new controller instance.
     */
    public function __construct(AuthService $authService, TenantAwareAuthManager $tenantAuth)
    {
        $this->middleware('guest')->except('logout');
        $this->authService = $authService;
        $this->tenantAuth = $tenantAuth;
    }

    /**
     * Show the application's login form.
     */
    public function showLoginForm()
    {
        $tenant = app('tenant', null);
        
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
     * Display the login view (alias for Inertia routing)
     */
    public function create()
    {
        return $this->showLoginForm();
    }

    /**
     * Handle login form submission (alias for Inertia routing)
     */
    public function store(Request $request)
    {
        return $this->login($request);
    }

    /**
     * Handle logout (alias for Inertia routing)
     */
    public function destroy(Request $request)
    {
        return $this->logout($request);
    }

    /**
     * Handle a login request to the application.
     */
    public function login(Request $request)
    {
        $this->validateLogin($request);

        // If the class is using the ThrottlesLogins trait, we can automatically throttle
        // the login attempts for this application. We'll key this by the username and
        // the IP address of the client making these requests into this application.
        if (method_exists($this, 'hasTooManyLoginAttempts') &&
            $this->hasTooManyLoginAttempts($request)) {
            $this->fireLockoutEvent($request);

            return $this->sendLockoutResponse($request);
        }

        if ($this->attemptLogin($request)) {
            if ($request->hasSession()) {
                $request->session()->put('auth.password_confirmed_at', time());
            }

            return $this->sendLoginResponse($request);
        }

        // If the login attempt was unsuccessful we will increment the number of attempts
        // to login and redirect the user back to the login form. Of course, when this
        // user surpasses their maximum number of attempts they will get locked out.
        $this->incrementLoginAttempts($request);

        return $this->sendFailedLoginResponse($request);
    }

    /**
     * Attempt to log the user into the application.
     */
    protected function attemptLogin(Request $request)
    {
        $credentials = $this->credentials($request);
        $remember = $request->boolean('remember');

        return $this->authService->attemptLogin($credentials, $remember);
    }

    /**
     * Get the needed authorization credentials from the request.
     */
    protected function credentials(Request $request)
    {
        return $request->only($this->username(), 'password');
    }

    /**
     * Get the login username to be used by the controller.
     */
    public function username()
    {
        return 'email';
    }

    /**
     * Send the response after the user was authenticated.
     */
    protected function sendLoginResponse(Request $request)
    {
        $request->session()->regenerate();

        $this->clearLoginAttempts($request);

        if ($response = $this->authenticated($request, $this->guard()->user())) {
            return $response;
        }

        return $request->wantsJson()
                    ? new \Illuminate\Http\JsonResponse([], 204)
                    : redirect()->intended($this->redirectPath());
    }

    /**
     * The user has been authenticated.
     */
    protected function authenticated(Request $request, $user)
    {
        // Update last login timestamp
        if (method_exists($user, 'updateLastLogin')) {
            $user->updateLastLogin();
        }

        // Log successful authentication
        \Log::info('User authenticated', [
            'user_id' => $user->id,
            'email' => $user->email,
            'tenant_id' => app('tenant_id', null),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    /**
     * Get the failed login response instance.
     */
    protected function sendFailedLoginResponse(Request $request)
    {
        throw ValidationException::withMessages([
            $this->username() => [trans('auth.failed')],
        ]);
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request)
    {
        $user = $this->guard()->user();

        $this->guard()->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        if ($response = $this->loggedOut($request)) {
            return $response;
        }

        // Log successful logout
        if ($user) {
            \Log::info('User logged out', [
                'user_id' => $user->id,
                'email' => $user->email,
                'tenant_id' => app('tenant_id', null),
                'ip' => $request->ip(),
            ]);
        }

        return $request->wantsJson()
            ? new \Illuminate\Http\JsonResponse([], 204)
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
    public function redirectPath()
    {
        $tenant = app('tenant', null);
        
        if ($tenant) {
            // Tenant-specific dashboard
            return route('dashboard');
        } else {
            // Check if user has multiple tenants
            $user = Auth::user();
            $tenants = $user->tenants ?? collect();

            if ($tenants->count() > 1) {
                // Redirect to tenant selection
                return route('tenant.select');
            } elseif ($tenants->count() === 1) {
                // Set the single tenant and redirect to dashboard
                session(['tenant_id' => $tenants->first()->id]);
                return route('dashboard');
            } else {
                // No tenants - redirect to tenant selection with warning
                return route('tenant.select');
            }
        }
    }

    /**
     * Validate the user login request.
     */
    protected function validateLogin(Request $request)
    {
        $request->validate([
            $this->username() => 'required|string|email',
            'password' => 'required|string',
        ]);
    }

    /**
     * Handle tenant-specific login
     */
    public function tenantLogin(Request $request)
    {
        // Ensure we have a tenant context
        $tenant = app('tenant', null);
        if (!$tenant) {
            return redirect()->route('tenant.select')
                           ->withErrors(['tenant' => 'Please select a tenant first.']);
        }

        return $this->login($request);
    }

    /**
     * Handle landlord login
     */
    public function landlordLogin(Request $request)
    {
        // Ensure we're not in a tenant context
        if (app('tenant', null)) {
            return redirect()->route('landlord.login');
        }

        return $this->login($request);
    }

    /**
     * Show tenant selection form
     */
    public function showTenantSelection()
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
     * Handle tenant selection
     */
    public function selectTenant(Request $request)
    {
        $request->validate([
            'subdomain' => 'required|string|max:255',
        ]);

        $subdomain = $request->input('subdomain');
        
        // Redirect to tenant-specific login
        $protocol = $request->isSecure() ? 'https' : 'http';
        $domain = config('app.domain', $request->getHost());
        
        return redirect()->to("{$protocol}://{$subdomain}.{$domain}/login");
    }

    /**
     * Handle API login
     */
    public function apiLogin(Request $request)
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
     * Handle API logout
     */
    public function apiLogout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }
}
