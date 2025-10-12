<?php

namespace App\Services\Core;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Base Service Class
 *
 * Provides common service patterns and functionality
 * for all domain services in the application.
 */
abstract class BaseService
{
    /**
     * The model instance
     */
    protected Model $model;

    /**
     * Create a new service instance
     */
    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    /**
     * Find a record by ID
     */
    public function find(string $id): ?Model
    {
        return $this->model->find($id);
    }

    /**
     * Find a record by ID or fail
     */
    public function findOrFail(string $id): Model
    {
        return $this->model->findOrFail($id);
    }

    /**
     * Get all records with optional filters
     */
    public function findAll(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        $this->applyFilters($query, $filters);

        return $query->get();
    }

    /**
     * Get paginated records with optional filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        $this->applyFilters($query, $filters);

        return $query->paginate($perPage);
    }

    /**
     * Create a new record
     */
    public function create(array $data): Model
    {
        $this->validateData($data, 'create');

        return $this->model->create($data);
    }

    /**
     * Update an existing record
     */
    public function update(string $id, array $data): Model
    {
        $record = $this->findOrFail($id);

        $this->validateData($data, 'update');

        $record->update($data);

        return $record->fresh();
    }

    /**
     * Delete a record
     */
    public function delete(string $id): bool
    {
        $record = $this->findOrFail($id);

        return $record->delete();
    }

    /**
     * Apply filters to query
     */
    protected function applyFilters($query, array $filters): void
    {
        foreach ($filters as $key => $value) {
            if ($value !== null && $value !== '') {
                $this->applyFilter($query, $key, $value);
            }
        }
    }

    /**
     * Apply individual filter
     */
    protected function applyFilter($query, string $key, $value): void
    {
        // Default implementation - can be overridden in child classes
        if (method_exists($this, 'filter'.ucfirst($key))) {
            $this->{'filter'.ucfirst($key)}($query, $value);
        } else {
            $query->where($key, $value);
        }
    }

    /**
     * Validate data before create/update
     */
    protected function validateData(array $data, string $operation): void
    {
        // Override in child classes for specific validation
    }

    /**
     * Get the model class name
     */
    public function getModelClass(): string
    {
        return get_class($this->model);
    }

    /**
     * Get fresh model instance
     */
    protected function getFreshModel(): Model
    {
        return new ($this->getModelClass());
    }
}
