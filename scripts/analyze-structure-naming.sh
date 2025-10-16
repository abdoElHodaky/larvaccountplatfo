#!/bin/bash

# Advanced Backend Structure & Naming Analyzer
# Analyzes Laravel codebase for structure simplification and naming improvements

echo "🔍 Advanced Backend Structure & Naming Analysis"
echo "=============================================="
echo ""

# Initialize counters
total_files=0
structure_issues=0
naming_issues=0
complexity_issues=0
duplication_issues=0

# Create results file
results_file="structure-naming-analysis.txt"
echo "Advanced Backend Structure & Naming Analysis Report" > "$results_file"
echo "Generated: $(date)" >> "$results_file"
echo "=================================================" >> "$results_file"
echo "" >> "$results_file"

echo "📂 ANALYZING DIRECTORY STRUCTURE"
echo "================================"

# Analyze feature structure consistency
echo "🏗️ Checking feature structure consistency..."
feature_dirs=$(find app/Features -maxdepth 1 -type d -not -path "app/Features" | sort)

echo "Features found:" >> "$results_file"
for feature_dir in $feature_dirs; do
    feature_name=$(basename "$feature_dir")
    echo "  - $feature_name" >> "$results_file"
    
    # Check for standard directories
    standard_dirs=("Controllers" "Models" "Services" "Routes")
    missing_dirs=()
    
    for dir in "${standard_dirs[@]}"; do
        if [ ! -d "$feature_dir/$dir" ]; then
            missing_dirs+=("$dir")
        fi
    done
    
    if [ ${#missing_dirs[@]} -gt 0 ]; then
        echo "    ⚠️  Missing standard directories: ${missing_dirs[*]}" >> "$results_file"
        ((structure_issues++))
    fi
    
    # Count files in feature
    file_count=$(find "$feature_dir" -name "*.php" | wc -l)
    echo "    📊 PHP files: $file_count" >> "$results_file"
    
    if [ $file_count -lt 5 ]; then
        echo "    💡 SUGGESTION: Small feature ($file_count files) - consider consolidation" >> "$results_file"
    fi
done

echo "" >> "$results_file"

echo "🏷️ ANALYZING NAMING CONVENTIONS"
echo "==============================="

# Find all PHP files
php_files=$(find app/ -name "*.php" -not -path "*/app_backup_*/*")
total_files=$(echo "$php_files" | wc -l)

echo "📊 Analyzing $total_files PHP files for naming issues..."

echo "NAMING ANALYSIS:" >> "$results_file"
echo "===============" >> "$results_file"

# Check class vs filename consistency
echo "🔍 Checking class vs filename consistency..."
while IFS= read -r file; do
    if [ -f "$file" ]; then
        filename=$(basename "$file" .php)
        class_name=$(grep -o "^class [A-Za-z_][A-Za-z0-9_]*" "$file" | cut -d' ' -f2)
        
        if [ -n "$class_name" ] && [ "$class_name" != "$filename" ]; then
            echo "  ⚠️  Class/File mismatch: $file" >> "$results_file"
            echo "      Class: $class_name, File: $filename" >> "$results_file"
            ((naming_issues++))
        fi
    fi
done <<< "$php_files"

# Check for inconsistent method naming
echo "🔍 Checking method naming patterns..."
method_issues=0
while IFS= read -r file; do
    if [ -f "$file" ]; then
        # Find methods with underscores (should be camelCase)
        underscore_methods=$(grep -o "function [a-z_]*_[a-z_]*" "$file" | cut -d' ' -f2)
        if [ -n "$underscore_methods" ]; then
            echo "  ℹ️  Non-camelCase methods in $(basename "$file"):" >> "$results_file"
            echo "$underscore_methods" | while read -r method; do
                if [ -n "$method" ]; then
                    echo "      - $method" >> "$results_file"
                    ((method_issues++))
                fi
            done
        fi
    fi
done <<< "$php_files"

echo "" >> "$results_file"

echo "🔄 ANALYZING CODE DUPLICATION"
echo "============================="

echo "DUPLICATION ANALYSIS:" >> "$results_file"
echo "====================" >> "$results_file"

# Check for duplicate service names across features
echo "🔍 Checking for duplicate service names..."
service_files=$(find app/Features -name "*Service.php" -not -path "*/app_backup_*/*")
service_names=()

while IFS= read -r service_file; do
    if [ -f "$service_file" ]; then
        service_name=$(basename "$service_file")
        service_names+=("$service_name")
    fi
done <<< "$service_files"

# Find duplicates
duplicate_services=$(printf '%s\n' "${service_names[@]}" | sort | uniq -d)
if [ -n "$duplicate_services" ]; then
    echo "  ⚠️  Duplicate service names found:" >> "$results_file"
    echo "$duplicate_services" | while read -r dup; do
        if [ -n "$dup" ]; then
            echo "      - $dup" >> "$results_file"
            ((duplication_issues++))
        fi
    done
else
    echo "  ✅ No duplicate service names found" >> "$results_file"
fi

# Check for similar class names that might indicate duplication
echo "🔍 Checking for similar class patterns..."
class_names=$(grep -h "^class [A-Za-z_][A-Za-z0-9_]*" $php_files | cut -d' ' -f2 | sort)
similar_patterns=$(echo "$class_names" | grep -E "(Service|Controller|Model)" | cut -d'S' -f1 | cut -d'C' -f1 | cut -d'M' -f1 | sort | uniq -d)

if [ -n "$similar_patterns" ]; then
    echo "  💡 Similar class name patterns (potential consolidation opportunities):" >> "$results_file"
    echo "$similar_patterns" | while read -r pattern; do
        if [ -n "$pattern" ] && [ ${#pattern} -gt 3 ]; then
            echo "      - Classes starting with: $pattern" >> "$results_file"
        fi
    done
fi

echo "" >> "$results_file"

echo "🧮 ANALYZING CODE COMPLEXITY"
echo "============================"

echo "COMPLEXITY ANALYSIS:" >> "$results_file"
echo "===================" >> "$results_file"

# Simple complexity analysis based on file size and decision points
echo "🔍 Checking file complexity..."
while IFS= read -r file; do
    if [ -f "$file" ]; then
        line_count=$(wc -l < "$file")
        decision_points=$(grep -c -E '\b(if|while|for|foreach|case|catch|\?)\b' "$file")
        
        # Simple complexity score
        complexity=$((decision_points + line_count / 50))
        
        if [ $complexity -gt 20 ]; then
            echo "  ⚠️  High complexity: $(basename "$file") (score: $complexity)" >> "$results_file"
            echo "      Lines: $line_count, Decision points: $decision_points" >> "$results_file"
            ((complexity_issues++))
        fi
    fi
done <<< "$php_files"

echo "" >> "$results_file"

echo "🏗️ ANALYZING ARCHITECTURAL PATTERNS"
echo "==================================="

echo "ARCHITECTURAL ANALYSIS:" >> "$results_file"
echo "======================" >> "$results_file"

# Check for business logic in controllers
echo "🔍 Checking separation of concerns..."
controller_files=$(find app/Features -name "*Controller.php" -not -path "*/app_backup_*/*")
controllers_with_logic=0

while IFS= read -r controller; do
    if [ -f "$controller" ]; then
        # Check for database operations in controllers
        if grep -q -E "(DB::|->save\(\)|->create\(\)|->update\(\)|->delete\(\))" "$controller"; then
            echo "  ⚠️  Business logic in controller: $(basename "$controller")" >> "$results_file"
            ((controllers_with_logic++))
        fi
    fi
done <<< "$controller_files"

if [ $controllers_with_logic -eq 0 ]; then
    echo "  ✅ Controllers appear to follow separation of concerns" >> "$results_file"
else
    echo "  💡 SUGGESTION: Move business logic from $controllers_with_logic controllers to services" >> "$results_file"
fi

# Check for consistent service patterns
echo "🔍 Analyzing service patterns..."
service_methods=()
while IFS= read -r service; do
    if [ -f "$service" ]; then
        methods=$(grep -o "public function [A-Za-z_][A-Za-z0-9_]*" "$service" | cut -d' ' -f3)
        service_methods+=($methods)
    fi
done <<< "$service_files"

# Find common method patterns
common_methods=$(printf '%s\n' "${service_methods[@]}" | sort | uniq -c | sort -nr | head -5)
echo "  📊 Most common service methods:" >> "$results_file"
echo "$common_methods" | while read -r count method; do
    if [ -n "$method" ] && [ "$count" -gt 1 ]; then
        echo "      - $method (appears $count times)" >> "$results_file"
    fi
done

echo "" >> "$results_file"

echo "💡 GENERATING RECOMMENDATIONS"
echo "============================"

echo "RECOMMENDATIONS:" >> "$results_file"
echo "===============" >> "$results_file"

# Structure recommendations
echo "📂 STRUCTURE IMPROVEMENTS:" >> "$results_file"
echo "  1. Standardize feature directory structure" >> "$results_file"
echo "     - Ensure all features have: Controllers, Models, Services, Routes" >> "$results_file"
echo "  2. Consider consolidating small features (< 5 files)" >> "$results_file"
echo "  3. Create shared components for common functionality" >> "$results_file"
echo "" >> "$results_file"

# Naming recommendations
echo "🏷️ NAMING IMPROVEMENTS:" >> "$results_file"
echo "  1. Ensure class names match file names exactly" >> "$results_file"
echo "  2. Use consistent camelCase for method names" >> "$results_file"
echo "  3. Use descriptive, intention-revealing names" >> "$results_file"
echo "  4. Follow Laravel naming conventions:" >> "$results_file"
echo "     - Controllers: PascalCase + Controller suffix" >> "$results_file"
echo "     - Models: Singular PascalCase" >> "$results_file"
echo "     - Services: PascalCase + Service suffix" >> "$results_file"
echo "" >> "$results_file"

# Architecture recommendations
echo "🏗️ ARCHITECTURAL IMPROVEMENTS:" >> "$results_file"
echo "  1. Implement Repository pattern for data access" >> "$results_file"
echo "  2. Use Service layer for business logic" >> "$results_file"
echo "  3. Implement proper dependency injection" >> "$results_file"
echo "  4. Use Events for cross-feature communication" >> "$results_file"
echo "  5. Create base classes for common functionality" >> "$results_file"
echo "" >> "$results_file"

# Priority recommendations
echo "🎯 PRIORITY ACTIONS:" >> "$results_file"
echo "  HIGH PRIORITY:" >> "$results_file"
echo "    - Fix class/filename mismatches ($naming_issues found)" >> "$results_file"
echo "    - Move business logic out of controllers ($controllers_with_logic found)" >> "$results_file"
echo "  MEDIUM PRIORITY:" >> "$results_file"
echo "    - Standardize feature structures ($structure_issues inconsistencies)" >> "$results_file"
echo "    - Reduce code complexity ($complexity_issues high-complexity files)" >> "$results_file"
echo "  LOW PRIORITY:" >> "$results_file"
echo "    - Consolidate duplicate patterns ($duplication_issues found)" >> "$results_file"
echo "    - Improve method naming consistency" >> "$results_file"

echo "" >> "$results_file"

# Generate summary
echo "SUMMARY STATISTICS:" >> "$results_file"
echo "==================" >> "$results_file"
echo "Total PHP Files Analyzed: $total_files" >> "$results_file"
echo "Structure Issues: $structure_issues" >> "$results_file"
echo "Naming Issues: $naming_issues" >> "$results_file"
echo "Complexity Issues: $complexity_issues" >> "$results_file"
echo "Duplication Issues: $duplication_issues" >> "$results_file"

total_issues=$((structure_issues + naming_issues + complexity_issues + duplication_issues))
echo "Total Issues Found: $total_issues" >> "$results_file"

# Calculate improvement score
if [ $total_issues -eq 0 ]; then
    improvement_score=100
else
    improvement_score=$((100 - (total_issues * 2)))
    if [ $improvement_score -lt 0 ]; then
        improvement_score=0
    fi
fi

echo "Structure Quality Score: $improvement_score/100" >> "$results_file"

echo ""
echo "==============================================="
echo "📊 STRUCTURE & NAMING ANALYSIS SUMMARY"
echo "==============================================="
echo ""
echo "📈 STATISTICS:"
echo "├─ Total Files Analyzed: $total_files"
echo "├─ Structure Issues: $structure_issues"
echo "├─ Naming Issues: $naming_issues"
echo "├─ Complexity Issues: $complexity_issues"
echo "└─ Duplication Issues: $duplication_issues"
echo ""
echo "🏆 STRUCTURE QUALITY SCORE: $improvement_score/100"

if [ $improvement_score -ge 90 ]; then
    echo "   Status: ✅ Excellent Structure"
elif [ $improvement_score -ge 75 ]; then
    echo "   Status: ✅ Good Structure"
elif [ $improvement_score -ge 60 ]; then
    echo "   Status: ⚠️ Needs Improvement"
else
    echo "   Status: ❌ Requires Restructuring"
fi

echo ""
echo "📄 Detailed analysis saved to: $results_file"
echo ""

# Generate actionable improvement plan
improvement_plan="structure-improvement-plan.md"
echo "# Backend Structure Improvement Plan" > "$improvement_plan"
echo "" >> "$improvement_plan"
echo "## 🎯 Priority Actions" >> "$improvement_plan"
echo "" >> "$improvement_plan"

if [ $naming_issues -gt 0 ]; then
    echo "### 🚨 HIGH PRIORITY: Fix Naming Issues ($naming_issues found)" >> "$improvement_plan"
    echo "- Review and fix class/filename mismatches" >> "$improvement_plan"
    echo "- Standardize method naming to camelCase" >> "$improvement_plan"
    echo "- Ensure descriptive, intention-revealing names" >> "$improvement_plan"
    echo "" >> "$improvement_plan"
fi

if [ $controllers_with_logic -gt 0 ]; then
    echo "### 🚨 HIGH PRIORITY: Improve Separation of Concerns" >> "$improvement_plan"
    echo "- Move business logic from $controllers_with_logic controllers to services" >> "$improvement_plan"
    echo "- Implement proper service layer pattern" >> "$improvement_plan"
    echo "" >> "$improvement_plan"
fi

if [ $structure_issues -gt 0 ]; then
    echo "### ⚠️ MEDIUM PRIORITY: Standardize Structure ($structure_issues issues)" >> "$improvement_plan"
    echo "- Ensure all features have standard directories" >> "$improvement_plan"
    echo "- Create missing Controllers, Models, Services, Routes directories" >> "$improvement_plan"
    echo "" >> "$improvement_plan"
fi

if [ $complexity_issues -gt 0 ]; then
    echo "### ⚠️ MEDIUM PRIORITY: Reduce Complexity ($complexity_issues files)" >> "$improvement_plan"
    echo "- Break down complex methods into smaller ones" >> "$improvement_plan"
    echo "- Extract common functionality into traits or base classes" >> "$improvement_plan"
    echo "" >> "$improvement_plan"
fi

echo "## 📋 Implementation Steps" >> "$improvement_plan"
echo "" >> "$improvement_plan"
echo "1. **Phase 1: Critical Fixes**" >> "$improvement_plan"
echo "   - Fix all class/filename mismatches" >> "$improvement_plan"
echo "   - Move business logic out of controllers" >> "$improvement_plan"
echo "" >> "$improvement_plan"
echo "2. **Phase 2: Structure Standardization**" >> "$improvement_plan"
echo "   - Create missing standard directories" >> "$improvement_plan"
echo "   - Reorganize files into proper locations" >> "$improvement_plan"
echo "" >> "$improvement_plan"
echo "3. **Phase 3: Quality Improvements**" >> "$improvement_plan"
echo "   - Reduce code complexity" >> "$improvement_plan"
echo "   - Implement consistent patterns" >> "$improvement_plan"
echo "" >> "$improvement_plan"

echo "📋 Improvement plan saved to: $improvement_plan"
echo ""
echo "🚀 Ready to implement improvements!"

