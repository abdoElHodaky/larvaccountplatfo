#!/bin/bash

# Laravel Cloud Deployment Script
# Laravel Multi-Tenant Accounting Platform
# Optimized for Laravel Cloud deployment

set -e

echo "🚀 Starting Laravel Cloud deployment..."

# Set deployment environment
export LARAVEL_CLOUD_DEPLOYMENT=true

# Navigate to the application directory
cd /var/www/html

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Copying Cloud environment configuration..."
    cp .env.cloud .env
    echo "⚠️  Environment variables will be managed by Laravel Cloud"
fi

# Install/update Composer dependencies (production optimized)
echo "📦 Installing Composer dependencies..."
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Install/update NPM dependencies
echo "📦 Installing NPM dependencies..."
npm ci --production=false

# Build frontend assets
echo "🏗️  Building frontend assets..."
npm run build

# Generate application key if not set
if grep -q "APP_KEY=$" .env; then
    echo "🔑 Generating application key..."
    php artisan key:generate --force
fi

# Clear and cache configuration
echo "⚡ Optimizing application..."
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan route:cache
php artisan view:clear
php artisan view:cache
php artisan event:clear
php artisan event:cache

# Run database migrations (simplified for cloud)
echo "🗄️  Running database migrations..."
php artisan migrate --force

# Create storage link if it doesn't exist
if [ ! -L public/storage ]; then
    echo "🔗 Creating storage link..."
    php artisan storage:link
fi

# Clear application cache
echo "🧹 Clearing application cache..."
php artisan cache:clear

# Apply cloud-specific feature flags
echo "🏷️  Applying cloud feature flags..."
php artisan config:set features.profile cloud

# Optimize for cloud deployment
echo "⚡ Running cloud optimizations..."
php artisan optimize

# Set proper permissions for cloud environment
echo "🔒 Setting proper permissions..."
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Health check
echo "🏥 Performing health check..."
php artisan health:check || echo "⚠️  Health check warnings (non-critical)"

echo "✅ Laravel Cloud deployment completed successfully!"

# Optional: Send deployment notification
if [ ! -z "$DEPLOYMENT_WEBHOOK_URL" ]; then
    curl -X POST "$DEPLOYMENT_WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -d "{\"message\": \"Cloud deployment completed successfully\", \"timestamp\": \"$(date)\"}"
fi

echo "🎉 Laravel Cloud deployment finished!"
