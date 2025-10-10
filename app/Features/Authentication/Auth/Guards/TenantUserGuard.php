<?php

namespace App\Features\Authentication\Auth\Guards;

use Illuminate\Auth\SessionGuard;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Contracts\Session\Session;
use Illuminate\Http\Request;

class TenantUserGuard extends SessionGuard
{
    /**
     * Create a new authentication guard.
     */
    public function __construct(UserProvider $provider, Session $session, Request $request = null)
    {
        parent::__construct('tenant_user', $provider, $session, $request);
    }

    /**
     * Attempt to authenticate a user using the given credentials.
     */
    public function attempt(array $credentials = [], $remember = false)
    {
        // Ensure we have a tenant context
        if (!$this->hasTenantContext()) {
            return false;
        }

        $this->fireAttemptEvent($credentials, $remember);

        $this->lastAttempted = $user = $this->provider->retrieveByCredentials($credentials);

        // If an implementation of UserInterface was returned, we'll ask the provider
        // to validate the user against the given credentials, and if they are in
        // fact valid we'll log the user into the application and return true.
        if ($this->hasValidCredentials($user, $credentials)) {
            $this->login($user, $remember);

            return true;
        }

        // If the authentication attempt fails, we will fire an event so that the user
        // may be notified of any suspicious attempts to access their account from
        // an unrecognized user. A developer may listen to this event as needed.
        $this->fireFailedEvent($user, $credentials);

        return false;
    }

    /**
     * Log a user into the application.
     */
    public function login(Authenticatable $user, $remember = false)
    {
        // Verify user belongs to current tenant
        if (!$this->userBelongsToCurrentTenant($user)) {
            throw new \Illuminate\Auth\AuthenticationException('User does not belong to current tenant.');
        }

        $this->updateSession($user->getAuthIdentifier());

        // If the user should be permanently "remembered" by the application we will
        // queue a permanent cookie that contains the encrypted copy of the user
        // identifier. We will then decrypt this on each subsequent request.
        if ($remember) {
            $this->ensureRememberTokenIsSet($user);

            $this->queueRecallerCookie($user);
        }

        // If we have an event dispatcher instance set we will fire an authentication
        // event so that any listeners will hook into the authentication events and
        // run actions based on the login and logout events fired from the guard.
        $this->fireLoginEvent($user, $remember);

        $this->setUser($user);

        // Update last login timestamp for tenant user
        if (method_exists($user, 'updateLastLogin')) {
            $user->updateLastLogin();
        }
    }

    /**
     * Log the user out of the application.
     */
    public function logout()
    {
        $user = $this->user();

        // Clear the user from the session and call the logout event
        $this->clearUserDataFromStorage();

        if (isset($this->events)) {
            $this->events->dispatch(new \Illuminate\Auth\Events\Logout($this->name, $user));
        }

        // Once we have fired the logout event we will clear the users out of memory
        // so they are no longer available as the user is no longer considered as
        // being signed into this application and should not be available here.
        $this->user = null;

        $this->loggedOut = true;
    }

    /**
     * Get the session key name for the guard
     */
    public function getName()
    {
        $tenant = $this->getCurrentTenant();
        $tenantId = $tenant ? $tenant->id : 'unknown';
        
        return 'login_tenant_user_' . $tenantId . '_' . sha1(static::class);
    }

    /**
     * Get the remember me cookie name for the guard
     */
    public function getRecallerName()
    {
        $tenant = $this->getCurrentTenant();
        $tenantId = $tenant ? $tenant->id : 'unknown';
        
        return 'remember_tenant_user_' . $tenantId . '_' . sha1(static::class);
    }

    /**
     * Get the currently authenticated user.
     */
    public function user()
    {
        if ($this->loggedOut) {
            return;
        }

        // Ensure we have a tenant context
        if (!$this->hasTenantContext()) {
            return null;
        }

        // If we've already retrieved the user for the current request we can just
        // return it back immediately. We do not want to fetch the user data on
        // every call to this method because that would be tremendously slow.
        if (!is_null($this->user)) {
            return $this->user;
        }

        $id = $this->session->get($this->getName());

        // First we will try to load the user using the identifier in the session if
        // one exists. Otherwise we will check for a "remember me" cookie in this
        // request, and if one exists, attempt to retrieve the user using that.
        if (!is_null($id) && $this->user = $this->provider->retrieveById($id)) {
            // Verify user still belongs to current tenant
            if ($this->userBelongsToCurrentTenant($this->user)) {
                $this->fireAuthenticatedEvent($this->user);
            } else {
                // User no longer belongs to tenant, clear session
                $this->clearUserDataFromStorage();
                $this->user = null;
            }
        }

        // If the user is null, but we decrypt a "remember me" cookie we can attempt
        // to retrieve the user using that. Once we have the user we can return it.
        if (is_null($this->user) && !is_null($recaller = $this->recaller())) {
            $this->user = $this->userFromRecaller($recaller);

            if ($this->user && $this->userBelongsToCurrentTenant($this->user)) {
                $this->updateSession($this->user->getAuthIdentifier());

                $this->fireLoginEvent($this->user, true);
            } else {
                $this->user = null;
            }
        }

        return $this->user;
    }

    /**
     * Validate a user's credentials.
     */
    public function validate(array $credentials = [])
    {
        if (!$this->hasTenantContext()) {
            return false;
        }

        $this->lastAttempted = $user = $this->provider->retrieveByCredentials($credentials);

        return $this->hasValidCredentials($user, $credentials) && 
               $this->userBelongsToCurrentTenant($user);
    }

    /**
     * Determine if the user matches the credentials.
     */
    protected function hasValidCredentials($user, $credentials)
    {
        $validated = !is_null($user) && $this->provider->validateCredentials($user, $credentials);

        if ($validated) {
            $this->fireValidatedEvent($user);
        }

        return $validated;
    }

    /**
     * Check if we have a tenant context
     */
    protected function hasTenantContext(): bool
    {
        return app()->bound('tenant') && app('tenant') !== null;
    }

    /**
     * Get the current tenant
     */
    protected function getCurrentTenant()
    {
        return app('tenant', null);
    }

    /**
     * Check if user belongs to current tenant
     */
    protected function userBelongsToCurrentTenant($user): bool
    {
        if (!$user) {
            return false;
        }

        $tenant = $this->getCurrentTenant();
        if (!$tenant) {
            return false;
        }

        // For shared databases, check organization_id
        if (isset($user->organization_id)) {
            return $user->organization_id === $tenant->id;
        }

        // For dedicated databases, user automatically belongs to tenant
        // since they're in the tenant's dedicated database
        return true;
    }

    /**
     * Fire the authenticated event if the dispatcher is set.
     */
    protected function fireAuthenticatedEvent($user)
    {
        if (isset($this->events)) {
            $this->events->dispatch(new \Illuminate\Auth\Events\Authenticated($this->name, $user));
        }
    }

    /**
     * Fire the login event if the dispatcher is set.
     */
    protected function fireLoginEvent($user, $remember = false)
    {
        if (isset($this->events)) {
            $this->events->dispatch(new \Illuminate\Auth\Events\Login($this->name, $user, $remember));
        }
    }

    /**
     * Fire the validated event if the dispatcher is set.
     */
    protected function fireValidatedEvent($user)
    {
        if (isset($this->events)) {
            $this->events->dispatch(new \Illuminate\Auth\Events\Validated($this->name, $user));
        }
    }

    /**
     * Fire the attempt event if the dispatcher is set.
     */
    protected function fireAttemptEvent(array $credentials, $remember = false)
    {
        if (isset($this->events)) {
            $this->events->dispatch(new \Illuminate\Auth\Events\Attempting($this->name, $credentials, $remember));
        }
    }

    /**
     * Fire the failed authentication attempt event if the dispatcher is set.
     */
    protected function fireFailedEvent($user, array $credentials)
    {
        if (isset($this->events)) {
            $this->events->dispatch(new \Illuminate\Auth\Events\Failed($this->name, $user, $credentials));
        }
    }
}
