<?php

/**
 * Code Pattern Analysis Script
 * 
 * Analyzes PHP codebase for naming patterns, class Structures,
 * interface usage, and trait organization to identify
 * resimplification opportunities.
 */

class CodePatternAnalyzer
{
    private array $results = [
        'variables' => [],
        'methods' => [],
        'classes' => [],
        'interfaces' => [],
        'traits' => [],
        'constants' => [],
        'patterns' => [],
        'statistics' => []
    ];

    private array $namingPatterns = [
        'camelCase' => 0,
        'snake_case' => 0,
        'PascalCase' => 0,
        'UPPER_CASE' => 0,
        'kebab-case' => 0,
        'mixed' => 0
    ];

    public function analyze(string $directory): array
    {
        echo "🔍 Starting code pattern analysis...\n";
        
        $this->analyzeDirectory($directory);
        $this->generateStatistics();
        $this->identifyPatterns();
        
        echo "✅ Analysis complete!\n";
        
        return $this->results;
    }

    private function analyzeDirectory(string $directory): void
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory)
        );

        foreach ($iterator as $file) {
            if ($file->getExtension() === 'php') {
                $this->analyzeFile($file->getPathname());
            }
        }
    }

    private function analyzeFile(string $filePath): void
    {
        $content = file_get_contents($filePath);
        $relativePath = str_replace(getcwd() . '/', '', $filePath);
        
        echo "📄 Analyzing: {$relativePath}\n";

        // Analyze classes
        $this->analyzeClasses($content, $relativePath);
        
        // Analyze interfaces
        $this->analyzeInterfaces($content, $relativePath);
        
        // Analyze traits
        $this->analyzeTraits($content, $relativePath);
        
        // Analyze variables
        $this->analyzeVariables($content, $relativePath);
        
        // Analyze methods
        $this->analyzeMethods($content, $relativePath);
        
        // Analyze constants
        $this->analyzeConstants($content, $relativePath);
    }

    private function analyzeClasses(string $content, string $filePath): void
    {
        // Match class Declarations
        preg_match_all('/class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w\s,]+))?/i', $content, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $match) {
            $className = $match[1];
            $extends = $match[2] ?? null;
            $implements = isset($match[3]) ? array_map('trim', explode(',', $match[3])) : [];
            
            $this->results['classes'][] = [
                'name' => $className,
                'file' => $filePath,
                'extends' => $extends,
                'implements' => $implements,
                'naming_pattern' => $this->detectNamingPattern($className)
            ];
            
            $this->namingPatterns[$this->detectNamingPattern($className)]++;
        }
    }

    private function analyzeInterfaces(string $content, string $filePath): void
    {
        preg_match_all('/interface\s+(\w+)(?:\s+extends\s+([\w\s,]+))?/i', $content, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $match) {
            $interfaceName = $match[1];
            $extends = isset($match[2]) ? array_map('trim', explode(',', $match[2])) : [];
            
            $this->results['interfaces'][] = [
                'name' => $interfaceName,
                'file' => $filePath,
                'extends' => $extends,
                'naming_pattern' => $this->detectNamingPattern($interfaceName)
            ];
            
            $this->namingPatterns[$this->detectNamingPattern($interfaceName)]++;
        }
    }

    private function analyzeTraits(string $content, string $filePath): void
    {
        preg_match_all('/trait\s+(\w+)/i', $content, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $match) {
            $traitName = $match[1];
            
            $this->results['traits'][] = [
                'name' => $traitName,
                'file' => $filePath,
                'naming_pattern' => $this->detectNamingPattern($traitName)
            ];
            
            $this->namingPatterns[$this->detectNamingPattern($traitName)]++;
        }
    }

    private function analyzeVariables(string $content, string $filePath): void
    {
        // Match variable declarations (properties and local variables)
        preg_match_all('/(?:public|private|protected)?\s*\$(\w+)\s*[=;]/', $content, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $match) {
            $variableName = $match[1];
            
            $this->results['variables'][] = [
                'name' => $variableName,
                'file' => $filePath,
                'naming_pattern' => $this->detectNamingPattern($variableName)
            ];
            
            $this->namingPatterns[$this->detectNamingPattern($variableName)]++;
        }
    }

    private function analyzeMethods(string $content, string $filePath): void
    {
        // Match method declarations
        preg_match_all('/(?:public|private|protected)?\s*function\s+(\w+)\s*\(/i', $content, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $match) {
            $methodName = $match[1];
            
            // Skip magic methods and constructors
            if (strpos($methodName, '__') === 0) {
                continue;
            }
            
            $this->results['methods'][] = [
                'name' => $methodName,
                'file' => $filePath,
                'naming_pattern' => $this->detectNamingPattern($methodName)
            ];
            
            $this->namingPatterns[$this->detectNamingPattern($methodName)]++;
        }
    }

    private function analyzeConstants(string $content, string $filePath): void
    {
        // Match constant declarations
        preg_match_all('/const\s+(\w+)\s*=/', $content, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $match) {
            $constantName = $match[1];
            
            $this->results['constants'][] = [
                'name' => $constantName,
                'file' => $filePath,
                'naming_pattern' => $this->detectNamingPattern($constantName)
            ];
            
            $this->namingPatterns[$this->detectNamingPattern($constantName)]++;
        }
    }

    private function detectNamingPattern(string $name): string
    {
        if (ctype_upper($name) || preg_match('/^[A-Z][A-Z0-9_]*$/', $name)) {
            return 'UPPER_CASE';
        }
        
        if (preg_match('/^[A-Z][a-zA-Z0-9]*$/', $name)) {
            return 'PascalCase';
        }
        
        if (preg_match('/^[a-z][a-zA-Z0-9]*$/', $name)) {
            return 'camelCase';
        }
        
        if (preg_match('/^[a-z][a-z0-9_]*$/', $name)) {
            return 'snake_case';
        }
        
        if (strpos($name, '-') !== false) {
            return 'kebab-case';
        }
        
        return 'mixed';
    }

    private function generateStatistics(): void
    {
        $total = array_sum($this->namingPatterns);
        
        $this->results['statistics'] = [
            'total_elements' => $total,
            'naming_patterns' => $this->namingPatterns,
            'naming_percentages' => array_map(
                fn($count) => $total > 0 ? round(($count / $total) * 100, 2) : 0,
                $this->namingPatterns
            ),
            'class_count' => count($this->results['classes']),
            'interface_count' => count($this->results['interfaces']),
            'trait_count' => count($this->results['traits']),
            'variable_count' => count($this->results['variables']),
            'method_count' => count($this->results['methods']),
            'constant_count' => count($this->results['constants'])
        ];
    }

    private function identifyPatterns(): void
    {
        $patterns = [];
        
        // Identify inconsistent naming patterns
        $classPatterns = array_count_values(array_column($this->results['classes'], 'naming_pattern'));
        $methodPatterns = array_count_values(array_column($this->results['methods'], 'naming_pattern'));
        $variablePatterns = array_count_values(array_column($this->results['variables'], 'naming_pattern'));
        
        // Check for interface naming consistency
        $interfaceNames = array_column($this->results['interfaces'], 'name');
        $interfacesWithoutSuffix = array_filter($interfaceNames, fn($name) => !str_ends_with($name, 'Interface'));
        
        if (!empty($interfacesWithoutSuffix)) {
            $patterns[] = [
                'type' => 'interface_naming_inconsistency',
                'description' => 'Some interfaces do not follow the "Interface" suffix convention',
                'count' => count($interfacesWithoutSuffix),
                'examples' => array_slice($interfacesWithoutSuffix, 0, 5)
            ];
        }
        
        // Check for trait naming consistency
        $traitNames = array_column($this->results['traits'], 'name');
        $traitsWithoutSuffix = array_filter($traitNames, fn($name) => !str_ends_with($name, 'Trait') && !str_ends_with($name, 'able'));
        
        if (!empty($traitsWithoutSuffix)) {
            $patterns[] = [
                'type' => 'trait_naming_inconsistency',
                'description' => 'Some traits do not follow naming conventions',
                'count' => count($traitsWithoutSuffix),
                'examples' => array_slice($traitsWithoutSuffix, 0, 5)
            ];
        }
        
        // Identify potential interface consolidation opportunities
        $interfacesByName = [];
        foreach ($this->results['interfaces'] as $interface) {
            $baseName = str_replace(['Interface', 'Contract'], '', $interface['name']);
            $interfacesByName[$baseName][] = $interface;
        }
        
        $duplicateInterfaces = array_filter($interfacesByName, fn($interfaces) => count($interfaces) > 1);
        if (!empty($duplicateInterfaces)) {
            $patterns[] = [
                'type' => 'potential_interface_consolidation',
                'description' => 'Multiple interfaces with similar names that could be consolidated',
                'count' => count($duplicateInterfaces),
                'examples' => array_keys($duplicateInterfaces)
            ];
        }
        
        $this->results['patterns'] = $patterns;
    }

    public function generateReport(): string
    {
        $report = "# Code Pattern Analysis Report\n\n";
        $report .= "Generated on: " . date('Y-m-d H:i:s') . "\n\n";
        
        // Statistics
        $stats = $this->results['statistics'];
        $report .= "## 📊 Statistics\n\n";
        $report .= "- **Total Elements Analyzed**: {$stats['total_elements']}\n";
        $report .= "- **Classes**: {$stats['class_count']}\n";
        $report .= "- **Interfaces**: {$stats['interface_count']}\n";
        $report .= "- **Traits**: {$stats['trait_count']}\n";
        $report .= "- **Variables**: {$stats['variable_count']}\n";
        $report .= "- **Methods**: {$stats['method_count']}\n";
        $report .= "- **Constants**: {$stats['constant_count']}\n\n";
        
        // Naming patterns
        $report .= "## 🏷️ Naming Pattern Distribution\n\n";
        foreach ($stats['naming_percentages'] as $pattern => $percentage) {
            $count = $stats['naming_patterns'][$pattern];
            $report .= "- **{$pattern}**: {$count} ({$percentage}%)\n";
        }
        $report .= "\n";
        
        // Identified patterns
        if (!empty($this->results['patterns'])) {
            $report .= "## 🔍 Identified Issues\n\n";
            foreach ($this->results['patterns'] as $pattern) {
                $report .= "### {$pattern['description']}\n";
                $report .= "- **Type**: {$pattern['type']}\n";
                $report .= "- **Count**: {$pattern['count']}\n";
                if (!empty($pattern['examples'])) {
                    $report .= "- **Examples**: " . implode(', ', $pattern['examples']) . "\n";
                }
                $report .= "\n";
            }
        }
        
        // Recommendations
        $report .= "## 💡 Recommendations\n\n";
        
        $camelCasePercentage = $stats['naming_percentages']['camelCase'];
        $snakeCasePercentage = $stats['naming_percentages']['snake_case'];
        $pascalCasePercentage = $stats['naming_percentages']['PascalCase'];
        
        if ($camelCasePercentage < 80) {
            $report .= "- **Standardize camelCase**: Only {$camelCasePercentage}% of elements use camelCase. Consider standardizing variable and method names.\n";
        }
        
        if ($pascalCasePercentage < 90) {
            $report .= "- **Standardize PascalCase**: Only {$pascalCasePercentage}% of classes use PascalCase. Ensure all class Names follow this convention.\n";
        }
        
        if ($stats['interface_count'] > 0) {
            $report .= "- **Interface Consolidation**: Review {$stats['interface_count']} interfaces for consolidation opportunities.\n";
        }
        
        if ($stats['trait_count'] > 0) {
            $report .= "- **Trait Organization**: Review {$stats['trait_count']} traits for better organization and naming.\n";
        }
        
        return $report;
    }
}

// Run the analysis
if (php_sapi_name() === 'cli') {
    $analyzer = new CodePatternAnalyzer();
    $results = $analyzer->analyze('app/');
    
    // Generate and save report
    $report = $analyzer->generateReport();
    file_put_contents('docs/CODE_ANALYSIS_REPORT.md', $report);
    
    echo "\n📄 Report saved to: docs/CODE_ANALYSIS_REPORT.md\n";
    echo "🎯 Analysis Summary:\n";
    echo "   - Classes: {$results['statistics']['class_count']}\n";
    echo "   - Interfaces: {$results['statistics']['interface_count']}\n";
    echo "   - Traits: {$results['statistics']['trait_count']}\n";
    echo "   - Variables: {$results['statistics']['variable_count']}\n";
    echo "   - Methods: {$results['statistics']['method_count']}\n";
    echo "   - Issues Found: " . count($results['patterns']) . "\n";
}
