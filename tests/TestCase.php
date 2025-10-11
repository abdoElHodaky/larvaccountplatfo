<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * Setup the test environment.
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // Set up test environment
        $this->withoutVite();
        
        // Disable broadcasting for tests
        $this->withoutBroadcasting();
        
        // Set up default test configuration
        config(['app.env' => 'testing']);
    }

    /**
     * Clean up the testing environment before the next test.
     */
    protected function tearDown(): void
    {
        parent::tearDown();
    }
}
