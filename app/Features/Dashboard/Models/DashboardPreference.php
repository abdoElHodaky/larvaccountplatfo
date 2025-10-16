<?php

namespace App\Features\Dashboard\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DashboardPreference extends Model
{
    protected $fillable = [
        'organization_id',
        'user_id',
        'auto_refresh',
        'refresh_interval',
        'show_animations',
        'compact_mode',
        'show_tooltips',
        'currency_format',
        'date_format',
        'time_format',
        'timezone',
        'language',
        'email_alerts',
        'browser_notifications',
        'sound_alerts',
        'share_analytics',
        'track_usage',
        'high_contrast',
        'large_text',
        'reduced_motion',
        'screen_reader_support',
    ];

    protected $casts = [
        'auto_refresh' => 'boolean',
        'refresh_interval' => 'integer',
        'show_animations' => 'boolean',
        'compact_mode' => 'boolean',
        'show_tooltips' => 'boolean',
        'email_alerts' => 'boolean',
        'browser_notifications' => 'boolean',
        'sound_alerts' => 'boolean',
        'share_analytics' => 'boolean',
        'track_usage' => 'boolean',
        'high_contrast' => 'boolean',
        'large_text' => 'boolean',
        'reduced_motion' => 'boolean',
        'screen_reader_support' => 'boolean',
    ];

    /**
     * Get the organization that owns the preferences
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\App\Shared\Models\Organization::class);
    }

    /**
     * Get the user that owns the preferences
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Shared\Models\User::class);
    }
}

