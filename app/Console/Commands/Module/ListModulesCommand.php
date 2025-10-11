<?php

namespace App\Console\Commands\Module;

use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ListModulesCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'module:list
                            {--enabled : Show only enabled modules}
                            {--disabled : Show only disabled modules}
                            {--detailed : Show detailed module information}';

    /**
     * The console command description.
     */
    protected $description = 'List all available modules with their status';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $showEnabled = $this->option('enabled');
        $showDisabled = $this->option('disabled');
        $detailed = $this->option('detailed');

        $this->info('📦 Laravel Modular Accounting Platform - Modules');
        $this->newLine();

        $modules = $this->discoverModules();
        $enabledModules = config('modules.enabled', []);

        if (empty($modules)) {
            $this->warn('No modules found.');

            return self::SUCCESS;
        }

        $filteredModules = collect($modules)->filter(function ($module, $name) use ($showEnabled, $showDisabled, $enabledModules) {
            $isEnabled = in_array($name, $enabledModules);

            if ($showEnabled && ! $isEnabled) {
                return false;
            }
            if ($showDisabled && $isEnabled) {
                return false;
            }

            return true;
        });

        if ($filteredModules->isEmpty()) {
            $this->info('No modules match the specified criteria.');

            return self::SUCCESS;
        }

        if ($detailed) {
            $this->displayDetailedModules($filteredModules, $enabledModules);
        } else {
            $this->displaySimpleModules($filteredModules, $enabledModules);
        }

        // Summary
        $this->newLine();
        $this->info('📊 Summary:');
        $totalModules = count($modules);
        $enabledCount = count(array_intersect(array_keys($modules), $enabledModules));
        $disabledCount = $totalModules - $enabledCount;

        $this->line("  Total modules: {$totalModules}");
        $this->line("  Enabled: {$enabledCount}");
        $this->line("  Disabled: {$disabledCount}");

        return self::SUCCESS;
    }

    /**
     * Discover available modules
     */
    private function discoverModules(): array
    {
        $modules = [];
        $modulesPath = base_path('Modules');

        if (! is_dir($modulesPath)) {
            return $modules;
        }

        $moduleDirectories = glob($modulesPath.'/*', GLOB_ONLYDIR);

        foreach ($moduleDirectories as $moduleDir) {
            $moduleName = basename($moduleDir);

            $modules[$moduleName] = [
                'name' => $moduleName,
                'path' => $moduleDir,
                'version' => $this->getModuleVersion($moduleDir),
                'description' => $this->getModuleDescription($moduleDir),
                'dependencies' => $this->getModuleDependencies($moduleDir),
            ];
        }

        return $modules;
    }

    /**
     * Get module version
     */
    private function getModuleVersion(string $moduleDir): string
    {
        $composerFile = $moduleDir.'/composer.json';

        if (file_exists($composerFile)) {
            $composer = json_decode(file_get_contents($composerFile), true);

            return $composer['version'] ?? '1.0.0';
        }

        return '1.0.0';
    }

    /**
     * Get module description
     */
    private function getModuleDescription(string $moduleDir): string
    {
        $composerFile = $moduleDir.'/composer.json';

        if (file_exists($composerFile)) {
            $composer = json_decode(file_get_contents($composerFile), true);

            return $composer['description'] ?? 'No description available';
        }

        return 'No description available';
    }

    /**
     * Get module dependencies
     */
    private function getModuleDependencies(string $moduleDir): array
    {
        $composerFile = $moduleDir.'/composer.json';

        if (file_exists($composerFile)) {
            $composer = json_decode(file_get_contents($composerFile), true);

            return array_keys($composer['require'] ?? []);
        }

        return [];
    }

    /**
     * Display modules in simple table format
     */
    private function displaySimpleModules($modules, $enabledModules): void
    {
        $headers = ['Module', 'Status', 'Version', 'Description'];
        $rows = [];

        foreach ($modules as $name => $module) {
            $isEnabled = in_array($name, $enabledModules);
            $status = $isEnabled ? '✅ Enabled' : '❌ Disabled';

            $rows[] = [
                $name,
                $status,
                $module['version'] ?? '1.0.0',
                Str::limit($module['description'] ?? 'No description', 50),
            ];
        }

        $this->table($headers, $rows);
    }

    /**
     * Display modules with detailed information
     */
    private function displayDetailedModules($modules, $enabledModules): void
    {
        foreach ($modules as $name => $module) {
            $isEnabled = in_array($name, $enabledModules);
            $status = $isEnabled ? '✅ Enabled' : '❌ Disabled';

            $this->info("📦 {$name}");
            $this->line("  Status: {$status}");
            $this->line('  Version: '.($module['version'] ?? '1.0.0'));
            $this->line('  Description: '.($module['description'] ?? 'No description'));
            $this->line('  Path: '.($module['path'] ?? 'N/A'));

            if (! empty($module['dependencies'])) {
                $this->line('  Dependencies: '.implode(', ', $module['dependencies']));
            }

            $this->newLine();
        }
    }
}
