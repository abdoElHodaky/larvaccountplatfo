<?php

namespace App\Features\Dashboard\Controllers;

use App\Http\Controllers\Controller;
use App\Features\Dashboard\Events\DashboardUpdated;
use App\Features\Dashboard\Events\MetricsUpdated;
use App\Features\Dashboard\Services\DashboardOrchestrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * WebSocket Controller for Dashboard Real-time Features
 * 
 * Handles WebSocket connections, authentication, and real-time dashboard updates.
 * Integrates with Laravel Reverb for WebSocket server functionality.
 */
class WebSocketController extends Controller
{
    public function __construct(
        private DashboardOrchestrationService $orchestrationService
    ) {}

    /**
     * Authenticate WebSocket connection
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function authenticate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'socket_id' => 'required|string',
            'channel_name' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid request parameters',
                'details' => $validator->errors()
            ], 400);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $socketId = $request->input('socket_id');
        $channelName = $request->input('channel_name');

        // Validate channel access
        if (!$this->canAccessChannel($user, $channelName)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Generate authentication signature for private channels
        $auth = $this->generateAuthSignature($socketId, $channelName, $user);

        Log::info('WebSocket authentication successful', [
            'user_id' => $user->id,
            'channel' => $channelName,
            'socket_id' => $socketId
        ]);

        return response()->json([
            'auth' => $auth,
            'channel_data' => json_encode([
                'user_id' => $user->id,
                'user_info' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ]
            ])
        ]);
    }

    /**
     * Subscribe to dashboard channel
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'channel' => 'required|string',
            'organization_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid subscription parameters',
                'details' => $validator->errors()
            ], 400);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $organizationId = $request->input('organization_id');
        $channel = $request->input('channel');

        // Validate organization access
        if (!$user->hasAccessToOrganization($organizationId)) {
            return response()->json(['error' => 'Access denied to organization'], 403);
        }

        // Subscribe to dashboard updates
        $subscriptionData = [
            'channel' => $channel,
            'organization_id' => $organizationId,
            'user_id' => $user->id,
            'subscribed_at' => now()->toISOString(),
        ];

        Log::info('Dashboard WebSocket subscription', $subscriptionData);

        return response()->json([
            'success' => true,
            'subscription' => $subscriptionData,
            'available_events' => [
                'dashboard.updated',
                'widget.created',
                'widget.configured',
                'metrics.updated',
            ]
        ]);
    }

    /**
     * Unsubscribe from dashboard channel
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $channel = $request->input('channel');
        $organizationId = $request->input('organization_id');

        Log::info('Dashboard WebSocket unsubscription', [
            'channel' => $channel,
            'organization_id' => $organizationId,
            'user_id' => $user->id,
            'unsubscribed_at' => now()->toISOString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Successfully unsubscribed from dashboard updates'
        ]);
    }

    /**
     * Trigger dashboard update event
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function triggerUpdate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'organization_id' => 'required|integer',
            'update_type' => 'required|string|in:layout,widgets,metrics,settings',
            'changes' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid update parameters',
                'details' => $validator->errors()
            ], 400);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $organizationId = $request->input('organization_id');
        $updateType = $request->input('update_type');
        $changes = $request->input('changes');

        // Validate organization access
        if (!$user->hasAccessToOrganization($organizationId)) {
            return response()->json(['error' => 'Access denied to organization'], 403);
        }

        // Trigger dashboard update event
        event(new DashboardUpdated($organizationId, $user->id, $changes, $updateType));

        Log::info('Dashboard update triggered via WebSocket', [
            'organization_id' => $organizationId,
            'user_id' => $user->id,
            'update_type' => $updateType,
            'changes_count' => count($changes),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard update broadcasted successfully',
            'update_type' => $updateType,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Trigger metrics update event
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function triggerMetricsUpdate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'organization_id' => 'required|integer',
            'metric_type' => 'required|string|in:general,accounting,inventory,banking',
            'metrics' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid metrics parameters',
                'details' => $validator->errors()
            ], 400);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $organizationId = $request->input('organization_id');
        $metricType = $request->input('metric_type');
        $metrics = $request->input('metrics');

        // Validate organization access
        if (!$user->hasAccessToOrganization($organizationId)) {
            return response()->json(['error' => 'Access denied to organization'], 403);
        }

        // Trigger metrics update event
        event(new MetricsUpdated($metrics, $organizationId, $metricType));

        Log::info('Metrics update triggered via WebSocket', [
            'organization_id' => $organizationId,
            'user_id' => $user->id,
            'metric_type' => $metricType,
            'metrics_count' => count($metrics),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Metrics update broadcasted successfully',
            'metric_type' => $metricType,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get connection status and statistics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getConnectionStatus(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $organizationId = $request->input('organization_id');

        return response()->json([
            'status' => 'connected',
            'user_id' => $user->id,
            'organization_id' => $organizationId,
            'server_time' => now()->toISOString(),
            'websocket_server' => config('broadcasting.connections.reverb.host', 'localhost'),
            'available_channels' => [
                "dashboard.{$organizationId}",
                "organization.{$organizationId}",
            ],
        ]);
    }

    /**
     * Check if user can access a specific channel
     * 
     * @param $user
     * @param string $channelName
     * @return bool
     */
    private function canAccessChannel($user, string $channelName): bool
    {
        // Extract organization ID from channel name
        if (preg_match('/dashboard\.(\d+)/', $channelName, $matches)) {
            $organizationId = (int) $matches[1];
            return $user->hasAccessToOrganization($organizationId);
        }

        if (preg_match('/organization\.(\d+)/', $channelName, $matches)) {
            $organizationId = (int) $matches[1];
            return $user->hasAccessToOrganization($organizationId);
        }

        // Default to deny access for unknown channel patterns
        return false;
    }

    /**
     * Generate authentication signature for WebSocket channels
     * 
     * @param string $socketId
     * @param string $channelName
     * @param $user
     * @return string
     */
    private function generateAuthSignature(string $socketId, string $channelName, $user): string
    {
        $appKey = config('broadcasting.connections.reverb.key');
        $appSecret = config('broadcasting.connections.reverb.secret');
        
        $stringToSign = $socketId . ':' . $channelName;
        
        return $appKey . ':' . hash_hmac('sha256', $stringToSign, $appSecret);
    }
}
