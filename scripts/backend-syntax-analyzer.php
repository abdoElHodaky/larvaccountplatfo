<?php
/**
 * Backend Syntax Analyzer for Laravel Accounting Platform
 * 
 * Comprehensive PHP syntax analysis tool that scans the entire codebase
 * for syntax errors, deprecated patterns, and code quality issues.
 * 
 * @author AbdElrhman ElHodaky
 * @version 1.0.0
 */

class BackendSyntaxAnalyzer
{
    private array $results = [];
    private array $stats = [
        'total_files' => 0,
        'scanned_files' => 0,
        'syntax_errors' => 0,
        'warnings' => 0,
        'info_issues' => 0,
        'critical_issues' => 0
    ];
    
    private array $laravelVersion = [];
    private string $projectRoot;
    
    public function __construct(string $projectRoot = '.')
    {
        $this->projectRoot = realpath($projectRoot);
        $this->detectLaravelVersion();
    }
    
    /**
     * Main analysis method
     */
    public function analyze(): array
    {
        echo "🔍 Starting Backend Syntax Analysis...\n";
        echo "📁 Project Root: {$this->projectRoot}\n";
        echo "🚀 Laravel Version: {$this->laravelVersion['version']}\n";
        echo "🐘 PHP Version: " . PHP_VERSION . "\n\n";
        
        $phpFiles = $this->findPhpFiles();
        $this->stats['total_files'] = count($phpFiles);
        
        echo "📊 Found {$this->stats['total_files']} PHP files to analyze\n\n";
        
        foreach ($phpFiles as $file) {
            $this->analyzeFile($file);
            $this->stats['scanned_files']++;
            
            // Progress indicator
            if ($this->stats['scanned_files'] % 10 === 0) {
                $progress = round(($this->stats['scanned_files'] / $this->stats['total_files']) * 100, 1);
                echo "📈 Progress: {$progress}% ({$this->stats['scanned_files']}/{$this->stats['total_files']})\n";
            }
        }
        
        $this->generateReport();
        return $this->results;
    }
    
    /**
     * Detect Laravel version from composer.json
     */
    private function detectLaravelVersion(): void
    {
        $composerPath = $this->projectRoot . '/composer.json';
        if (file_exists($composerPath)) {
            $composer = json_decode(file_get_contents($composerPath), true);
            $laravelConstraint = $composer['require']['laravel/framework'] ?? 'unknown';
            
            $this->laravelVersion = [
                'constraint' => $laravelConstraint,
                'version' => $this->parseVersionConstraint($laravelConstraint),
                'major' => (int) substr($this->parseVersionConstraint($laravelConstraint), 0, strpos($this->parseVersionConstraint($laravelConstraint), '.'))
            ];
        }
    }
    
    /**
     * Parse version constraint to get actual version
     */
    private function parseVersionConstraint(string $constraint): string
    {
        // Remove constraint operators (^, ~, >=, etc.)
        return preg_replace('/[^\d\.]/', '', $constraint) ?: 'unknown';
    }
    
    /**
     * Find all PHP files in the project
     */
    private function findPhpFiles(): array
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->projectRoot, RecursiveDirectoryIterator::SKIP_DOTS)
        );
        
        $phpFiles = [];
        foreach ($iterator as $file) {
            if ($file->getExtension() === 'php') {
                // Skip vendor directory and other irrelevant paths
                $relativePath = str_replace($this->projectRoot . '/', '', $file->getPathname());
                if (!$this->shouldSkipFile($relativePath)) {
                    $phpFiles[] = $file->getPathname();
                }
            }
        }
        
        return $phpFiles;
    }
    
    /**
     * Check if file should be skipped
     */
    private function shouldSkipFile(string $relativePath): bool
    {
        $skipPatterns = [
            'vendor/',
            'node_modules/',
            'storage/',
            'bootstrap/cache/',
            '.git/',
            'tests/Feature/Pest.php',
            'tests/Unit/Pest.php'
        ];
        
        foreach ($skipPatterns as $pattern) {
            if (strpos($relativePath, $pattern) === 0) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Analyze individual PHP file
     */
    private function analyzeFile(string $filePath): void
    {
        $relativePath = str_replace($this->projectRoot . '/', '', $filePath);
        $content = file_get_contents($filePath);
        
        $fileResults = [
            'file' => $relativePath,
            'size' => filesize($filePath),
            'lines' => substr_count($content, "\n") + 1,
            'issues' => []
        ];
        
        // 1. Syntax Check
        $this->checkSyntax($filePath, $fileResults);
        
        // 2. Laravel-specific checks
        $this->checkLaravelPatterns($content, $fileResults);
        
        // 3. Namespace and imports check
        $this->checkNamespaceAndImports($content, $fileResults);
        
        // 4. Code quality checks
        $this->checkCodeQuality($content, $fileResults);
        
        // 5. Security checks
        $this->checkSecurity($content, $fileResults);
        
        if (!empty($fileResults['issues'])) {
            $this->results[] = $fileResults;
        }
        
        // Update stats
        foreach ($fileResults['issues'] as $issue) {
            switch ($issue['severity']) {
                case 'critical':
                    $this->stats['critical_issues']++;
                    break;
                case 'warning':
                    $this->stats['warnings']++;
                    break;
                case 'info':
                    $this->stats['info_issues']++;
                    break;
            }
        }
    }
    
    /**
     * Check PHP syntax
     */
    private function checkSyntax(string $filePath, array &$fileResults): void
    {
        $output = [];
        $returnCode = 0;
        
        exec("php -l " . escapeshellarg($filePath) . " 2>&1", $output, $returnCode);
        
        if ($returnCode !== 0) {
            $this->stats['syntax_errors']++;
            $fileResults['issues'][] = [
                'type' => 'syntax_error',
                'severity' => 'critical',
                'message' => 'PHP syntax error detected',
                'details' => implode("\n", $output),
                'line' => $this->extractLineNumber(implode("\n", $output))
            ];
        }
    }
    
    /**
     * Check Laravel-specific patterns
     */
    private function checkLaravelPatterns(string $content, array &$fileResults): void
    {
        // Check for deprecated $dates property (Laravel 7+)
        }
        
        // Check for old array syntax in config
        if (preg_match('/array\s*\(/', $content) && strpos($fileResults['file'], 'config/') !== false) {
            $fileResults['issues'][] = [
                'type' => 'old_syntax',
                'severity' => 'info',
                'message' => 'Old array syntax in config file',
                'details' => 'Consider using short array syntax [] instead of array()',
                'fix' => 'Replace array() with []'
            ];
        }
        
        // Check for missing return types on scope methods
        if (preg_match('/public\s+function\s+scope\w+\s*\([^)]*\)\s*{/', $content)) {
            if (!preg_match('/public\s+function\s+scope\w+\s*\([^)]*\)\s*:\s*\w+/', $content)) {
                $fileResults['issues'][] = [
                    'type' => 'missing_type_hint',
                    'severity' => 'info',
                    'message' => 'Missing return type hints on scope methods',
                    'details' => 'Scope methods should have Builder return type hints',
                    'fix' => 'Add ": Builder" return type to scope methods'
                ];
            }
        }
        
        // Check for constants without visibility
        if (preg_match('/^\s*const\s+\w+/m', $content)) {
            $fileResults['issues'][] = [
                'type' => 'missing_visibility',
                'severity' => 'info',
                'message' => 'Constants without explicit visibility',
                'details' => 'Constants should have explicit visibility (public, private, protected)',
                'fix' => 'Add public/private/protected visibility to constants'
            ];
        }
    }
    
    /**
     * Check namespace and imports
     */
    private function checkNamespaceAndImports(string $content, array &$fileResults): void
    {
        // Check for missing namespace
        if (!preg_match('/^namespace\s+[\w\\\\]+;/m', $content) && 
            strpos($fileResults['file'], 'app/') === 0) {
            $fileResults['issues'][] = [
                'type' => 'missing_namespace',
                'severity' => 'critical',
                'message' => 'Missing namespace declaration',
                'details' => 'PHP files in app/ directory should have namespace declarations',
                'fix' => 'Add appropriate namespace declaration'
            ];
        }
        
        // Check for incorrect namespace patterns
        if (preg_match('/use\s+Modules\\\\/', $content)) {
            $fileResults['issues'][] = [
                'type' => 'incorrect_namespace',
                'severity' => 'critical',
                'message' => 'Incorrect namespace import',
                'details' => 'Found "Modules\\" namespace which should be "App\\"',
                'fix' => 'Replace "Modules\\" with "App\\" in use statements'
            ];
        }
        
        // Check for unused imports
        $imports = [];
        preg_match_all('/use\s+([\w\\\\]+)(?:\s+as\s+(\w+))?;/', $content, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $match) {
            $fullClass = $match[1];
            $alias = $match[2] ?? basename(str_replace('\\', '/', $fullClass));
            
            // Simple check if the class is used (not perfect but catches obvious cases)
            if (!preg_match('/\b' . preg_quote($alias, '/') . '\b/', substr($content, strpos($content, $match[0]) + strlen($match[0])))) {
                $fileResults['issues'][] = [
                    'type' => 'unused_import',
                    'severity' => 'info',
                    'message' => "Potentially unused import: {$fullClass}",
                    'details' => "The imported class {$alias} doesn't appear to be used",
                    'fix' => 'Remove unused import statement'
                ];
            }
        }
    }
    
    /**
     * Check code quality issues
     */
    private function checkCodeQuality(string $content, array &$fileResults): void
    {
        // Check for very long lines
        $lines = explode("\n", $content);
        foreach ($lines as $lineNum => $line) {
            if (strlen($line) > 120) {
                $fileResults['issues'][] = [
                    'type' => 'long_line',
                    'severity' => 'info',
                    'message' => 'Line exceeds 120 characters',
                    'details' => "Line " . ($lineNum + 1) . " has " . strlen($line) . " characters",
                    'line' => $lineNum + 1,
                    'fix' => 'Break long lines for better readability'
                ];
                break; // Only report first occurrence per file
            }
        }
        
        // Check for TODO/FIXME comments
        if (preg_match_all('/(TODO|FIXME|HACK):\s*(.+)/i', $content, $matches, PREG_OFFSET_CAPTURE)) {
            foreach ($matches[0] as $i => $match) {
                $lineNum = substr_count(substr($content, 0, $match[1]), "\n") + 1;
                $fileResults['issues'][] = [
                    'type' => 'todo_comment',
                    'severity' => 'info',
                    'message' => 'TODO/FIXME comment found',
                    'details' => trim($matches[2][$i][0]),
                    'line' => $lineNum,
                    'fix' => 'Address the TODO/FIXME comment'
                ];
            }
        }
        
        // Check for debug statements
        $debugPatterns = ['var_dump', 'print_r', 'dd(', 'dump(', 'console.log'];
        foreach ($debugPatterns as $pattern) {
            if (strpos($content, $pattern) !== false) {
                $fileResults['issues'][] = [
                    'type' => 'debug_statement',
                    'severity' => 'warning',
                    'message' => "Debug statement found: {$pattern}",
                    'details' => 'Debug statements should not be committed to production code',
                    'fix' => 'Remove debug statements'
                ];
                break; // Only report once per file
            }
        }
    }
    
    /**
     * Check security issues
     */
    private function checkSecurity(string $content, array &$fileResults): void
    {
        // Check for potential SQL injection
        if (preg_match('/DB::raw\s*\(\s*[\'"][^\'\"]*\$/', $content)) {
            $fileResults['issues'][] = [
                'type' => 'security_risk',
                'severity' => 'critical',
                'message' => 'Potential SQL injection in DB::raw()',
                'details' => 'Variable interpolation in DB::raw() can lead to SQL injection',
                'fix' => 'Use parameter binding instead of string interpolation'
            ];
        }
        
        // Check for hardcoded credentials
        $credentialPatterns = [
            '/password\s*=\s*[\'"][^\'"]{3,}[\'"]/',
            '/api_key\s*=\s*[\'"][^\'"]{10,}[\'"]/',
            '/secret\s*=\s*[\'"][^\'"]{10,}[\'"]/'
        ];
        
        foreach ($credentialPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                $fileResults['issues'][] = [
                    'type' => 'security_risk',
                    'severity' => 'critical',
                    'message' => 'Potential hardcoded credentials',
                    'details' => 'Hardcoded credentials found in source code',
                    'fix' => 'Move credentials to environment variables'
                ];
                break; // Only report once per file
            }
        }
    }
    
    /**
     * Extract line number from error message
     */
    private function extractLineNumber(string $errorMessage): ?int
    {
        if (preg_match('/line (\d+)/', $errorMessage, $matches)) {
            return (int) $matches[1];
        }
        return null;
    }
    
    /**
     * Generate comprehensive report
     */
    private function generateReport(): void
    {
        echo "\n" . str_repeat("=", 80) . "\n";
        echo "📊 BACKEND SYNTAX ANALYSIS REPORT\n";
        echo str_repeat("=", 80) . "\n\n";
        
        // Summary statistics
        echo "📈 SUMMARY STATISTICS:\n";
        echo "├─ Total Files Scanned: {$this->stats['total_files']}\n";
        echo "├─ Files with Issues: " . count($this->results) . "\n";
        echo "├─ Critical Issues: {$this->stats['critical_issues']}\n";
        echo "├─ Warnings: {$this->stats['warnings']}\n";
        echo "└─ Info Issues: {$this->stats['info_issues']}\n\n";
        
        // Health score calculation
        $totalIssues = $this->stats['critical_issues'] + $this->stats['warnings'] + $this->stats['info_issues'];
        $healthScore = max(0, 100 - ($this->stats['critical_issues'] * 10) - ($this->stats['warnings'] * 3) - ($this->stats['info_issues'] * 1));
        $healthScore = min(100, $healthScore);
        
        echo "🏥 HEALTH SCORE: {$healthScore}/100\n";
        if ($healthScore >= 90) {
            echo "   Status: ✅ Excellent\n";
        } elseif ($healthScore >= 75) {
            echo "   Status: ✅ Good\n";
        } elseif ($healthScore >= 60) {
            echo "   Status: ⚠️ Needs Improvement\n";
        } else {
            echo "   Status: ❌ Critical\n";
        }
        echo "\n";
        
        // Issue breakdown by type
        $issueTypes = [];
        foreach ($this->results as $fileResult) {
            foreach ($fileResult['issues'] as $issue) {
                $issueTypes[$issue['type']] = ($issueTypes[$issue['type']] ?? 0) + 1;
            }
        }
        
        if (!empty($issueTypes)) {
            echo "🔍 ISSUE BREAKDOWN BY TYPE:\n";
            arsort($issueTypes);
            foreach ($issueTypes as $type => $count) {
                echo "├─ " . str_replace('_', ' ', ucwords($type, '_')) . ": {$count}\n";
            }
            echo "\n";
        }
        
        // Critical issues first
        if ($this->stats['critical_issues'] > 0) {
            echo "🚨 CRITICAL ISSUES (MUST FIX):\n";
            $this->printIssuesByType('critical');
            echo "\n";
        }
        
        // Warnings
        if ($this->stats['warnings'] > 0) {
            echo "⚠️ WARNINGS (SHOULD FIX):\n";
            $this->printIssuesByType('warning');
            echo "\n";
        }
        
        // Info issues (first 10 only to avoid spam)
        if ($this->stats['info_issues'] > 0) {
            echo "ℹ️ INFO ISSUES (NICE TO FIX - showing first 10):\n";
            $this->printIssuesByType('info', 10);
            echo "\n";
        }
        
        // Recommendations
        echo "💡 RECOMMENDATIONS:\n";
        $this->generateRecommendations();
        
        echo "\n" . str_repeat("=", 80) . "\n";
        echo "Analysis completed at " . date('Y-m-d H:i:s') . "\n";
        echo str_repeat("=", 80) . "\n";
    }
    
    /**
     * Print issues by severity type
     */
    private function printIssuesByType(string $severity, int $limit = null): void
    {
        $count = 0;
        foreach ($this->results as $fileResult) {
            foreach ($fileResult['issues'] as $issue) {
                if ($issue['severity'] === $severity) {
                    if ($limit && $count >= $limit) {
                        echo "   ... and " . ($this->stats[$severity . '_issues'] - $limit) . " more\n";
                        return;
                    }
                    
                    echo "├─ {$fileResult['file']}";
                    if (isset($issue['line'])) {
                        echo ":{$issue['line']}";
                    }
                    echo "\n";
                    echo "│  {$issue['message']}\n";
                    if (!empty($issue['details'])) {
                        echo "│  Details: {$issue['details']}\n";
                    }
                    if (!empty($issue['fix'])) {
                        echo "│  Fix: {$issue['fix']}\n";
                    }
                    echo "│\n";
                    $count++;
                }
            }
        }
    }
    
    /**
     * Generate actionable recommendations
     */
    private function generateRecommendations(): void
    {
        $recommendations = [];
        
        if ($this->stats['critical_issues'] > 0) {
            $recommendations[] = "🔥 Fix all critical issues immediately - they prevent the application from running properly";
        }
        
        if ($this->stats['syntax_errors'] > 0) {
            $recommendations[] = "🐛 Run 'php -l' on individual files to get detailed syntax error information";
        }
        
        // Check for specific patterns in results
        $hasDeprecatedDates = false;
        $hasNamespaceIssues = false;
        $hasMissingTypes = false;
        
        foreach ($this->results as $fileResult) {
            foreach ($fileResult['issues'] as $issue) {
                if ($issue['type'] === 'deprecated_pattern') $hasDeprecatedDates = true;
                if ($issue['type'] === 'incorrect_namespace') $hasNamespaceIssues = true;
                if ($issue['type'] === 'missing_type_hint') $hasMissingTypes = true;
            }
        }
        
        if ($hasDeprecatedDates) {
            $recommendations[] = "📅 Update deprecated \$dates properties to use \$casts with 'datetime' casting";
        }
        
        if ($hasNamespaceIssues) {
            $recommendations[] = "📦 Fix namespace imports - replace 'Modules\\' with 'App\\' throughout the codebase";
        }
        
        if ($hasMissingTypes) {
            $recommendations[] = "🏷️ Add type hints to improve code quality and IDE support";
        }
        
        $recommendations[] = "🧪 Consider setting up automated code quality tools (PHPStan, Laravel Pint)";
        $recommendations[] = "🔄 Run this analyzer regularly to maintain code quality";
        
        foreach ($recommendations as $i => $recommendation) {
            echo ($i === count($recommendations) - 1 ? "└─ " : "├─ ") . $recommendation . "\n";
        }
    }
}

// Run the analyzer if called directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $analyzer = new BackendSyntaxAnalyzer('.');
    $results = $analyzer->analyze();
    
    // Save results to JSON file for further processing
    file_put_contents('backend-analysis-results.json', json_encode($results, JSON_PRETTY_PRINT));
    echo "\n📄 Detailed results saved to: backend-analysis-results.json\n";
}

