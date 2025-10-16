<?php

namespace App\Features\Dashboard\Events;

use App\Features\Dashboard\Models\DashboardWidget;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WidgetCreated
{
    use Dispatchable, SerializesModels;

    public DashboardWidget $widget;

    public function __construct(DashboardWidget $widget)
    {
        $this->widget = $widget;
    }
}

