<?php

namespace App\Shared\Contracts;

/**
 * Base service interface that all business logic services should implement
 */
interface ServiceInterface
{
    /**
     * Get the service name/identifier
     */
    public function getName(): string;

    /**
     * Get the service version
     */
    public function getVersion(): string;

    /**
     * Check if the service is healthy and operational
     */
    public function isHealthy(): bool;

    /**
     * Get service dependencies
     */
    public function getDependencies(): array;

    /**
     * Initialize the service
     */
    public function initialize(): void;

    /**
     * Cleanup service resources
     */
    public function cleanup(): void;
}
