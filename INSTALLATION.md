# Installation Guide

## Laravel 12 Modular Accounting Platform

This guide will help you set up the Laravel 12 Modular Accounting Platform on your local development environment or production server.

## 📋 **Prerequisites**

### **System Requirements**
- **PHP**: 8.2 or higher
- **Node.js**: 18.0 or higher
- **NPM**: 9.0 or higher
- **MySQL**: 8.0 or higher
- **Redis**: 6.0 or higher (for caching and queues)
- **Composer**: 2.0 or higher

### **PHP Extensions Required**
```bash
# Ubuntu/Debian
sudo apt-get install php8.2-cli php8.2-fpm php8.2-mysql php8.2-redis php8.2-xml php8.2-curl php8.2-mbstring php8.2-zip php8.2-bcmath php8.2-intl php8.2-gd php8.2-imagick

# CentOS/RHEL
sudo yum install php82-cli php82-fpm php82-mysql php82-redis php82-xml php82-curl php82-mbstring php82-zip php82-bcmath php82-intl php82-gd php82-imagick
```

## 🚀 **Quick Installation**

### **1. Clone the Repository**
```bash
git clone https://github.com/abdoElHodaky/larvaccountplatfo.git
cd larvaccountplatfo
```

### **2. Install Dependencies**
```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

### **3. Environment Configuration**
```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Create storage link
php artisan storage:link
```

### **4. Database Setup**

#### **Create Databases**
```sql
-- Landlord Database
CREATE DATABASE accounting_landlord;

-- Shared Database Shards
CREATE DATABASE accounting_shared_1;
CREATE DATABASE accounting_shared_2;
CREATE DATABASE accounting_shared_3;
CREATE DATABASE accounting_shared_4;

-- Optional: Regional Clusters
CREATE DATABASE accounting_cluster_us_east;
CREATE DATABASE accounting_cluster_us_west;
CREATE DATABASE accounting_cluster_eu_west;
CREATE DATABASE accounting_cluster_ap_southeast;
```

#### **Configure Database Connections**
Edit your `.env` file with your database credentials:

```env
# Landlord Database
DB_CONNECTION=landlord
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=accounting_landlord
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Shared Shards
DB_SHARED_SHARD_1_HOST=127.0.0.1
DB_SHARED_SHARD_1_DATABASE=accounting_shared_1
DB_SHARED_SHARD_1_USERNAME=your_username
DB_SHARED_SHARD_1_PASSWORD=your_password

# ... (repeat for other shards)
```

### **5. Run Migrations**
```bash
# Run landlord migrations
php artisan migrate --database=landlord

# Run shared database migrations
php artisan migrate --database=shared_shard_1
php artisan migrate --database=shared_shard_2
php artisan migrate --database=shared_shard_3
php artisan migrate --database=shared_shard_4

# Seed sample data (optional)
php artisan db:seed
```

### **6. Build Frontend Assets**
```bash
# Development build
npm run dev

# Production build
npm run build
```

### **7. Start Development Servers**
```bash
# Laravel development server
php artisan serve

# Laravel Reverb (WebSocket server)
php artisan reverb:start

# Queue worker
php artisan queue:work

# Frontend development server (in another terminal)
npm run dev
```

## 🛠️ **Using Makefile (Recommended)**

We provide a comprehensive Makefile for easier development:

```bash
# Complete setup for new developers
make quick-setup

# Start development servers
make dev

# Run tests
make test

# Code formatting and linting
make lint-fix

# Production deployment
make production-setup
```

## 🔧 **Advanced Configuration**

### **Redis Configuration**
```env
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0

CACHE_STORE=redis
QUEUE_CONNECTION=redis
```

### **Broadcasting Configuration**
```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=local
REVERB_APP_KEY=local-key
REVERB_APP_SECRET=local-secret
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http
```

### **API Integration Configuration**
```env
# Plaid (Bank Integration)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENVIRONMENT=sandbox

# Stripe (Payment Processing)
STRIPE_KEY=your_stripe_key
STRIPE_SECRET=your_stripe_secret

# PayPal (Payment Processing)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

## 🏗️ **Module Configuration**

### **Enable/Disable Modules**
```env
MODULES_ENABLED="Organization,Accounting,Inventory,Reporting,Integration,Security,Mobile"
MODULE_AUTO_DISCOVERY=true
```

### **Module-Specific Configuration**
```bash
# List available modules
php artisan module:list

# Enable a module
php artisan module:enable Inventory

# Disable a module
php artisan module:disable Integration
```

## 🔒 **Security Configuration**

### **Security Monitoring**
```env
SECURITY_MONITORING_ENABLED=true
AUDIT_LOG_ENABLED=true
FAILED_LOGIN_THRESHOLD=5
FAILED_LOGIN_LOCKOUT_DURATION=3600
```

### **File Permissions**
```bash
# Set proper permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

## 📱 **Progressive Web App Setup**

### **PWA Configuration**
```env
PWA_ENABLED=true
PWA_OFFLINE_ENABLED=true
PWA_PUSH_NOTIFICATIONS_ENABLED=true
```

### **Generate PWA Assets**
```bash
npm run pwa:generate
```

## 🚀 **Production Deployment**

### **1. Server Requirements**
- **Web Server**: Nginx or Apache
- **PHP-FPM**: 8.2 or higher
- **Process Manager**: Supervisor (for queues)
- **SSL Certificate**: Let's Encrypt or commercial

### **2. Production Setup**
```bash
# Install dependencies (production)
composer install --no-dev --optimize-autoloader
npm ci --production

# Build assets
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Set permissions
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
sudo chmod -R 775 storage bootstrap/cache
```

### **3. Web Server Configuration**

#### **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/larvaccountplatfo/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### **4. Process Management**

#### **Supervisor Configuration**
```ini
[program:larvaccountplatfo-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/larvaccountplatfo/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=8
redirect_stderr=true
stdout_logfile=/var/www/larvaccountplatfo/storage/logs/worker.log
stopwaitsecs=3600

[program:larvaccountplatfo-reverb]
process_name=%(program_name)s
command=php /var/www/larvaccountplatfo/artisan reverb:start
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/larvaccountplatfo/storage/logs/reverb.log
```

## 🧪 **Testing**

### **Run Tests**
```bash
# All tests
php artisan test

# Specific test suites
php artisan test --testsuite=Unit
php artisan test --testsuite=Feature
php artisan test --testsuite=Module

# With coverage
php artisan test --coverage
```

### **Code Quality**
```bash
# PHP linting
./vendor/bin/pint

# Static analysis
./vendor/bin/phpstan analyse

# JavaScript linting
npm run lint:fix
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Database Connection Issues**
```bash
# Test database connections
php artisan tinker
>>> DB::connection('landlord')->getPdo();
>>> DB::connection('shared_shard_1')->getPdo();
```

#### **Permission Issues**
```bash
# Fix storage permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

#### **Queue Issues**
```bash
# Clear failed jobs
php artisan queue:clear

# Restart queue workers
php artisan queue:restart
```

#### **Cache Issues**
```bash
# Clear all caches
php artisan optimize:clear

# Clear specific caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### **Performance Optimization**

#### **Database Optimization**
```sql
-- Add indexes for better performance
ALTER TABLE transactions ADD INDEX idx_account_date (account_id, created_at);
ALTER TABLE stock_movements ADD INDEX idx_product_date (product_id, movement_date);
```

#### **Redis Optimization**
```bash
# Redis configuration for production
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## 📞 **Support**

- **Documentation**: [GitHub Wiki](https://github.com/abdoElHodaky/larvaccountplatfo/wiki)
- **Issues**: [GitHub Issues](https://github.com/abdoElHodaky/larvaccountplatfo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/abdoElHodaky/larvaccountplatfo/discussions)

## 🎉 **Next Steps**

After successful installation:

1. **Create your first organization**: Visit `/organizations/create`
2. **Set up chart of accounts**: Navigate to `/accounting/accounts`
3. **Configure integrations**: Go to `/integrations`
4. **Explore the dashboard**: Check out `/dashboard`
5. **Read the documentation**: Visit the `/docs` section

**Congratulations! Your Laravel 12 Modular Accounting Platform is now ready for use!** 🚀

