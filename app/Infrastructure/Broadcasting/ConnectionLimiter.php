<?php

namespace App\Broadcasting;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ConnectionLimiter
{
    private const MAX_CONNECTIONS_PER_USER = 5;

    private const MAX_CONNECTIONS_PER_ORG = 100;

    private const CONNECTION_TTL = 3600; // 1 hour

    /**
     * Check if user can connect
     */
    public static function canConnect(int $userId, int $organizationId): bool
    {
        $userConnections = self::getUserConnections($userId);
        $orgConnections = self::getOrgConnections($organizationId);

        if ($userConnections >= self::MAX_CONNECTIONS_PER_USER) {
            Log::warning('User connection limit exceeded', [
                'user_id' => $userId,
                'connections' => $userConnections,
            ]);

            return false;
        }

        if ($orgConnections >= self::MAX_CONNECTIONS_PER_ORG) {
            Log::warning('Organization connection limit exceeded', [
                'organization_id' => $organizationId,
                'connections' => $orgConnections,
            ]);

            return false;
        }

        return true;
    }

    /**
     * Register new connection
     */
    public static function addConnection(int $userId, int $organizationId, string $socketId): void
    {
        $userKey = "ws_connections:user:{$userId}";
        $orgKey = "ws_connections:org:{$organizationId}";
        $socketKey = "ws_socket:{$socketId}";

        // Store connection info
        Cache::put($socketKey, [
            'user_id' => $userId,
            'organization_id' => $organizationId,
            'connected_at' => now(),
        ], self::CONNECTION_TTL);

        // Increment counters
        Cache::increment($userKey, 1);
        Cache::increment($orgKey, 1);

        // Set TTL for counters
        Cache::put($userKey, Cache::get($userKey, 0), self::CONNECTION_TTL);
        Cache::put($orgKey, Cache::get($orgKey, 0), self::CONNECTION_TTL);
    }

    /**
     * Remove connection
     */
    public static function removeConnection(string $socketId): void
    {
        $socketKey = "ws_socket:{$socketId}";
        $connectionInfo = Cache::get($socketKey);

        if ($connectionInfo) {
            $userKey = "ws_connections:user:{$connectionInfo['user_id']}";
            $orgKey = "ws_connections:org:{$connectionInfo['organization_id']}";

            // Decrement counters
            Cache::decrement($userKey, 1);
            Cache::decrement($orgKey, 1);

            // Remove socket info
            Cache::forget($socketKey);
        }
    }

    /**
     * Get user connection count
     */
    private static function getUserConnections(int $userId): int
    {
        return Cache::get("ws_connections:user:{$userId}", 0);
    }

    /**
     * Get organization connection count
     */
    private static function getOrgConnections(int $organizationId): int
    {
        return Cache::get("ws_connections:org:{$organizationId}", 0);
    }
}
