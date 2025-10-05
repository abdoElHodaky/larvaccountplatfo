<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('platform:status', function () {
    $this->info('🚀 Laravel 12 Modular Accounting Platform');
    $this->newLine();
    
    // System Information
    $this->info('📊 System Information:');
    $this->line('  Laravel Version: ' . app()->version());
    $this->line('  PHP Version: ' . PHP_VERSION);
    $this->line('  Environment: ' . app()->environment());
    $this->line('  Debug Mode: ' . (config('app.debug') ? 'Enabled' : 'Disabled'));
    $this->newLine();
    
    // Database Status
    $this->info('🗄️  Database Status:');
    try {
        DB::connection()->getPdo();
        $this->line('  Database: ✅ Connected');
    } catch (Exception $e) {
        $this->line('  Database: ❌ Failed');
    }
    $this->newLine();
    
    // Module Status
    $this->info('📦 Module Status:');
    $enabledModules = config('modules.enabled', []);
    if (empty($enabledModules)) {
        $this->line('  No modules enabled');
    } else {
        foreach ($enabledModules as $module) {
            $this->line("  {$module}: ✅ Enabled");
        }
    }
    $this->newLine();
    
    // Cache Status
    $this->info('🚀 Cache Status:');
    $this->line('  Cache Driver: ' . config('cache.default'));
    $this->line('  Queue Driver: ' . config('queue.default'));
    $this->newLine();
    
    $this->info('✅ Platform status check completed!');
})->purpose('Display platform status information');

Artisan::command('platform:optimize', function () {
    $this->info('⚡ Optimizing Laravel 12 Modular Accounting Platform...');
    
    // Clear all caches
    $this->call('optimize:clear');
    $this->line('✅ Cleared all caches');
    
    // Optimize for production
    $this->call('config:cache');
    $this->line('✅ Configuration cached');
    
    $this->call('route:cache');
    $this->line('✅ Routes cached');
    
    $this->call('view:cache');
    $this->line('✅ Views cached');
    
    $this->call('event:cache');
    $this->line('✅ Events cached');
    
    $this->newLine();
    $this->info('🚀 Platform optimization completed!');
})->purpose('Optimize the platform for production');

Artisan::command('platform:setup', function () {
    $this->info('🛠️  Setting up Laravel 12 Modular Accounting Platform...');
    $this->newLine();
    
    // Generate application key if not set
    if (empty(config('app.key'))) {
        $this->call('key:generate');
        $this->line('✅ Application key generated');
    }
    
    // Create storage link
    $this->call('storage:link');
    $this->line('✅ Storage link created');
    
    // Run migrations
    if ($this->confirm('Run database migrations?', true)) {
        $this->call('migrate', ['--force' => true]);
        $this->line('✅ Database migrations completed');
    }
    
    // Seed database
    if ($this->confirm('Seed database with sample data?', false)) {
        $this->call('db:seed', ['--force' => true]);
        $this->line('✅ Database seeded');
    }
    
    // Optimize platform
    $this->call('platform:optimize');
    
    $this->newLine();
    $this->info('🎉 Platform setup completed successfully!');
    $this->line('🌐 You can now access your application at: ' . config('app.url'));
})->purpose('Complete platform setup for new installations');

Artisan::command('platform:doctor', function () {
    $this->info('🏥 Running platform diagnostics...');
    $this->newLine();
    
    $issues = [];
    
    // Check PHP version
    if (version_compare(PHP_VERSION, '8.2.0', '<')) {
        $issues[] = 'PHP version should be 8.2 or higher (current: ' . PHP_VERSION . ')';
    } else {
        $this->line('✅ PHP version: ' . PHP_VERSION);
    }
    
    // Check required extensions
    $requiredExtensions = ['pdo', 'mbstring', 'openssl', 'tokenizer', 'xml', 'ctype', 'json', 'bcmath'];
    foreach ($requiredExtensions as $extension) {
        if (!extension_loaded($extension)) {
            $issues[] = "Required PHP extension missing: {$extension}";
        }
    }
    
    if (empty($issues)) {
        $this->line('✅ All required PHP extensions loaded');
    }
    
    // Check environment file
    if (!file_exists(base_path('.env'))) {
        $issues[] = '.env file is missing';
    } else {
        $this->line('✅ Environment file exists');
    }
    
    // Check application key
    if (empty(config('app.key'))) {
        $issues[] = 'Application key is not set';
    } else {
        $this->line('✅ Application key is set');
    }
    
    // Check storage permissions
    $storagePath = storage_path();
    if (!is_writable($storagePath)) {
        $issues[] = 'Storage directory is not writable';
    } else {
        $this->line('✅ Storage directory is writable');
    }
    
    $this->newLine();
    
    if (empty($issues)) {
        $this->info('🎉 All diagnostics passed! Your platform is healthy.');
    } else {
        $this->error('❌ Issues found:');
        foreach ($issues as $issue) {
            $this->line("  • {$issue}");
        }
        return 1;
    }
    
    return 0;
})->purpose('Run platform health diagnostics');
