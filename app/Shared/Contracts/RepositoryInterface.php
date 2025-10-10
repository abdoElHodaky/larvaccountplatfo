<?php

namespace App\Shared\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Base repository interface for data access layer
 */
interface RepositoryInterface
{
    /**
     * Find a record by ID
     */
    public function find(int $id): ?Model;

    /**
     * Find a record by ID or fail
     */
    public function findOrFail(int $id): Model;

    /**
     * Find records by criteria
     */
    public function findBy(array $criteria): Collection;

    /**
     * Find one record by criteria
     */
    public function findOneBy(array $criteria): ?Model;

    /**
     * Get all records
     */
    public function all(): Collection;

    /**
     * Get paginated records
     */
    public function paginate(int $perPage = 15, array $criteria = []): LengthAwarePaginator;

    /**
     * Create a new record
     */
    public function create(array $data): Model;

    /**
     * Update a record
     */
    public function update(int $id, array $data): Model;

    /**
     * Delete a record
     */
    public function delete(int $id): bool;

    /**
     * Count records by criteria
     */
    public function count(array $criteria = []): int;

    /**
     * Check if record exists
     */
    public function exists(array $criteria): bool;

    /**
     * Get records with relationships
     */
    public function with(array $relations): self;

    /**
     * Apply scopes to query
     */
    public function scope(string $scope, ...$parameters): self;

    /**
     * Order results
     */
    public function orderBy(string $column, string $direction = 'asc'): self;

    /**
     * Limit results
     */
    public function limit(int $limit): self;

    /**
     * Get the model instance
     */
    public function getModel(): Model;

    /**
     * Set the model instance
     */
    public function setModel(Model $model): self;

    /**
     * Reset query builder
     */
    public function resetQuery(): self;
}
