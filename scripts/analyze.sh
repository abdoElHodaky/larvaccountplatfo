#!/bin/bash

# Laravel Backend Syntax Analysis & Fixing Suite
# Usage: ./analyze.sh [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BASE_PATH="."
DRY_RUN=false
ANALYSIS_ONLY=false
FIXES_ONLY=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Laravel Backend Syntax Analysis & Fixing Suite"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --path PATH        Base path to analyze (default: current directory)"
    echo "  -d, --dry-run         Run in dry-run mode (no actual fixes)"
    echo "  -a, --analysis-only   Run analysis only (no fixes)"
    echo "  -f, --fixes-only      Run fixes only (requires existing report)"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Analyze current directory and apply fixes"
    echo "  $0 -p /path/to/laravel # Analyze specific Laravel project"
    echo "  $0 --dry-run          # Analyze and show what would be fixed"
    echo "  $0 --analysis-only    # Only run analysis, no fixes"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--path)
            BASE_PATH="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -a|--analysis-only)
            ANALYSIS_ONLY=true
            shift
            ;;
        -f|--fixes-only)
            FIXES_ONLY=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if PHP is available
if ! command -v php &> /dev/null; then
    print_error "PHP is not installed or not in PATH"
    exit 1
fi

# Check if base path exists
if [ ! -d "$BASE_PATH" ]; then
    print_error "Base path does not exist: $BASE_PATH"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_status "Starting Laravel Backend Syntax Analysis..."
print_status "Base Path: $BASE_PATH"
print_status "Dry Run: $DRY_RUN"

# Change to base path
cd "$BASE_PATH"

# Run analysis only
if [ "$ANALYSIS_ONLY" = true ]; then
    print_status "Running analysis only..."
    php "$SCRIPT_DIR/syntax-analyzer.php" "$BASE_PATH"
    print_success "Analysis complete! Check syntax-analysis-report.json for results."
    exit 0
fi

# Run fixes only
if [ "$FIXES_ONLY" = true ]; then
    print_status "Running fixes only..."
    
    if [ ! -f "syntax-analysis-report.json" ]; then
        print_error "Analysis report not found. Run analysis first."
        exit 1
    fi
    
    if [ "$DRY_RUN" = true ]; then
        php "$SCRIPT_DIR/parallel-fixer.php" "$BASE_PATH" --dry-run syntax-analysis-report.json
    else
        php "$SCRIPT_DIR/parallel-fixer.php" "$BASE_PATH" syntax-analysis-report.json
    fi
    
    print_success "Fixes complete!"
    exit 0
fi

# Run complete analysis and fixing
print_status "Running complete analysis and fixing suite..."

# Create temporary config for dry run
if [ "$DRY_RUN" = true ]; then
    print_warning "Running in DRY RUN mode - no actual changes will be made"
fi

# Run the batch runner
php "$SCRIPT_DIR/run-analysis.php" "$BASE_PATH"

# Show results
print_success "Analysis and fixing complete!"
print_status "Generated files:"
echo "  📊 syntax-analysis-report.json - Detailed analysis report"
echo "  📄 syntax-analysis-report.html - HTML report for viewing"
echo "  📋 syntax-analysis-summary.json - Executive summary"

if [ "$DRY_RUN" = false ]; then
    echo "  💾 *.backup.* - Backup files (if fixes were applied)"
fi

print_status "Next steps:"
echo "  1. Review the HTML report in your browser"
echo "  2. Test your application to ensure fixes work correctly"
echo "  3. Commit the changes if everything looks good"

if [ "$DRY_RUN" = false ]; then
    echo "  4. Clean up backup files when satisfied: rm *.backup.*"
fi

print_success "Done! 🎉"

