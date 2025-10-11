# Laravel Accounting Platform - Deployment Guide

This guide covers deployment options for the Laravel Modular Accounting Platform, optimized for Laravel Forge and Laravel Cloud.

## 🚀 Deployment Options

### 1. Laravel Forge Deployment (Recommended for Production)

Laravel Forge provides the best balance of features and simplicity for this application.

#### Prerequisites
- Laravel Forge account
- Server provisioned through Forge (DigitalOcean, AWS, etc.)
- Domain configured
- SSL certificate installed

#### Setup Steps

1. **Create Site in Forge**
   ```bash
   # Site type: Laravel/PHP
   # Repository: https://github.com/abdoElHodaky/larvaccountplatfo
   # Branch: main
   ```

2. **Configure Environment**
   ```bash
   # Copy the Forge environment template
   cp .env.forge .env
   
   # Update the following variables:
   APP_URL=https://your-domain.com
   DB_DATABASE=your_database_name
   DB_PASSWORD=your_secure_password
   
   # Configure mail settings
   MAIL_HOST=your-smtp-host
   MAIL_USERNAME=your-smtp-username
   MAIL_PASSWORD=your-smtp-password
   
   # Configure S3 for file storage
   AWS_ACCESS_KEY_ID=your-aws-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret
   AWS_BUCKET=your-s3-bucket
   ```

3. **Set Deployment Script**
   ```bash
   # In Forge dashboard, set deployment script to:
   bash forge-deploy.sh
   ```

4. **Configure Services**
   - **Redis**: Enable Redis in Forge dashboard
   - **Queue Workers**: Configure Horizon in Forge
   - **Scheduler**: Enable Laravel scheduler

5. **Deploy**
   ```bash
   # Trigger deployment from Forge dashboard
   # Or push to main branch for auto-deployment
   ```

#### Forge-Specific Features Enabled
- ✅ Advanced Reporting
- ✅ PWA Support
- ✅ Horizon Queue Management
- ✅ Performance Monitoring
- ✅ Integration Services
- ❌ Multi-region (simplified)
- ❌ Database Sharding (single database)

### 2. Laravel Cloud Deployment (Simplified)

Laravel Cloud offers the simplest deployment with managed services.

#### Prerequisites
- Laravel Cloud account
- GitHub repository access

#### Setup Steps

1. **Connect Repository**
   - Link your GitHub repository to Laravel Cloud
   - Select the main branch

2. **Configure Environment**
   ```bash
   # Environment variables are managed through Laravel Cloud dashboard
   # Key variables to set:
   APP_URL=https://your-app.laravel.cloud
   DB_DATABASE=your_database
   # Other variables are auto-configured
   ```

3. **Deploy**
   - Laravel Cloud handles deployment automatically
   - Uses the cloud-deploy.sh script

#### Cloud-Specific Features (Minimal)
- ✅ Core Accounting Features
- ✅ Basic Reporting
- ✅ User Management
- ❌ PWA Features
- ❌ Advanced Reporting
- ❌ Real-time Collaboration
- ❌ Complex Integrations

### 3. Enterprise Deployment (Full Features)

For enterprise deployments requiring all features including multi-region and sharding.

#### Prerequisites
- Multiple servers/regions
- Load balancers
- Multiple database instances
- Redis cluster
- Advanced monitoring

#### Features Enabled
- ✅ All features enabled
- ✅ Multi-region support
- ✅ Database sharding
- ✅ Real-time collaboration
- ✅ Advanced reporting
- ✅ Mobile app support
- ✅ Workflow automation

## 🔧 Configuration Management

### Feature Flags

The application uses feature flags to enable/disable functionality based on deployment type:

```php
// Check if a feature is enabled
if (FeatureFlag::enabled('advanced_reporting')) {
    // Show advanced reporting features
}

// Frontend feature checking
if (isFeatureEnabled('pwa')) {
    // Enable PWA features
}
```

### Environment Profiles

Three pre-configured profiles are available:

1. **Cloud Profile** (`.env.cloud`)
   - Minimal features
   - Single database
   - Basic functionality

2. **Forge Profile** (`.env.forge`)
   - Moderate features
   - Single database with optimization
   - Most features enabled

3. **Enterprise Profile** (`.env.example`)
   - All features enabled
   - Multi-database setup
   - Full functionality

## 📊 Database Configuration

### Cloud/Forge Deployment (Simplified)
```php
// Uses single MySQL database
'default' => 'mysql',
'connections' => [
    'mysql' => [
        'driver' => 'mysql',
        'host' => env('DB_HOST'),
        'database' => env('DB_DATABASE'),
        // ... standard configuration
    ]
]
```

### Enterprise Deployment (Complex)
```php
// Uses landlord + sharded databases
'default' => 'landlord',
'connections' => [
    'landlord' => [...],
    'shared_shard_1' => [...],
    'shared_shard_2' => [...],
    // ... multiple database connections
]
```

## 🚀 Deployment Scripts

### Forge Deployment Script
```bash
# forge-deploy.sh
# - Optimized for Laravel Forge
# - Includes health checks
# - Handles queue workers
# - Manages caching
```

### Cloud Deployment Script
```bash
# cloud-deploy.sh
# - Simplified for Laravel Cloud
# - Minimal dependencies
# - Auto-configuration
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoints
- `/health` - Basic application health
- `/health/database` - Database connectivity
- `/health/redis` - Redis connectivity
- `/health/queue` - Queue worker status

### Performance Monitoring
- **Forge**: Horizon dashboard + custom monitoring
- **Cloud**: Basic Laravel Cloud monitoring
- **Enterprise**: Full Telescope + custom analytics

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database configuration
   php artisan config:clear
   php artisan config:cache
   ```

2. **Queue Workers Not Processing**
   ```bash
   # Restart queue workers
   php artisan queue:restart
   # Or restart Horizon
   php artisan horizon:terminate
   ```

3. **Asset Build Failures**
   ```bash
   # Clear node modules and rebuild
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

4. **Permission Issues**
   ```bash
   # Fix storage permissions
   chmod -R 755 storage bootstrap/cache
   chown -R www-data:www-data storage bootstrap/cache
   ```

### Environment-Specific Issues

#### Forge Issues
- **SSL Certificate**: Ensure SSL is properly configured in Forge
- **Queue Workers**: Check Horizon configuration in Forge dashboard
- **Database**: Verify database user permissions

#### Cloud Issues
- **Environment Variables**: Check Laravel Cloud dashboard for missing variables
- **Build Process**: Monitor build logs in Laravel Cloud
- **Database Migrations**: Ensure migrations run successfully

## 📚 Additional Resources

- [Laravel Forge Documentation](https://forge.laravel.com/docs)
- [Laravel Cloud Documentation](https://cloud.laravel.com/docs)
- [Application Architecture Guide](./docs/architecture.md)
- [Feature Flags Documentation](./docs/features.md)

## 🆘 Support

For deployment issues:
1. Check the deployment logs
2. Review health check endpoints
3. Consult the troubleshooting section
4. Contact support with specific error messages

---

**Note**: This application is designed to work optimally with Laravel Forge. Laravel Cloud deployment provides basic functionality, while enterprise deployment offers full features.
