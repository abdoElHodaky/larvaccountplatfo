<?php

namespace App\Features\Dashboard\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DashboardUpdated
{
    use Dispatchable, SerializesModels;

    public int $organizationId;
    public int $userId;
    public array $changes;
    public string $updateType;

    public function __construct(int $organizationId, int $userId, array $changes, string $updateType = 'layout')
    {
        $this->organizationId = $organizationId;
        $this->userId = $userId;
        $this->changes = $changes;
        $this->updateType = $updateType;
    }
}

