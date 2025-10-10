<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Features\Accounting\Models\Account;
use App\Features\Accounting\Models\TaxRate;
use App\Features\Accounting\Models\Budget;
use App\Features\Accounting\Models\BudgetLineItem;
use App\Features\Accounting\Models\FinancialForecast;
use App\Features\Accounting\Models\ForecastLineItem;
use Carbon\Carbon;

class AccountingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedChartOfAccounts();
        $this->seedTaxRates();
        $this->seedSampleBudgets();
        $this->seedSampleForecasts();
    }

    /**
     * Seed a comprehensive chart of accounts
     */
    private function seedChartOfAccounts(): void
    {
        $organizationId = 1; // Assuming first organization

        $accounts = [
            // ASSETS
            ['code' => '1000', 'name' => 'Current Assets', 'type' => 'asset', 'subtype' => 'current_asset', 'parent_id' => null],
            ['code' => '1010', 'name' => 'Cash and Cash Equivalents', 'type' => 'asset', 'subtype' => 'cash', 'parent_id' => 1],
            ['code' => '1011', 'name' => 'Petty Cash', 'type' => 'asset', 'subtype' => 'cash', 'parent_id' => 2],
            ['code' => '1012', 'name' => 'Checking Account', 'type' => 'asset', 'subtype' => 'cash', 'parent_id' => 2],
            ['code' => '1013', 'name' => 'Savings Account', 'type' => 'asset', 'subtype' => 'cash', 'parent_id' => 2],
            ['code' => '1020', 'name' => 'Accounts Receivable', 'type' => 'asset', 'subtype' => 'receivable', 'parent_id' => 1],
            ['code' => '1030', 'name' => 'Inventory', 'type' => 'asset', 'subtype' => 'inventory', 'parent_id' => 1],
            ['code' => '1040', 'name' => 'Prepaid Expenses', 'type' => 'asset', 'subtype' => 'prepaid', 'parent_id' => 1],

            // Fixed Assets
            ['code' => '1500', 'name' => 'Fixed Assets', 'type' => 'asset', 'subtype' => 'fixed_asset', 'parent_id' => null],
            ['code' => '1510', 'name' => 'Equipment', 'type' => 'asset', 'subtype' => 'equipment', 'parent_id' => 9],
            ['code' => '1520', 'name' => 'Accumulated Depreciation - Equipment', 'type' => 'asset', 'subtype' => 'accumulated_depreciation', 'parent_id' => 9],

            // LIABILITIES
            ['code' => '2000', 'name' => 'Current Liabilities', 'type' => 'liability', 'subtype' => 'current_liability', 'parent_id' => null],
            ['code' => '2010', 'name' => 'Accounts Payable', 'type' => 'liability', 'subtype' => 'payable', 'parent_id' => 12],
            ['code' => '2020', 'name' => 'Accrued Expenses', 'type' => 'liability', 'subtype' => 'accrued', 'parent_id' => 12],
            ['code' => '2030', 'name' => 'Sales Tax Payable', 'type' => 'liability', 'subtype' => 'tax_payable', 'parent_id' => 12],
            ['code' => '2040', 'name' => 'Payroll Liabilities', 'type' => 'liability', 'subtype' => 'payroll', 'parent_id' => 12],

            // Long-term Liabilities
            ['code' => '2500', 'name' => 'Long-term Liabilities', 'type' => 'liability', 'subtype' => 'long_term_liability', 'parent_id' => null],
            ['code' => '2510', 'name' => 'Long-term Debt', 'type' => 'liability', 'subtype' => 'debt', 'parent_id' => 17],

            // EQUITY
            ['code' => '3000', 'name' => 'Equity', 'type' => 'equity', 'subtype' => 'equity', 'parent_id' => null],
            ['code' => '3010', 'name' => 'Owner\'s Equity', 'type' => 'equity', 'subtype' => 'owners_equity', 'parent_id' => 19],
            ['code' => '3020', 'name' => 'Retained Earnings', 'type' => 'equity', 'subtype' => 'retained_earnings', 'parent_id' => 19],

            // REVENUE
            ['code' => '4000', 'name' => 'Revenue', 'type' => 'revenue', 'subtype' => 'operating_revenue', 'parent_id' => null],
            ['code' => '4010', 'name' => 'Sales Revenue', 'type' => 'revenue', 'subtype' => 'sales', 'parent_id' => 22],
            ['code' => '4020', 'name' => 'Service Revenue', 'type' => 'revenue', 'subtype' => 'service', 'parent_id' => 22],
            ['code' => '4030', 'name' => 'Other Revenue', 'type' => 'revenue', 'subtype' => 'other_revenue', 'parent_id' => 22],

            // EXPENSES
            ['code' => '5000', 'name' => 'Cost of Goods Sold', 'type' => 'expense', 'subtype' => 'cogs', 'parent_id' => null],
            ['code' => '5010', 'name' => 'Materials', 'type' => 'expense', 'subtype' => 'materials', 'parent_id' => 26],
            ['code' => '5020', 'name' => 'Labor', 'type' => 'expense', 'subtype' => 'labor', 'parent_id' => 26],

            // Operating Expenses
            ['code' => '6000', 'name' => 'Operating Expenses', 'type' => 'expense', 'subtype' => 'operating_expense', 'parent_id' => null],
            ['code' => '6010', 'name' => 'Salaries and Wages', 'type' => 'expense', 'subtype' => 'payroll', 'parent_id' => 29],
            ['code' => '6020', 'name' => 'Rent Expense', 'type' => 'expense', 'subtype' => 'rent', 'parent_id' => 29],
            ['code' => '6030', 'name' => 'Utilities Expense', 'type' => 'expense', 'subtype' => 'utilities', 'parent_id' => 29],
            ['code' => '6040', 'name' => 'Marketing Expense', 'type' => 'expense', 'subtype' => 'marketing', 'parent_id' => 29],
            ['code' => '6050', 'name' => 'Office Supplies', 'type' => 'expense', 'subtype' => 'supplies', 'parent_id' => 29],
            ['code' => '6060', 'name' => 'Professional Services', 'type' => 'expense', 'subtype' => 'professional', 'parent_id' => 29],
            ['code' => '6070', 'name' => 'Insurance Expense', 'type' => 'expense', 'subtype' => 'insurance', 'parent_id' => 29],
            ['code' => '6080', 'name' => 'Depreciation Expense', 'type' => 'expense', 'subtype' => 'depreciation', 'parent_id' => 29],
        ];

        foreach ($accounts as $index => $accountData) {
            Account::create([
                'organization_id' => $organizationId,
                'parent_id' => $accountData['parent_id'],
                'code' => $accountData['code'],
                'name' => $accountData['name'],
                'type' => $accountData['type'],
                'subtype' => $accountData['subtype'],
                'normal_balance' => in_array($accountData['type'], ['asset', 'expense']) ? 'debit' : 'credit',
                'is_active' => true,
                'level' => $accountData['parent_id'] ? 2 : 1,
            ]);
        }
    }

    /**
     * Seed common tax rates
     */
    private function seedTaxRates(): void
    {
        $organizationId = 1; // Assuming first organization

        $taxRates = [
            [
                'name' => 'Sales Tax - California',
                'code' => 'CA_SALES',
                'tax_type' => 'sales_tax',
                'rate' => 7.25,
                'jurisdiction' => 'California',
                'tax_authority' => 'California Department of Tax and Fee Administration',
                'is_active' => true,
            ],
            [
                'name' => 'VAT - Standard Rate',
                'code' => 'VAT_STD',
                'tax_type' => 'vat',
                'rate' => 20.00,
                'jurisdiction' => 'UK',
                'tax_authority' => 'HM Revenue and Customs',
                'is_active' => true,
            ],
            [
                'name' => 'GST - Canada',
                'code' => 'GST_CA',
                'tax_type' => 'gst',
                'rate' => 5.00,
                'jurisdiction' => 'Canada',
                'tax_authority' => 'Canada Revenue Agency',
                'is_active' => true,
            ],
            [
                'name' => 'Federal Income Tax',
                'code' => 'FED_INCOME',
                'tax_type' => 'income_tax',
                'rate' => 22.00,
                'jurisdiction' => 'Federal',
                'tax_authority' => 'Internal Revenue Service',
                'is_active' => true,
            ],
        ];

        foreach ($taxRates as $taxRateData) {
            TaxRate::create(array_merge($taxRateData, [
                'organization_id' => $organizationId,
                'effective_from' => Carbon::now()->startOfYear(),
            ]));
        }
    }

    /**
     * Seed sample budgets
     */
    private function seedSampleBudgets(): void
    {
        $organizationId = 1; // Assuming first organization
        $userId = 1; // Assuming first user

        // Create annual operational budget
        $budget = Budget::create([
            'organization_id' => $organizationId,
            'name' => '2024 Annual Operating Budget',
            'description' => 'Annual operating budget for fiscal year 2024',
            'budget_type' => 'operational',
            'period_type' => 'yearly',
            'start_date' => Carbon::now()->startOfYear(),
            'end_date' => Carbon::now()->endOfYear(),
            'status' => 'active',
            'created_by' => $userId,
            'approved_by' => $userId,
            'approved_at' => Carbon::now(),
        ]);

        // Create budget line items
        $lineItems = [
            ['account_id' => 23, 'category' => 'revenue', 'budgeted_amount' => 500000], // Sales Revenue
            ['account_id' => 24, 'category' => 'revenue', 'budgeted_amount' => 100000], // Service Revenue
            ['account_id' => 30, 'category' => 'expense', 'budgeted_amount' => 120000], // Salaries
            ['account_id' => 31, 'category' => 'expense', 'budgeted_amount' => 24000],  // Rent
            ['account_id' => 32, 'category' => 'expense', 'budgeted_amount' => 12000],  // Utilities
            ['account_id' => 33, 'category' => 'expense', 'budgeted_amount' => 30000],  // Marketing
        ];

        foreach ($lineItems as $itemData) {
            BudgetLineItem::create([
                'organization_id' => $organizationId,
                'budget_id' => $budget->id,
                'account_id' => $itemData['account_id'],
                'category' => $itemData['category'],
                'budgeted_amount' => $itemData['budgeted_amount'],
                'period_start' => $budget->start_date,
                'period_end' => $budget->end_date,
            ]);
        }

        // Update budget total
        $budget->update(['total_amount' => $budget->calculateTotalAmount()]);
    }

    /**
     * Seed sample financial forecasts
     */
    private function seedSampleForecasts(): void
    {
        $organizationId = 1; // Assuming first organization
        $userId = 1; // Assuming first user

        // Create revenue forecast
        $forecast = FinancialForecast::create([
            'organization_id' => $organizationId,
            'name' => '2024 Revenue Forecast',
            'description' => 'Monthly revenue forecast based on historical trends',
            'forecast_type' => 'revenue',
            'period_type' => 'monthly',
            'start_date' => Carbon::now()->startOfYear(),
            'end_date' => Carbon::now()->endOfYear(),
            'base_year' => Carbon::now()->year - 1,
            'methodology' => 'historical_trend',
            'confidence_level' => 85.00,
            'status' => 'active',
            'created_by' => $userId,
            'approved_by' => $userId,
            'approved_at' => Carbon::now(),
            'assumptions' => [
                'growth_rate' => 15.0,
                'seasonal_adjustment' => true,
                'market_conditions' => 'stable',
            ],
        ]);

        // Create forecast line items for each month
        $baseAmount = 45000; // Monthly base
        $current = Carbon::now()->startOfYear();

        while ($current->year === Carbon::now()->year) {
            // Apply seasonal factors (higher in Q4, lower in Q1)
            $seasonalFactor = match ($current->month) {
                1, 2, 3 => 0.85,      // Q1 - slower
                4, 5, 6 => 1.0,       // Q2 - normal
                7, 8, 9 => 1.1,       // Q3 - busy
                10, 11, 12 => 1.25,   // Q4 - peak
            };

            ForecastLineItem::create([
                'organization_id' => $organizationId,
                'financial_forecast_id' => $forecast->id,
                'account_id' => 23, // Sales Revenue account
                'period_start' => $current->copy()->startOfMonth(),
                'period_end' => $current->copy()->endOfMonth(),
                'forecasted_amount' => $baseAmount * $seasonalFactor,
                'growth_rate' => 15.0,
                'seasonality_factor' => $seasonalFactor,
                'confidence_level' => 85.0,
                'methodology' => 'historical_trend',
                'assumptions' => [
                    'base_amount' => $baseAmount,
                    'seasonal_pattern' => 'retail_business',
                ],
            ]);

            $current->addMonth();
        }
    }
}
