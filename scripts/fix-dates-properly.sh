#!/bin/bash

echo "🔧 Fixing $dates to $casts conversion properly..."

# Find files that still have the old $dates pattern
find app/ -name "*.php" -exec grep -l "protected.*\$dates.*=" {} \; | while read file; do
    echo "  🔧 Fixing $file..."
    
    # Remove the old $dates property completely
    sed -i '/protected.*$dates.*=/,/];/d' "$file"
    
    # The $casts should already be there from the previous script
    echo "  ✅ Cleaned up $file"
done

echo "✅ $dates cleanup complete"

