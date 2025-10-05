<?php

namespace Modules\Reporting\Jobs;

use Modules\Reporting\Models\ReportSchedule;
use Modules\Reporting\Models\ReportExecution;
use Modules\Reporting\Models\FinancialReport;
use Modules\Reporting\Services\FinancialReportingService;
use Modules\Reporting\Services\ReportExportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class GenerateScheduledReports implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     */
    public $timeout = 300; // 5 minutes

    /**
     * Execute the job.
     */
    public function handle(
        FinancialReportingService $reportingService,
        ReportExportService $exportService
    ): void {
        Log::info('Starting scheduled report generation job');

        $schedules = ReportSchedule::with(['organization', 'financialReport'])
            ->dueToRun()
            ->get();

        Log::info('Found ' . $schedules->count() . ' schedules due to run');

        foreach ($schedules as $schedule) {
            try {
                $this->generateScheduledReport($schedule, $reportingService, $exportService);
            } catch (\Exception $e) {
                Log::error('Failed to generate scheduled report for schedule ' . $schedule->id . ': ' . $e->getMessage(), [
                    'schedule_id' => $schedule->id,
                    'organization_id' => $schedule->organization_id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        Log::info('Completed scheduled report generation job');
    }

    /**
     * Generate a scheduled report
     */
    protected function generateScheduledReport(
        ReportSchedule $schedule,
        FinancialReportingService $reportingService,
        ReportExportService $exportService
    ): void {
        Log::info('Generating scheduled report', [
            'schedule_id' => $schedule->id,
            'organization_id' => $schedule->organization_id,
            'report_type' => $schedule->financialReport->report_type ?? 'unknown',
        ]);

        // Create execution record
        $execution = ReportExecution::create([
            'organization_id' => $schedule->organization_id,
            'report_schedule_id' => $schedule->id,
            'status' => ReportExecution::STATUS_RUNNING,
            'started_at' => now(),
        ]);

        try {
            // Determine report period based on frequency
            $period = $this->calculateReportPeriod($schedule);
            
            // Generate the report data
            $reportData = $this->generateReportData(
                $schedule,
                $reportingService,
                $period['start_date'],
                $period['end_date']
            );

            // Create financial report record
            $financialReport = FinancialReport::create([
                'organization_id' => $schedule->organization_id,
                'report_type' => $schedule->financialReport->report_type,
                'report_name' => $schedule->name . ' - ' . now()->format('M j, Y'),
                'period_type' => FinancialReport::PERIOD_CUSTOM,
                'start_date' => $period['start_date'],
                'end_date' => $period['end_date'],
                'currency' => $schedule->organization->currency,
                'status' => FinancialReport::STATUS_GENERATING,
                'generated_by' => null, // System generated
            ]);

            // Export reports in requested formats
            $exportedFiles = [];
            foreach ($schedule->export_formats as $format) {
                try {
                    $export = $exportService->exportReport(
                        $reportData,
                        $schedule->financialReport->report_type,
                        $format,
                        $schedule->organization,
                        $financialReport->generateFilename() . '-' . $format
                    );
                    
                    $exportedFiles[] = $export;
                } catch (\Exception $e) {
                    Log::warning('Failed to export report in format ' . $format, [
                        'schedule_id' => $schedule->id,
                        'format' => $format,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Mark financial report as completed
            $financialReport->markAsCompleted($reportData, [
                'generated_by_schedule' => $schedule->id,
                'exported_formats' => array_column($exportedFiles, 'file_path'),
            ]);

            // Update execution record
            $execution->update([
                'financial_report_id' => $financialReport->id,
            ]);

            // Send email notifications
            if (!empty($exportedFiles)) {
                $this->sendReportNotifications($schedule, $financialReport, $exportedFiles);
            }

            // Mark execution as completed
            $execution->markAsCompleted(
                $exportedFiles[0]['file_path'] ?? null,
                $exportedFiles[0]['file_size'] ?? null
            );

            // Update schedule
            $schedule->markAsExecuted();

            Log::info('Successfully generated scheduled report', [
                'schedule_id' => $schedule->id,
                'financial_report_id' => $financialReport->id,
                'exported_files' => count($exportedFiles),
            ]);

        } catch (\Exception $e) {
            // Mark execution as failed
            $execution->markAsFailed($e->getMessage());

            // Mark financial report as failed if it was created
            if (isset($financialReport)) {
                $financialReport->markAsFailed($e->getMessage());
            }

            throw $e;
        }
    }

    /**
     * Calculate report period based on schedule frequency
     */
    protected function calculateReportPeriod(ReportSchedule $schedule): array
    {
        $now = now();
        
        switch ($schedule->frequency) {
            case ReportSchedule::FREQUENCY_DAILY:
                return [
                    'start_date' => $now->copy()->subDay()->startOfDay(),
                    'end_date' => $now->copy()->subDay()->endOfDay(),
                ];
                
            case ReportSchedule::FREQUENCY_WEEKLY:
                return [
                    'start_date' => $now->copy()->subWeek()->startOfWeek(),
                    'end_date' => $now->copy()->subWeek()->endOfWeek(),
                ];
                
            case ReportSchedule::FREQUENCY_MONTHLY:
                return [
                    'start_date' => $now->copy()->subMonth()->startOfMonth(),
                    'end_date' => $now->copy()->subMonth()->endOfMonth(),
                ];
                
            case ReportSchedule::FREQUENCY_QUARTERLY:
                return [
                    'start_date' => $now->copy()->subQuarter()->startOfQuarter(),
                    'end_date' => $now->copy()->subQuarter()->endOfQuarter(),
                ];
                
            case ReportSchedule::FREQUENCY_YEARLY:
                return [
                    'start_date' => $now->copy()->subYear()->startOfYear(),
                    'end_date' => $now->copy()->subYear()->endOfYear(),
                ];
                
            default:
                // Default to previous month
                return [
                    'start_date' => $now->copy()->subMonth()->startOfMonth(),
                    'end_date' => $now->copy()->subMonth()->endOfMonth(),
                ];
        }
    }

    /**
     * Generate report data based on report type
     */
    protected function generateReportData(
        ReportSchedule $schedule,
        FinancialReportingService $reportingService,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $reportType = $schedule->financialReport->report_type;
        $organization = $schedule->organization;
        $currency = $organization->currency;

        switch ($reportType) {
            case FinancialReport::TYPE_BALANCE_SHEET:
                return $reportingService->generateBalanceSheet($organization, $endDate, $currency);
                
            case FinancialReport::TYPE_INCOME_STATEMENT:
                return $reportingService->generateIncomeStatement($organization, $startDate, $endDate, $currency);
                
            case FinancialReport::TYPE_CASH_FLOW:
                return $reportingService->generateCashFlowStatement($organization, $startDate, $endDate, $currency);
                
            case FinancialReport::TYPE_TRIAL_BALANCE:
                return $reportingService->generateTrialBalance($organization, $endDate, $currency);
                
            default:
                throw new \InvalidArgumentException('Unsupported report type: ' . $reportType);
        }
    }

    /**
     * Send report notifications via email
     */
    protected function sendReportNotifications(
        ReportSchedule $schedule,
        FinancialReport $financialReport,
        array $exportedFiles
    ): void {
        try {
            foreach ($schedule->recipients as $recipient) {
                Mail::send('reporting::emails.scheduled-report', [
                    'schedule' => $schedule,
                    'report' => $financialReport,
                    'organization' => $schedule->organization,
                ], function ($message) use ($recipient, $schedule, $exportedFiles) {
                    $message->to($recipient)
                           ->subject($schedule->organization->name . ' - ' . $schedule->name);
                    
                    // Attach exported files
                    foreach ($exportedFiles as $file) {
                        if (file_exists(storage_path('app/' . $file['file_path']))) {
                            $message->attach(
                                storage_path('app/' . $file['file_path']),
                                [
                                    'as' => basename($file['file_path']),
                                    'mime' => $file['mime_type'],
                                ]
                            );
                        }
                    }
                });
            }

            Log::info('Sent report notifications', [
                'schedule_id' => $schedule->id,
                'recipients' => count($schedule->recipients),
                'attachments' => count($exportedFiles),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send report notifications', [
                'schedule_id' => $schedule->id,
                'error' => $e->getMessage(),
            ]);
            
            // Don't throw the exception as the report was generated successfully
        }
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Scheduled report generation job failed', [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}

