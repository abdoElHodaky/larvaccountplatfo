<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Models\Organization;
use App\Models\User;

class CacheWarmCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'cache:warm 
                            {--tenant= : Warm cache for specific tenant}
                            {--type= : Cache type to warm (all|config|users|organizations)}';

    /**
     * The console command description.
     */
    protected $description = 'Warm frequently accessed cache keys for optimal performance';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $tenant = $this->option('tenant');
        $type = $this->option('type') ?? 'all';

        $this->info('🔥 Starting cache warming process...');

        try {
            match ($type) {
                'config' => $this->warmConfigCache(),
                'users' => $this->warmUsersCache($tenant),
                'organizations' => $this->warmOrganizationsCache($tenant),
                'all' => $this->warmAllCaches($tenant),
                default => throw new \InvalidArgumentException("Invalid cache type: {$type}")
            };

            $this->info('✅ Cache warming completed successfully!');
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Cache warming failed: {$e->getMessage()}");
            return Command::FAILURE;
        }
    }

    /**
     * Warm all cache types
     */
    private function warmAllCaches(?string $tenant = null): void
    {
        $this->warmConfigCache();
        $this->warmUsersCache($tenant);
        $this->warmOrganizationsCache($tenant);
        $this->warmFinancialCache($tenant);
    }

    /**
     * Warm configuration cache
     */
    private function warmConfigCache(): void
    {
        $this->info('🔧 Warming configuration cache...');

        // Application settings
        Cache::remember('app.settings', 3600, function () {
            return [
                'name' => config('app.name'),
                'version' => config('app.version', '1.0.0'),
                'features' => config('features', []),
                'limits' => config('limits', []),
            ];
        });

        // Feature flags
        Cache::remember('feature.flags', 1800, function () {
            return [
                'real_time_enabled' => true,
                'advanced_reporting' => true,
                'multi_currency' => true,
                'api_access' => true,
                'mobile_app' => true,
            ];
        });

        // System configuration
        Cache::remember('system.config', 7200, function () {
            return [
                'max_file_size' => config('filesystems.max_file_size', 10240),
                'allowed_extensions' => config('filesystems.allowed_extensions', []),
                'timezone' => config('app.timezone'),
                'locale' => config('app.locale'),
            ];
        });

        $this->line('   ✓ Configuration cache warmed');
    }

    /**
     * Warm users cache
     */
    private function warmUsersCache(?string $tenant = null): void
    {
        $this->info('👥 Warming users cache...');

        $query = User::with(['organization', 'roles', 'permissions']);
        
        if ($tenant) {
            $query->whereHas('organization', function ($q) use ($tenant) {
                $q->where('slug', $tenant);
            });
        }

        $users = $query->limit(100)->get();

        foreach ($users as $user) {
            // User profile cache
            Cache::remember("user.profile.{$user->id}", 1800, function () use ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'organization_id' => $user->organization_id,
                    'roles' => $user->roles->pluck('name'),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ];
            });

            // User preferences cache
            Cache::remember("user.preferences.{$user->id}", 3600, function () use ($user) {
                return $user->preferences ?? [
                    'theme' => 'light',
                    'language' => 'en',
                    'timezone' => 'UTC',
                    'notifications' => true,
                ];
            });

            // User dashboard cache
            Cache::remember("user.dashboard.{$user->id}", 900, function () use ($user) {
                return [
                    'recent_transactions' => [],
                    'account_summary' => [],
                    'notifications_count' => 0,
                    'tasks_count' => 0,
                ];
            });
        }

        $this->line("   ✓ Users cache warmed ({$users->count()} users)");
    }

    /**
     * Warm organizations cache
     */
    private function warmOrganizationsCache(?string $tenant = null): void
    {
        $this->info('🏢 Warming organizations cache...');

        $query = Organization::with(['users', 'settings']);
        
        if ($tenant) {
            $query->where('slug', $tenant);
        }

        $organizations = $query->limit(50)->get();

        foreach ($organizations as $org) {
            // Organization profile cache
            Cache::remember("organization.profile.{$org->id}", 3600, function () use ($org) {
                return [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'logo' => $org->logo,
                    'settings' => $org->settings,
                    'users_count' => $org->users->count(),
                    'subscription' => $org->subscription,
                ];
            });

            // Organization statistics cache
            Cache::remember("organization.stats.{$org->id}", 1800, function () use ($org) {
                return [
                    'total_users' => $org->users()->count(),
                    'active_users' => $org->users()->where('last_login_at', '>=', now()->subDays(30))->count(),
                    'total_transactions' => 0, // Would be calculated from actual data
                    'monthly_revenue' => 0,    // Would be calculated from actual data
                ];
            });

            // Organization permissions cache
            Cache::remember("organization.permissions.{$org->id}", 7200, function () use ($org) {
                return [
                    'features' => $org->enabled_features ?? [],
                    'limits' => $org->limits ?? [],
                    'integrations' => $org->integrations ?? [],
                ];
            });
        }

        $this->line("   ✓ Organizations cache warmed ({$organizations->count()} organizations)");
    }

    /**
     * Warm financial data cache
     */
    private function warmFinancialCache(?string $tenant = null): void
    {
        $this->info('💰 Warming financial cache...');

        $query = Organization::query();
        
        if ($tenant) {
            $query->where('slug', $tenant);
        }

        $organizations = $query->limit(20)->get();

        foreach ($organizations as $org) {
            // Chart of accounts cache
            Cache::remember("financial.accounts.{$org->id}", 3600, function () use ($org) {
                return [
                    'assets' => [],
                    'liabilities' => [],
                    'equity' => [],
                    'revenue' => [],
                    'expenses' => [],
                ];
            });

            // Financial summary cache
            Cache::remember("financial.summary.{$org->id}", 1800, function () use ($org) {
                return [
                    'total_assets' => 0,
                    'total_liabilities' => 0,
                    'total_equity' => 0,
                    'monthly_revenue' => 0,
                    'monthly_expenses' => 0,
                    'net_income' => 0,
                ];
            });

            // Recent transactions cache
            Cache::remember("financial.recent_transactions.{$org->id}", 900, function () use ($org) {
                return [
                    'transactions' => [],
                    'count' => 0,
                    'total_amount' => 0,
                ];
            });
        }

        $this->line("   ✓ Financial cache warmed ({$organizations->count()} organizations)");
    }
}
