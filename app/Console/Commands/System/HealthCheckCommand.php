<?php

namespace App\Console\Commands\System;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class HealthCheckCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'system:health-check 
                            {--detailed : Show detailed health information}
                            {--json : Output results in JSON format}';

    /**
     * The console command description.
     */
    protected $description = 'Perform comprehensive system health check';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $detailed = $this->option('detailed');
        $json = $this->option('json');

        $healthData = $this->performHealthChecks($detailed);

        if ($json) {
            $this->line(json_encode($healthData, JSON_PRETTY_PRINT));
        } else {
            $this->displayHealthResults($healthData, $detailed);
        }

        return $healthData['overall_status'] === 'healthy' ? self::SUCCESS : self::FAILURE;
    }

    /**
     * Perform all health checks
     */
    private function performHealthChecks(bool $detailed): array
    {
        $checks = [
            'database' => $this->checkDatabase($detailed),
            'cache' => $this->checkCache($detailed),
            'storage' => $this->checkStorage($detailed),
            'modules' => $this->checkModules($detailed),
        ];

        $overallStatus = collect($checks)->every(fn ($check) => $check['status'] === 'healthy')
            ? 'healthy'
            : 'unhealthy';

        return [
            'timestamp' => now()->toISOString(),
            'overall_status' => $overallStatus,
            'checks' => $checks,
        ];
    }

    /**
     * Check database connectivity
     */
    private function checkDatabase(bool $detailed): array
    {
        $result = [
            'status' => 'healthy',
            'message' => 'Database connections working',
            'details' => [],
        ];

        try {
            // Test basic database connection
            DB::connection()->getPdo();

            if ($detailed) {
                $result['details'] = [
                    'driver' => DB::connection()->getDriverName(),
                    'database' => DB::connection()->getDatabaseName(),
                ];
            }
        } catch (\Exception $e) {
            $result['status'] = 'unhealthy';
            $result['message'] = 'Database connection failed: '.$e->getMessage();
        }

        return $result;
    }

    /**
     * Check cache functionality
     */
    private function checkCache(bool $detailed): array
    {
        $result = [
            'status' => 'healthy',
            'message' => 'Cache working properly',
            'details' => [],
        ];

        try {
            $testKey = 'health_check_'.time();
            $testValue = 'test_value';

            Cache::put($testKey, $testValue, 60);
            $cachedValue = Cache::get($testKey);

            if ($cachedValue !== $testValue) {
                throw new \Exception('Cache read/write mismatch');
            }

            Cache::forget($testKey);

            if ($detailed) {
                $result['details'] = [
                    'driver' => config('cache.default'),
                    'prefix' => config('cache.prefix'),
                ];
            }
        } catch (\Exception $e) {
            $result['status'] = 'unhealthy';
            $result['message'] = 'Cache test failed: '.$e->getMessage();
        }

        return $result;
    }

    /**
     * Check storage functionality
     */
    private function checkStorage(bool $detailed): array
    {
        $result = [
            'status' => 'healthy',
            'message' => 'Storage working properly',
            'details' => [],
        ];

        try {
            $testFile = 'health_check_'.time().'.txt';
            $testContent = 'Health check test file';

            \Storage::put($testFile, $testContent);
            $readContent = \Storage::get($testFile);

            if ($readContent !== $testContent) {
                throw new \Exception('Storage read/write mismatch');
            }

            \Storage::delete($testFile);

            if ($detailed) {
                $result['details'] = [
                    'default_disk' => config('filesystems.default'),
                ];
            }
        } catch (\Exception $e) {
            $result['status'] = 'unhealthy';
            $result['message'] = 'Storage test failed: '.$e->getMessage();
        }

        return $result;
    }

    /**
     * Check module status
     */
    private function checkModules(bool $detailed): array
    {
        $result = [
            'status' => 'healthy',
            'message' => 'All modules functioning',
            'details' => [],
        ];

        try {
            $enabledModules = config('modules.enabled', []);
            $moduleCount = count($enabledModules);

            if ($detailed) {
                $result['details'] = [
                    'enabled_modules' => $enabledModules,
                    'module_count' => $moduleCount,
                ];
            }

            if ($moduleCount === 0) {
                $result['status'] = 'warning';
                $result['message'] = 'No modules enabled';
            }
        } catch (\Exception $e) {
            $result['status'] = 'unhealthy';
            $result['message'] = 'Module check failed: '.$e->getMessage();
        }

        return $result;
    }

    /**
     * Display health check results
     */
    private function displayHealthResults(array $healthData, bool $detailed): void
    {
        $overallStatus = $healthData['overall_status'];
        $statusIcon = $overallStatus === 'healthy' ? '✅' : '❌';

        $this->info("🏥 System Health Check - {$statusIcon} {$overallStatus}");
        $this->line("Timestamp: {$healthData['timestamp']}");
        $this->newLine();

        foreach ($healthData['checks'] as $component => $check) {
            $icon = match ($check['status']) {
                'healthy' => '✅',
                'warning' => '⚠️',
                'unhealthy' => '❌',
                default => '❓',
            };

            $this->line("{$icon} ".ucfirst($component).": {$check['message']}");

            if ($detailed && ! empty($check['details'])) {
                foreach ($check['details'] as $key => $value) {
                    if (is_array($value)) {
                        $this->line("    {$key}: ".json_encode($value));
                    } else {
                        $this->line("    {$key}: {$value}");
                    }
                }
            }
        }

        if ($overallStatus !== 'healthy') {
            $this->newLine();
            $this->warn('⚠️  System health issues detected. Please review the failed components.');
        }
    }
}
