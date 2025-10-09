<?php

namespace App\Features\Accounting\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountingPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Check if user has any of the required permissions
        if (!$user->hasAnyAccountingPermission($permissions)) {
            return response()->json([
                'message' => 'Insufficient permissions.',
                'required_permissions' => $permissions,
                'user_permissions' => $user->getAccountingPermissions(),
            ], 403);
        }

        return $next($request);
    }
}
