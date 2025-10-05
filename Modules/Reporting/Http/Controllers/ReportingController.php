<?php

namespace Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Reporting\Models\FinancialReport;
use Modules\Reporting\Models\ReportSchedule;
use Modules\Reporting\Services\FinancialReportingService;
use Modules\Reporting\Services\AnalyticsService;
use Modules\Reporting\Services\ReportExportService;
use Modules\Shared\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ReportingController extends Controller
{
    /**
     * The financial reporting service.
     */
    protected $reportingService;

    /**
     * The analytics service.
     */
    protected $analyticsService;

    /**
     * The report export service.
     */
    protected $exportService;

    /**
     * Create a new controller instance.
     */
    public function __construct(
        FinancialReportingService $reportingService,
        AnalyticsService $analyticsService,
        ReportExportService $exportService
    ) {
        $this->middleware('auth');
        $this->reportingService = $reportingService;
        $this->analyticsService = $analyticsService;
        $this->exportService = $exportService;
    }

    /**
     * Display the reporting dashboard.
     */
    public function dashboard(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : now()->startOfMonth();
        $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : now()->endOfMonth();
        
        $analytics = $this->analyticsService->getDashboardAnalytics($organization, $startDate, $endDate);
        
        $recentReports = FinancialReport::where('organization_id', $organization->id)
            ->where('status', FinancialReport::STATUS_COMPLETED)
            ->orderBy('generated_at', 'desc')
            ->limit(10)
            ->get();

        if ($request->wantsJson()) {
            return response()->json([
                'analytics' => $analytics,
                'recent_reports' => $recentReports,
                'period' => [
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                ],
            ]);
        }

        return view('reporting::dashboard', compact('analytics', 'recentReports', 'organization', 'startDate', 'endDate'));
    }

    /**
     * Generate Balance Sheet
     */
    public function balanceSheet(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $validatedData = $request->validate([
            'as_of_date' => 'nullable|date',
            'currency' => 'nullable|string|size:3',
            'include_comparison' => 'boolean',
            'comparison_date' => 'nullable|date',
            'export_format' => 'nullable|in:' . implode(',', array_keys(FinancialReport::getExportFormats())),
        ]);

        $asOfDate = isset($validatedData['as_of_date']) 
            ? Carbon::parse($validatedData['as_of_date']) 
            : now();
        
        $currency = $validatedData['currency'] ?? $organization->currency;
        $includeComparison = $validatedData['include_comparison'] ?? false;
        $comparisonDate = isset($validatedData['comparison_date']) 
            ? Carbon::parse($validatedData['comparison_date']) 
            : null;

        try {
            $balanceSheet = $this->reportingService->generateBalanceSheet(
                $organization,
                $asOfDate,
                $currency,
                $includeComparison,
                $comparisonDate
            );

            // Handle export request
            if (!empty($validatedData['export_format'])) {
                return $this->exportReport(
                    $balanceSheet,
                    FinancialReport::TYPE_BALANCE_SHEET,
                    $validatedData['export_format'],
                    $organization
                );
            }

            if ($request->wantsJson()) {
                return response()->json(['balance_sheet' => $balanceSheet]);
            }

            return view('reporting::balance-sheet', compact('balanceSheet', 'organization'));
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to generate balance sheet.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to generate balance sheet: ' . $e->getMessage()]);
        }
    }

    /**
     * Generate Income Statement
     */
    public function incomeStatement(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $validatedData = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'currency' => 'nullable|string|size:3',
            'include_comparison' => 'boolean',
            'comparison_start_date' => 'nullable|date',
            'comparison_end_date' => 'nullable|date|after_or_equal:comparison_start_date',
            'export_format' => 'nullable|in:' . implode(',', array_keys(FinancialReport::getExportFormats())),
        ]);

        $startDate = isset($validatedData['start_date']) 
            ? Carbon::parse($validatedData['start_date']) 
            : now()->startOfMonth();
        
        $endDate = isset($validatedData['end_date']) 
            ? Carbon::parse($validatedData['end_date']) 
            : now()->endOfMonth();
        
        $currency = $validatedData['currency'] ?? $organization->currency;
        $includeComparison = $validatedData['include_comparison'] ?? false;
        
        $comparisonStartDate = isset($validatedData['comparison_start_date']) 
            ? Carbon::parse($validatedData['comparison_start_date']) 
            : null;
        
        $comparisonEndDate = isset($validatedData['comparison_end_date']) 
            ? Carbon::parse($validatedData['comparison_end_date']) 
            : null;

        try {
            $incomeStatement = $this->reportingService->generateIncomeStatement(
                $organization,
                $startDate,
                $endDate,
                $currency,
                $includeComparison,
                $comparisonStartDate,
                $comparisonEndDate
            );

            // Handle export request
            if (!empty($validatedData['export_format'])) {
                return $this->exportReport(
                    $incomeStatement,
                    FinancialReport::TYPE_INCOME_STATEMENT,
                    $validatedData['export_format'],
                    $organization
                );
            }

            if ($request->wantsJson()) {
                return response()->json(['income_statement' => $incomeStatement]);
            }

            return view('reporting::income-statement', compact('incomeStatement', 'organization'));
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to generate income statement.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to generate income statement: ' . $e->getMessage()]);
        }
    }

    /**
     * Generate Cash Flow Statement
     */
    public function cashFlowStatement(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $validatedData = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'currency' => 'nullable|string|size:3',
            'export_format' => 'nullable|in:' . implode(',', array_keys(FinancialReport::getExportFormats())),
        ]);

        $startDate = isset($validatedData['start_date']) 
            ? Carbon::parse($validatedData['start_date']) 
            : now()->startOfMonth();
        
        $endDate = isset($validatedData['end_date']) 
            ? Carbon::parse($validatedData['end_date']) 
            : now()->endOfMonth();
        
        $currency = $validatedData['currency'] ?? $organization->currency;

        try {
            $cashFlowStatement = $this->reportingService->generateCashFlowStatement(
                $organization,
                $startDate,
                $endDate,
                $currency
            );

            // Handle export request
            if (!empty($validatedData['export_format'])) {
                return $this->exportReport(
                    $cashFlowStatement,
                    FinancialReport::TYPE_CASH_FLOW,
                    $validatedData['export_format'],
                    $organization
                );
            }

            if ($request->wantsJson()) {
                return response()->json(['cash_flow_statement' => $cashFlowStatement]);
            }

            return view('reporting::cash-flow-statement', compact('cashFlowStatement', 'organization'));
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to generate cash flow statement.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to generate cash flow statement: ' . $e->getMessage()]);
        }
    }

    /**
     * Generate Trial Balance
     */
    public function trialBalance(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $validatedData = $request->validate([
            'as_of_date' => 'nullable|date',
            'currency' => 'nullable|string|size:3',
            'include_zero_balances' => 'boolean',
            'export_format' => 'nullable|in:' . implode(',', array_keys(FinancialReport::getExportFormats())),
        ]);

        $asOfDate = isset($validatedData['as_of_date']) 
            ? Carbon::parse($validatedData['as_of_date']) 
            : now();
        
        $currency = $validatedData['currency'] ?? $organization->currency;
        $includeZeroBalances = $validatedData['include_zero_balances'] ?? false;

        try {
            $trialBalance = $this->reportingService->generateTrialBalance(
                $organization,
                $asOfDate,
                $currency,
                $includeZeroBalances
            );

            // Handle export request
            if (!empty($validatedData['export_format'])) {
                return $this->exportReport(
                    $trialBalance,
                    FinancialReport::TYPE_TRIAL_BALANCE,
                    $validatedData['export_format'],
                    $organization
                );
            }

            if ($request->wantsJson()) {
                return response()->json(['trial_balance' => $trialBalance]);
            }

            return view('reporting::trial-balance', compact('trialBalance', 'organization'));
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to generate trial balance.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to generate trial balance: ' . $e->getMessage()]);
        }
    }

    /**
     * Get analytics data
     */
    public function analytics(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $validatedData = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'metrics' => 'nullable|array',
            'metrics.*' => 'string|in:financial_overview,revenue_analytics,expense_analytics,cash_flow_analytics,kpis,trends',
        ]);

        $startDate = isset($validatedData['start_date']) 
            ? Carbon::parse($validatedData['start_date']) 
            : now()->startOfMonth();
        
        $endDate = isset($validatedData['end_date']) 
            ? Carbon::parse($validatedData['end_date']) 
            : now()->endOfMonth();

        try {
            $analytics = $this->analyticsService->getDashboardAnalytics($organization, $startDate, $endDate);

            // Filter analytics if specific metrics requested
            if (!empty($validatedData['metrics'])) {
                $analytics = array_intersect_key($analytics, array_flip($validatedData['metrics']));
            }

            return response()->json([
                'analytics' => $analytics,
                'period' => [
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate analytics.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * List financial reports
     */
    public function reports(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $query = FinancialReport::where('organization_id', $organization->id)
            ->with(['generatedBy']);

        // Apply filters
        if ($request->has('report_type')) {
            $query->where('report_type', $request->get('report_type'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('start_date')) {
            $query->where('start_date', '>=', $request->get('start_date'));
        }

        if ($request->has('end_date')) {
            $query->where('end_date', '<=', $request->get('end_date'));
        }

        $reports = $query->orderBy('generated_at', 'desc')
            ->paginate($request->get('per_page', 15));

        if ($request->wantsJson()) {
            return response()->json([
                'reports' => $reports,
                'report_types' => FinancialReport::getReportTypes(),
                'statuses' => FinancialReport::getStatuses(),
            ]);
        }

        return view('reporting::reports', compact('reports', 'organization'));
    }

    /**
     * Show a specific financial report
     */
    public function showReport(FinancialReport $report)
    {
        $this->authorize('view', $report);

        if (request()->wantsJson()) {
            return response()->json(['report' => $report]);
        }

        return view('reporting::show-report', compact('report'));
    }

    /**
     * Delete a financial report
     */
    public function deleteReport(FinancialReport $report)
    {
        $this->authorize('delete', $report);

        try {
            // Delete associated file if exists
            if ($report->file_path && \Storage::disk('local')->exists($report->file_path)) {
                \Storage::disk('local')->delete($report->file_path);
            }

            $report->delete();

            if (request()->wantsJson()) {
                return response()->json(['message' => 'Report deleted successfully.']);
            }

            return redirect()->route('reporting.reports')
                           ->with('success', 'Report deleted successfully.');
        } catch (\Exception $e) {
            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to delete report.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to delete report: ' . $e->getMessage()]);
        }
    }

    /**
     * List report schedules
     */
    public function schedules(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $schedules = ReportSchedule::where('organization_id', $organization->id)
            ->with(['financialReport', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        if ($request->wantsJson()) {
            return response()->json([
                'schedules' => $schedules,
                'frequencies' => ReportSchedule::getFrequencies(),
            ]);
        }

        return view('reporting::schedules', compact('schedules', 'organization'));
    }

    /**
     * Create a new report schedule
     */
    public function createSchedule(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $validatedData = $request->validate([
            'financial_report_id' => 'required|exists:financial_reports,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'frequency' => 'required|in:' . implode(',', array_keys(ReportSchedule::getFrequencies())),
            'frequency_config' => 'nullable|array',
            'recipients' => 'required|array|min:1',
            'recipients.*' => 'email',
            'export_formats' => 'required|array|min:1',
            'export_formats.*' => 'in:' . implode(',', array_keys(FinancialReport::getExportFormats())),
            'is_active' => 'boolean',
        ]);

        try {
            $validatedData['organization_id'] = $organization->id;
            $validatedData['created_by'] = auth()->id();

            $schedule = ReportSchedule::create($validatedData);

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Report schedule created successfully.',
                    'schedule' => $schedule,
                ], 201);
            }

            return redirect()->route('reporting.schedules')
                           ->with('success', 'Report schedule created successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to create report schedule.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withInput()
                        ->withErrors(['error' => 'Failed to create report schedule: ' . $e->getMessage()]);
        }
    }

    /**
     * Export report to specified format
     */
    protected function exportReport(array $reportData, string $reportType, string $format, Organization $organization)
    {
        try {
            $export = $this->exportService->exportReport($reportData, $reportType, $format, $organization);
            
            return response()->download(
                storage_path('app/' . $export['file_path']),
                basename($export['file_path']),
                ['Content-Type' => $export['mime_type']]
            );
        } catch (\Exception $e) {
            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to export report.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to export report: ' . $e->getMessage()]);
        }
    }

    /**
     * Clear report cache
     */
    public function clearCache(Request $request)
    {
        $organization = $this->getCurrentOrganization();
        
        $reportType = $request->get('report_type');
        
        try {
            $this->reportingService->clearReportCache($organization, $reportType);

            if ($request->wantsJson()) {
                return response()->json(['message' => 'Report cache cleared successfully.']);
            }

            return back()->with('success', 'Report cache cleared successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to clear cache.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to clear cache: ' . $e->getMessage()]);
        }
    }

    /**
     * Get the current organization.
     */
    protected function getCurrentOrganization(): Organization
    {
        $user = Auth::user();
        
        if (!$user->organization_id) {
            throw new \Exception('User is not associated with an organization.');
        }

        return Organization::findOrFail($user->organization_id);
    }
}

