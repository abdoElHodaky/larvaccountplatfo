<?php

/**
 * Structure Simplification Analyzer
 * Provides actionable recommendations for Laravel backend simplification
 */

class StructureSimplificationAnalyzer
{
    private array $recommendations = [];
    private array $metrics = [];
    private string $projectRoot;

    public function __construct(string $projectRoot = '.')
    {
        $this->projectRoot = $projectRoot;
    }

    public function analyze(): array
    {
        echo "🔍 Structure Simplification Analysis Starting...\n";
        echo "📁 Project Root: " . realpath($this->projectRoot) . "\n\n";

        $this->analyzeFeatureComplexity();
        $this->identifyConsolidationOpportunities();
        $this->analyzeServicePatterns();
        $this->identifyArchitecturalImprovements();
        $this->generateActionablePlan();

        return [
            'recommendations' => $this->recommendations,
            'metrics' => $this->metrics
        ];
    }

    private function analyzeFeatureComplexity(): void
    {
        echo "📊 Analyzing feature complexity...\n";
        
        $features = glob($this->projectRoot . '/app/Features/*', GLOB_ONLYDIR);
        $featureMetrics = [];
        
        foreach ($features as $feature) {
            $featureName = basename($feature);
            $phpFiles = glob($feature . '/**/*.php', GLOB_BRACE) ?: [];
            $totalLines = 0;
            $totalMethods = 0;
            
            foreach ($phpFiles as $file) {
                $content = file_get_contents($file);
                $totalLines += substr_count($content, "\n");
                $totalMethods += preg_match_all('/(?:public|private|protected)\s+function\s+/', $content);
            }
            
            $featureMetrics[$featureName] = [
                'files' => count($phpFiles),
                'lines' => $totalLines,
                'methods' => $totalMethods,
                'complexity_score' => $this->calculateFeatureComplexity($totalLines, $totalMethods, count($phpFiles))
            ];
        }
        
        $this->metrics['features'] = $featureMetrics;
        
        // Identify overly complex features
        foreach ($featureMetrics as $feature => $metrics) {
            if ($metrics['complexity_score'] > 100) {
                $this->recommendations[] = [
                    'type' => 'feature_simplification',
                    'priority' => 'high',
                    'feature' => $feature,
                    'message' => "Feature '$feature' is overly complex (score: {$metrics['complexity_score']})",
                    'suggestion' => "Consider breaking down into smaller, focused features",
                    'metrics' => $metrics
                ];
            }
        }
        
        echo "✅ Feature complexity analysis complete\n\n";
    }

    private function identifyConsolidationOpportunities(): void
    {
        echo "🔄 Identifying consolidation opportunities...\n";
        
        // Find small features that could be consolidated
        $smallFeatures = [];
        foreach ($this->metrics['features'] as $feature => $metrics) {
            if ($metrics['files'] < 5 && $metrics['lines'] < 200) {
                $smallFeatures[] = $feature;
            }
        }
        
        if (count($smallFeatures) > 1) {
            $this->recommendations[] = [
                'type' => 'feature_consolidation',
                'priority' => 'medium',
                'message' => "Multiple small features could be consolidated",
                'features' => $smallFeatures,
                'suggestion' => "Consider merging related small features into larger, cohesive modules"
            ];
        }
        
        // Find duplicate service patterns
        $this->findDuplicateServicePatterns();
        
        echo "✅ Consolidation analysis complete\n\n";
    }

    private function analyzeServicePatterns(): void
    {
        echo "🏗️ Analyzing service patterns...\n";
        
        $services = glob($this->projectRoot . '/app/Features/*/Services/*.php');
        $servicePatterns = [];
        
        foreach ($services as $service) {
            $content = file_get_contents($service);
            $className = pathinfo($service, PATHINFO_FILENAME);
            
            // Extract method signatures
            preg_match_all('/(?:public|private|protected)\s+function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)/', $content, $methods);
            $servicePatterns[$className] = $methods[1];
        }
        
        // Find common patterns
        $methodFrequency = [];
        foreach ($servicePatterns as $service => $methods) {
            foreach ($methods as $method) {
                if (!in_array($method, ['__construct', '__destruct', '__call', '__get', '__set'])) {
                    $methodFrequency[$method] = ($methodFrequency[$method] ?? 0) + 1;
                }
            }
        }
        
        // Identify patterns that could be extracted to base classes
        $commonMethods = array_filter($methodFrequency, fn($count) => $count >= 3);
        if (!empty($commonMethods)) {
            $this->recommendations[] = [
                'type' => 'base_class_extraction',
                'priority' => 'medium',
                'message' => "Common service methods found across multiple services",
                'methods' => array_keys($commonMethods),
                'suggestion' => "Extract common methods to a base service class or trait"
            ];
        }
        
        echo "✅ Service pattern analysis complete\n\n";
    }

    private function identifyArchitecturalImprovements(): void
    {
        echo "🏛️ Identifying architectural improvements...\n";
        
        // Check for missing standard directories
        $features = glob($this->projectRoot . '/app/Features/*', GLOB_ONLYDIR);
        $standardDirs = ['Controllers', 'Models', 'Services', 'Routes'];
        
        foreach ($features as $feature) {
            $featureName = basename($feature);
            $missingDirs = [];
            
            foreach ($standardDirs as $dir) {
                if (!is_dir($feature . '/' . $dir)) {
                    $missingDirs[] = $dir;
                }
            }
            
            if (!empty($missingDirs)) {
                $this->recommendations[] = [
                    'type' => 'structure_standardization',
                    'priority' => 'low',
                    'feature' => $featureName,
                    'message' => "Missing standard directories in $featureName feature",
                    'missing_directories' => $missingDirs,
                    'suggestion' => "Create missing directories to maintain consistent structure"
                ];
            }
        }
        
        // Check for business logic in controllers
        $this->checkControllerCompliance();
        
        echo "✅ Architectural analysis complete\n\n";
    }

    private function checkControllerCompliance(): void
    {
        $controllers = glob($this->projectRoot . '/app/Features/*/Controllers/*.php');
        $violatingControllers = [];
        
        foreach ($controllers as $controller) {
            $content = file_get_contents($controller);
            
            // Check for direct database operations
            if (preg_match('/\b(DB::|Eloquent::|->save\(\)|->create\(\)|->update\(\)|->delete\(\))\b/', $content)) {
                $violatingControllers[] = basename($controller);
            }
        }
        
        if (!empty($violatingControllers)) {
            $this->recommendations[] = [
                'type' => 'separation_of_concerns',
                'priority' => 'high',
                'message' => "Controllers contain business logic",
                'controllers' => $violatingControllers,
                'suggestion' => "Move database operations and business logic to service classes"
            ];
        }
    }

    private function generateActionablePlan(): void
    {
        echo "📋 Generating actionable improvement plan...\n";
        
        // Sort recommendations by priority
        usort($this->recommendations, function($a, $b) {
            $priorities = ['high' => 3, 'medium' => 2, 'low' => 1];
            return $priorities[$b['priority']] - $priorities[$a['priority']];
        });
        
        echo "✅ Actionable plan generated\n\n";
    }

    private function calculateFeatureComplexity(int $lines, int $methods, int $files): int
    {
        // Simple complexity calculation
        return ($lines / 10) + ($methods * 2) + ($files * 5);
    }

    private function findDuplicateServicePatterns(): void
    {
        $services = glob($this->projectRoot . '/app/Features/*/Services/*.php');
        $serviceNames = [];
        
        foreach ($services as $service) {
            $name = pathinfo($service, PATHINFO_FILENAME);
            $serviceNames[] = $name;
        }
        
        $duplicates = array_count_values($serviceNames);
        $duplicateNames = array_filter($duplicates, fn($count) => $count > 1);
        
        if (!empty($duplicateNames)) {
            $this->recommendations[] = [
                'type' => 'naming_consolidation',
                'priority' => 'medium',
                'message' => "Duplicate service names found",
                'duplicates' => array_keys($duplicateNames),
                'suggestion' => "Rename or consolidate services with duplicate names"
            ];
        }
    }

    public function generateReport(): string
    {
        $report = "STRUCTURE SIMPLIFICATION ANALYSIS REPORT\n";
        $report .= "========================================\n\n";
        
        $report .= "FEATURE METRICS:\n";
        $report .= "----------------\n";
        foreach ($this->metrics['features'] ?? [] as $feature => $metrics) {
            $report .= "- $feature: {$metrics['files']} files, {$metrics['lines']} lines, complexity: {$metrics['complexity_score']}\n";
        }
        $report .= "\n";
        
        $report .= "RECOMMENDATIONS (by priority):\n";
        $report .= "------------------------------\n";
        
        $priorityGroups = ['high' => [], 'medium' => [], 'low' => []];
        foreach ($this->recommendations as $rec) {
            $priorityGroups[$rec['priority']][] = $rec;
        }
        
        foreach ($priorityGroups as $priority => $recommendations) {
            if (empty($recommendations)) continue;
            
            $report .= "\n" . strtoupper($priority) . " PRIORITY:\n";
            foreach ($recommendations as $rec) {
                $report .= "- {$rec['message']}\n";
                $report .= "  Suggestion: {$rec['suggestion']}\n";
                if (isset($rec['feature'])) {
                    $report .= "  Feature: {$rec['feature']}\n";
                }
                $report .= "\n";
            }
        }
        
        return $report;
    }

    public function generateImplementationScript(): string
    {
        $script = "#!/bin/bash\n\n";
        $script .= "# Structure Simplification Implementation Script\n";
        $script .= "# Generated automatically from analysis\n\n";
        
        $script .= "echo \"🚀 Starting Structure Simplification Implementation\"\n";
        $script .= "echo \"=================================================\"\n\n";
        
        // Generate commands for high priority items
        $highPriorityRecs = array_filter($this->recommendations, fn($rec) => $rec['priority'] === 'high');
        
        if (!empty($highPriorityRecs)) {
            $script .= "echo \"🚨 HIGH PRIORITY FIXES\"\n";
            $script .= "echo \"=====================\"\n\n";
            
            foreach ($highPriorityRecs as $rec) {
                if ($rec['type'] === 'structure_standardization') {
                    foreach ($rec['missing_directories'] as $dir) {
                        $script .= "mkdir -p app/Features/{$rec['feature']}/$dir\n";
                        $script .= "echo \"✅ Created {$rec['feature']}/$dir directory\"\n";
                    }
                    $script .= "\n";
                }
            }
        }
        
        $script .= "echo \"✅ Implementation complete!\"\n";
        
        return $script;
    }
}

// Run the analysis if called directly
if (php_sapi_name() === 'cli') {
    $analyzer = new StructureSimplificationAnalyzer('.');
    $results = $analyzer->analyze();
    
    echo $analyzer->generateReport();
    
    // Save results
    file_put_contents('structure-simplification-results.json', json_encode($results, JSON_PRETTY_PRINT));
    file_put_contents('structure-simplification-report.txt', $analyzer->generateReport());
    file_put_contents('implement-structure-fixes.sh', $analyzer->generateImplementationScript());
    
    echo "📄 Results saved to structure-simplification-results.json\n";
    echo "📄 Report saved to structure-simplification-report.txt\n";
    echo "📄 Implementation script saved to implement-structure-fixes.sh\n";
}

