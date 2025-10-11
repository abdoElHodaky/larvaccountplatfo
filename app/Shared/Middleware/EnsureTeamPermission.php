<?php

namespace App\Shared\Middleware;

use App\Models\Team;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTeamPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Get current team from request or user's current team
        $team = $this->getCurrentTeam($request, $user);

        if (! $team) {
            return response()->json(['message' => 'No team context available.'], 400);
        }

        // Check if user belongs to the team
        if (! $team->hasUser($user)) {
            return response()->json(['message' => 'User is not a member of this team.'], 403);
        }

        // Check if user has any of the required permissions in this team
        $hasPermission = false;
        foreach ($permissions as $permission) {
            if ($team->userHasPermission($user, $permission)) {
                $hasPermission = true;
                break;
            }
        }

        if (! $hasPermission) {
            return response()->json([
                'message' => 'Insufficient team permissions.',
                'required_permissions' => $permissions,
                'team_permissions' => $team->getTeamPermissions(),
                'user_permissions' => $team->getUserPermissions($user),
            ], 403);
        }

        // Add team to request for use in controllers
        $request->merge(['current_team' => $team]);

        return $next($request);
    }

    /**
     * Get the current team from request or user context.
     */
    private function getCurrentTeam(Request $request, $user): ?Team
    {
        // Try to get team from route parameter
        if ($request->route('team')) {
            $teamId = $request->route('team');

            return Team::find($teamId);
        }

        // Try to get team from request header
        if ($request->header('X-Team-ID')) {
            $teamId = $request->header('X-Team-ID');

            return Team::find($teamId);
        }

        // Try to get team from request parameter
        if ($request->input('team_id')) {
            $teamId = $request->input('team_id');

            return Team::find($teamId);
        }

        // Fall back to user's current team
        return $user->currentTeam;
    }
}
