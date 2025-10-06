# Multi-stage Dockerfile for Laravel Multi-Tenant Accounting Platform
# Optimized for production deployment with Laravel Forge & Laravel Cloud

# Base PHP image with extensions
FROM php:8.2-fpm-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    oniguruma-dev \
    icu-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    libzip-dev \
    supervisor \
    nginx

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
        opcache \
        sockets

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Node.js and npm
RUN apk add --no-cache nodejs npm

# Set working directory
WORKDIR /var/www

# Create www-data user
RUN addgroup -g 1000 www-data && adduser -u 1000 -G www-data -s /bin/sh -D www-data

# Development stage
FROM base AS development

# Install development dependencies
RUN apk add --no-cache \
    bash \
    vim \
    htop

# Install Xdebug for development
RUN pecl install xdebug && docker-php-ext-enable xdebug

# Copy Xdebug configuration
COPY docker/php/xdebug.ini /usr/local/etc/php/conf.d/xdebug.ini

# Copy PHP configuration for development
COPY docker/php/php-dev.ini /usr/local/etc/php/php.ini

# Expose port 9000 for PHP-FPM
EXPOSE 9000

CMD ["php-fpm"]

# Production build stage
FROM base AS build

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Copy package.json files
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build frontend assets
RUN npm run build

# Generate optimized autoloader
RUN composer dump-autoload --optimize

# Set permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www/storage \
    && chmod -R 755 /var/www/bootstrap/cache

# Production stage
FROM base AS production

# Copy PHP configuration for production
COPY docker/php/php-prod.ini /usr/local/etc/php/php.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# Copy supervisor configuration
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf

# Copy application from build stage
COPY --from=build --chown=www-data:www-data /var/www /var/www

# Create necessary directories
RUN mkdir -p /var/www/storage/logs \
    && mkdir -p /var/www/storage/framework/cache \
    && mkdir -p /var/www/storage/framework/sessions \
    && mkdir -p /var/www/storage/framework/views \
    && mkdir -p /var/www/bootstrap/cache

# Set permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www/storage \
    && chmod -R 755 /var/www/bootstrap/cache

# Create entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Expose ports
EXPOSE 80 9000

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Default command
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

# Queue worker stage
FROM production AS queue-worker

# Copy queue worker supervisor configuration
COPY docker/supervisor/queue-worker.conf /etc/supervisor/conf.d/queue-worker.conf

# Override default command for queue worker
CMD ["php", "artisan", "horizon"]

# Scheduler stage
FROM production AS scheduler

# Copy scheduler supervisor configuration
COPY docker/supervisor/scheduler.conf /etc/supervisor/conf.d/scheduler.conf

# Override default command for scheduler
CMD ["php", "artisan", "schedule:work"]

# WebSocket server stage
FROM production AS websocket

# Copy WebSocket supervisor configuration
COPY docker/supervisor/websocket.conf /etc/supervisor/conf.d/websocket.conf

# Expose WebSocket port
EXPOSE 8080

# Override default command for WebSocket server
CMD ["php", "artisan", "reverb:start", "--host=0.0.0.0", "--port=8080"]
