<?php

namespace App\Features\Dashboard\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Features\Dashboard\Services\DashboardService;
use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Display the dashboard
     */
    public function index(): Response
    {
        $tenant = app('tenant');
        $user = Auth::user();

        if (!$tenant) {
            return redirect()->route('tenant.select');
        }

        // Get basic dashboard data
        $stats = $this->dashboardService->getDashboardStats($tenant->id);
        $recentActivity = $this->dashboardService->getRecentActivity($tenant->id);

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentActivity' => $recentActivity,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'user',
                'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
            ],
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo' => $tenant->logo,
                'subscription_status' => $tenant->subscription_status,
            ],
        ]);
    }

    /**
     * Get dashboard statistics (API endpoint)
     */
    public function stats(): JsonResponse
    {
        $tenant = app('tenant');
        $stats = $this->dashboardService->getDashboardStats($tenant->id);
        return response()->json($stats);
    }

    /**
     * Get recent activity (API endpoint)
     */
    public function recentActivity(): JsonResponse
    {
        $tenant = app('tenant');
        $activity = $this->dashboardService->getRecentActivity($tenant->id);
        return response()->json($activity);
    }
}
