# Laravel Backend Syntax Analysis & Fixing Suite

A comprehensive set of PHP scripts for analyzing and fixing syntax issues in Laravel backend codebases.

## 🚀 Quick Start

```bash
# Make the script executable
chmod +x scripts/analyze.sh

# Run complete analysis and fixes
./scripts/analyze.sh

# Run in dry-run mode (no actual changes)
./scripts/analyze.sh --dry-run

# Analyze specific Laravel project
./scripts/analyze.sh --path /path/to/your/laravel/project
```

## 📁 Scripts Overview

### 1. `analyze.sh` - Main Entry Point
**Usage**: `./analyze.sh [options]`

The main shell script that orchestrates the entire analysis and fixing process.

**Options**:
- `-p, --path PATH` - Base path to analyze (default: current directory)
- `-d, --dry-run` - Run in dry-run mode (no actual fixes)
- `-a, --analysis-only` - Run analysis only (no fixes)
- `-f, --fixes-only` - Run fixes only (requires existing report)
- `-h, --help` - Show help message

### 2. `syntax-analyzer.php` - Core Analysis Engine
**Usage**: `php syntax-analyzer.php [base_path]`

Scans PHP files and identifies:
- 🚨 **Critical Issues**: Syntax errors, missing imports, incorrect namespaces
- ⚠️ **Warning Issues**: Deprecated patterns, inconsistent constants, naming issues
- ℹ️ **Info Issues**: Missing type hints, code quality improvements

### 3. `parallel-fixer.php` - Automated Fix Engine
**Usage**: `php parallel-fixer.php [base_path] [--dry-run] [report_file]`

Fixes issues in three parallel phases:
- **Phase 1**: Critical issues (immediate fix required)
- **Phase 2**: High priority issues (warnings)
- **Phase 3**: Code quality improvements

### 4. `run-analysis.php` - Batch Runner
**Usage**: `php run-analysis.php [base_path]`

Orchestrates the complete process:
1. Runs syntax analysis
2. Applies fixes in parallel phases
3. Generates comprehensive reports

## 🔍 What Gets Analyzed

### Critical Issues (🚨)
- **Missing Imports**: Incorrect namespace references
- **Syntax Errors**: Mismatched braces, missing semicolons
- **Namespace Issues**: Wrong module references

### Warning Issues (⚠️)
- **Deprecated Patterns**: `$dates` property, old array syntax
- **Inconsistent Constants**: Mixed `const` vs `public const`
- **Suspicious File Names**: Unusual naming patterns

### Info Issues (ℹ️)
- **Missing Type Hints**: Scope methods without return types
- **Code Quality**: Formatting, documentation improvements

## 📊 Generated Reports

### 1. `syntax-analysis-report.json`
Detailed JSON report with all findings:
```json
{
  "stats": {
    "total_files": 268,
    "files_with_issues": 15,
    "critical_issues": 3,
    "warning_issues": 8,
    "info_issues": 12
  },
  "issues": { ... },
  "summary": {
    "health_score": 85,
    "critical_files": [...],
    "warning_files": [...]
  }
}
```

### 2. `syntax-analysis-report.html`
Interactive HTML report for easy viewing in browser with:
- Visual statistics dashboard
- Color-coded issue severity
- File-by-file breakdown
- Health score visualization

### 3. `syntax-analysis-summary.json`
Executive summary with:
- Key statistics
- Health score
- Actionable recommendations
- Critical files list

## 🛠️ Fix Categories

### Phase 1: Critical Fixes
- ✅ Fix missing/incorrect imports
- ✅ Correct namespace references
- ✅ Add missing semicolons
- ✅ Fix basic syntax errors

### Phase 2: High Priority Fixes
- ✅ Convert deprecated `$dates` to `$casts`
- ✅ Standardize constant declarations
- ✅ Update old array syntax
- ✅ Fix naming inconsistencies

### Phase 3: Quality Improvements
- ✅ Add missing type hints
- ✅ Improve code formatting
- ✅ Add documentation
- ✅ Optimize performance patterns

## 🔧 Configuration

The scripts use sensible defaults but can be customized by modifying the configuration in `run-analysis.php`:

```php
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
]
```

## 💾 Backup & Safety

### Automatic Backups
When fixes are applied, automatic backups are created:
- Format: `filename.php.backup.YYYY-MM-DD-HH-MM-SS`
- Location: Same directory as original file

### Restore Files
```bash
# Restore a specific file
cp file.php.backup.2024-01-15-10-30-00 file.php

# Clean up all backups
rm *.backup.*
```

### Dry Run Mode
Always test first with dry-run mode:
```bash
./scripts/analyze.sh --dry-run
```

## 📈 Health Score

The health score (0-100) is calculated based on:
- **Critical Issues**: -10 points each
- **Warning Issues**: -5 points each
- **Info Issues**: -1 point each

**Score Interpretation**:
- 🟢 **80-100**: Excellent code quality
- 🟡 **60-79**: Good, minor improvements needed
- 🔴 **0-59**: Needs attention, multiple issues

## 🎯 Best Practices

### Before Running
1. **Backup your project**: `git commit -am "Before syntax fixes"`
2. **Run in dry-run mode first**: `./analyze.sh --dry-run`
3. **Review the HTML report**: Check what will be changed

### After Running
1. **Test your application**: Ensure fixes don't break functionality
2. **Review changes**: Check the modified files
3. **Run tests**: Execute your test suite
4. **Commit changes**: `git add . && git commit -m "Fix syntax issues"`

### Continuous Integration
Add to your CI pipeline:
```yaml
- name: Syntax Analysis
  run: |
    chmod +x scripts/analyze.sh
    ./scripts/analyze.sh --analysis-only
    # Fail if health score < 70
    php -r "
      $report = json_decode(file_get_contents('syntax-analysis-report.json'), true);
      if ($report['summary']['health_score'] < 70) exit(1);
    "
```

## 🐛 Troubleshooting

### Common Issues

**"PHP is not installed"**
```bash
# Install PHP (Ubuntu/Debian)
sudo apt-get install php-cli

# Install PHP (macOS with Homebrew)
brew install php
```

**"Permission denied"**
```bash
chmod +x scripts/analyze.sh
```

**"Analysis report not found"**
```bash
# Run analysis first
./scripts/analyze.sh --analysis-only
# Then run fixes
./scripts/analyze.sh --fixes-only
```

### Debug Mode
For detailed debugging, run PHP scripts directly:
```bash
php -d display_errors=1 scripts/syntax-analyzer.php
```

## 🤝 Contributing

To extend the analysis capabilities:

1. **Add new issue detection** in `syntax-analyzer.php`
2. **Add corresponding fixes** in `parallel-fixer.php`
3. **Update documentation** in this README
4. **Test thoroughly** with various Laravel projects

## 📝 License

This tool is part of the Laravel Accounting Platform project and follows the same license terms.

---

**Happy coding! 🚀**

