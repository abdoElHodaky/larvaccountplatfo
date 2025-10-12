<?php
/**
 * Parallel Syntax Fixer
 * 
 * This script fixes syntax issues in parallel phases based on priority
 */

class ParallelSyntaxFixer
{
    private array $fixedFiles = [];
    private array $backups = [];
    private string $basePath;
    private bool $dryRun;
    
    public function __construct(string $basePath = '.', bool $dryRun = false)
    {
        $this->basePath = rtrim($basePath, '/');
        $this->dryRun = $dryRun;
    }
    
    /**
     * Execute fixes in parallel phases
     */
    public function executeParallelFixes(array $analysisReport): void
    {
        echo "🚀 Starting Parallel Syntax Fixes...\n";
        echo "🔧 Dry Run: " . ($this->dryRun ? 'YES' : 'NO') . "\n\n";
        
        // Phase 1: Critical Issues (Immediate)
        $this->executePhase1($analysisReport);
        
        // Phase 2: High Priority Issues
        $this->executePhase2($analysisReport);
        
        // Phase 3: Code Quality Improvements
        $this->executePhase3($analysisReport);
        
        $this->printSummary();
    }
    
    /**
     * Phase 1: Critical Issues (Immediate Fix Required)
     */
    private function executePhase1(array $report): void
    {
        echo "🚨 PHASE 1: Critical Issues (Immediate Fix)\n";
        echo str_repeat("-", 50) . "\n";
        
        $criticalFixes = [
            'missing_imports' => 'fixMissingImports',
            'suspicious_files' => 'fixSuspiciousFileNames',
            'syntax_errors' => 'fixBasicSyntaxErrors'
        ];
        
        foreach ($report['issues'] as $file => $issues) {
            $criticalIssues = array_filter($issues, fn($issue) => $issue['type'] === 'critical');
            
            if (!empty($criticalIssues)) {
                echo "🔧 Fixing critical issues in: {$file}\n";
                $this->processFileIssues($file, $criticalIssues, $criticalFixes);
            }
        }
        
        echo "✅ Phase 1 Complete\n\n";
    }
    
    /**
     * Phase 2: High Priority Issues
     */
    private function executePhase2(array $report): void
    {
        echo "⚠️  PHASE 2: High Priority Issues\n";
        echo str_repeat("-", 50) . "\n";
        
        $highPriorityFixes = [
            'deprecated_patterns' => 'fixDeprecatedPatterns',
            'inconsistent_constants' => 'fixInconsistentConstants',
            'naming_issues' => 'fixNamingIssues'
        ];
        
        foreach ($report['issues'] as $file => $issues) {
            $warningIssues = array_filter($issues, fn($issue) => $issue['type'] === 'warning');
            
            if (!empty($warningIssues)) {
                echo "🔧 Fixing warning issues in: {$file}\n";
                $this->processFileIssues($file, $warningIssues, $highPriorityFixes);
            }
        }
        
        echo "✅ Phase 2 Complete\n\n";
    }
    
    /**
     * Phase 3: Code Quality Improvements
     */
    private function executePhase3(array $report): void
    {
        echo "ℹ️  PHASE 3: Code Quality Improvements\n";
        echo str_repeat("-", 50) . "\n";
        
        $qualityFixes = [
            'type_hints' => 'addMissingTypeHints',
            'documentation' => 'addDocumentation',
            'formatting' => 'improveFormatting'
        ];
        
        foreach ($report['issues'] as $file => $issues) {
            $infoIssues = array_filter($issues, fn($issue) => $issue['type'] === 'info');
            
            if (!empty($infoIssues)) {
                echo "🔧 Improving code quality in: {$file}\n";
                $this->processFileIssues($file, $infoIssues, $qualityFixes);
            }
        }
        
        echo "✅ Phase 3 Complete\n\n";
    }
    
    /**
     * Process issues for a specific file
     */
    private function processFileIssues(string $file, array $issues, array $fixMethods): void
    {
        $filePath = $this->basePath . '/' . $file;
        
        if (!file_exists($filePath)) {
            echo "  ❌ File not found: {$file}\n";
            return;
        }
        
        // Create backup
        $this->createBackup($filePath);
        
        $content = file_get_contents($filePath);
        $originalContent = $content;
        
        foreach ($issues as $issue) {
            $fixMethod = $fixMethods[$issue['category']] ?? null;
            
            if ($fixMethod && method_exists($this, $fixMethod)) {
                $content = $this->$fixMethod($content, $issue, $file);
            }
        }
        
        // Apply changes if content was modified
        if ($content !== $originalContent) {
            if (!$this->dryRun) {
                file_put_contents($filePath, $content);
                $this->fixedFiles[] = $file;
                echo "  ✅ Fixed issues in: {$file}\n";
            } else {
                echo "  🔍 Would fix issues in: {$file}\n";
            }
        }
    }
    
    /**
     * Fix missing import statements
     */
    private function fixMissingImports(string $content, array $issue, string $file): string
    {
        // Fix incorrect Modules namespace
        if (strpos($issue['message'], 'Modules\\') !== false) {
            $content = str_replace('use Modules\\', 'use App\\', $content);
            echo "    🔧 Fixed namespace: Modules\\ → App\\\n";
        }
        
        // Add missing common imports
        $commonImports = [
            'Builder' => 'use Illuminate\Database\Eloquent\Builder;',
            'Collection' => 'use Illuminate\Database\Eloquent\Collection;',
            'Request' => 'use Illuminate\Http\Request;',
            'Response' => 'use Illuminate\Http\Response;'
        ];
        
        foreach ($commonImports as $class => $import) {
            if (strpos($issue['message'], $class) !== false && 
                strpos($content, $import) === false) {
                
                // Find the last use statement and add after it
                $lines = explode("\n", $content);
                $lastUseIndex = -1;
                
                foreach ($lines as $index => $line) {
                    if (preg_match('/^use\s+/', trim($line))) {
                        $lastUseIndex = $index;
                    }
                }
                
                if ($lastUseIndex >= 0) {
                    array_splice($lines, $lastUseIndex + 1, 0, $import);
                    $content = implode("\n", $lines);
                    echo "    🔧 Added import: {$import}\n";
                }
            }
        }
        
        return $content;
    }
    
    /**
     * Fix suspicious file names
     */
    private function fixSuspiciousFileNames(string $content, array $issue, string $file): string
    {
        // This would require file renaming, which is complex
        // For now, just log the recommendation
        echo "    ⚠️  Recommend renaming: {$file}\n";
        return $content;
    }
    
    /**
     * Fix basic syntax errors
     */
    private function fixBasicSyntaxErrors(string $content, array $issue, string $file): string
    {
        // Fix missing semicolons
        if (strpos($issue['message'], 'Missing semicolon') !== false) {
            $lines = explode("\n", $content);
            
            foreach ($lines as $index => $line) {
                $trimmed = trim($line);
                
                if (preg_match('/^\s*(return|echo|print|throw|break|continue)\s+.*[^;{}]\s*$/', $trimmed)) {
                    $lines[$index] = rtrim($line) . ';';
                    echo "    🔧 Added semicolon to line " . ($index + 1) . "\n";
                }
            }
            
            $content = implode("\n", $lines);
        }
        
        return $content;
    }
    
    /**
     * Fix deprecated patterns
     */
    private function fixDeprecatedPatterns(string $content, array $issue, string $file): string
    {
        // Fix deprecated $dates property
        if (strpos($issue['message'], '$dates property') !== false) {
            // Replace $dates with $casts
            $content = preg_replace_callback(
                '/protected\s+\$dates\s*=\s*\[(.*?)\];/s',
                function ($matches) {
                    $dateFields = $matches[1];
                    // Convert to $casts format
                    $casts = preg_replace('/[\'"]([^\'"]+)[\'"]/', "'$1' => 'date'", $dateFields);
                    return "protected \$casts = [\n        $casts\n    ];";
                },
                $content
            );
            echo "    🔧 Converted \$dates to \$casts\n";
        }
        
        // Fix old array syntax
        if (strpos($issue['message'], 'Old array syntax') !== false) {
            $content = preg_replace('/array\s*\(/', '[', $content);
            $content = preg_replace('/\)(\s*;?\s*)$/', ']$1', $content);
            echo "    🔧 Updated array syntax\n";
        }
        
        return $content;
    }
    
    /**
     * Fix inconsistent constants
     */
    private function fixInconsistentConstants(string $content, array $issue, string $file): string
    {
        // Convert all constants to public const
        $content = preg_replace('/^\s*const\s+(\w+)/m', '    public const $1', $content);
        echo "    🔧 Standardized constants to 'public const'\n";
        
        return $content;
    }
    
    /**
     * Fix naming issues
     */
    private function fixNamingIssues(string $content, array $issue, string $file): string
    {
        // This would require more complex refactoring
        echo "    ⚠️  Manual review needed for naming: {$file}\n";
        return $content;
    }
    
    /**
     * Add missing type hints
     */
    private function addMissingTypeHints(string $content, array $issue, string $file): string
    {
        // Add return type hints to scope methods
        if (strpos($issue['message'], 'Scope method') !== false) {
            $content = preg_replace(
                '/(public\s+function\s+scope\w+\s*\([^)]*\))\s*(?!:\s*\w)/',
                '$1: Builder',
                $content
            );
            echo "    🔧 Added Builder return type to scope method\n";
        }
        
        return $content;
    }
    
    /**
     * Add documentation
     */
    private function addDocumentation(string $content, array $issue, string $file): string
    {
        // This would require more sophisticated analysis
        echo "    ℹ️  Documentation improvement needed: {$file}\n";
        return $content;
    }
    
    /**
     * Improve formatting
     */
    private function improveFormatting(string $content, array $issue, string $file): string
    {
        // Basic formatting improvements
        $content = preg_replace('/\s+$/', '', $content); // Remove trailing whitespace
        echo "    🔧 Improved formatting\n";
        
        return $content;
    }
    
    /**
     * Create backup of file
     */
    private function createBackup(string $filePath): void
    {
        if (!$this->dryRun) {
            $backupPath = $filePath . '.backup.' . date('Y-m-d-H-i-s');
            copy($filePath, $backupPath);
            $this->backups[] = $backupPath;
        }
    }
    
    /**
     * Print summary of fixes
     */
    private function printSummary(): void
    {
        echo str_repeat("=", 60) . "\n";
        echo "📋 PARALLEL FIXES SUMMARY\n";
        echo str_repeat("=", 60) . "\n\n";
        
        echo "✅ Files Fixed: " . count($this->fixedFiles) . "\n";
        echo "💾 Backups Created: " . count($this->backups) . "\n\n";
        
        if (!empty($this->fixedFiles)) {
            echo "📄 Fixed Files:\n";
            foreach ($this->fixedFiles as $file) {
                echo "  ✅ {$file}\n";
            }
        }
        
        if (!$this->dryRun && !empty($this->backups)) {
            echo "\n💾 Backup Files Created:\n";
            foreach ($this->backups as $backup) {
                echo "  📦 {$backup}\n";
            }
            
            echo "\n⚠️  To restore a file: cp backup-file original-file\n";
            echo "🗑️  To clean backups: rm *.backup.*\n";
        }
    }
}

// Run the fixer if called directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $basePath = $argv[1] ?? '.';
    $dryRun = isset($argv[2]) && $argv[2] === '--dry-run';
    $reportFile = $argv[3] ?? 'syntax-analysis-report.json';
    
    if (!file_exists($reportFile)) {
        echo "❌ Analysis report not found: {$reportFile}\n";
        echo "💡 Run syntax-analyzer.php first to generate the report.\n";
        exit(1);
    }
    
    $report = json_decode(file_get_contents($reportFile), true);
    
    echo "🚀 Starting Parallel Syntax Fixes...\n";
    echo "📁 Base Path: {$basePath}\n";
    echo "📊 Report File: {$reportFile}\n";
    echo "🔧 Dry Run: " . ($dryRun ? 'YES' : 'NO') . "\n\n";
    
    $fixer = new ParallelSyntaxFixer($basePath, $dryRun);
    $fixer->executeParallelFixes($report);
}

