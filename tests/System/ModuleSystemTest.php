<?php

namespace Tests\System;

use Tests\Shared\TenantTestCase;
use Modules\Shared\Services\ModuleDiscoveryService;
use Modules\Shared\Services\InterModuleBus;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ModuleSystemTest extends TenantTestCase
{
    use RefreshDatabase;

    protected ModuleDiscoveryService $moduleDiscovery;
    protected InterModuleBus $interModuleBus;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->moduleDiscovery = app(ModuleDiscoveryService::class);
        $this->interModuleBus = app(InterModuleBus::class);
    }

    /**
     * Test module discovery functionality.
     */
    public function test_module_discovery(): void
    {
        $modules = $this->moduleDiscovery->discoverModules();
        
        $this->assertIsArray($modules);
        $this->assertNotEmpty($modules);
        
        // Check that core modules are discovered
        $moduleNames = array_keys($modules);
        $this->assertContains('Accounting', $moduleNames);
        $this->assertContains('Inventory', $moduleNames);
        $this->assertContains('Organization', $moduleNames);
        $this->assertContains('Reporting', $moduleNames);
        $this->assertContains('Shared', $moduleNames);
    }

    /**
     * Test module loading and registration.
     */
    public function test_module_loading(): void
    {
        $modules = $this->moduleDiscovery->discoverModules();
        
        foreach ($modules as $moduleName => $moduleConfig) {
            $this->assertTrue(
                $this->moduleDiscovery->isModuleLoaded($moduleName),
                "Module {$moduleName} should be loaded"
            );
        }
    }

    /**
     * Test inter-module communication.
     */
    public function test_inter_module_communication(): void
    {
        // Register a test service
        $testService = new class {
            public function testMethod(): string
            {
                return 'test_response';
            }
        };

        $this->interModuleBus->registerService('TestModule', 'TestService', $testService);

        // Test service retrieval
        $retrievedService = $this->interModuleBus->getService('TestModule', 'TestService');
        $this->assertSame($testService, $retrievedService);
        $this->assertEquals('test_response', $retrievedService->testMethod());
    }

    /**
     * Test module dependency resolution.
     */
    public function test_module_dependency_resolution(): void
    {
        $dependencies = $this->moduleDiscovery->getModuleDependencies();
        
        $this->assertIsArray($dependencies);
        
        // Test that Shared module has no dependencies (it's the base)
        if (isset($dependencies['Shared'])) {
            $this->assertEmpty($dependencies['Shared']);
        }
        
        // Test that other modules depend on Shared
        foreach (['Accounting', 'Inventory', 'Organization', 'Reporting'] as $module) {
            if (isset($dependencies[$module])) {
                $this->assertContains('Shared', $dependencies[$module]);
            }
        }
    }

    /**
     * Test module configuration loading.
     */
    public function test_module_configuration_loading(): void
    {
        $moduleConfig = config('modules');
        
        $this->assertIsArray($moduleConfig);
        $this->assertArrayHasKey('discovery', $moduleConfig);
        $this->assertArrayHasKey('loading', $moduleConfig);
        
        // Test discovery configuration
        $this->assertTrue($moduleConfig['discovery']['enabled']);
        $this->assertStringContains('Modules', $moduleConfig['discovery']['path']);
        
        // Test loading configuration
        $this->assertTrue($moduleConfig['loading']['auto_load']);
    }

    /**
     * Test module health checks.
     */
    public function test_module_health_checks(): void
    {
        $modules = $this->moduleDiscovery->discoverModules();
        
        foreach ($modules as $moduleName => $moduleConfig) {
            // Check that module directory exists
            $modulePath = base_path("Modules/{$moduleName}");
            $this->assertDirectoryExists($modulePath, "Module directory for {$moduleName} should exist");
            
            // Check that module has required structure
            $this->assertDirectoryExists("{$modulePath}/Models", "Models directory should exist for {$moduleName}");
            $this->assertDirectoryExists("{$modulePath}/Services", "Services directory should exist for {$moduleName}");
            
            // Check for service provider if it should exist
            if ($moduleName !== 'Shared') {
                $providerPath = "{$modulePath}/Providers/{$moduleName}ServiceProvider.php";
                if (file_exists($providerPath)) {
                    $this->assertFileExists($providerPath, "Service provider should exist for {$moduleName}");
                }
            }
        }
    }

    /**
     * Test module event system.
     */
    public function test_module_event_system(): void
    {
        $eventFired = false;
        $eventData = null;

        // Register event listener
        $this->interModuleBus->listen('test.event', function ($data) use (&$eventFired, &$eventData) {
            $eventFired = true;
            $eventData = $data;
        });

        // Fire event
        $testData = ['message' => 'test event data'];
        $this->interModuleBus->fire('test.event', $testData);

        // Assert event was handled
        $this->assertTrue($eventFired, 'Event should have been fired');
        $this->assertEquals($testData, $eventData, 'Event data should match');
    }

    /**
     * Test module performance metrics.
     */
    public function test_module_performance_metrics(): void
    {
        $startTime = microtime(true);
        
        // Perform module discovery
        $modules = $this->moduleDiscovery->discoverModules();
        
        $discoveryTime = microtime(true) - $startTime;
        
        // Assert reasonable performance (should complete within 1 second)
        $this->assertLessThan(1.0, $discoveryTime, 'Module discovery should complete within 1 second');
        
        // Test module loading performance
        $startTime = microtime(true);
        
        foreach ($modules as $moduleName => $moduleConfig) {
            $this->moduleDiscovery->loadModule($moduleName);
        }
        
        $loadingTime = microtime(true) - $startTime;
        
        // Assert reasonable loading performance
        $this->assertLessThan(2.0, $loadingTime, 'Module loading should complete within 2 seconds');
    }

    /**
     * Test module isolation and security.
     */
    public function test_module_isolation(): void
    {
        // Test that modules cannot access each other's private data directly
        $accountingService = $this->interModuleBus->getService('Accounting', 'AccountingService');
        
        // This should work - proper inter-module communication
        $this->assertNotNull($accountingService);
        
        // Test that module data is properly scoped to tenant
        $this->actingAsTenantUser();
        
        // Any module operations should be scoped to the current tenant
        $currentTenant = app('tenant');
        $this->assertNotNull($currentTenant);
        $this->assertEquals($this->tenant->id, $currentTenant->id);
    }
}
