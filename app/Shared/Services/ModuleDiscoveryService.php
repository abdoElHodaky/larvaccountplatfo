<?php

namespace App\Shared\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

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

        // Clear cache when new module is registered
        Cache::forget($this->cacheKey);
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
        $tenant = app('tenant', null);

        if (! $tenant) {
            // No tenant context, return non-tenant-aware modules
            return $this->getModules()->filter(function ($module) {
                return ! $module['tenant_aware'];
            });
        }

        $strategy = $tenant->database_strategy;

        return $this->getModules()->filter(function ($module) use ($strategy) {
            return in_array($strategy, $module['database_strategies']);
        });
    }

    /**
     * Get tenant-aware modules.
     */
    public function getTenantAwareModules(): Collection
    {
        return $this->getModules()->filter(function ($module) {
            return $module['tenant_aware'];
        });
    }

    /**
     * Get global (non-tenant-aware) modules.
     */
    public function getGlobalModules(): Collection
    {
        return $this->getModules()->filter(function ($module) {
            return ! $module['tenant_aware'];
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
     * Load modules from cache or discover them.
     */
    public function loadModules(): Collection
    {
        return Cache::remember($this->cacheKey, $this->cacheTtl, function () {
            return $this->discoverModules();
        });
    }

    /**
     * Refresh module cache.
     */
    public function refreshCache(): void
    {
        Cache::forget($this->cacheKey);
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
                'shared' => $modules->filter(function ($module) {
                    return in_array('shared', $module['database_strategies']);
                })->count(),
                'dedicated' => $modules->filter(function ($module) {
                    return in_array('dedicated', $module['database_strategies']);
                })->count(),
                'clustered' => $modules->filter(function ($module) {
                    return in_array('clustered', $module['database_strategies']);
                })->count(),
            ],
        ];
    }

    /**
     * Validate module configuration.
     */
    public function validateModule(array $moduleConfig): array
    {
        $errors = [];

        // Required fields
        $required = ['name', 'path', 'namespace', 'provider'];
        foreach ($required as $field) {
            if (empty($moduleConfig[$field])) {
                $errors[] = "Missing required field: {$field}";
            }
        }

        // Validate path exists
        if (! empty($moduleConfig['path']) && ! File::exists($moduleConfig['path'])) {
            $errors[] = "Module path does not exist: {$moduleConfig['path']}";
        }

        // Validate provider class exists
        if (! empty($moduleConfig['provider']) && ! class_exists($moduleConfig['provider'])) {
            $errors[] = "Provider class does not exist: {$moduleConfig['provider']}";
        }

        // Validate database strategies
        $validStrategies = ['shared', 'dedicated', 'clustered'];
        if (! empty($moduleConfig['database_strategies'])) {
            foreach ($moduleConfig['database_strategies'] as $strategy) {
                if (! in_array($strategy, $validStrategies)) {
                    $errors[] = "Invalid database strategy: {$strategy}";
                }
            }
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
        $dependencies = $module['dependencies'] ?? [];

        foreach ($dependencies as $dependency) {
            if (! $this->isModuleRegistered($dependency)) {
                $missing[] = $dependency;
            }
        }

        return $missing;
    }

    /**
     * Get module dependency tree.
     */
    public function getDependencyTree(string $moduleName): array
    {
        $tree = [];
        $visited = [];

        $this->buildDependencyTree($moduleName, $tree, $visited);

        return $tree;
    }

    /**
     * Build dependency tree recursively.
     */
    protected function buildDependencyTree(string $moduleName, array &$tree, array &$visited): void
    {
        if (in_array($moduleName, $visited)) {
            return; // Avoid circular dependencies
        }

        $visited[] = $moduleName;
        $module = $this->getModule($moduleName);

        if (! $module) {
            return;
        }

        $tree[$moduleName] = [
            'module' => $module,
            'dependencies' => [],
        ];

        $dependencies = $module['dependencies'] ?? [];

        foreach ($dependencies as $dependency) {
            $this->buildDependencyTree($dependency, $tree[$moduleName]['dependencies'], $visited);
        }
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
        $dependencies = $module['dependencies'] ?? [];

        foreach ($dependencies as $dependency) {
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
        return $this->getModules()->filter(function ($module) {
            return $module['enabled'] ?? true;
        });
    }

    /**
     * Get disabled modules.
     */
    public function getDisabledModules(): Collection
    {
        return $this->getModules()->filter(function ($module) {
            return ! ($module['enabled'] ?? true);
        });
    }
}
