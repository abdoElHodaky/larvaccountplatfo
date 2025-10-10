<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ApiResponseMiddleware
{
    /**
     * Handle an incoming request and standardize API responses.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only process JSON responses for API routes
        if ($request->is('api/*') && $response instanceof JsonResponse) {
            $data = $response->getData(true);
            
            // If response is already standardized, return as is
            if (isset($data['success']) && isset($data['data'])) {
                return $response;
            }

            // Standardize the response format
            $standardizedData = $this->standardizeResponse($data, $response->getStatusCode());
            
            return response()->json($standardizedData, $response->getStatusCode());
        }

        return $response;
    }

    /**
     * Standardize API response format
     */
    private function standardizeResponse(array $data, int $statusCode): array
    {
        $isSuccess = $statusCode >= 200 && $statusCode < 300;
        
        $standardized = [
            'success' => $isSuccess,
            'status_code' => $statusCode,
            'timestamp' => now()->toISOString(),
        ];

        if ($isSuccess) {
            // Success response
            $standardized['data'] = $data;
            $standardized['message'] = $this->getSuccessMessage($statusCode);
        } else {
            // Error response
            $standardized['error'] = [
                'message' => $data['message'] ?? $this->getErrorMessage($statusCode),
                'code' => $data['code'] ?? $statusCode,
                'details' => $data['errors'] ?? $data['details'] ?? null,
            ];
            
            // Remove null details
            if (is_null($standardized['error']['details'])) {
                unset($standardized['error']['details']);
            }
        }

        return $standardized;
    }

    /**
     * Get success message based on status code
     */
    private function getSuccessMessage(int $statusCode): string
    {
        return match ($statusCode) {
            200 => 'Request successful',
            201 => 'Resource created successfully',
            202 => 'Request accepted',
            204 => 'Request successful, no content',
            default => 'Request successful',
        };
    }

    /**
     * Get error message based on status code
     */
    private function getErrorMessage(int $statusCode): string
    {
        return match ($statusCode) {
            400 => 'Bad request',
            401 => 'Unauthorized',
            403 => 'Forbidden',
            404 => 'Resource not found',
            405 => 'Method not allowed',
            409 => 'Conflict',
            422 => 'Validation failed',
            429 => 'Too many requests',
            500 => 'Internal server error',
            502 => 'Bad gateway',
            503 => 'Service unavailable',
            default => 'An error occurred',
        };
    }
}
