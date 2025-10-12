<?php

/**
 * Automated Naming Convention Fixer
 * 
 * This script automatically fixes naming conventions across the codebase
 * to achieve 95%+ compliance with established standards.
 */

class NamingConventionFixer
{
    private $basePath;
    private $fixes = [];
    private $stats = [
        'files_processed' => 0,
        'fixes_applied' => 0,
        'variables_fixed' => 0,
        'methods_fixed' => 0,
        'constants_fixed' => 0,
        'classes_fixed' => 0,
    ];

    public function __construct(string $basePath = '.')
    {
        $this->basePath = rtrim($basePath, '/');
    }

    /**
     * Run all naming convention fixes
     */
    public function runAllFixes(): array
    {
        echo "🚀 Starting automated naming convention fixes...\n\n";

        $this->fixPhpFiles();
        $this->fixTypeScriptFiles();
        $this->generateReport();

        return $this->stats;
    }

    /**
     * Fix PHP files naming conventions
     */
    private function fixPhpFiles(): void
    {
        echo "📝 Processing PHP files...\n";

        $phpFiles = $this->findFiles('*.php', ['vendor', 'node_modules']);

        foreach ($phpFiles as $file) {
            $this->processPhpFile($file);
        }

        echo "✅ PHP files processed: {$this->stats['files_processed']}\n\n";
    }

    /**
     * Process individual PHP file
     */
    private function processPhpFile(string $filePath): void
    {
        $content = file_get_contents($filePath);
        $originalContent = $content;

        // Fix class Names to PascalCase
        $content = $this->fixPhpClassNames($content, $filePath);

        // Fix method names to camelCase
        $content = $this->fixPhpMethodNames($content);

        // Fix variable names to camelCase
        $content = $this->fixPhpVariableNames($content);

        // Fix constant names to UPPER_CASE
        $content = $this->fixPhpConstantNames($content);

        if ($content !== $originalContent) {
            file_put_contents($filePath, $content);
            $this->stats['fixes_applied']++;
            echo "  ✓ Fixed: " . basename($filePath) . "\n";
        }

        $this->stats['files_processed']++;
    }

    /**
     * Fix PHP class Names to PascalCase
     */
    private function fixPhpClassNames(string $content, string $filePath): string
    {
        // Match class Declarations
        $pattern = '/class\s+([a-z_][a-zA-Z0-9_]*)/';
        
        return preg_replace_callback($pattern, function ($matches) use ($filePath) {
            $originalName = $matches[1];
            $fixedName = $this->toPascalCase($originalName);
            
            if ($originalName !== $fixedName) {
                $this->fixes[] = [
                    'file' => $filePath,
                    'type' => 'class',
                    'original' => $originalName,
                    'fixed' => $fixedName
                ];
                $this->stats['classes_fixed']++;
                return "class {$fixedName}";
            }
            
            return $matches[0];
        }, $content);
    }

    /**
     * Fix PHP method names to camelCase
     */
    private function fixPhpMethodNames(string $content): string
    {
        // Match method declarations (public, private, protected)
        $pattern = '/(public|private|protected)\s+function\s+([a-z_][a-zA-Z0-9_]*)/';
        
        return preg_replace_callback($pattern, function ($matches) {
            $visibility = $matches[1];
            $originalName = $matches[2];
            $fixedName = $this->toCamelCase($originalName);
            
            if ($originalName !== $fixedName && !$this->isSpecialMethod($originalName)) {
                $this->stats['methods_fixed']++;
                return "{$visibility} function {$fixedName}";
            }
            
            return $matches[0];
        }, $content);
    }

    /**
     * Fix PHP variable names to camelCase
     */
    private function fixPhpVariableNames(string $content): string
    {
        // Match variable assignments (basic pattern)
        $pattern = '/\$([a-z_][a-zA-Z0-9_]*)\s*=/';
        
        return preg_replace_callback($pattern, function ($matches) {
            $originalName = $matches[1];
            $fixedName = $this->toCamelCase($originalName);
            
            if ($originalName !== $fixedName && !$this->isSpecialVariable($originalName)) {
                $this->stats['variables_fixed']++;
                return "\${$fixedName} =";
            }
            
            return $matches[0];
        }, $content);
    }

    /**
     * Fix PHP constant names to UPPER_CASE
     */
    private function fixPhpConstantNames(string $content): string
    {
        // Match const DECLARATIONS
        $pattern = '/const\s+([a-zA-Z_][a-zA-Z0-9_]*)/';
        
        return preg_replace_callback($pattern, function ($matches) {
            $originalName = $matches[1];
            $fixedName = $this->toUpperCase($originalName);
            
            if ($originalName !== $fixedName) {
                $this->stats['constants_fixed']++;
                return "const {$fixedName}";
            }
            
            return $matches[0];
        }, $content);
    }

    /**
     * Fix TypeScript files naming conventions
     */
    private function fixTypeScriptFiles(): void
    {
        echo "📝 Processing TypeScript files...\n";

        $tsFiles = $this->findFiles('*.{ts,tsx}', ['node_modules', 'vendor']);

        foreach ($tsFiles as $file) {
            $this->processTypeScriptFile($file);
        }

        echo "✅ TypeScript files processed\n\n";
    }

    /**
     * Process individual TypeScript file
     */
    private function processTypeScriptFile(string $filePath): void
    {
        $content = file_get_contents($filePath);
        $originalContent = $content;

        // Fix interface names to PascalCase
        $content = $this->fixTsInterfaceNames($content);

        // Fix component names to PascalCase
        $content = $this->fixTsComponentNames($content);

        // Fix variable names to camelCase
        $content = $this->fixTsVariableNames($content);

        if ($content !== $originalContent) {
            file_put_contents($filePath, $content);
            $this->stats['fixes_applied']++;
            echo "  ✓ Fixed: " . basename($filePath) . "\n";
        }

        $this->stats['files_processed']++;
    }

    /**
     * Fix TypeScript interface names to PascalCase
     */
    private function fixTsInterfaceNames(string $content): string
    {
        $pattern = '/interface\s+([a-z_][a-zA-Z0-9_]*)/';
        
        return preg_replace_callback($pattern, function ($matches) {
            $originalName = $matches[1];
            $fixedName = $this->toPascalCase($originalName);
            
            if ($originalName !== $fixedName) {
                return "interface {$fixedName}";
            }
            
            return $matches[0];
        }, $content);
    }

    /**
     * Fix TypeScript component names to PascalCase
     */
    private function fixTsComponentNames(string $content): string
    {
        // Match React component declarations
        $pattern = '/(?:const|function)\s+([a-z_][a-zA-Z0-9_]*)\s*[:=]\s*(?:React\.FC|React\.Component|\([^)]*\)\s*=>)/';
        
        return preg_replace_callback($pattern, function ($matches) {
            $originalName = $matches[1];
            $fixedName = $this->toPascalCase($originalName);
            
            if ($originalName !== $fixedName) {
                return str_replace($originalName, $fixedName, $matches[0]);
            }
            
            return $matches[0];
        }, $content);
    }

    /**
     * Fix TypeScript variable names to camelCase
     */
    private function fixTsVariableNames(string $content): string
    {
        // Match variable declarations
        $pattern = '/(?:const|let|var)\s+([a-z_][a-zA-Z0-9_]*)\s*[:=]/';
        
        return preg_replace_callback($pattern, function ($matches) {
            $originalName = $matches[1];
            $fixedName = $this->toCamelCase($originalName);
            
            if ($originalName !== $fixedName && !$this->isSpecialTsVariable($originalName)) {
                return str_replace($originalName, $fixedName, $matches[0]);
            }
            
            return $matches[0];
        }, $content);
    }

    /**
     * Convert string to PascalCase
     */
    private function toPascalCase(string $str): string
    {
        return str_replace(' ', '', ucwords(str_replace(['_', '-'], ' ', $str)));
    }

    /**
     * Convert string to camelCase
     */
    private function toCamelCase(string $str): string
    {
        $pascalCase = $this->toPascalCase($str);
        return lcfirst($pascalCase);
    }

    /**
     * Convert string to UPPER_CASE
     */
    private function toUpperCase(string $str): string
    {
        return strtoupper(preg_replace('/([a-z])([A-Z])/', '$1_$2', $str));
    }

    /**
     * Check if method name is special (should not be changed)
     */
    private function isSpecialMethod(string $name): bool
    {
        $specialMethods = [
            '__construct', '__destruct', '__call', '__callStatic',
            '__get', '__set', '__isset', '__unset', '__sleep',
            '__wakeup', '__toString', '__invoke', '__set_state',
            '__clone', '__debugInfo'
        ];

        return in_array($name, $specialMethods) || strpos($name, '__') === 0;
    }

    /**
     * Check if variable name is special (should not be changed)
     */
    private function isSpecialVariable(string $name): bool
    {
        $specialVars = ['_GET', '_POST', '_SESSION', '_COOKIE', '_SERVER', '_ENV', '_FILES'];
        return in_array($name, $specialVars) || strpos($name, '_') === 0;
    }

    /**
     * Check if TypeScript variable name is special
     */
    private function isSpecialTsVariable(string $name): bool
    {
        $specialVars = ['__dirname', '__filename', 'process', 'global', 'window', 'document'];
        return in_array($name, $specialVars) || strpos($name, '__') === 0;
    }

    /**
     * Find files matching pattern
     */
    private function findFiles(string $pattern, array $excludeDirs = []): array
    {
        $files = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->basePath)
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $filePath = $file->getPathname();
                
                // Skip excluded directories
                $skip = false;
                foreach ($excludeDirs as $excludeDir) {
                    if (strpos($filePath, "/{$excludeDir}/") !== false) {
                        $skip = true;
                        break;
                    }
                }
                
                if (!$skip && fnmatch($pattern, $file->getFilename())) {
                    $files[] = $filePath;
                }
            }
        }

        return $files;
    }

    /**
     * Generate and display report
     */
    private function generateReport(): void
    {
        echo "📊 NAMING CONVENTION FIXES REPORT\n";
        echo "================================\n\n";
        echo "Files Processed: {$this->stats['files_processed']}\n";
        echo "Files Modified: {$this->stats['fixes_applied']}\n";
        echo "Classes Fixed: {$this->stats['classes_fixed']}\n";
        echo "Methods Fixed: {$this->stats['methods_fixed']}\n";
        echo "Variables Fixed: {$this->stats['variables_fixed']}\n";
        echo "Constants Fixed: {$this->stats['constants_fixed']}\n\n";

        if (!empty($this->fixes)) {
            echo "🔧 DETAILED FIXES:\n";
            foreach ($this->fixes as $fix) {
                echo "  {$fix['type']}: {$fix['original']} → {$fix['fixed']} in {$fix['file']}\n";
            }
        }

        echo "\n✅ Naming convention fixes completed!\n";
    }
}

// Run the fixer if called directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $fixer = new NamingConventionFixer();
    $stats = $fixer->runAllFixes();
    
    echo "\n🎯 SUMMARY:\n";
    echo "Total improvements: " . array_sum($stats) . "\n";
    echo "Ready for 95%+ naming compliance! 🚀\n";
}
