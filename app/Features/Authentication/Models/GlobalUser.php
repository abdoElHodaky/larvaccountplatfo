<?php

namespace App\Features\Authentication\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class GlobalUser extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $connection = 'landlord';

    protected $fillable = [
        'tenant_id',
        'email',
        'name',
        'email_verified_at',
        'password',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Get the tenant that owns this user
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Scope to active users only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to users by tenant
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Update last login timestamp
     */
    public function updateLastLogin(): void
    {
        $this->update(['last_login_at' => now()]);
    }

    /**
     * Check if user belongs to specific tenant
     */
    public function belongsToTenant(int $tenantId): bool
    {
        return $this->tenant_id === $tenantId;
    }

    /**
     * Get user's tenant-specific user record
     */
    public function getTenantUser()
    {
        // This would return the user record from the tenant's database
        // Implementation depends on how you structure tenant-specific user data
        return null; // Placeholder
    }
}
