<?php

namespace App;


/**
 * Global helper functions for the Laravel Modular Accounting Platform
 */
if (! function_exists('current_tenant')) {
    /**
     * Get the current tenant from the application context
     */
    function current_tenant(): ?\App\Models\Tenant
    {
        return app('current_tenant');
    }
}

if (! function_exists('current_organization')) {
    /**
     * Get the current organization from the application context
     */
    function current_organization(): ?\App\Shared\Models\Organization
    {
        return app('current_organization');
    }
}

if (! function_exists('tenant_database')) {
    /**
     * Get the current tenant's database connection name
     */
    function tenant_database(): string
    {
        $tenant = current_tenant();

        if (! $tenant) {
            return config('database.default');
        }

        return match ($tenant->database_strategy) {
            'dedicated' => "tenant_{$tenant->id}",
            'clustered' => "cluster_{$tenant->region}",
            'shared' => 'shared_shard_'.(($tenant->id % 4) + 1),
            default => config('database.default'),
        };
    }
}

if (! function_exists('format_currency')) {
    /**
     * Format a number as currency for the current organization
     */
    function format_currency(float $amount, ?string $currency = null): string
    {
        $organization = current_organization();
        $currency = $currency ?? $organization?->currency ?? 'USD';

        return number_format($amount, 2).' '.$currency;
    }
}

if (! function_exists('format_percentage')) {
    /**
     * Format a number as percentage
     */
    function format_percentage(float $value, int $decimals = 2): string
    {
        return number_format($value, $decimals).'%';
    }
}

if (! function_exists('generate_account_code')) {
    /**
     * Generate a unique account code
     */
    function generate_account_code(string $type, ?string $subtype = null): string
    {
        $prefixes = [
            'asset' => '1',
            'liability' => '2',
            'equity' => '3',
            'revenue' => '4',
            'expense' => '5',
        ];

        $prefix = $prefixes[$type] ?? '9';
        $timestamp = now()->format('mdHis');

        return $prefix.$timestamp;
    }
}

if (! function_exists('generate_journal_entry_number')) {
    /**
     * Generate a unique journal entry number
     */
    function generate_journal_entry_number(): string
    {
        $organization = current_organization();
        $prefix = $organization ? strtoupper(substr($organization->name, 0, 3)) : 'JE';

        return $prefix.'-'.now()->format('Y').'-'.str_pad(
            \App\Features\Accounting\Models\JournalEntry::whereYear('created_at', now()->year)->count() + 1,
            6,
            '0',
            STR_PAD_LEFT
        );
    }
}

if (! function_exists('generate_purchase_order_number')) {
    /**
     * Generate a unique purchase order number
     */
    function generate_purchase_order_number(): string
    {
        $organization = current_organization();
        $prefix = $organization ? strtoupper(substr($organization->name, 0, 3)) : 'PO';

        return $prefix.'-'.now()->format('Y').'-'.str_pad(
            \App\Features\Purchase\Models\PurchaseOrder::whereYear('created_at', now()->year)->count() + 1,
            6,
            '0',
            STR_PAD_LEFT
        );
    }
}

if (! function_exists('is_shared_database')) {
    /**
     * Check if the current tenant is using a shared database
     */
    function is_shared_database(): bool
    {
        $tenant = current_tenant();

        return $tenant && $tenant->database_strategy === 'shared';
    }
}

if (! function_exists('is_dedicated_database')) {
    /**
     * Check if the current tenant is using a dedicated database
     */
    function is_dedicated_database(): bool
    {
        $tenant = current_tenant();

        return $tenant && $tenant->database_strategy === 'dedicated';
    }
}

if (! function_exists('is_clustered_database')) {
    /**
     * Check if the current tenant is using a clustered database
     */
    function is_clustered_database(): bool
    {
        $tenant = current_tenant();

        return $tenant && $tenant->database_strategy === 'clustered';
    }
}

if (! function_exists('audit_log')) {
    /**
     * Create an audit log entry
     */
    function audit_log(
        string $event,
        $auditable = null,
        array $oldValues = [],
        array $newValues = [],
        string $riskLevel = 'low',
        array $metadata = []
    ): void {
        if (class_exists(\App\Features\Security\Models\AuditLog::class)) {
            \App\Features\Security\Models\AuditLog::logEvent(
                $event,
                $auditable,
                $oldValues,
                $newValues,
                $riskLevel,
                $metadata
            );
        }
    }
}

if (! function_exists('broadcast_inventory_update')) {
    /**
     * Broadcast inventory update to real-time channels
     */
    function broadcast_inventory_update(string $event, array $data): void
    {
        if (class_exists(\App\Features\Inventory\Events\StockLevelUpdated::class)) {
            broadcast(new \App\Features\Inventory\Events\StockLevelUpdated($data));
        }
    }
}

if (! function_exists('calculate_account_balance')) {
    /**
     * Calculate account balance based on account type
     */
    function calculate_account_balance(string $accountType, float $debits, float $credits): float
    {
        $debitTypes = ['asset', 'expense'];

        if (in_array($accountType, $debitTypes)) {
            return $debits - $credits;
        }

        return $credits - $debits;
    }
}

if (! function_exists('get_financial_year_start')) {
    /**
     * Get the financial year start date for the current organization
     */
    function get_financial_year_start(): \Carbon\Carbon
    {
        $organization = current_organization();
        $fiscalYearStart = $organization?->settings['fiscal_year_start'] ?? '01-01';

        [$month, $day] = explode('-', $fiscalYearStart);

        $startDate = \Carbon\Carbon::create(now()->year, (int) $month, (int) $day);

        if ($startDate->isFuture()) {
            $startDate->subYear();
        }

        return $startDate;
    }
}

if (! function_exists('get_financial_year_end')) {
    /**
     * Get the financial year end date for the current organization
     */
    function get_financial_year_end(): \Carbon\Carbon
    {
        return get_financial_year_start()->addYear()->subDay();
    }
}

if (! function_exists('is_within_financial_year')) {
    /**
     * Check if a date is within the current financial year
     */
    function is_within_financial_year(\Carbon\Carbon $date): bool
    {
        $start = get_financial_year_start();
        $end = get_financial_year_end();

        return $date->between($start, $end);
    }
}

if (! function_exists('module_enabled')) {
    /**
     * Check if a module is enabled
     */
    function module_enabled(string $module): bool
    {
        $enabledModules = config('modules.enabled', []);

        return in_array($module, $enabledModules);
    }
}

if (! function_exists('get_module_service')) {
    /**
     * Get a service from a specific module
     */
    function get_module_service(string $module, string $service)
    {
        if (! module_enabled($module)) {
            throw new \Exception("Module {$module} is not enabled");
        }

        $serviceClass = "App\\Features\\{$module}\\Services\\{$service}";

        if (! class_exists($serviceClass)) {
            throw new \Exception("Service {$service} not found in module {$module}");
        }

        return app($serviceClass);
    }
}

if (! function_exists('tenant_cache_key')) {
    /**
     * Generate a tenant-specific cache key
     */
    function tenant_cache_key(string $key): string
    {
        $tenant = current_tenant();
        $tenantId = $tenant ? $tenant->id : 'global';

        return "tenant_{$tenantId}_{$key}";
    }
}

if (! function_exists('organization_cache_key')) {
    /**
     * Generate an organization-specific cache key
     */
    function organization_cache_key(string $key): string
    {
        $organization = current_organization();
        $orgId = $organization ? $organization->id : 'global';

        return "org_{$orgId}_{$key}";
    }
}
