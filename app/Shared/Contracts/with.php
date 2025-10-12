<?php

namespace App\Shared\Contracts;

use Illuminate\Database\Eloquent\Collection;

/**
 * Enhanced Repository Interface
 *
 * Extends the base repository interface with advanced functionality
 * including bulk operations, caching, and event handling.
 */
interface EnhancedRepositoryInterface extends RepositoryInterface
{
    /**
     * Bulk create multiple records
     */
    public function bulkCreate(array $data): Collection;

    /**
     * Bulk update multiple records
     */
    public function bulkUpdate(array $data): int;

    /**
     * Bulk delete multiple records
     */
    public function bulkDelete(array $ids): int;

    /**
     * Find records by filters
     */
    public function findByFilters(array $filters): Collection;

    /**
     * Search records by term in specified fields
     */
    public function searchByTerm(string $term, array $fields = []): Collection;

    /**
     * Enable caching for the next query
     */
    public function remember(int $minutes = 60): self;

    /**
     * Forget cached data
     */
    public function forgetCache(?string $key = null): void;

    /**
     * Enable or disable event firing
     */
    public function withEvents(bool $enabled = true): self;

    /**
     * Check if repository is connected
     */
    public function isConnected(): bool;

    /**
     * Get repository statistics
     */
    public function getStats(): array;

    /**
     * Validate data before operations
     */
    public function validate(array $data, array $rules = []): array;

    /**
     * Get repository configuration
     */
    public function getConfig(): array;

    /**
     * Handle repository events
     */
    public function handleEvent(string $event, array $data = []): void;
}
