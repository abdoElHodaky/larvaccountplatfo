<?php

namespace App\Shared\Services\Base;

abstract class BaseService
{
    /**
     * Validate input data
     */
    protected function validateData(array $data, array $rules): array
    {
        return validator($data, $rules)->validate();
    }

    /**
     * Handle common error responses
     */
    protected function handleError(\Exception $e): array
    {
        return [
            'success' => false,
            'message' => $e->getMessage(),
            'error' => $e->getCode()
        ];
    }

    /**
     * Handle success responses
     */
    protected function handleSuccess($data = null, string $message = 'Operation successful'): array
    {
        return [
            'success' => true,
            'message' => $message,
            'data' => $data
        ];
    }

    /**
     * Log service operations
     */
    protected function logOperation(string $operation, array $context = []): void
    {
        logger()->info("Service operation: $operation", $context);
    }
}
