<?php

namespace App\Features\Dashboard\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DashboardLayout extends Model
{
    protected $fillable = [
        'organization_id',
        'user_id',
        'grid_columns',
        'grid_rows',
        'widget_positions',
        'theme',
        'sidebar_collapsed',
        'header_visible',
        'footer_visible',
        'custom_css',
        'responsive_breakpoints',
    ];

    protected $casts = [
        'widget_positions' => 'array',
        'responsive_breakpoints' => 'array',
        'sidebar_collapsed' => 'boolean',
        'header_visible' => 'boolean',
        'footer_visible' => 'boolean',
        'grid_columns' => 'integer',
    ];

    /**
     * Get the organization that owns the layout
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\App\Shared\Models\Organization::class);
    }

    /**
     * Get the user that owns the layout
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Shared\Models\User::class);
    }
}

