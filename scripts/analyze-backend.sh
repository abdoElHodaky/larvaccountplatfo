#!/bin/bash

# Backend Syntax Analyzer for Laravel Accounting Platform
# Comprehensive analysis script using bash and standard Unix tools

echo "🔍 Backend Syntax Analysis Starting..."
echo "📁 Project Root: $(pwd)"
echo "📊 Analyzing Laravel Accounting Platform"
echo ""

# Initialize counters
total_files=0
files_with_issues=0
critical_issues=0
warning_issues=0
info_issues=0

# Create results file
results_file="backend-analysis-results.txt"
echo "Backend Syntax Analysis Report" > "$results_file"
echo "Generated: $(date)" >> "$results_file"
echo "======================================" >> "$results_file"
echo "" >> "$results_file"

# Find all PHP files
echo "📂 Discovering PHP files..."
php_files=$(find . -name "*.php" -not -path "./vendor/*" -not -path "./node_modules/*" -not -path "./storage/*" -not -path "./.git/*")
total_files=$(echo "$php_files" | wc -l)

echo "📊 Found $total_files PHP files to analyze"
echo ""

# Analysis functions
analyze_file() {
    local file="$1"
    local file_issues=0
    local relative_path="${file#./}"
    
    echo "Analyzing: $relative_path" >> "$results_file"
    
    # Check 1: Look for deprecated $dates property
    if grep -q 'protected.*$dates.*=' "$file"; then
        echo "  ⚠️  DEPRECATED: \$dates property found (use \$casts instead)" >> "$results_file"
        ((warning_issues++))
        ((file_issues++))
    fi
    
    # Check 2: Look for incorrect namespace imports
    if grep -q 'use Modules\\' "$file"; then
        echo "  🚨 CRITICAL: Incorrect namespace 'Modules\\' found (should be 'App\\')" >> "$results_file"
        ((critical_issues++))
        ((file_issues++))
    fi
    
    # Check 3: Look for constants without visibility
    if grep -qE '^\s*const\s+[A-Z_]+' "$file"; then
        echo "  ℹ️  INFO: Constants without explicit visibility found" >> "$results_file"
        ((info_issues++))
        ((file_issues++))
    fi
    
    # Check 4: Look for scope methods without return types
    if grep -qE 'function\s+scope[A-Z]\w*\s*\(' "$file" && ! grep -qE 'function\s+scope[A-Z]\w*\s*\([^)]*\)\s*:\s*\w+' "$file"; then
        echo "  ℹ️  INFO: Scope methods missing return type hints" >> "$results_file"
        ((info_issues++))
        ((file_issues++))
    fi
    
    # Check 5: Look for debug statements
    if grep -qE '(var_dump|print_r|dd\(|dump\()' "$file"; then
        echo "  ⚠️  WARNING: Debug statements found" >> "$results_file"
        ((warning_issues++))
        ((file_issues++))
    fi
    
    # Check 6: Look for TODO/FIXME comments
    if grep -qiE '(TODO|FIXME|HACK):' "$file"; then
        echo "  ℹ️  INFO: TODO/FIXME comments found" >> "$results_file"
        ((info_issues++))
        ((file_issues++))
    fi
    
    # Check 7: Look for potential security issues
    if grep -qE 'DB::raw\s*\(\s*['"'"'"][^'"'"'"]*\$' "$file"; then
        echo "  🚨 CRITICAL: Potential SQL injection in DB::raw()" >> "$results_file"
        ((critical_issues++))
        ((file_issues++))
    fi
    
    # Check 8: Look for hardcoded credentials
    if grep -qiE '(password|api_key|secret)\s*=\s*['"'"'"][^'"'"'"]{5,}['"'"'"]' "$file"; then
        echo "  🚨 CRITICAL: Potential hardcoded credentials" >> "$results_file"
        ((critical_issues++))
        ((file_issues++))
    fi
    
    # Check 9: Look for missing namespace in app files
    if [[ "$file" == ./app/* ]] && ! grep -q '^namespace ' "$file"; then
        echo "  🚨 CRITICAL: Missing namespace declaration" >> "$results_file"
        ((critical_issues++))
        ((file_issues++))
    fi
    
    # Check 10: Look for old array syntax
    if [[ "$file" == ./config/* ]] && grep -q 'array(' "$file"; then
        echo "  ℹ️  INFO: Old array() syntax found (consider using [])" >> "$results_file"
        ((info_issues++))
        ((file_issues++))
    fi
    
    if [ $file_issues -gt 0 ]; then
        ((files_with_issues++))
        echo "" >> "$results_file"
    fi
}

# Analyze each file
echo "🔍 Starting detailed analysis..."
file_count=0

for file in $php_files; do
    analyze_file "$file"
    ((file_count++))
    
    # Progress indicator
    if [ $((file_count % 20)) -eq 0 ]; then
        progress=$((file_count * 100 / total_files))
        echo "📈 Progress: $progress% ($file_count/$total_files)"
    fi
done

# Calculate health score
total_issues=$((critical_issues + warning_issues + info_issues))
health_score=$((100 - (critical_issues * 10) - (warning_issues * 3) - info_issues))
if [ $health_score -lt 0 ]; then
    health_score=0
fi

# Generate summary report
echo ""
echo "==============================================="
echo "📊 BACKEND SYNTAX ANALYSIS SUMMARY"
echo "==============================================="
echo ""
echo "📈 STATISTICS:"
echo "├─ Total Files Scanned: $total_files"
echo "├─ Files with Issues: $files_with_issues"
echo "├─ Critical Issues: $critical_issues"
echo "├─ Warning Issues: $warning_issues"
echo "└─ Info Issues: $info_issues"
echo ""
echo "🏥 HEALTH SCORE: $health_score/100"

if [ $health_score -ge 90 ]; then
    echo "   Status: ✅ Excellent"
elif [ $health_score -ge 75 ]; then
    echo "   Status: ✅ Good"
elif [ $health_score -ge 60 ]; then
    echo "   Status: ⚠️ Needs Improvement"
else
    echo "   Status: ❌ Critical"
fi

echo ""

# Add summary to results file
{
    echo ""
    echo "SUMMARY STATISTICS:"
    echo "==================="
    echo "Total Files Scanned: $total_files"
    echo "Files with Issues: $files_with_issues"
    echo "Critical Issues: $critical_issues"
    echo "Warning Issues: $warning_issues"
    echo "Info Issues: $info_issues"
    echo "Health Score: $health_score/100"
} >> "$results_file"

# Show critical issues if any
if [ $critical_issues -gt 0 ]; then
    echo "🚨 CRITICAL ISSUES FOUND:"
    echo "These issues must be fixed immediately!"
    echo ""
    grep -A 1 "🚨 CRITICAL:" "$results_file" | head -20
    echo ""
fi

# Show recommendations
echo "💡 RECOMMENDATIONS:"
if [ $critical_issues -gt 0 ]; then
    echo "├─ 🔥 Fix all critical issues immediately"
fi
if grep -q "Incorrect namespace" "$results_file"; then
    echo "├─ 📦 Replace 'Modules\\' with 'App\\' in namespace imports"
fi
if grep -q "dates property" "$results_file"; then
    echo "├─ 📅 Update deprecated \$dates to \$casts with datetime casting"
fi
if grep -q "return type hints" "$results_file"; then
    echo "├─ 🏷️ Add return type hints to scope methods"
fi
if grep -q "Constants without" "$results_file"; then
    echo "├─ 🔧 Add visibility modifiers to constants (public const)"
fi
echo "├─ 🧪 Consider automated code quality tools (PHPStan, Laravel Pint)"
echo "└─ 🔄 Run this analyzer regularly to maintain code quality"

echo ""
echo "📄 Detailed results saved to: $results_file"
echo ""
echo "==============================================="
echo "Analysis completed at $(date)"
echo "==============================================="

