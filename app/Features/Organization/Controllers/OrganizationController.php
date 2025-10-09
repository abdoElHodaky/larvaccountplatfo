<?php

namespace App\Features\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Features\Organization\Services\OrganizationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    public function __construct(
        private OrganizationService $organizationService
    ) {}

    /**
     * Display organization overview page
     */
    public function index(): Response
    {
        $organization = auth()->user()->organization;
        $stats = $this->organizationService->getDashboardStats();
        $recentActivity = $this->organizationService->getRecentActivity($organization->id);
        
        return Inertia::render('Organization/Index', [
            'organization' => $organization,
            'stats' => $stats,
            'recentActivity' => $recentActivity,
        ]);
    }

    /**
     * Show the organization dashboard
     */
    public function dashboard(): Response
    {
        $stats = $this->organizationService->getDashboardStats();
        
        return Inertia::render('Organization/Dashboard', [
            'stats' => $stats,
            'organization' => auth()->user()->organization,
        ]);
    }

    /**
     * Show organization settings
     */
    public function settings(): Response
    {
        $organization = auth()->user()->organization;
        $settings = $this->organizationService->getSettings($organization->id);
        
        return Inertia::render('Organization/Settings', [
            'organization' => $organization,
            'settings' => $settings,
        ]);
    }

    /**
     * Update organization settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:1000',
            'settings' => 'sometimes|array',
        ]);

        $organization = auth()->user()->organization;
        $updated = $this->organizationService->updateSettings(
            $organization->id,
            $request->only(['name', 'description', 'settings'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Organization settings updated successfully',
            'organization' => $updated,
        ]);
    }

    /**
     * Show organization profile
     */
    public function profile(): Response
    {
        $organization = auth()->user()->organization;
        
        return Inertia::render('Organization/Profile', [
            'organization' => $organization,
        ]);
    }

    /**
     * Update organization profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'website' => 'nullable|url',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        $organization = auth()->user()->organization;
        $updated = $this->organizationService->updateProfile(
            $organization->id,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Organization profile updated successfully',
            'organization' => $updated,
        ]);
    }

    /**
     * Show organization teams
     */
    public function teams(): Response
    {
        $organization = auth()->user()->organization;
        $teams = $this->organizationService->getTeams($organization->id);
        
        return Inertia::render('Organization/Teams', [
            'teams' => $teams,
            'organization' => $organization,
        ]);
    }

    /**
     * Create a new team
     */
    public function createTeam(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $organization = auth()->user()->organization;
        $team = $this->organizationService->createTeam(
            $organization->id,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Team created successfully',
            'team' => $team,
        ]);
    }

    /**
     * Update a team
     */
    public function updateTeam(Request $request, $teamId): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:500',
        ]);

        $team = $this->organizationService->updateTeam(
            $teamId,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Team updated successfully',
            'team' => $team,
        ]);
    }

    /**
     * Delete a team
     */
    public function deleteTeam($teamId): JsonResponse
    {
        $this->organizationService->deleteTeam($teamId);

        return response()->json([
            'success' => true,
            'message' => 'Team deleted successfully',
        ]);
    }

    /**
     * Show organization users
     */
    public function users(): Response
    {
        $organization = auth()->user()->organization;
        $users = $this->organizationService->getUsers($organization->id);
        
        return Inertia::render('Organization/Users', [
            'users' => $users,
            'organization' => $organization,
        ]);
    }

    /**
     * Invite a user to the organization
     */
    public function inviteUser(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'role' => 'required|string|in:admin,manager,user',
            'team_ids' => 'sometimes|array',
            'team_ids.*' => 'exists:teams,id',
        ]);

        $organization = auth()->user()->organization;
        $invitation = $this->organizationService->inviteUser(
            $organization->id,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'User invitation sent successfully',
            'invitation' => $invitation,
        ]);
    }

    /**
     * Update user role
     */
    public function updateUserRole(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'role' => 'required|string|in:admin,manager,user',
        ]);

        $this->organizationService->updateUserRole(
            $userId,
            $request->input('role')
        );

        return response()->json([
            'success' => true,
            'message' => 'User role updated successfully',
        ]);
    }

    /**
     * Remove user from organization
     */
    public function removeUser($userId): JsonResponse
    {
        $this->organizationService->removeUser($userId);

        return response()->json([
            'success' => true,
            'message' => 'User removed from organization successfully',
        ]);
    }

    /**
     * Get organization statistics (API)
     */
    public function getStats(): JsonResponse
    {
        $organization = auth()->user()->organization;
        $stats = $this->organizationService->getDashboardStats($organization->id);

        return response()->json($stats);
    }

    /**
     * Get organization activity (API)
     */
    public function getActivity(): JsonResponse
    {
        $organization = auth()->user()->organization;
        $activity = $this->organizationService->getRecentActivity($organization->id);

        return response()->json($activity);
    }

    /**
     * Get organization members (API)
     */
    public function getMembers(): JsonResponse
    {
        $organization = auth()->user()->organization;
        $members = $this->organizationService->getUsers($organization->id);

        return response()->json($members);
    }

    /**
     * Get organization teams (API)
     */
    public function getTeams(): JsonResponse
    {
        $organization = auth()->user()->organization;
        $teams = $this->organizationService->getTeams($organization->id);

        return response()->json($teams);
    }
}
