<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

abstract class BaseApiController extends Controller
{
    /**
     * Return a successful response
     */
    protected function success($data = null, string $message = 'Request successful', int $statusCode = 200): JsonResponse
    {
        $response = [
            'success' => true,
            'status_code' => $statusCode,
            'message' => $message,
            'timestamp' => now()->toISOString(),
        ];

        if (!is_null($data)) {
            $response['data'] = $data;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return a paginated successful response
     */
    protected function successWithPagination(LengthAwarePaginator $paginator, string $message = 'Request successful'): JsonResponse
    {
        return $this->success([
            'items' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
                'has_more_pages' => $paginator->hasMorePages(),
            ]
        ], $message);
    }

    /**
     * Return an error response
     */
    protected function error(string $message, int $statusCode = 400, $details = null, string $code = null): JsonResponse
    {
        $response = [
            'success' => false,
            'status_code' => $statusCode,
            'timestamp' => now()->toISOString(),
            'error' => [
                'message' => $message,
                'code' => $code ?? $statusCode,
            ]
        ];

        if (!is_null($details)) {
            $response['error']['details'] = $details;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return a validation error response
     */
    protected function validationError($errors, string $message = 'Validation failed'): JsonResponse
    {
        return $this->error($message, 422, $errors, 'VALIDATION_ERROR');
    }

    /**
     * Return a not found error response
     */
    protected function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return $this->error($message, 404, null, 'NOT_FOUND');
    }

    /**
     * Return an unauthorized error response
     */
    protected function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->error($message, 401, null, 'UNAUTHORIZED');
    }

    /**
     * Return a forbidden error response
     */
    protected function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return $this->error($message, 403, null, 'FORBIDDEN');
    }

    /**
     * Return a server error response
     */
    protected function serverError(string $message = 'Internal server error'): JsonResponse
    {
        return $this->error($message, 500, null, 'SERVER_ERROR');
    }

    /**
     * Return a created response
     */
    protected function created($data = null, string $message = 'Resource created successfully'): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    /**
     * Return a no content response
     */
    protected function noContent(string $message = 'Request successful'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'status_code' => 204,
            'message' => $message,
            'timestamp' => now()->toISOString(),
        ], 204);
    }

    /**
     * Apply filters to a query based on request parameters
     */
    protected function applyFilters($query, Request $request, array $allowedFilters = []): mixed
    {
        foreach ($allowedFilters as $filter => $column) {
            if ($request->has($filter) && !is_null($request->get($filter))) {
                $value = $request->get($filter);
                
                if (is_string($column)) {
                    // Simple column filter
                    $query->where($column, $value);
                } elseif (is_callable($column)) {
                    // Custom filter function
                    $column($query, $value);
                }
            }
        }

        return $query;
    }

    /**
     * Apply search to a query
     */
    protected function applySearch($query, Request $request, array $searchableColumns = []): mixed
    {
        if ($request->has('search') && !empty($request->get('search'))) {
            $searchTerm = $request->get('search');
            
            $query->where(function ($q) use ($searchableColumns, $searchTerm) {
                foreach ($searchableColumns as $column) {
                    $q->orWhere($column, 'LIKE', "%{$searchTerm}%");
                }
            });
        }

        return $query;
    }

    /**
     * Apply sorting to a query
     */
    protected function applySorting($query, Request $request, array $allowedSortColumns = [], string $defaultSort = 'created_at', string $defaultDirection = 'desc'): mixed
    {
        $sortBy = $request->get('sort_by', $defaultSort);
        $sortDirection = $request->get('sort_direction', $defaultDirection);

        // Validate sort direction
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = $defaultDirection;
        }

        // Validate sort column
        if (!empty($allowedSortColumns) && !in_array($sortBy, $allowedSortColumns)) {
            $sortBy = $defaultSort;
        }

        return $query->orderBy($sortBy, $sortDirection);
    }

    /**
     * Get pagination parameters from request
     */
    protected function getPaginationParams(Request $request): array
    {
        $perPage = (int) $request->get('per_page', 15);
        $page = (int) $request->get('page', 1);

        // Limit per_page to reasonable bounds
        $perPage = max(1, min($perPage, 100));
        $page = max(1, $page);

        return [$perPage, $page];
    }

    /**
     * Transform data using a transformer class or callback
     */
    protected function transform($data, $transformer = null)
    {
        if (is_null($transformer)) {
            return $data;
        }

        if (is_callable($transformer)) {
            return $transformer($data);
        }

        if (is_string($transformer) && class_exists($transformer)) {
            return (new $transformer)->transform($data);
        }

        return $data;
    }

    /**
     * Handle common API exceptions
     */
    protected function handleException(\Throwable $e): JsonResponse
    {
        if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->notFound('Resource not found');
        }

        if ($e instanceof \Illuminate\Validation\ValidationException) {
            return $this->validationError($e->errors(), $e->getMessage());
        }

        if ($e instanceof \Illuminate\Auth\AuthenticationException) {
            return $this->unauthorized('Authentication required');
        }

        if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
            return $this->forbidden('Access denied');
        }

        // Log the exception for debugging
        \Log::error('API Exception: ' . $e->getMessage(), [
            'exception' => $e,
            'trace' => $e->getTraceAsString()
        ]);

        return $this->serverError('An unexpected error occurred');
    }
}
