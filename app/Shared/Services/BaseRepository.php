<?php

namespace App\Shared\Services;

use App\Shared\Contracts\RepositoryInterface;
use Exception;
use Illuminate\Container\Container as App;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

/**
 * Laravel Eloquent Repository Pattern Base Implementation
 *
 * This base repository follows Laravel's Eloquent Repository pattern
 * with advanced caching, query optimization, and relationship management
 */
abstract class BaseRepository implements RepositoryInterface
{
    protected App $app;

    protected Model $model;

    protected Builder $query;

    protected array $with = [];

    protected array $scopes = [];

    protected array $orderBy = [];

    protected ?int $limit = null;

    protected bool $cacheEnabled = false;

    protected int $cacheTTL = 3600; // 1 hour

    protected array $cacheTags = [];

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->makeModel();
        $this->resetQuery();
        $this->initializeCache();
    }

    /**
     * Specify Model class name
     */
    abstract public function model(): string;

    /**
     * Create model instance using Laravel's service container
     */
    public function makeModel(): Model
    {
        $model = $this->app->make($this->model());

        if (! $model instanceof Model) {
            throw new Exception("Class {$this->model()} must be an instance of Illuminate\\Database\\Eloquent\\Model");
        }

        $this->model = $model;

        return $this->model;
    }

    /**
     * Initialize cache configuration
     */
    protected function initializeCache(): void
    {
        $modelClass = get_class($this->model);
        $this->cacheTags = [
            strtolower(class_basename($modelClass)),
            'repository',
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function find(int $id): ?Model
    {
        if ($this->cacheEnabled) {
            $cacheKey = $this->getCacheKey('find', ['id' => $id]);

            return Cache::tags($this->cacheTags)->remember($cacheKey, $this->cacheTTL, function () use ($id) {
                return $this->query->find($id);
            });
        }

        return $this->query->find($id);
    }

    /**
     * {@inheritdoc}
     */
    public function findOrFail(int $id): Model
    {
        if ($this->cacheEnabled) {
            $cacheKey = $this->getCacheKey('findOrFail', ['id' => $id]);

            return Cache::tags($this->cacheTags)->remember($cacheKey, $this->cacheTTL, function () use ($id) {
                return $this->query->findOrFail($id);
            });
        }

        return $this->query->findOrFail($id);
    }

    /**
     * {@inheritdoc}
     */
    public function findBy(array $criteria): Collection
    {
        $query = $this->applyCriteria($this->query, $criteria);

        if ($this->cacheEnabled) {
            $cacheKey = $this->getCacheKey('findBy', $criteria);

            return Cache::tags($this->cacheTags)->remember($cacheKey, $this->cacheTTL, function () use ($query) {
                return $query->get();
            });
        }

        return $query->get();
    }

    /**
     * {@inheritdoc}
     */
    public function findOneBy(array $criteria): ?Model
    {
        $query = $this->applyCriteria($this->query, $criteria);

        if ($this->cacheEnabled) {
            $cacheKey = $this->getCacheKey('findOneBy', $criteria);

            return Cache::tags($this->cacheTags)->remember($cacheKey, $this->cacheTTL, function () use ($query) {
                return $query->first();
            });
        }

        return $query->first();
    }

    /**
     * {@inheritdoc}
     */
    public function all(): Collection
    {
        if ($this->cacheEnabled) {
            $cacheKey = $this->getCacheKey('all');

            return Cache::tags($this->cacheTags)->remember($cacheKey, $this->cacheTTL, function () {
                return $this->query->get();
            });
        }

        return $this->query->get();
    }

    /**
     * {@inheritdoc}
     */
    public function paginate(int $perPage = 15, array $criteria = []): LengthAwarePaginator
    {
        $query = $this->applyCriteria($this->query, $criteria);

        return $query->paginate($perPage);
    }

    /**
     * {@inheritdoc}
     */
    public function create(array $data): Model
    {
        $model = $this->model->create($data);
        $this->clearCache();

        return $model;
    }

    /**
     * {@inheritdoc}
     */
    public function update(int $id, array $data): Model
    {
        $model = $this->findOrFail($id);
        $model->update($data);
        $this->clearCache();

        return $model->fresh();
    }

    /**
     * {@inheritdoc}
     */
    public function delete(int $id): bool
    {
        $model = $this->findOrFail($id);
        $result = $model->delete();
        $this->clearCache();

        return $result;
    }

    /**
     * {@inheritdoc}
     */
    public function count(array $criteria = []): int
    {
        $query = $this->applyCriteria($this->query, $criteria);

        if ($this->cacheEnabled) {
            $cacheKey = $this->getCacheKey('count', $criteria);

            return Cache::tags($this->cacheTags)->remember($cacheKey, $this->cacheTTL, function () use ($query) {
                return $query->count();
            });
        }

        return $query->count();
    }

    /**
     * {@inheritdoc}
     */
    public function exists(array $criteria): bool
    {
        $query = $this->applyCriteria($this->query, $criteria);

        if ($this->cacheEnabled) {
            $cacheKey = $this->getCacheKey('exists', $criteria);

            return Cache::tags($this->cacheTags)->remember($cacheKey, $this->cacheTTL, function () use ($query) {
                return $query->exists();
            });
        }

        return $query->exists();
    }

    /**
     * {@inheritdoc}
     */
    public function with(array $relations): self
    {
        $this->with = array_merge($this->with, $relations);
        $this->query = $this->query->with($relations);

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function scope(string $scope, ...$parameters): self
    {
        $this->scopes[] = ['scope' => $scope, 'parameters' => $parameters];
        $this->query = $this->query->{$scope}(...$parameters);

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function orderBy(string $column, string $direction = 'asc'): self
    {
        $this->orderBy[] = ['column' => $column, 'direction' => $direction];
        $this->query = $this->query->orderBy($column, $direction);

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function limit(int $limit): self
    {
        $this->limit = $limit;
        $this->query = $this->query->limit($limit);

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function getModel(): Model
    {
        return $this->model;
    }

    /**
     * {@inheritdoc}
     */
    public function setModel(Model $model): self
    {
        $this->model = $model;
        $this->resetQuery();

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function resetQuery(): self
    {
        $this->query = $this->model->newQuery();
        $this->with = [];
        $this->scopes = [];
        $this->orderBy = [];
        $this->limit = null;

        return $this;
    }

    /**
     * Apply criteria to query
     */
    protected function applyCriteria(Builder $query, array $criteria): Builder
    {
        foreach ($criteria as $field => $value) {
            if (is_array($value)) {
                $query = $this->applyArrayCriteria($query, $field, $value);
            } else {
                $query = $query->where($field, $value);
            }
        }

        return $query;
    }

    /**
     * Apply array criteria to query
     */
    protected function applyArrayCriteria(Builder $query, string $field, array $value): Builder
    {
        if (isset($value['operator']) && isset($value['value'])) {
            return $query->where($field, $value['operator'], $value['value']);
        }

        if (isset($value['in'])) {
            return $query->whereIn($field, $value['in']);
        }

        if (isset($value['not_in'])) {
            return $query->whereNotIn($field, $value['not_in']);
        }

        if (isset($value['between'])) {
            return $query->whereBetween($field, $value['between']);
        }

        if (isset($value['not_between'])) {
            return $query->whereNotBetween($field, $value['not_between']);
        }

        if (isset($value['null'])) {
            return $value['null'] ? $query->whereNull($field) : $query->whereNotNull($field);
        }

        if (isset($value['like'])) {
            return $query->where($field, 'LIKE', $value['like']);
        }

        // Default to whereIn for simple arrays
        return $query->whereIn($field, $value);
    }

    /**
     * Enable caching for this repository
     */
    public function enableCache(?int $ttl = null, array $tags = []): self
    {
        $this->cacheEnabled = true;

        if ($ttl !== null) {
            $this->cacheTTL = $ttl;
        }

        if (! empty($tags)) {
            $this->cacheTags = array_merge($this->cacheTags, $tags);
        }

        return $this;
    }

    /**
     * Disable caching for this repository
     */
    public function disableCache(): self
    {
        $this->cacheEnabled = false;

        return $this;
    }

    /**
     * Clear cache for this repository
     */
    public function clearCache(): void
    {
        if (! empty($this->cacheTags)) {
            Cache::tags($this->cacheTags)->flush();
        }
    }

    /**
     * Get cache key for method and parameters
     */
    protected function getCacheKey(string $method, array $parameters = []): string
    {
        $modelClass = get_class($this->model);
        $className = strtolower(class_basename($modelClass));
        $parameterHash = md5(serialize($parameters));

        return "repository:{$className}:{$method}:{$parameterHash}";
    }

    /**
     * Bulk insert records
     */
    public function bulkInsert(array $data): bool
    {
        $result = $this->model->insert($data);
        $this->clearCache();

        return $result;
    }

    /**
     * Bulk update records
     */
    public function bulkUpdate(array $criteria, array $data): int
    {
        $query = $this->applyCriteria($this->model->newQuery(), $criteria);
        $result = $query->update($data);
        $this->clearCache();

        return $result;
    }

    /**
     * Bulk delete records
     */
    public function bulkDelete(array $criteria): int
    {
        $query = $this->applyCriteria($this->model->newQuery(), $criteria);
        $result = $query->delete();
        $this->clearCache();

        return $result;
    }

    /**
     * Get repository statistics
     */
    public function getStats(): array
    {
        return [
            'model' => get_class($this->model),
            'cache_enabled' => $this->cacheEnabled,
            'cache_ttl' => $this->cacheTTL,
            'cache_tags' => $this->cacheTags,
            'total_records' => $this->count(),
        ];
    }
}
