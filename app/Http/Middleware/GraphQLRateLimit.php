<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class GraphQLRateLimit
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Simple rate limiting for GraphQL
        $key = 'graphql:'.($request->user()?->id ?? $request->ip());

        if (RateLimiter::tooManyAttempts($key, 100)) { // 100 requests per minute
            return response()->json([
                'errors' => [
                    [
                        'message' => 'Too many requests. Please try again later.',
                        'extensions' => [
                            'category' => 'rate_limit',
                            'retry_after' => RateLimiter::availableIn($key),
                        ],
                    ],
                ],
            ], 429);
        }

        RateLimiter::hit($key, 60); // 1 minute window

        return $next($request);
    }
}
