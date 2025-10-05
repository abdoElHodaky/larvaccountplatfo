<?php

namespace Modules\Shared\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends HybridModel
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'tax_number',
        'currency',
        'timezone',
        'date_format',
        'time_format',
        'settings',
        'is_active',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Organization doesn't need organization scope applied to itself
     */
    protected static function booted(): void
    {
        // Skip the parent booted method for Organization model
        // as it doesn't need to be scoped by organization_id
    }

    /**
     * Get the users for this organization
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Scope to active organizations only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to organizations by country
     */
    public function scopeByCountry($query, string $country)
    {
        return $query->where('country', $country);
    }

    /**
     * Scope to organizations by currency
     */
    public function scopeByCurrency($query, string $currency)
    {
        return $query->where('currency', $currency);
    }

    /**
     * Get organization setting with default
     */
    public function getSetting(string $key, $default = null)
    {
        return data_get($this->settings, $key, $default);
    }

    /**
     * Set organization setting
     */
    public function setSetting(string $key, $value): void
    {
        $settings = $this->settings ?? [];
        data_set($settings, $key, $value);
        $this->update(['settings' => $settings]);
    }

    /**
     * Get formatted address
     */
    public function getFormattedAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->city,
            $this->state,
            $this->postal_code,
            $this->country,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Get organization's full name with location
     */
    public function getFullNameAttribute(): string
    {
        $parts = [$this->name];
        
        if ($this->city && $this->country) {
            $parts[] = "({$this->city}, {$this->country})";
        } elseif ($this->country) {
            $parts[] = "({$this->country})";
        }

        return implode(' ', $parts);
    }

    /**
     * Check if organization is in specific timezone
     */
    public function isInTimezone(string $timezone): bool
    {
        return $this->timezone === $timezone;
    }

    /**
     * Get localized date format
     */
    public function getLocalizedDateFormat(): string
    {
        $formats = [
            'Y-m-d' => 'YYYY-MM-DD',
            'm/d/Y' => 'MM/DD/YYYY',
            'd/m/Y' => 'DD/MM/YYYY',
            'd-m-Y' => 'DD-MM-YYYY',
            'Y/m/d' => 'YYYY/MM/DD',
        ];

        return $formats[$this->date_format] ?? 'YYYY-MM-DD';
    }

    /**
     * Get localized time format
     */
    public function getLocalizedTimeFormat(): string
    {
        $formats = [
            'H:i:s' => '24-hour',
            'h:i:s A' => '12-hour',
            'H:i' => '24-hour (no seconds)',
            'h:i A' => '12-hour (no seconds)',
        ];

        return $formats[$this->time_format] ?? '24-hour';
    }

    /**
     * Format date according to organization preferences
     */
    public function formatDate($date): string
    {
        if (!$date) {
            return '';
        }

        return $date->setTimezone($this->timezone)->format($this->date_format);
    }

    /**
     * Format datetime according to organization preferences
     */
    public function formatDateTime($datetime): string
    {
        if (!$datetime) {
            return '';
        }

        return $datetime->setTimezone($this->timezone)
                       ->format($this->date_format . ' ' . $this->time_format);
    }

    /**
     * Get organization statistics
     */
    public function getStats(): array
    {
        return [
            'users_count' => $this->users()->count(),
            'active_users_count' => $this->users()->where('is_active', true)->count(),
            'created_at' => $this->created_at,
            'last_activity' => $this->users()->max('last_login_at'),
        ];
    }
}

