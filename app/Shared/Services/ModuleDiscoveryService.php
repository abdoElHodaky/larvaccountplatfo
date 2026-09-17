<?php

namespace App\Shared\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Throwable;

class ModuleDiscoveryService
{
    /**
     * Registered modules.
     */
    protected $modules = [];

    /**
     * Module cache key.
     */
    protected $cacheKey = 'modules.registry';

    /**
     * Cache TTL in seconds.
     */
    protected $cacheTtl = 3600;

    /**
     * Register a module.
     */
    public function registerModule(array $moduleConfig): void
    {
        $this->modules[$moduleConfig['name']] = $moduleConfig;

        // Safely clear cache if the container/facade root is ready
        try {
            if (app()->bound('cache')) {
                Cache::forget($this->cacheKey);
            }
        } catch (Throwable $e) {
            // Suppress early-boot facade errors
        }
    }

    /**
     * Get all registered modules.
     */
    public function getModules(): Collection
    {
        return collect($this->modules);
    }

    /**
     * Get a specific module by name.
     */
    public function getModule(string $name): ?array
    {
        return $this->modules[$name] ?? null;
    }

    /**
     * Check if a module is registered.
     */
    public function isModuleRegistered(string $name): bool
    {
        return isset($this->modules[$name]);
    }

    /**
     * Get modules that support the current tenant's database strategy.
     */
    public function getModulesForCurrentTenant(): Collection
    {
        $tenant = null;
        try {
            if (app()->bound('tenant')) {
                $tenant = app('tenant');
            }
        } catch (Throwable $e) {
            // Fallback if tenant resolution fails early
        }

        if (! $tenant) {
            // No tenant context, return non-tenant-aware modules
            return $this->getModules()->filter(function ($module) {
                return ! $module['tenant_aware'];
            });
        }

        $strategy = $tenant->database_strategy ?? 'shared';

        return $this->getModules()->filter(function ($module) use ($strategy) {
            return in_array($strategy, $module['database_strategies'] ?? []);
        });
    }

    /**
     * Get tenant-aware modules.
     */
    public function getTenantAwareModules(): Collection
    {
        return $this->getModules()->filter(function ($module) {
            return $module['tenant_aware'] ?? false;
        });
    }

    /**
     * Get global (non-tenant-aware) modules.
     */
    public function getGlobalModules(): Collection
    {
        return $this->getModules()->filter(function ($module) {
            return ! ($module['tenant_aware'] ?? false);
        });
    }

    /**
     * Discover modules from filesystem.
     */
    public function discoverModules(?string $modulesPath = null): Collection
    {
        $modulesPath = $modulesPath ?: base_path('Modules');

        if (! File::exists($modulesPath)) {
            return collect();
        }

        $discoveredModules = collect();
        $directories = File::directories($modulesPath);

        foreach ($directories as $directory) {
            $moduleName = basename($directory);
            $providerPath = $directory.'/Providers/'.$moduleName.'ServiceProvider.php';

            if (File::exists($providerPath)) {
                $moduleConfig = $this->extractModuleConfig($directory, $moduleName);
                $discoveredModules->put($moduleName, $moduleConfig);
            }
        }

        return $discoveredModules;
    }

    /**
     * Extract module configuration from filesystem.
     */
    protected function extractModuleConfig(string $modulePath, string $moduleName): array
    {
        $configPath = $modulePath.'/module.json';
        $config = [];

        if (File::exists($configPath)) {
            $config = json_decode(File::get($configPath), true) ?? [];
        }

        return array_merge([
            'name' => $moduleName,
            'path' => $modulePath,
            'namespace' => "Modules\\{$moduleName}",
            'provider' => "Modules\\{$moduleName}\\Providers\\{$moduleName}ServiceProvider",
            'tenant_aware' => true,
            'database_strategies' => ['shared', 'dedicated', 'clustered'],
            'version' => '1.0.0',
            'description' => '',
            'author' => '',
            'dependencies' => [],
            'enabled' => true,
        ], $config);
    }

    /**
     * Load modules from cache or discover them safely.
     */
    public function loadModules(): Collection
    {
        try {
            if (app()->bound('cache')) {
                return Cache::remember($this->cacheKey, $this->cacheTtl, function () {
                    return $this->discoverModules();
                });
            }
        } catch (Throwable $e) {
            // Fallback to direct discovery if cache facade isn't booted yet
        }

        return $this->discoverModules();
    }

    /**
     * Refresh module cache.
     */
    public function refreshCache(): void
    {
        try {
            if (app()->bound('cache')) {
                Cache::forget($this->cacheKey);
            }
        } catch (Throwable $e) {
            // Suppress early-boot errors
        }
        
        $this->loadModules();
    }

    /**
     * Get module statistics.
     */
    public function getModuleStats(): array
    {
        $modules = $this->getModules();

        return [
            'total' => $modules->count(),
            'tenant_aware' => $modules->where('tenant_aware', true)->count(),
            'global' => $modules->where('tenant_aware', false)->count(),
            'enabled' => $modules->where('enabled', true)->count(),
            'disabled' => $modules->where('enabled', false)->count(),
            'by_strategy' => [
                'shared' => $modules->filter(fn ($m) => in_array('shared', $m['database_strategies'] ?? []))->count(),
                'dedicated' => $modules->filter(fn ($m) => in_array('dedicated', $m['database_strategies'] ?? []))->count(),
                'clustered' => $modules->filter(fn ($m) => in_array('clustered', $m['database_strategies'] ?? []))->count(),
            ],
        ];
    }

    /**
     * Validate module configuration.
     */
    public function validateModule(array $moduleConfig): array
    {
        $errors = [];

        foreach (['name', 'path', 'namespace', 'provider'] as $field) {
            if (empty($moduleConfig[$field])) {
                $errors[] = "Missing required field: {$field}";
            }
        }

        if (! empty($moduleConfig['path']) && ! File::exists($moduleConfig['path'])) {
            $errors[] = "Module path does not exist: {$moduleConfig['path']}";
        }

        if (! empty($moduleConfig['provider']) && ! class_exists($moduleConfig['provider'])) {
            $errors[] = "Provider class does not exist: {$moduleConfig['provider']}";
        }

        return $errors;
    }

    /**
     * Check module dependencies.
     */
    public function checkDependencies(string $moduleName): array
    {
        $module = $this->getModule($moduleName);
        if (! $module) {
            return ['Module not found'];
        }

        $missing = [];
        foreach ($module['dependencies'] ?? [] as $dependency) {
            if (! $this->isModuleRegistered($dependency)) {
                $missing[] = $dependency;
            }
        }

        return $missing;
    }

    /**
     * Get modules in load order (dependencies first).
     */
    public function getModulesInLoadOrder(): Collection
    {
        $modules = $this->getModules();
        $sorted = [];
        $visited = [];

        foreach ($modules as $name => $module) {
            $this->sortModulesByDependencies($name, $modules->toArray(), $sorted, $visited);
        }

        return collect($sorted);
    }

    /**
     * Sort modules by dependencies using topological sort.
     */
    protected function sortModulesByDependencies(string $moduleName, array $modules, array &$sorted, array &$visited): void
    {
        if (in_array($moduleName, $visited)) {
            return;
        }

        $visited[] = $moduleName;

        if (! isset($modules[$moduleName])) {
            return;
        }

        $module = $modules[$moduleName];
        foreach ($module['dependencies'] ?? [] as $dependency) {
            $this->sortModulesByDependencies($dependency, $modules, $sorted, $visited);
        }

        if (! in_array($module, $sorted)) {
            $sorted[] = $module;
        }
    }

    /**
     * Enable a module.
     */
    public function enableModule(string $moduleName): bool
    {
        if (! $this->isModuleRegistered($moduleName)) {
            return false;
        }

        $this->modules[$moduleName]['enabled'] = true;
        $this->refreshCache();

        return true;
    }

    /**
     * Disable a module.
     */
    public function disableModule(string $moduleName): bool
    {
        if (! $this->isModuleRegistered($moduleName)) {
            return false;
        }

        $this->modules[$moduleName]['enabled'] = false;
        $this->refreshCache();

        return true;
    }

    /**
     * Get enabled modules.
     */
    public function getEnabledModules(): Collection
    {
        return $this->getModules()->filter(fn ($m) => $m['enabled'] ?? true);
    }

    /**
     * Get disabled modules.
     */
    public function getDisabledModules(): Collection
    {
        return $this->getModules()->filter(fn ($m) => ! ($m['enabled'] ?? true));
    }
}
