<?php

namespace App\Auth\Providers;

use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Database\Eloquent\Model;

class HybridUserProvider extends EloquentUserProvider
{
    /**
     * The global user model class name.
     */
    protected $globalModel;

    /**
     * Create a new database user provider.
     */
    public function __construct(Hasher $hasher, $model, $globalModel = null)
    {
        parent::__construct($hasher, $model);
        
        $this->globalModel = $globalModel;
    }

    /**
     * Retrieve a user by their unique identifier.
     */
    public function retrieveById($identifier)
    {
        $model = $this->createModel();

        return $this->newModelQuery($model)
                    ->where($model->getAuthIdentifierName(), $identifier)
                    ->first();
    }

    /**
     * Retrieve a user by their unique identifier and "remember me" token.
     */
    public function retrieveByToken($identifier, $token)
    {
        $model = $this->createModel();

        $retrievedModel = $this->newModelQuery($model)
                               ->where($model->getAuthIdentifierName(), $identifier)
                               ->first();

        if (!$retrievedModel) {
            return null;
        }

        $rememberToken = $retrievedModel->getRememberToken();

        return $rememberToken && hash_equals($rememberToken, $token)
                        ? $retrievedModel : null;
    }

    /**
     * Update the "remember me" token for the given user in storage.
     */
    public function updateRememberToken(Authenticatable $user, $token)
    {
        $user->setRememberToken($token);

        $timestamps = $user->timestamps;

        $user->timestamps = false;

        $user->save();

        $user->timestamps = $timestamps;
    }

    /**
     * Retrieve a user by the given credentials.
     */
    public function retrieveByCredentials(array $credentials)
    {
        if (empty($credentials) ||
           (count($credentials) === 1 &&
            array_key_exists('password', $credentials))) {
            return;
        }

        // Build the query on the model
        $query = $this->newModelQuery();

        foreach ($credentials as $key => $value) {
            if (str_contains($key, 'password')) {
                continue;
            }

            if (is_array($value) || $value instanceof \Arrayable) {
                $query->whereIn($key, $value);
            } else {
                $query->where($key, $value);
            }
        }

        return $query->first();
    }

    /**
     * Validate a user against the given credentials.
     */
    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        $plain = $credentials['password'];

        return $this->hasher->check($plain, $user->getAuthPassword());
    }

    /**
     * Create a new instance of the model.
     */
    public function createModel()
    {
        $class = '\\'.ltrim($this->model, '\\');

        return new $class;
    }

    /**
     * Create a new instance of the global model.
     */
    public function createGlobalModel()
    {
        if (!$this->globalModel) {
            return null;
        }

        $class = '\\'.ltrim($this->globalModel, '\\');

        return new $class;
    }

    /**
     * Gets the name of the Eloquent user model.
     */
    public function getModel()
    {
        return $this->model;
    }

    /**
     * Sets the name of the Eloquent user model.
     */
    public function setModel($model)
    {
        $this->model = $model;

        return $this;
    }

    /**
     * Gets the name of the global Eloquent user model.
     */
    public function getGlobalModel()
    {
        return $this->globalModel;
    }

    /**
     * Sets the name of the global Eloquent user model.
     */
    public function setGlobalModel($globalModel)
    {
        $this->globalModel = $globalModel;

        return $this;
    }

    /**
     * Get a new query builder for the model instance.
     */
    protected function newModelQuery($model = null)
    {
        $model = $model ?: $this->createModel();

        // Ensure we're using the correct database connection based on tenant context
        $this->ensureCorrectDatabaseConnection($model);

        return $model->newQuery();
    }

    /**
     * Ensure the model is using the correct database connection
     */
    protected function ensureCorrectDatabaseConnection($model): void
    {
        $tenant = app('tenant', null);
        
        if (!$tenant) {
            // No tenant context, ensure we're using the landlord connection for global users
            if ($this->isGlobalUserModel($model)) {
                $model->setConnection('landlord');
            }
            return;
        }

        // We have a tenant context, set the appropriate connection
        $connectionName = $tenant->getDatabaseConnectionName();
        $model->setConnection($connectionName);
    }

    /**
     * Check if the model is a global user model
     */
    protected function isGlobalUserModel($model): bool
    {
        return $this->globalModel && $model instanceof $this->globalModel;
    }

    /**
     * Determine if the user provider supports the given model
     */
    public function supportsModel($model): bool
    {
        return $model instanceof $this->model || 
               ($this->globalModel && $model instanceof $this->globalModel);
    }

    /**
     * Switch to global user model for landlord authentication
     */
    public function switchToGlobalModel(): void
    {
        if ($this->globalModel) {
            $this->model = $this->globalModel;
        }
    }

    /**
     * Switch to tenant user model for tenant authentication
     */
    public function switchToTenantModel(): void
    {
        // Reset to the original model (tenant user model)
        // This assumes the original model passed to constructor was the tenant model
    }

    /**
     * Get user by email across both global and tenant contexts
     */
    public function findUserByEmail(string $email)
    {
        // First try to find in current context
        $user = $this->retrieveByCredentials(['email' => $email]);
        
        if ($user) {
            return $user;
        }

        // If not found and we have a global model, try global context
        if ($this->globalModel && !app('tenant', null)) {
            $globalModel = $this->createGlobalModel();
            if ($globalModel) {
                $globalModel->setConnection('landlord');
                return $globalModel->where('email', $email)->first();
            }
        }

        return null;
    }

    /**
     * Check if user exists in current tenant context
     */
    public function userExistsInTenant(string $email, $tenantId = null): bool
    {
        $tenant = $tenantId ? app(\App\Models\Tenant::class)->find($tenantId) : app('tenant', null);
        
        if (!$tenant) {
            return false;
        }

        $model = $this->createModel();
        $connectionName = $tenant->getDatabaseConnectionName();
        $model->setConnection($connectionName);

        $query = $model->where('email', $email);

        // For shared databases, also check organization_id
        if ($tenant->database_strategy === 'shared') {
            $query->where('organization_id', $tenant->id);
        }

        return $query->exists();
    }
}

