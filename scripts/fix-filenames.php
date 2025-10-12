<?php

/**
 * Filename Resimplification & Standardization Script
 *
 * This script analyzes and fixes filename inconsistencies to match
 * established naming conventions (PascalCase for classes/components, camelCase for others).
 */
class FilenameStandardizer
{
    private $basePath;

    private $renames = [];

    private $stats = [
        'files_analyzed' => 0,
        'files_renamed' => 0,
        'php_files_fixed' => 0,
        'ts_files_fixed' => 0,
        'import_updates' => 0,
    ];

    public function __construct(string $basePath = '.')
    {
        $this->basePath = rtrim($basePath, '/');
    }

    /**
     * Run filename standardization
     */
    public function standardizeFilenames(): array
    {
        echo "🚀 Starting filename standardization...\n\n";

        $this->analyzePhpFiles();
        $this->analyzeTypeScriptFiles();
        $this->executeRenames();
        $this->updateImports();
        $this->generateReport();

        return $this->stats;
    }

    /**
     * Analyze PHP files for naming issues
     */
    private function analyzePhpFiles(): void
    {
        echo "📝 Analyzing PHP files...\n";

        $phpFiles = $this->findFiles('./app', '*.php');

        foreach ($phpFiles as $file) {
            $this->analyzePhpFile($file);
        }

        echo '✅ PHP files analyzed: '.count($phpFiles)."\n\n";
    }

    /**
     * Analyze individual PHP file
     */
    private function analyzePhpFile(string $filePath): void
    {
        $this->stats['files_analyzed']++;

        $filename = basename($filePath);
        $directory = dirname($filePath);

        // Extract class Name from file content
        $content = file_get_contents($filePath);
        $className = $this->extractPhpClassName($content);

        if ($className) {
            $expectedFilename = $className.'.php';

            if ($filename !== $expectedFilename) {
                $newPath = $directory.'/'.$expectedFilename;

                // Check if target file already exists
                if (! file_exists($newPath)) {
                    $this->renames[] = [
                        'type' => 'php',
                        'old_path' => $filePath,
                        'new_path' => $newPath,
                        'old_name' => $filename,
                        'new_name' => $expectedFilename,
                        'class_name' => $className,
                    ];
                    $this->stats['php_files_fixed']++;
                }
            }
        }
    }

    /**
     * Analyze TypeScript files for naming issues
     */
    private function analyzeTypeScriptFiles(): void
    {
        echo "📝 Analyzing TypeScript files...\n";

        $tsFiles = $this->findFiles('./resources/js', '*.{ts,tsx}');

        foreach ($tsFiles as $file) {
            $this->analyzeTypeScriptFile($file);
        }

        echo '✅ TypeScript files analyzed: '.count($tsFiles)."\n\n";
    }

    /**
     * Analyze individual TypeScript file
     */
    private function analyzeTypeScriptFile(string $filePath): void
    {
        $this->stats['files_analyzed']++;

        $filename = basename($filePath, '.tsx');
        $filename = basename($filename, '.ts');
        $directory = dirname($filePath);
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);

        $content = file_get_contents($filePath);

        // Check if it's a React component
        if ($this->isReactComponent($content)) {
            $componentName = $this->extractComponentName($content, $filename);

            if ($componentName) {
                $expectedFilename = $componentName.'.'.$extension;
                $currentFilename = basename($filePath);

                if ($currentFilename !== $expectedFilename) {
                    $newPath = $directory.'/'.$expectedFilename;

                    if (! file_exists($newPath)) {
                        $this->renames[] = [
                            'type' => 'component',
                            'old_path' => $filePath,
                            'new_path' => $newPath,
                            'old_name' => $currentFilename,
                            'new_name' => $expectedFilename,
                            'component_name' => $componentName,
                        ];
                        $this->stats['ts_files_fixed']++;
                    }
                }
            }
        } else {
            // For non-component files, ensure camelCase
            $expectedFilename = $this->toCamelCase($filename).'.'.$extension;
            $currentFilename = basename($filePath);

            if ($currentFilename !== $expectedFilename && $this->shouldRename($filename)) {
                $newPath = $directory.'/'.$expectedFilename;

                if (! file_exists($newPath)) {
                    $this->renames[] = [
                        'type' => 'utility',
                        'old_path' => $filePath,
                        'new_path' => $newPath,
                        'old_name' => $currentFilename,
                        'new_name' => $expectedFilename,
                    ];
                    $this->stats['ts_files_fixed']++;
                }
            }
        }
    }

    /**
     * Execute all planned renames
     */
    private function executeRenames(): void
    {
        if (empty($this->renames)) {
            echo "✅ No files need renaming - all filenames are already standardized!\n\n";

            return;
        }

        echo "🔄 Executing file renames...\n";

        foreach ($this->renames as $rename) {
            if (rename($rename['old_path'], $rename['new_path'])) {
                echo "  ✓ Renamed: {$rename['old_name']} → {$rename['new_name']}\n";
                $this->stats['files_renamed']++;
            } else {
                echo "  ✗ Failed to rename: {$rename['old_name']}\n";
            }
        }

        echo "\n✅ File renames completed: {$this->stats['files_renamed']} files\n\n";
    }

    /**
     * Update import statements to reflect renamed files
     */
    private function updateImports(): void
    {
        if (empty($this->renames)) {
            return;
        }

        echo "🔄 Updating import statements...\n";

        // Find all files that might contain imports
        $allFiles = array_merge(
            $this->findFiles('./app', '*.php'),
            $this->findFiles('./resources/js', '*.{ts,tsx}')
        );

        foreach ($allFiles as $file) {
            $this->updateImportsInFile($file);
        }

        echo "✅ Import statements updated\n\n";
    }

    /**
     * Update imports in a specific file
     */
    private function updateImportsInFile(string $filePath): void
    {
        $content = file_get_contents($filePath);
        $originalContent = $content;

        foreach ($this->renames as $rename) {
            // Update PHP use statements
            if (pathinfo($filePath, PATHINFO_EXTENSION) === 'php') {
                $oldClass = pathinfo($rename['old_name'], PATHINFO_FILENAME);
                $newClass = pathinfo($rename['new_name'], PATHINFO_FILENAME);

                // Update use statements
                $content = preg_replace(
                    '/use\s+([^;]+\\\\)'.preg_quote($oldClass).';/',
                    'use $1'.$newClass.';',
                    $content
                );
            }

            // Update TypeScript/JavaScript imports
            if (in_array(pathinfo($filePath, PATHINFO_EXTENSION), ['ts', 'tsx', 'js', 'jsx'])) {
                $oldName = pathinfo($rename['old_name'], PATHINFO_FILENAME);
                $newName = pathinfo($rename['new_name'], PATHINFO_FILENAME);

                // Update import statements
                $content = preg_replace(
                    '/from\s+[\'"]([^\'"]*)'.preg_quote($oldName).'[\'"]/',
                    'from \'$1'.$newName.'\'',
                    $content
                );

                $content = preg_replace(
                    '/import\s+[\'"]([^\'"]*)'.preg_quote($oldName).'[\'"]/',
                    'import \'$1'.$newName.'\'',
                    $content
                );
            }
        }

        if ($content !== $originalContent) {
            file_put_contents($filePath, $content);
            $this->stats['import_updates']++;
        }
    }

    /**
     * Extract PHP class Name from file content
     */
    private function extractPhpClassName(string $content): ?string
    {
        if (preg_match('/class\s+([A-Za-z_][A-Za-z0-9_]*)/i', $content, $matches)) {
            return $matches[1];
        }

        if (preg_match('/interface\s+([A-Za-z_][A-Za-z0-9_]*)/i', $content, $matches)) {
            return $matches[1];
        }

        if (preg_match('/trait\s+([A-Za-z_][A-Za-z0-9_]*)/i', $content, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Check if TypeScript file is a React component
     */
    private function isReactComponent(string $content): bool
    {
        return preg_match('/export\s+(?:default\s+)?(?:function|const)\s+[A-Z]/', $content) ||
               preg_match('/React\.FC|React\.Component/', $content) ||
               preg_match('/return\s*\(\s*</', $content) ||
               preg_match('/jsx|tsx/', $content);
    }

    /**
     * Extract component name from TypeScript content
     */
    private function extractComponentName(string $content, string $fallbackName): ?string
    {
        // Try to find exported component
        if (preg_match('/export\s+(?:default\s+)?(?:function|const)\s+([A-Z][A-Za-z0-9_]*)/i', $content, $matches)) {
            return $this->toPascalCase($matches[1]);
        }

        // Fallback to filename in PascalCase
        return $this->toPascalCase($fallbackName);
    }

    /**
     * Check if filename should be renamed
     */
    private function shouldRename(string $filename): bool
    {
        // Don't rename special files
        $specialFiles = ['index', 'main', 'app', 'bootstrap', 'config'];

        return ! in_array(strtolower($filename), $specialFiles);
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
     * Find files matching pattern in directory
     */
    private function findFiles(string $directory, string $pattern): array
    {
        $files = [];

        if (! is_dir($directory)) {
            return $files;
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $filename = $file->getFilename();

                // Handle glob patterns
                if (strpos($pattern, '{') !== false) {
                    $patterns = explode(',', trim($pattern, '*.{}'));
                    foreach ($patterns as $ext) {
                        if (str_ends_with($filename, '.'.$ext)) {
                            $files[] = $file->getPathname();
                            break;
                        }
                    }
                } else {
                    if (fnmatch($pattern, $filename)) {
                        $files[] = $file->getPathname();
                    }
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
        echo "📊 FILENAME STANDARDIZATION REPORT\n";
        echo "=================================\n\n";
        echo "Files Analyzed: {$this->stats['files_analyzed']}\n";
        echo "Files Renamed: {$this->stats['files_renamed']}\n";
        echo "PHP Files Fixed: {$this->stats['php_files_fixed']}\n";
        echo "TypeScript Files Fixed: {$this->stats['ts_files_fixed']}\n";
        echo "Import Updates: {$this->stats['import_updates']}\n\n";

        if (! empty($this->renames)) {
            echo "🔧 DETAILED RENAMES:\n";
            foreach ($this->renames as $rename) {
                echo "  {$rename['type']}: {$rename['old_name']} → {$rename['new_name']}\n";
            }
        }

        echo "\n✅ Filename standardization completed!\n";
        echo "🎯 All filenames now follow consistent naming conventions!\n";
    }
}

// Run the standardizer if called directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $standardizer = new FilenameStandardizer;
    $stats = $standardizer->standardizeFilenames();

    echo "\n🎯 SUMMARY:\n";
    echo "Total files processed: {$stats['files_analyzed']}\n";
    echo "Files renamed: {$stats['files_renamed']}\n";
    echo "Import statements updated: {$stats['import_updates']}\n";
    echo "Filename standardization complete! 🚀\n";
}
