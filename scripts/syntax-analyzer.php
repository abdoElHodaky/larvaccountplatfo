<?php
/**
 * Laravel Backend Syntax Analyzer
 * 
 * This script systematically scans and analyzes PHP files for syntax issues,
 * deprecated patterns, and code quality problems.
 */

class SyntaxAnalyzer
{
    private array $issues = [];
    private array $stats = [];
    private string $basePath;
    
    public function __construct(string $basePath = '.')
    {
        $this->basePath = rtrim($basePath, '/');
        $this->initializeStats();
    }
    
    private function initializeStats(): void
    {
        $this->stats = [
            'total_files' => 0,
            'files_with_issues' => 0,
            'critical_issues' => 0,
            'warning_issues' => 0,
            'info_issues' => 0,
            'deprecated_patterns' => 0,
            'missing_type_hints' => 0,
            'inconsistent_constants' => 0,
        ];
    }
    
    /**
     * Scan all PHP files in the project
     */
    public function scanProject(): array
    {
        $phpFiles = $this->findPhpFiles();
        
        echo "🔍 Scanning {$this->stats['total_files']} PHP files...\n";
        
        foreach ($phpFiles as $file) {
            $this->analyzeFile($file);
        }
        
        return $this->generateReport();
    }
    
    /**
     * Find all PHP files in the project
     */
    private function findPhpFiles(): array
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->basePath)
        );
        
        $phpFiles = [];
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                // Skip vendor and node_modules directories
                $path = $file->getPathname();
                if (strpos($path, '/vendor/') === false && 
                    strpos($path, '/node_modules/') === false) {
                    $phpFiles[] = $path;
                    $this->stats['total_files']++;
                }
            }
        }
        
        return $phpFiles;
    }
    
    /**
     * Analyze a single PHP file
     */
    private function analyzeFile(string $filePath): void
    {
        $content = file_get_contents($filePath);
        $relativePath = str_replace($this->basePath . '/', '', $filePath);
        
        $fileIssues = [];
        
        // Check for syntax errors (basic)
        $fileIssues = array_merge($fileIssues, $this->checkBasicSyntax($content, $relativePath));
        
        // Check for deprecated patterns
        $fileIssues = array_merge($fileIssues, $this->checkDeprecatedPatterns($content, $relativePath));
        
        // Check for missing imports
        $fileIssues = array_merge($fileIssues, $this->checkMissingImports($content, $relativePath));
        
        // Check for inconsistent constants
        $fileIssues = array_merge($fileIssues, $this->checkInconsistentConstants($content, $relativePath));
        
        // Check for missing type hints
        $fileIssues = array_merge($fileIssues, $this->checkMissingTypeHints($content, $relativePath));
        
        // Check for suspicious file names
        $fileIssues = array_merge($fileIssues, $this->checkSuspiciousFileNames($filePath, $relativePath));
        
        if (!empty($fileIssues)) {
            $this->issues[$relativePath] = $fileIssues;
            $this->stats['files_with_issues']++;
        }
    }
    
    /**
     * Check for basic syntax issues
     */
    private function checkBasicSyntax(string $content, string $file): array
    {
        $issues = [];
        
        // Check for unclosed brackets/braces
        $openBraces = substr_count($content, '{');
        $closeBraces = substr_count($content, '}');
        
        if ($openBraces !== $closeBraces) {
            $issues[] = [
                'type' => 'critical',
                'category' => 'syntax',
                'message' => 'Mismatched braces: ' . $openBraces . ' opening, ' . $closeBraces . ' closing',
                'line' => null
            ];
            $this->stats['critical_issues']++;
        }
        
        // Check for missing semicolons (basic check)
        $lines = explode("\n", $content);
        foreach ($lines as $lineNum => $line) {
            $trimmed = trim($line);
            
            // Skip comments and empty lines
            if (empty($trimmed) || strpos($trimmed, '//') === 0 || strpos($trimmed, '/*') === 0) {
                continue;
            }
            
            // Check for statements that should end with semicolon
            if (preg_match('/^\s*(return|echo|print|throw|break|continue)\s+.*[^;{}]\s*$/', $trimmed)) {
                $issues[] = [
                    'type' => 'critical',
                    'category' => 'syntax',
                    'message' => 'Missing semicolon',
                    'line' => $lineNum + 1
                ];
                $this->stats['critical_issues']++;
            }
        }
        
        return $issues;
    }
    
    /**
     * Check for deprecated Laravel patterns
     */
    private function checkDeprecatedPatterns(string $content, string $file): array
    {
        $issues = [];
        
        // Check for deprecated $dates property
            $this->stats['deprecated_patterns']++;
            $this->stats['warning_issues']++;
        }
        
        // Check for old array syntax
        if (preg_match('/array\s*\(/', $content)) {
            $issues[] = [
                'type' => 'info',
                'category' => 'deprecated',
                'message' => 'Old array syntax found. Consider using [] syntax.',
                'line' => $this->getLineNumber($content, 'array(')
            ];
            $this->stats['info_issues']++;
        }
        
        return $issues;
    }
    
    /**
     * Check for missing import statements
     */
    private function checkMissingImports(string $content, string $file): array
    {
        $issues = [];
        
        // Check for common Laravel classes without imports
        $commonClasses = [
            'Builder' => 'Illuminate\Database\Eloquent\Builder',
            'Collection' => 'Illuminate\Database\Eloquent\Collection',
            'Model' => 'Illuminate\Database\Eloquent\Model',
            'Request' => 'Illuminate\Http\Request',
            'Response' => 'Illuminate\Http\Response',
        ];
        
        foreach ($commonClasses as $class => $fullClass) {
            if (preg_match('/\b' . $class . '\b/', $content) && 
                !preg_match('/use\s+' . preg_quote($fullClass, '/') . '/', $content)) {
                
                $issues[] = [
                    'type' => 'warning',
                    'category' => 'imports',
                    'message' => "Possible missing import for {$class}. Consider adding: use {$fullClass};",
                    'line' => $this->getLineNumber($content, $class)
                ];
                $this->stats['warning_issues']++;
            }
        }
        
        // Check for incorrect namespace references
        if (preg_match('/use\s+Modules\\\\/', $content)) {
            $issues[] = [
                'type' => 'critical',
                'category' => 'imports',
                'message' => 'Incorrect namespace reference: Modules\\ should likely be App\\',
                'line' => $this->getLineNumber($content, 'use App\\')
            ];
            $this->stats['critical_issues']++;
        }
        
        return $issues;
    }
    
    /**
     * Check for inconsistent constant declarations
     */
    private function checkInconsistentConstants(string $content, string $file): array
    {
        $issues = [];
        
        // Find all constant declarations
        preg_match_all('/^\s*(public\s+)?const\s+\w+/m', $content, $matches, PREG_OFFSET_CAPTURE);
        
        $hasPublicConst = false;
        $hasPlainConst = false;
        
        foreach ($matches[0] as $match) {
            if (strpos($match[0], 'public const') !== false) {
                $hasPublicConst = true;
            } else {
                $hasPlainConst = true;
            }
        }
        
        if ($hasPublicConst && $hasPlainConst) {
            $issues[] = [
                'type' => 'warning',
                'category' => 'consistency',
                'message' => 'Inconsistent constant declarations. Mix of "const" and "public const" found.',
                'line' => null
            ];
            $this->stats['inconsistent_constants']++;
            $this->stats['warning_issues']++;
        }
        
        return $issues;
    }
    
    /**
     * Check for missing type hints
     */
    private function checkMissingTypeHints(string $content, string $file): array
    {
        $issues = [];
        
        // Check for scope methods without return type hints
        preg_match_all('/public\s+function\s+scope\w+\s*\([^)]*\)\s*(?!:\s*\w)/', $content, $matches, PREG_OFFSET_CAPTURE);
        
        foreach ($matches[0] as $match) {
            $issues[] = [
                'type' => 'info',
                'category' => 'type_hints',
                'message' => 'Scope method missing return type hint. Consider adding ": Builder"',
                'line' => $this->getLineNumber($content, $match[0])
            ];
            $this->stats['missing_type_hints']++;
            $this->stats['info_issues']++;
        }
        
        return $issues;
    }
    
    /**
     * Check for suspicious file names
     */
    private function checkSuspiciousFileNames(string $filePath, string $relativePath): array
    {
        $issues = [];
        
        $suspiciousNames = ['for.php', 'that.php', 'with.php'];
        $fileName = basename($filePath);
        
        if (in_array($fileName, $suspiciousNames)) {
            $issues[] = [
                'type' => 'warning',
                'category' => 'naming',
                'message' => "Suspicious file name: {$fileName}. Consider using a more descriptive name.",
                'line' => null
            ];
            $this->stats['warning_issues']++;
        }
        
        return $issues;
    }
    
    /**
     * Get line number for a specific text
     */
    private function getLineNumber(string $content, string $search): ?int
    {
        $lines = explode("\n", $content);
        foreach ($lines as $lineNum => $line) {
            if (strpos($line, $search) !== false) {
                return $lineNum + 1;
            }
        }
        return null;
    }
    
    /**
     * Generate analysis report
     */
    private function generateReport(): array
    {
        return [
            'stats' => $this->stats,
            'issues' => $this->issues,
            'summary' => $this->generateSummary()
        ];
    }
    
    /**
     * Generate summary
     */
    private function generateSummary(): array
    {
        $criticalFiles = [];
        $warningFiles = [];
        
        foreach ($this->issues as $file => $fileIssues) {
            $hasCritical = false;
            $hasWarning = false;
            
            foreach ($fileIssues as $issue) {
                if ($issue['type'] === 'critical') {
                    $hasCritical = true;
                }
                if ($issue['type'] === 'warning') {
                    $hasWarning = true;
                }
            }
            
            if ($hasCritical) {
                $criticalFiles[] = $file;
            } elseif ($hasWarning) {
                $warningFiles[] = $file;
            }
        }
        
        return [
            'critical_files' => $criticalFiles,
            'warning_files' => $warningFiles,
            'health_score' => $this->calculateHealthScore()
        ];
    }
    
    /**
     * Calculate overall health score
     */
    private function calculateHealthScore(): int
    {
        if ($this->stats['total_files'] === 0) {
            return 100;
        }
        
        $score = 100;
        $score -= ($this->stats['critical_issues'] * 10);
        $score -= ($this->stats['warning_issues'] * 5);
        $score -= ($this->stats['info_issues'] * 1);
        
        return max(0, $score);
    }
    
    /**
     * Print formatted report
     */
    public function printReport(array $report): void
    {
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "🔍 LARAVEL BACKEND SYNTAX ANALYSIS REPORT\n";
        echo str_repeat("=", 60) . "\n\n";
        
        // Statistics
        echo "📊 STATISTICS:\n";
        echo "  Total Files Scanned: {$report['stats']['total_files']}\n";
        echo "  Files with Issues: {$report['stats']['files_with_issues']}\n";
        echo "  Critical Issues: {$report['stats']['critical_issues']}\n";
        echo "  Warning Issues: {$report['stats']['warning_issues']}\n";
        echo "  Info Issues: {$report['stats']['info_issues']}\n";
        echo "  Health Score: {$report['summary']['health_score']}/100\n\n";
        
        // Critical files
        if (!empty($report['summary']['critical_files'])) {
            echo "🚨 CRITICAL FILES (Immediate attention required):\n";
            foreach ($report['summary']['critical_files'] as $file) {
                echo "  ❌ {$file}\n";
            }
            echo "\n";
        }
        
        // Warning files
        if (!empty($report['summary']['warning_files'])) {
            echo "⚠️  WARNING FILES (Should be addressed):\n";
            foreach ($report['summary']['warning_files'] as $file) {
                echo "  ⚠️  {$file}\n";
            }
            echo "\n";
        }
        
        // Detailed issues
        echo "📋 DETAILED ISSUES:\n";
        foreach ($report['issues'] as $file => $issues) {
            echo "\n📄 {$file}:\n";
            foreach ($issues as $issue) {
                $icon = $this->getIssueIcon($issue['type']);
                $line = $issue['line'] ? " (Line {$issue['line']})" : "";
                echo "  {$icon} [{$issue['category']}] {$issue['message']}{$line}\n";
            }
        }
    }
    
    /**
     * Get icon for issue type
     */
    private function getIssueIcon(string $type): string
    {
        return match($type) {
            'critical' => '🚨',
            'warning' => '⚠️',
            'info' => 'ℹ️',
            default => '•'
        };
    }
}

// Run the analyzer if called directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $basePath = $argv[1] ?? '.';
    
    echo "🚀 Starting Laravel Backend Syntax Analysis...\n";
    echo "📁 Base Path: {$basePath}\n\n";
    
    $analyzer = new SyntaxAnalyzer($basePath);
    $report = $analyzer->scanProject();
    $analyzer->printReport($report);
    
    // Save report to JSON file
    $reportFile = 'syntax-analysis-report.json';
    file_put_contents($reportFile, json_encode($report, JSON_PRETTY_PRINT));
    echo "\n💾 Report saved to: {$reportFile}\n";
}

