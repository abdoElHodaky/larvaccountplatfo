#!/bin/bash

# Clean analysis excluding backup files
echo "🔍 Running Clean Backend Analysis (excluding backups)..."

# Initialize counters
total_files=0
files_with_issues=0
critical_issues=0
warning_issues=0
info_issues=0

# Create results file
results_file="clean-analysis-results.txt"
echo "Clean Backend Syntax Analysis Report" > "$results_file"
echo "Generated: $(date)" >> "$results_file"
echo "======================================" >> "$results_file"
echo "" >> "$results_file"

# Find all PHP files excluding backups
php_files=$(find . -name "*.php" -not -path "./vendor/*" -not -path "./node_modules/*" -not -path "./storage/*" -not -path "./.git/*" -not -path "./app_backup_*/*")
total_files=$(echo "$php_files" | wc -l)

echo "📊 Found $total_files PHP files to analyze (excluding backups)"
echo ""

# Analysis function
analyze_file() {
    local file="$1"
    local file_issues=0
    local relative_path="${file#./}"
    
    echo "Analyzing: $relative_path" >> "$results_file"
    
    # Check 1: Look for incorrect namespace imports
    if grep -q 'use Modules\\' "$file"; then
        echo "  🚨 CRITICAL: Incorrect namespace 'Modules\\' found (should be 'App\\')" >> "$results_file"
        ((critical_issues++))
        ((file_issues++))
    fi
    
    # Check 2: Look for missing namespace in app files
    if [[ "$file" == ./app/* ]] && ! grep -q '^namespace ' "$file" && [[ "$file" != *"/Routes/"* ]]; then
        echo "  🚨 CRITICAL: Missing namespace declaration" >> "$results_file"
        ((critical_issues++))
        ((file_issues++))
    fi
    
    # Check 3: Look for deprecated $dates property
    if grep -q 'protected.*$dates.*=' "$file"; then
        echo "  ⚠️  DEPRECATED: \$dates property found (use \$casts instead)" >> "$results_file"
        ((warning_issues++))
        ((file_issues++))
    fi
    
    # Check 4: Look for debug statements
    if grep -qE '(var_dump|print_r|dd\(|dump\()' "$file"; then
        echo "  ⚠️  WARNING: Debug statements found" >> "$results_file"
        ((warning_issues++))
        ((file_issues++))
    fi
    
    # Check 5: Look for constants without visibility
    if grep -qE '^\s*const\s+[A-Z_]+' "$file"; then
        echo "  ℹ️  INFO: Constants without explicit visibility found" >> "$results_file"
        ((info_issues++))
        ((file_issues++))
    fi
    
    if [ $file_issues -gt 0 ]; then
        ((files_with_issues++))
        echo "" >> "$results_file"
    fi
}

# Analyze each file
file_count=0
for file in $php_files; do
    analyze_file "$file"
    ((file_count++))
    
    if [ $((file_count % 50)) -eq 0 ]; then
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

# Generate summary
echo ""
echo "==============================================="
echo "📊 CLEAN BACKEND ANALYSIS SUMMARY"
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

echo ""
echo "📄 Clean analysis results saved to: $results_file"

