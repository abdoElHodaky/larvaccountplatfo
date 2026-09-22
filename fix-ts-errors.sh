#!/usr/bin/env bash

# File to hold tsc output
LOG_FILE=".ts-errors.tmp"

echo "🔍 Running TypeScript type check..."
npx tsc --noEmit --pretty false > "$LOG_FILE" 2>&1

# Filter for error lines (Format: path/to/file.tsx(line,col): error TSXXXX: Message)
ERRORS=$(grep -E '^[a-zA-Z0-9_/.-]+\([0-9]+,[0-9]+\): error TS[0-9]+:' "$LOG_FILE")

if [ -z "$ERRORS" ]; then
  echo "✅ No TypeScript errors found!"
  rm -f "$LOG_FILE"
  exit 0
fi

echo ""
echo "❌ TypeScript Errors Found:"
echo "----------------------------------------------------"

# Parse error lines into an array
IFS=$'\n' read -rd '' -a ERROR_ARRAY <<< "$ERRORS"

select CHOICE in "${ERROR_ARRAY[@]}" "Exit"; do
  if [ "$CHOICE" == "Exit" ] || [ -z "$CHOICE" ]; then
    echo "Exiting..."
    break
  fi

  # Extract file path and line number from chosen error line
  FILE_PATH=$(echo "$CHOICE" | sed -E 's/^(.*)\(([0-9]+),[0-9]+\):.*/\1/')
  LINE_NUM=$(echo "$CHOICE" | sed -E 's/^(.*)\(([0-9]+),[0-9]+\):.*/\2/')

  echo ""
  echo "===================================================="
  echo "📄 File: $FILE_PATH (Line: $LINE_NUM)"
  echo "⚠️ Error: $CHOICE"
  echo "===================================================="
  echo ""
  
  # Display 5 lines before and after the error line for context
  START_LINE=$((LINE_NUM > 5 ? LINE_NUM - 5 : 1))
  END_LINE=$((LINE_NUM + 5))
  echo "--- Code Context (Lines $START_LINE to $END_LINE) ---"
  sed -n "${START_LINE},${END_LINE}p" "$FILE_PATH" | nl -v "$START_LINE"
  echo "----------------------------------------------------"
  echo ""

  read -p "Would you like to rewrite this file using cat << 'EOF'? (y/N): " CONFIRM
  if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Paste your updated file contents below, then press ENTER on a new line and type 'EOF':"
    echo "----------------------------------------------------"
    
    # Overwrite the file using cat EOF
    cat << 'EOF' > "$FILE_PATH"
$(cat)
EOF

    echo ""
    echo "✅ Updated $FILE_PATH successfully!"
    echo "🔄 Re-running TypeScript check..."
    rm -f "$LOG_FILE"
    exec "$0" # Restart script to refresh error list
  else
    echo "Skipped editing $FILE_PATH."
  fi

  echo ""
  echo "Select another error to fix or option:"
done

rm -f "$LOG_FILE"
