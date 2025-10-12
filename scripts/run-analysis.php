<?php
/**
 * Batch Analysis Runner
 * 
 * This script runs the complete analysis and fixing process
 */

class BatchAnalysisRunner
{
    private string $basePath;
    private array $config;
    
    public function __construct(string $basePath = '.')
    {
        $this->basePath = rtrim($basePath, '/');
        $this->config = $this->loadConfig();
    }
    
    /**
     * Load configuration
     */
    private function loadConfig(): array
    {
        return [
            'analysis' => [
                'enabled' => true,
                'output_file' => 'syntax-analysis-report.json'
            ],
            'fixes' => [
                'enabled' => true,
                'dry_run' => false,
                'create_backups' => true,
                'phases' => [
                    'critical' => true,
                    'warnings' => true,
                    'quality' => true
                ]
            ],
            'reporting' => [
                'console' => true,
                'html' => true,
                'json' => true
            ]
        ];
    }
    
    /**
     * Run complete analysis and fixing process
     */
    public function run(): void
    {
        $this->printHeader();
        
        try {
            // Step 1: Run Analysis
            if ($this->config['analysis']['enabled']) {
                $this->runAnalysis();
            }
            
            // Step 2: Run Fixes
            if ($this->config['fixes']['enabled']) {
                $this->runFixes();
            }
            
            // Step 3: Generate Reports
            $this->generateReports();
            
            $this->printFooter();
            
        } catch (Exception $e) {
            echo "❌ Error: " . $e->getMessage() . "\n";
            exit(1);
        }
    }
    
    /**
     * Print header
     */
    private function printHeader(): void
    {
        echo str_repeat("=", 80) . "\n";
        echo "🚀 LARAVEL BACKEND SYNTAX ANALYSIS & FIXING SUITE\n";
        echo str_repeat("=", 80) . "\n";
        echo "📁 Base Path: {$this->basePath}\n";
        echo "⏰ Started: " . date('Y-m-d H:i:s') . "\n";
        echo str_repeat("-", 80) . "\n\n";
    }
    
    /**
     * Run syntax analysis
     */
    private function runAnalysis(): void
    {
        echo "🔍 STEP 1: Running Syntax Analysis\n";
        echo str_repeat("-", 40) . "\n";
        
        $startTime = microtime(true);
        
        // Include and run analyzer
        require_once __DIR__ . '/syntax-analyzer.php';
        
        $analyzer = new SyntaxAnalyzer($this->basePath);
        $report = $analyzer->scanProject();
        
        // Save report
        $reportFile = $this->config['analysis']['output_file'];
        file_put_contents($reportFile, json_encode($report, JSON_PRETTY_PRINT));
        
        $duration = round(microtime(true) - $startTime, 2);
        
        echo "✅ Analysis completed in {$duration}s\n";
        echo "📊 Report saved to: {$reportFile}\n";
        echo "🏥 Health Score: {$report['summary']['health_score']}/100\n\n";
        
        // Print quick summary
        $this->printQuickSummary($report);
    }
    
    /**
     * Run fixes
     */
    private function runFixes(): void
    {
        echo "🔧 STEP 2: Running Parallel Fixes\n";
        echo str_repeat("-", 40) . "\n";
        
        $reportFile = $this->config['analysis']['output_file'];
        
        if (!file_exists($reportFile)) {
            throw new Exception("Analysis report not found: {$reportFile}");
        }
        
        $startTime = microtime(true);
        
        // Include and run fixer
        require_once __DIR__ . '/parallel-fixer.php';
        
        $report = json_decode(file_get_contents($reportFile), true);
        $fixer = new ParallelSyntaxFixer($this->basePath, $this->config['fixes']['dry_run']);
        $fixer->executeParallelFixes($report);
        
        $duration = round(microtime(true) - $startTime, 2);
        
        echo "✅ Fixes completed in {$duration}s\n\n";
    }
    
    /**
     * Generate reports
     */
    private function generateReports(): void
    {
        echo "📋 STEP 3: Generating Reports\n";
        echo str_repeat("-", 40) . "\n";
        
        $reportFile = $this->config['analysis']['output_file'];
        $report = json_decode(file_get_contents($reportFile), true);
        
        // Generate HTML report
        if ($this->config['reporting']['html']) {
            $this->generateHtmlReport($report);
        }
        
        // Generate summary report
        $this->generateSummaryReport($report);
        
        echo "✅ Reports generated\n\n";
    }
    
    /**
     * Generate HTML report
     */
    private function generateHtmlReport(array $report): void
    {
        $html = $this->buildHtmlReport($report);
        file_put_contents('syntax-analysis-report.html', $html);
        echo "📄 HTML report: syntax-analysis-report.html\n";
    }
    
    /**
     * Build HTML report content
     */
    private function buildHtmlReport(array $report): string
    {
        $healthScore = $report['summary']['health_score'];
        $healthColor = $healthScore >= 80 ? 'green' : ($healthScore >= 60 ? 'orange' : 'red');
        
        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laravel Backend Syntax Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #007bff; }
        .health-score { font-size: 3em; color: {$healthColor}; }
        .issues-section { margin-top: 30px; }
        .file-issues { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .issue { margin: 5px 0; padding: 8px; border-radius: 4px; }
        .critical { background: #ffebee; border-left: 4px solid #f44336; }
        .warning { background: #fff3e0; border-left: 4px solid #ff9800; }
        .info { background: #e3f2fd; border-left: 4px solid #2196f3; }
        .issue-type { font-weight: bold; text-transform: uppercase; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Laravel Backend Syntax Analysis Report</h1>
            <p>Generated on: {$this->getCurrentDateTime()}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">{$report['stats']['total_files']}</div>
                <div>Total Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{$report['stats']['files_with_issues']}</div>
                <div>Files with Issues</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{$report['stats']['critical_issues']}</div>
                <div>Critical Issues</div>
            </div>
            <div class="stat-card">
                <div class="health-score">{$healthScore}</div>
                <div>Health Score</div>
            </div>
        </div>
        
        <div class="issues-section">
            <h2>📋 Detailed Issues</h2>
HTML;
        
        foreach ($report['issues'] as $file => $issues) {
            $html .= "<div class='file-issues'>";
            $html .= "<h3>📄 {$file}</h3>";
            
            foreach ($issues as $issue) {
                $typeClass = $issue['type'];
                $line = $issue['line'] ? " (Line {$issue['line']})" : "";
                
                $html .= "<div class='issue {$typeClass}'>";
                $html .= "<span class='issue-type'>{$issue['type']}</span> ";
                $html .= "[{$issue['category']}] {$issue['message']}{$line}";
                $html .= "</div>";
            }
            
            $html .= "</div>";
        }
        
        $html .= <<<HTML
        </div>
    </div>
</body>
</html>
HTML;
        
        return $html;
    }
    
    /**
     * Generate summary report
     */
    private function generateSummaryReport(array $report): void
    {
        $summary = [
            'timestamp' => date('Y-m-d H:i:s'),
            'stats' => $report['stats'],
            'health_score' => $report['summary']['health_score'],
            'critical_files' => $report['summary']['critical_files'],
            'recommendations' => $this->generateRecommendations($report)
        ];
        
        file_put_contents('syntax-analysis-summary.json', json_encode($summary, JSON_PRETTY_PRINT));
        echo "📊 Summary report: syntax-analysis-summary.json\n";
    }
    
    /**
     * Generate recommendations
     */
    private function generateRecommendations(array $report): array
    {
        $recommendations = [];
        
        if ($report['stats']['critical_issues'] > 0) {
            $recommendations[] = "🚨 Address {$report['stats']['critical_issues']} critical issues immediately";
        }
        
        if ($report['stats']['deprecated_patterns'] > 0) {
            $recommendations[] = "⚠️ Update {$report['stats']['deprecated_patterns']} deprecated patterns";
        }
        
        if ($report['stats']['missing_type_hints'] > 10) {
            $recommendations[] = "📝 Consider adding type hints to improve code quality";
        }
        
        if ($report['summary']['health_score'] < 70) {
            $recommendations[] = "🏥 Health score is low - prioritize code quality improvements";
        }
        
        return $recommendations;
    }
    
    /**
     * Print quick summary
     */
    private function printQuickSummary(array $report): void
    {
        echo "📊 QUICK SUMMARY:\n";
        echo "  🚨 Critical: {$report['stats']['critical_issues']}\n";
        echo "  ⚠️  Warnings: {$report['stats']['warning_issues']}\n";
        echo "  ℹ️  Info: {$report['stats']['info_issues']}\n";
        echo "  🏥 Health: {$report['summary']['health_score']}/100\n\n";
    }
    
    /**
     * Print footer
     */
    private function printFooter(): void
    {
        echo str_repeat("=", 80) . "\n";
        echo "✅ ANALYSIS & FIXING COMPLETE\n";
        echo str_repeat("=", 80) . "\n";
        echo "⏰ Finished: " . date('Y-m-d H:i:s') . "\n";
        echo "📋 Check generated reports for detailed results\n";
        echo "🔧 Review fixed files and test your application\n\n";
    }
    
    /**
     * Get current date time
     */
    private function getCurrentDateTime(): string
    {
        return date('Y-m-d H:i:s');
    }
}

// Run if called directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $basePath = $argv[1] ?? '.';
    
    $runner = new BatchAnalysisRunner($basePath);
    $runner->run();
}

