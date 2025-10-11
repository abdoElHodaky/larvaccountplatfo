#!/bin/bash

# Laravel Forge Deployment Script
# Laravel Multi-Tenant Accounting Platform
# Optimized for Laravel Forge and Cloud Deployment

set -e

echo "🚀 Starting deployment of Laravel Multi-Tenant Accounting Platform..."

# Configuration
SITE_PATH="${FORGE_SITE_PATH:-/home/forge/default}"
BACKUP_PATH="/home/forge/backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/home/forge/deployment.log"

# Set deployment environment
export FORGE_DEPLOYMENT=true

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Error handling
handle_error() {
    log "❌ ERROR: Deployment failed at step: $1"
    log "Rolling back to previous version..."
    
    # Restore from backup if available
    if [ -d "$BACKUP_PATH" ]; then
        log "Restoring from backup: $BACKUP_PATH"
        cp -r $BACKUP_PATH/* $SITE_PATH/
    fi
    
    # Ensure application is up
    cd $SITE_PATH
    php artisan up
    
    # Send failure notification
    php artisan deployment:notify --status=failed --error="$1"
    
    exit 1
}

# Set error trap
trap 'handle_error "Unexpected error"' ERR

cd $SITE_PATH

log "📋 Pre-deployment checks..."

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log "⚠️  Warning: Not on main branch. Current branch: $CURRENT_BRANCH"
fi

# Check disk space
DISK_USAGE=$(df $SITE_PATH | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    handle_error "Insufficient disk space: ${DISK_USAGE}% used"
fi

log "✅ Pre-deployment checks passed"

# Create backup
log "💾 Creating backup..."
mkdir -p $BACKUP_PATH
cp -r $SITE_PATH/* $BACKUP_PATH/ || handle_error "Backup creation failed"
log "✅ Backup created: $BACKUP_PATH"

# Enable maintenance mode
log "🔧 Enabling maintenance mode..."
php artisan down --retry=60 --secret="deployment-$(date +%s)" || handle_error "Failed to enable maintenance mode"

# Pull latest changes
log "📥 Pulling latest changes from repository..."
git fetch origin
git reset --hard origin/main || handle_error "Git pull failed"

# Install/update Composer dependencies
log "📦 Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction || handle_error "Composer install failed"

# Install/update NPM dependencies and build assets
log "🎨 Building frontend assets..."
npm ci --silent || handle_error "NPM install failed"
npm run build || handle_error "Asset build failed"

# Clear and optimize Laravel caches
log "🧹 Clearing and optimizing caches..."
php artisan config:clear || handle_error "Config clear failed"
php artisan config:cache || handle_error "Config cache failed"
php artisan route:clear || handle_error "Route clear failed"
php artisan route:cache || handle_error "Route cache failed"
php artisan view:clear || handle_error "View clear failed"
php artisan view:cache || handle_error "View cache failed"
php artisan event:clear || handle_error "Event clear failed"
php artisan event:cache || handle_error "Event cache failed"

# Database migrations
log "🗄️  Running database migrations..."

# Run landlord migrations first
log "Running landlord database migrations..."
php artisan migrate --database=landlord --force || handle_error "Landlord migration failed"

# Run shared tenant database migrations
log "Running shared tenant database migrations..."
php artisan migrate --database=tenant_shared_1 --force || handle_error "Shared tenant 1 migration failed"
php artisan migrate --database=tenant_shared_2 --force || handle_error "Shared tenant 2 migration failed"

# Run dedicated tenant migrations (if any exist)
log "Checking for dedicated tenant databases..."
php artisan tenant:migrate --force || log "No dedicated tenant migrations to run"

# Clear application cache
log "🧹 Clearing application cache..."
php artisan cache:clear || handle_error "Cache clear failed"

# Restart queue workers
log "🔄 Restarting queue workers..."
php artisan queue:restart || handle_error "Queue restart failed"

# Restart Horizon (if running)
log "🔄 Restarting Horizon..."
if pgrep -f "artisan horizon" > /dev/null; then
    php artisan horizon:terminate
    sleep 5
fi

# Restart Reverb WebSocket server (if running)
log "🔄 Restarting Reverb WebSocket server..."
if pgrep -f "artisan reverb:start" > /dev/null; then
    pkill -f "artisan reverb:start"
    sleep 2
fi

# Restart system services
log "🔄 Restarting system services..."
sudo supervisorctl restart horizon || log "Horizon not managed by supervisor"
sudo supervisorctl restart reverb || log "Reverb not managed by supervisor"

# Restart PHP-FPM
log "🔄 Restarting PHP-FPM..."
sudo service php8.2-fpm reload || handle_error "PHP-FPM restart failed"

# Health check before going live
log "🏥 Performing health checks..."

# Check database connectivity
php artisan health:check --database || handle_error "Database health check failed"

# Check Redis connectivity
php artisan health:check --redis || handle_error "Redis health check failed"

# Check queue workers
php artisan health:check --horizon || handle_error "Horizon health check failed"

# Check WebSocket server
php artisan health:check --reverb || handle_error "Reverb health check failed"

# Warm up application
log "🔥 Warming up application..."
curl -s -o /dev/null -w "%{http_code}" https://accounting.yourdomain.com/health || handle_error "Application warmup failed"

# Test multi-tenant functionality
log "🏢 Testing multi-tenant functionality..."
curl -s -o /dev/null -w "%{http_code}" -H "Host: demo.accounting.yourdomain.com" https://accounting.yourdomain.com/health || log "Multi-tenant test warning"

# Disable maintenance mode
log "✅ Disabling maintenance mode..."
php artisan up || handle_error "Failed to disable maintenance mode"

# Post-deployment tasks
log "📊 Running post-deployment tasks..."

# Update search indexes (if applicable)
php artisan scout:import "App\\Models\\Account" || log "Search index update skipped"

# Generate sitemap (if applicable)
php artisan sitemap:generate || log "Sitemap generation skipped"

# Clear old logs (keep last 30 days)
find storage/logs -name "*.log" -mtime +30 -delete || log "Log cleanup skipped"

# Performance optimization
log "⚡ Running performance optimizations..."
php artisan optimize || handle_error "Optimization failed"

# Send deployment success notification
log "📧 Sending deployment notification..."
php artisan deployment:notify --status=success --version="$(git rev-parse --short HEAD)" || log "Notification failed"

# Cleanup old backups (keep last 7 days)
log "🧹 Cleaning up old backups..."
find /home/forge/backups -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || log "Backup cleanup completed"

# Final verification
log "🔍 Final verification..."
RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://accounting.yourdomain.com)
if [ "$RESPONSE_CODE" != "200" ]; then
    handle_error "Final verification failed: HTTP $RESPONSE_CODE"
fi

# Log deployment completion
DEPLOYMENT_TIME=$(($(date +%s) - $(stat -c %Y $LOG_FILE)))
log "🎉 Deployment completed successfully in ${DEPLOYMENT_TIME} seconds!"

# Display deployment summary
echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "=========================================="
echo "📅 Date: $(date)"
echo "🔗 URL: https://accounting.yourdomain.com"
echo "📝 Git Commit: $(git rev-parse --short HEAD)"
echo "⏱️  Duration: ${DEPLOYMENT_TIME} seconds"
echo "💾 Backup: $BACKUP_PATH"
echo "📋 Log: $LOG_FILE"
echo "=========================================="

# Optional: Run smoke tests
if [ "$RUN_SMOKE_TESTS" = "true" ]; then
    log "🧪 Running smoke tests..."
    php artisan test --testsuite=Smoke || log "Smoke tests failed (non-critical)"
fi

# Optional: Performance test
if [ "$RUN_PERFORMANCE_TEST" = "true" ]; then
    log "⚡ Running performance test..."
    curl -w "@curl-format.txt" -o /dev/null -s https://accounting.yourdomain.com || log "Performance test skipped"
fi

log "🚀 Deployment script completed successfully!"

exit 0
