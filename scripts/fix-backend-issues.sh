#!/bin/bash

# Comprehensive Backend Fix Script
# Executes all three phases of backend improvements in parallel where safe

echo "🚀 Starting Comprehensive Backend Fixes"
echo "========================================"
echo ""

# Initialize counters
phase1_fixes=0
phase2_fixes=0
phase3_fixes=0

# Create backup
echo "📦 Creating backup..."
cp -r app/ app_backup_$(date +%Y%m%d_%H%M%S)

echo "✅ Backup created"
echo ""

# PHASE 1: CRITICAL FIXES (Sequential for safety)
echo "🚨 PHASE 1: CRITICAL FIXES"
echo "=========================="

# Fix 1: Add missing namespace declarations
echo "🔧 Adding missing namespace declarations..."

# Fix app/helpers.php
if ! grep -q "^namespace" app/helpers.php; then
    echo "<?php

namespace App;

$(tail -n +2 app/helpers.php)" > app/helpers.php.tmp && mv app/helpers.php.tmp app/helpers.php
    echo "  ✅ Fixed app/helpers.php"
    ((phase1_fixes++))
fi

# Fix route files that need namespaces (these are actually route files, so they don't need namespaces)
# Let's check what these files actually contain first

# Fix 2: Correct namespace imports (Modules\ -> App\)
echo "🔧 Fixing incorrect namespace imports..."

find app/ -name "*.php" -exec grep -l "use Modules\\\\" {} \; | while read file; do
    sed -i 's/use Modules\\/use App\\/g' "$file"
    echo "  ✅ Fixed namespace imports in $file"
    ((phase1_fixes++))
done

find tests/ -name "*.php" -exec grep -l "use Modules\\\\" {} \; 2>/dev/null | while read file; do
    sed -i 's/use Modules\\/use App\\/g' "$file"
    echo "  ✅ Fixed namespace imports in $file"
    ((phase1_fixes++))
done

echo "✅ Phase 1 Critical Fixes Complete"
echo ""

# PHASE 2: WARNING FIXES (Can run in parallel)
echo "⚠️ PHASE 2: WARNING FIXES"
echo "========================="

# Fix 3: Replace deprecated $dates with $casts
echo "🔧 Replacing deprecated \$dates properties..."

find app/ -name "*.php" -exec grep -l "protected.*\$dates.*=" {} \; | while read file; do
    # Create a backup of the original line for reference
    grep "protected.*\$dates.*=" "$file" > /tmp/dates_backup.txt
    
    # Replace $dates with $casts
    sed -i 's/protected \$dates = \[/protected \$casts = [/g' "$file"
    sed -i 's/protected static \$dates = \[/protected static \$casts = [/g' "$file"
    
    # Convert date field names to datetime casting
    sed -i "s/'created_at'/'created_at' => 'datetime'/g" "$file"
    sed -i "s/'updated_at'/'updated_at' => 'datetime'/g" "$file"
    sed -i "s/'deleted_at'/'deleted_at' => 'datetime'/g" "$file"
    sed -i "s/'published_at'/'published_at' => 'datetime'/g" "$file"
    sed -i "s/'expires_at'/'expires_at' => 'datetime'/g" "$file"
    
    echo "  ✅ Updated \$dates to \$casts in $file"
    ((phase2_fixes++))
done

# Fix 4: Remove debug statements
echo "🔧 Removing debug statements..."

find app/ -name "*.php" -exec grep -l "dd(" {} \; | while read file; do
    # Comment out dd() statements instead of removing them completely
    sed -i 's/dd(/\/\/ dd(/g' "$file"
    echo "  ✅ Commented out dd() in $file"
    ((phase2_fixes++))
done

find app/ -name "*.php" -exec grep -l "dump(" {} \; | while read file; do
    # Comment out dump() statements
    sed -i 's/dump(/\/\/ dump(/g' "$file"
    echo "  ✅ Commented out dump() in $file"
    ((phase2_fixes++))
done

find app/ -name "*.php" -exec grep -l "var_dump(" {} \; | while read file; do
    # Comment out var_dump() statements
    sed -i 's/var_dump(/\/\/ var_dump(/g' "$file"
    echo "  ✅ Commented out var_dump() in $file"
    ((phase2_fixes++))
done

echo "✅ Phase 2 Warning Fixes Complete"
echo ""

# PHASE 3: QUALITY FIXES (Highly parallelizable)
echo "ℹ️ PHASE 3: QUALITY FIXES"
echo "========================"

# Fix 5: Add visibility to constants
echo "🔧 Adding visibility modifiers to constants..."

find app/ -name "*.php" -exec grep -l "^\s*const " {} \; | while read file; do
    # Add public visibility to constants that don't have visibility
    sed -i 's/^\(\s*\)const /\1public const /g' "$file"
    echo "  ✅ Added visibility to constants in $file"
    ((phase3_fixes++))
done

# Fix 6: Add return type hints to scope methods
echo "🔧 Adding return type hints to scope methods..."

find app/ -name "*.php" -exec grep -l "function scope[A-Z]" {} \; | while read file; do
    # Add Builder return type to scope methods that don't have it
    sed -i 's/function scope\([A-Za-z]*\)\s*(\([^)]*\))\s*{/function scope\1(\2): \\Illuminate\\Database\\Eloquent\\Builder {/g' "$file"
    
    # Add the use statement for Builder if not present
    if ! grep -q "use Illuminate\\\\Database\\\\Eloquent\\\\Builder;" "$file"; then
        # Find the last use statement and add Builder after it
        sed -i '/^use /a use Illuminate\\Database\\Eloquent\\Builder;' "$file"
    fi
    
    echo "  ✅ Added return type hints to scope methods in $file"
    ((phase3_fixes++))
done

echo "✅ Phase 3 Quality Fixes Complete"
echo ""

# VERIFICATION
echo "🔍 VERIFICATION"
echo "==============="

# Run the analysis again to check improvements
echo "📊 Running post-fix analysis..."
./scripts/analyze-backend.sh > post_fix_analysis.txt

# Extract the new health score
new_health_score=$(grep "Health Score:" post_fix_analysis.txt | grep -o '[0-9]*' | head -1)

echo ""
echo "📈 FIX SUMMARY"
echo "=============="
echo "Phase 1 (Critical) Fixes: $phase1_fixes"
echo "Phase 2 (Warning) Fixes: $phase2_fixes"  
echo "Phase 3 (Quality) Fixes: $phase3_fixes"
echo "Total Fixes Applied: $((phase1_fixes + phase2_fixes + phase3_fixes))"
echo ""
echo "🏥 Health Score Improvement:"
echo "Before: 0/100"
echo "After: ${new_health_score:-'Calculating...'}/100"
echo ""

# Show remaining issues
echo "📋 Remaining Issues:"
grep -E "(CRITICAL|WARNING|INFO):" post_fix_analysis.txt | head -10

echo ""
echo "✅ Comprehensive Backend Fixes Complete!"
echo "📄 Detailed results saved to: post_fix_analysis.txt"
echo ""
echo "🚀 Next Steps:"
echo "1. Review the post-fix analysis results"
echo "2. Test application functionality"
echo "3. Run automated tests if available"
echo "4. Deploy to staging for validation"

