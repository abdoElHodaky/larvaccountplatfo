<?php

namespace App\Shared\Traits;

use Illuminate\Support\Facades\Auth;

/**
 * Auditable Trait
 *
 * Automatically tracks who created and updated records.
 * Provides audit trail functionality for models.
 */
trait AuditableTrait
{
    /**
     * Boot the auditable trait for a model.
     */
    protected static function bootAuditableTrait()
    {
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::id();
                $model->updated_by = Auth::id();
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }

    /**
     * Get the user who created this record
     */
    public function creator()
    {
        return $this->belongsTo(config('auth.providers.users.model'), 'created_by');
    }

    /**
     * Get the user who last updated this record
     */
    public function updater()
    {
        return $this->belongsTo(config('auth.providers.users.model'), 'updated_by');
    }

    /**
     * Get audit trail information
     */
    public function getAuditTrail(): array
    {
        return [
            'created' => [
                'at' => $this->created_at,
                'by' => $this->creator ? $this->creator->name : 'System',
                'by_id' => $this->created_by,
            ],
            'updated' => [
                'at' => $this->updated_at,
                'by' => $this->updater ? $this->updater->name : 'System',
                'by_id' => $this->updated_by,
            ],
        ];
    }

    /**
     * Check if record was created by specific user
     */
    public function wasCreatedBy(int $userId): bool
    {
        return $this->created_by === $userId;
    }

    /**
     * Check if record was last updated by specific user
     */
    public function wasUpdatedBy(int $userId): bool
    {
        return $this->updated_by === $userId;
    }

    /**
     * Check if record was modified by specific user
     */
    public function wasModifiedBy(int $userId): bool
    {
        return $this->wasCreatedBy($userId) || $this->wasUpdatedBy($userId);
    }

    /**
     * Scope to records created by specific user
     */
    public function scopeCreatedBy($query, int $userId)
    {
        return $query->where('created_by', $userId);
    }

    /**
     * Scope to records updated by specific user
     */
    public function scopeUpdatedBy($query, int $userId)
    {
        return $query->where('updated_by', $userId);
    }

    /**
     * Scope to records modified by specific user
     */
    public function scopeModifiedBy($query, int $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('created_by', $userId)
                ->orWhere('updated_by', $userId);
        });
    }

    /**
     * Get the fillable attributes for audit fields
     */
    public function getAuditableFillable(): array
    {
        return ['created_by', 'updated_by'];
    }

    /**
     * Get the casts for audit fields
     */
    public function getAuditableCasts(): array
    {
        return [
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }

    /**
     * Get audit field validation rules
     */
    public function getAuditableRules(): array
    {
        return [
            'created_by' => 'nullable|integer|exists:users,id',
            'updated_by' => 'nullable|integer|exists:users,id',
        ];
    }
}
