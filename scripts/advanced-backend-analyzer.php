<?php

/**
 * Advanced Backend Structure & Naming Analyzer
 * Analyzes Laravel codebase for structure simplification and naming improvements
 */

class AdvancedBackendAnalyzer
{
    private array $issues = [];
    private array $suggestions = [];
    private array $metrics = [];
    private string $projectRoot;

    public function __construct(string $projectRoot = '.')
    {
        $this->projectRoot = $projectRoot;
    }

    public function analyze(): array
    {
        echo "🔍 Advanced Backend Analysis Starting...\n";
        echo "📁 Project Root: " . realpath($this->projectRoot) . "\n";
        echo "📊 Analyzing Laravel Accounting Platform Structure\n\n";

        $this->analyzeDirectoryStructure();
        $this->analyzeNamingConventions();
        $this->analyzeDuplication();
        $this->analyzeComplexity();
        $this->analyzeArchitecturalPatterns();
        $this->generateRecommendations();

        return [
            'issues' => $this->issues,
            'suggestions' => $this->suggestions,
            'metrics' => $this->metrics
        ];
    }

    private function analyzeDirectoryStructure(): void
    {
        echo "📂 Analyzing Directory Structure...\n";
        
        $directories = $this->getDirectoryStructure();
        $this->metrics['total_directories'] = count($directories);
        
        // Check for structural inconsistencies
        $features = glob($this->projectRoot . '/app/Features/*', GLOB_ONLYDIR);
        foreach ($features as $feature) {
            $featureName = basename($feature);
            $this->analyzeFeatureStructure($featureName, $feature);
        }
        
        // Check for duplicate service patterns
        $this->checkForDuplicateServices();
        
        echo "✅ Directory structure analysis complete\n\n";
    }

    private function analyzeFeatureStructure(string $featureName, string $featurePath): void
    {
        $expectedDirs = ['Controllers', 'Models', 'Services', 'Routes'];
        $actualDirs = array_map('basename', glob($featurePath . '/*', GLOB_ONLYDIR));
        
        // Check for missing standard directories
        $missing = array_diff($expectedDirs, $actualDirs);
        if (!empty($missing)) {
            $this->issues[] = [
                'type' => 'structure',
                'severity' => 'info',
                'feature' => $featureName,
                'message' => "Missing standard directories: " . implode(', ', $missing),
                'path' => $featurePath
            ];
        }
        
        // Check for non-standard directories
        $nonStandard = array_diff($actualDirs, [
            'Controllers', 'Models', 'Services', 'Routes', 'Middleware', 
            'Events', 'Listeners', 'GraphQL', 'Repositories', 'Providers',
            'Contracts', 'Jobs', 'Mail', 'Notifications'
        ]);
        
        if (!empty($nonStandard)) {
            $this->suggestions[] = [
                'type' => 'structure_optimization',
                'feature' => $featureName,
                'message' => "Consider reorganizing non-standard directories: " . implode(', ', $nonStandard),
                'impact' => 'medium'
            ];
        }
    }

    private function analyzeNamingConventions(): void
    {
        echo "🏷️ Analyzing Naming Conventions...\n";
        
        $phpFiles = $this->getAllPhpFiles();
        $namingIssues = [];
        
        foreach ($phpFiles as $file) {
            $this->analyzeFileNaming($file, $namingIssues);
        }
        
        $this->metrics['naming_issues'] = count($namingIssues);
        $this->issues = array_merge($this->issues, $namingIssues);
        
        echo "✅ Naming convention analysis complete\n\n";
    }

    private function analyzeFileNaming(string $file, array &$namingIssues): void
    {
        $content = file_get_contents($file);
        $relativePath = str_replace($this->projectRoot . '/', '', $file);
        
        // Check class naming
        if (preg_match('/class\s+([A-Za-z_][A-Za-z0-9_]*)/i', $content, $matches)) {
            $className = $matches[1];
            $fileName = pathinfo($file, PATHINFO_FILENAME);
            
            if ($className !== $fileName) {
                $namingIssues[] = [
                    'type' => 'naming',
                    'severity' => 'warning',
                    'message' => "Class name '$className' doesn't match file name '$fileName'",
                    'path' => $relativePath,
                    'suggestion' => "Rename file to '$className.php' or class to '$fileName'"
                ];
            }
        }
        
        // Check method naming consistency
        preg_match_all('/(?:public|private|protected)\s+function\s+([A-Za-z_][A-Za-z0-9_]*)/i', $content, $methods);
        foreach ($methods[1] as $method) {
            if (!$this->isValidMethodName($method)) {
                $namingIssues[] = [
                    'type' => 'naming',
                    'severity' => 'info',
                    'message' => "Method '$method' doesn't follow camelCase convention",
                    'path' => $relativePath,
                    'suggestion' => "Use camelCase: " . $this->toCamelCase($method)
                ];
            }
        }
        
        // Check variable naming in methods
        preg_match_all('/\$([a-zA-Z_][a-zA-Z0-9_]*)\s*=/', $content, $variables);
        foreach ($variables[1] as $variable) {
            if (!$this->isValidVariableName($variable)) {
                $namingIssues[] = [
                    'type' => 'naming',
                    'severity' => 'info',
                    'message' => "Variable '\$$variable' could use better naming",
                    'path' => $relativePath,
                    'suggestion' => "Use descriptive camelCase names"
                ];
            }
        }
    }

    private function analyzeDuplication(): void
    {
        echo "🔄 Analyzing Code Duplication...\n";
        
        $duplicates = $this->findDuplicateCode();
        $this->metrics['duplicate_blocks'] = count($duplicates);
        
        foreach ($duplicates as $duplicate) {
            $this->issues[] = [
                'type' => 'duplication',
                'severity' => 'warning',
                'message' => "Duplicate code block found",
                'files' => $duplicate['files'],
                'lines' => $duplicate['lines'],
                'suggestion' => "Extract to shared method or trait"
            ];
        }
        
        echo "✅ Duplication analysis complete\n\n";
    }

    private function analyzeComplexity(): void
    {
        echo "🧮 Analyzing Code Complexity...\n";
        
        $phpFiles = $this->getAllPhpFiles();
        $complexityIssues = [];
        
        foreach ($phpFiles as $file) {
            $complexity = $this->calculateCyclomaticComplexity($file);
            if ($complexity > 10) {
                $complexityIssues[] = [
                    'type' => 'complexity',
                    'severity' => 'warning',
                    'path' => str_replace($this->projectRoot . '/', '', $file),
                    'complexity' => $complexity,
                    'message' => "High cyclomatic complexity ($complexity)",
                    'suggestion' => "Consider breaking down into smaller methods"
                ];
            }
        }
        
        $this->metrics['high_complexity_files'] = count($complexityIssues);
        $this->issues = array_merge($this->issues, $complexityIssues);
        
        echo "✅ Complexity analysis complete\n\n";
    }

    private function analyzeArchitecturalPatterns(): void
    {
        echo "🏗️ Analyzing Architectural Patterns...\n";
        
        // Check for proper separation of concerns
        $this->checkSeparationOfConcerns();
        
        // Check for proper dependency injection
        $this->checkDependencyInjection();
        
        // Check for consistent service patterns
        $this->checkServicePatterns();
        
        echo "✅ Architectural pattern analysis complete\n\n";
    }

    private function checkSeparationOfConcerns(): void
    {
        $controllers = glob($this->projectRoot . '/app/Features/*/Controllers/*.php');
        
        foreach ($controllers as $controller) {
            $content = file_get_contents($controller);
            
            // Check if controller has business logic (should be in services)
            if (preg_match('/DB::|Eloquent::|->save\(\)|->create\(\)|->update\(\)/', $content)) {
                $this->issues[] = [
                    'type' => 'architecture',
                    'severity' => 'warning',
                    'path' => str_replace($this->projectRoot . '/', '', $controller),
                    'message' => "Controller contains business logic",
                    'suggestion' => "Move business logic to service classes"
                ];
            }
        }
    }

    private function checkDependencyInjection(): void
    {
        $services = glob($this->projectRoot . '/app/Features/*/Services/*.php');
        
        foreach ($services as $service) {
            $content = file_get_contents($service);
            
            // Check for hard-coded dependencies
            if (preg_match('/new\s+[A-Z][A-Za-z0-9_]*\s*\(/', $content)) {
                $this->suggestions[] = [
                    'type' => 'dependency_injection',
                    'path' => str_replace($this->projectRoot . '/', '', $service),
                    'message' => "Consider using dependency injection instead of direct instantiation",
                    'impact' => 'medium'
                ];
            }
        }
    }

    private function checkServicePatterns(): void
    {
        $services = glob($this->projectRoot . '/app/Features/*/Services/*.php');
        $patterns = [];
        
        foreach ($services as $service) {
            $content = file_get_contents($service);
            $className = pathinfo($service, PATHINFO_FILENAME);
            
            // Check for consistent method patterns
            preg_match_all('/public\s+function\s+([A-Za-z_][A-Za-z0-9_]*)/i', $content, $methods);
            $patterns[$className] = $methods[1];
        }
        
        // Analyze patterns for consistency
        $this->analyzeServicePatternConsistency($patterns);
    }

    private function generateRecommendations(): void
    {
        echo "💡 Generating Recommendations...\n";
        
        // Structure simplification recommendations
        $this->generateStructureRecommendations();
        
        // Naming improvement recommendations
        $this->generateNamingRecommendations();
        
        // Architecture improvement recommendations
        $this->generateArchitectureRecommendations();
        
        echo "✅ Recommendations generated\n\n";
    }

    private function generateStructureRecommendations(): void
    {
        // Check for overly nested structures
        $deepPaths = $this->findDeepNesting();
        foreach ($deepPaths as $path) {
            $this->suggestions[] = [
                'type' => 'structure_simplification',
                'message' => "Consider flattening deep directory structure",
                'path' => $path,
                'impact' => 'low'
            ];
        }
        
        // Suggest feature consolidation
        $smallFeatures = $this->findSmallFeatures();
        if (count($smallFeatures) > 1) {
            $this->suggestions[] = [
                'type' => 'feature_consolidation',
                'message' => "Consider consolidating small features: " . implode(', ', $smallFeatures),
                'impact' => 'medium'
            ];
        }
    }

    private function generateNamingRecommendations(): void
    {
        $this->suggestions[] = [
            'type' => 'naming_standards',
            'message' => "Establish consistent naming conventions across all features",
            'details' => [
                'Controllers: Use descriptive names ending with Controller',
                'Services: Use descriptive names ending with Service',
                'Models: Use singular nouns',
                'Methods: Use camelCase with action verbs',
                'Variables: Use descriptive camelCase names'
            ],
            'impact' => 'high'
        ];
    }

    private function generateArchitectureRecommendations(): void
    {
        $this->suggestions[] = [
            'type' => 'architecture_improvement',
            'message' => "Implement consistent architectural patterns",
            'details' => [
                'Use Repository pattern for data access',
                'Implement Service layer for business logic',
                'Use Events for cross-feature communication',
                'Implement proper error handling',
                'Use DTOs for data transfer'
            ],
            'impact' => 'high'
        ];
    }

    // Helper methods
    private function getDirectoryStructure(): array
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->projectRoot . '/app'),
            RecursiveIteratorIterator::SELF_FIRST
        );
        
        $directories = [];
        foreach ($iterator as $path => $dir) {
            if ($dir->isDir() && !in_array($dir->getFilename(), ['.', '..'])) {
                $directories[] = $path;
            }
        }
        
        return $directories;
    }

    private function getAllPhpFiles(): array
    {
        return glob($this->projectRoot . '/app/**/*.php', GLOB_BRACE) ?: [];
    }

    private function isValidMethodName(string $name): bool
    {
        return preg_match('/^[a-z][a-zA-Z0-9]*$/', $name) === 1;
    }

    private function isValidVariableName(string $name): bool
    {
        return preg_match('/^[a-z][a-zA-Z0-9]*$/', $name) === 1 && strlen($name) > 2;
    }

    private function toCamelCase(string $string): string
    {
        return lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $string))));
    }

    private function findDuplicateCode(): array
    {
        // Simplified duplicate detection - in real implementation would use more sophisticated algorithms
        return [];
    }

    private function calculateCyclomaticComplexity(string $file): int
    {
        $content = file_get_contents($file);
        $complexity = 1; // Base complexity
        
        // Count decision points
        $complexity += preg_match_all('/\b(if|while|for|foreach|case|catch|\?)\b/', $content);
        $complexity += preg_match_all('/\b(&&|\|\|)\b/', $content);
        
        return $complexity;
    }

    private function checkForDuplicateServices(): void
    {
        $services = glob($this->projectRoot . '/app/Features/*/Services/*.php');
        $serviceNames = array_map(function($path) {
            return pathinfo($path, PATHINFO_FILENAME);
        }, $services);
        
        $duplicates = array_count_values($serviceNames);
        foreach ($duplicates as $name => $count) {
            if ($count > 1) {
                $this->issues[] = [
                    'type' => 'duplication',
                    'severity' => 'warning',
                    'message' => "Duplicate service name '$name' found in $count features",
                    'suggestion' => "Consider consolidating or renaming for clarity"
                ];
            }
        }
    }

    private function analyzeServicePatternConsistency(array $patterns): void
    {
        // Analyze common patterns across services
        $commonMethods = [];
        foreach ($patterns as $service => $methods) {
            foreach ($methods as $method) {
                $commonMethods[$method] = ($commonMethods[$method] ?? 0) + 1;
            }
        }
        
        // Find methods that appear in multiple services but not all
        $serviceCount = count($patterns);
        foreach ($commonMethods as $method => $count) {
            if ($count > 1 && $count < $serviceCount) {
                $this->suggestions[] = [
                    'type' => 'pattern_consistency',
                    'message' => "Method '$method' appears in $count/$serviceCount services",
                    'suggestion' => "Consider creating a base service class or trait",
                    'impact' => 'medium'
                ];
            }
        }
    }

    private function findDeepNesting(): array
    {
        $deepPaths = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->projectRoot . '/app')
        );
        
        foreach ($iterator as $path => $file) {
            $depth = $iterator->getDepth();
            if ($depth > 5) { // More than 5 levels deep
                $deepPaths[] = str_replace($this->projectRoot . '/', '', dirname($path));
            }
        }
        
        return array_unique($deepPaths);
    }

    private function findSmallFeatures(): array
    {
        $features = glob($this->projectRoot . '/app/Features/*', GLOB_ONLYDIR);
        $smallFeatures = [];
        
        foreach ($features as $feature) {
            $fileCount = count(glob($feature . '/**/*.php', GLOB_BRACE));
            if ($fileCount < 5) { // Less than 5 PHP files
                $smallFeatures[] = basename($feature);
            }
        }
        
        return $smallFeatures;
    }

    public function generateReport(): string
    {
        $report = "ADVANCED BACKEND ANALYSIS REPORT\n";
        $report .= "================================\n\n";
        
        $report .= "METRICS:\n";
        $report .= "--------\n";
        foreach ($this->metrics as $key => $value) {
            $report .= "- " . ucwords(str_replace('_', ' ', $key)) . ": $value\n";
        }
        $report .= "\n";
        
        $report .= "ISSUES FOUND:\n";
        $report .= "-------------\n";
        foreach ($this->issues as $issue) {
            $severity = strtoupper($issue['severity']);
            $report .= "[$severity] {$issue['message']}\n";
            if (isset($issue['path'])) {
                $report .= "  Path: {$issue['path']}\n";
            }
            if (isset($issue['suggestion'])) {
                $report .= "  Suggestion: {$issue['suggestion']}\n";
            }
            $report .= "\n";
        }
        
        $report .= "IMPROVEMENT SUGGESTIONS:\n";
        $report .= "------------------------\n";
        foreach ($this->suggestions as $suggestion) {
            $impact = strtoupper($suggestion['impact'] ?? 'MEDIUM');
            $report .= "[$impact] {$suggestion['message']}\n";
            if (isset($suggestion['details'])) {
                foreach ($suggestion['details'] as $detail) {
                    $report .= "  - $detail\n";
                }
            }
            $report .= "\n";
        }
        
        return $report;
    }
}

// Run the analysis
if (php_sapi_name() === 'cli') {
    $analyzer = new AdvancedBackendAnalyzer('.');
    $results = $analyzer->analyze();
    
    echo $analyzer->generateReport();
    
    // Save detailed results
    file_put_contents('advanced-analysis-results.json', json_encode($results, JSON_PRETTY_PRINT));
    echo "📄 Detailed results saved to: advanced-analysis-results.json\n";
}

