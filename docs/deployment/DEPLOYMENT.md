# Laravel Multi-Tenant Accounting Platform
## Production Deployment Guide - Laravel Forge & Laravel Cloud

**Last Updated**: October 6, 2025  
**Platform Version**: Complete Enterprise Implementation  
**Deployment Target**: Laravel Forge + Laravel Cloud

---

## 🎯 **Deployment Overview**

This guide provides comprehensive instructions for deploying the Laravel Multi-Tenant Accounting Platform using **Laravel Forge** for server management and **Laravel Cloud** for scalable cloud infrastructure.

### **Deployment Architecture**
- **Laravel Cloud**: Primary hosting with auto-scaling and managed services
- **Laravel Forge**: Server provisioning, deployment automation, and management
- **Multi-Environment Setup**: Production, staging, and development environments
- **Auto-Scaling**: Dynamic scaling based on load and performance metrics

---

## 🏗️ **PHASE 1: Laravel Cloud Setup**

### **1.1: Laravel Cloud Project Creation**

#### **Create New Laravel Cloud Project**
```bash
# Using Laravel Cloud CLI
laravel-cloud project:create accounting-platform \
    --region=us-east-1 \
    --environment=production \
    --auto-scaling=enabled
```

#### **Project Configuration**
```yaml
# laravel-cloud.yml
name: accounting-platform
region: us-east-1
environments:
  production:
    auto_scaling:
      enabled: true
      min_instances: 2
      max_instances: 10
      target_cpu: 70
      target_memory: 80
    
  staging:
    auto_scaling:
      enabled: false
      instances: 1
    
  development:
    auto_scaling:
      enabled: false
      instances: 1

services:
  database:
    type: mysql
    version: "8.0"
    storage: 100GB
    backup_retention: 30
    multi_az: true
    
  redis:
    type: redis
    version: "7.0"
    memory: 2GB
    cluster_mode: enabled
    
  queue:
    type: horizon
    workers: 4
    memory: 512MB
    timeout: 300
    
  websockets:
    type: reverb
    memory: 256MB
    connections: 1000
```

### **1.2: Database Configuration**

#### **Multi-Tenant Database Setup**
```yaml
# Database configuration for multi-tenant architecture
databases:
  landlord:
    connection: mysql
    database: accounting_landlord
    backup: daily
    
  tenant_shared_1:
    connection: mysql
    database: accounting_shared_1
    backup: daily
    
  tenant_shared_2:
    connection: mysql
    database: accounting_shared_2
    backup: daily
    
  tenant_dedicated_template:
    connection: mysql
    database_template: accounting_tenant_{tenant_id}
    backup: daily
    auto_create: true
```

### **1.3: Redis Cluster Configuration**

#### **Multi-Tenant Redis Setup**
```yaml
redis_clusters:
  cache:
    nodes: 3
    memory_per_node: 1GB
    persistence: enabled
    
  sessions:
    nodes: 2
    memory_per_node: 512MB
    persistence: enabled
    
  queues:
    nodes: 3
    memory_per_node: 2GB
    persistence: enabled
```

---

## 🔧 **PHASE 2: Laravel Forge Integration**

### **2.1: Server Provisioning**

#### **Forge Server Configuration**
```bash
# Create production servers via Forge API
curl -X POST https://forge.laravel.com/api/v1/servers \
  -H "Authorization: Bearer YOUR_FORGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "aws",
    "credential_id": 1,
    "name": "accounting-production-1",
    "size": "m5.xlarge",
    "database": "accounting_platform",
    "php_version": "php82",
    "region": "us-east-1"
  }'
```

#### **Server Specifications**
```yaml
production_servers:
  web_servers:
    - name: accounting-web-1
      type: m5.xlarge
      cpu: 4
      memory: 16GB
      storage: 100GB SSD
      
    - name: accounting-web-2
      type: m5.xlarge
      cpu: 4
      memory: 16GB
      storage: 100GB SSD
      
  queue_servers:
    - name: accounting-queue-1
      type: c5.large
      cpu: 2
      memory: 4GB
      storage: 50GB SSD
      
    - name: accounting-queue-2
      type: c5.large
      cpu: 2
      memory: 4GB
      storage: 50GB SSD
      
  websocket_server:
    - name: accounting-websocket-1
      type: m5.large
      cpu: 2
      memory: 8GB
      storage: 50GB SSD
```

### **2.2: Site Configuration**

#### **Forge Site Setup**
```php
// forge-site-config.php
return [
    'domain' => 'accounting.yourdomain.com',
    'project_type' => 'php',
    'directory' => '/public',
    'isolated' => true,
    'username' => 'forge',
    'php_version' => 'php82',
    'wildcards' => true, // For multi-tenant subdomains
];
```

#### **Nginx Configuration for Multi-Tenant**
```nginx
# /etc/nginx/sites-available/accounting-platform
server {
    listen 80;
    listen [::]:80;
    server_name accounting.yourdomain.com *.accounting.yourdomain.com;
    root /home/forge/accounting.yourdomain.com/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    # Multi-tenant subdomain handling
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
        
        # Pass tenant information
        fastcgi_param HTTP_X_TENANT_DOMAIN $host;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### **2.3: SSL Configuration**

#### **Let's Encrypt SSL Setup**
```bash
# Enable SSL for main domain and wildcard subdomains
forge ssl:create accounting.yourdomain.com \
    --domains="accounting.yourdomain.com,*.accounting.yourdomain.com" \
    --type=letsencrypt
```

---

## ⚙️ **PHASE 3: Environment Configuration**

### **3.1: Production Environment Variables**

#### **Laravel Cloud Environment**
```bash
# .env.production
APP_NAME="Laravel Accounting Platform"
APP_ENV=production
APP_KEY=base64:YOUR_PRODUCTION_KEY
APP_DEBUG=false
APP_URL=https://accounting.yourdomain.com

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=accounting-db-cluster.laravel-cloud.com
DB_PORT=3306
DB_DATABASE=accounting_landlord
DB_USERNAME=forge
DB_PASSWORD=YOUR_SECURE_PASSWORD

# Multi-Tenant Database Connections
DB_LANDLORD_HOST=accounting-db-cluster.laravel-cloud.com
DB_LANDLORD_DATABASE=accounting_landlord

DB_SHARD_1_HOST=accounting-db-cluster.laravel-cloud.com
DB_SHARD_1_DATABASE=accounting_shared_1

DB_SHARD_2_HOST=accounting-db-cluster.laravel-cloud.com
DB_SHARD_2_DATABASE=accounting_shared_2

# Redis Configuration
REDIS_HOST=accounting-redis-cluster.laravel-cloud.com
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
REDIS_PORT=6379

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Laravel Horizon Configuration
HORIZON_ENABLED=true
HORIZON_PREFIX=accounting_production
HORIZON_REDIS_CONNECTION=horizon

# Laravel Reverb Configuration
REVERB_APP_ID=YOUR_REVERB_APP_ID
REVERB_APP_KEY=YOUR_REVERB_APP_KEY
REVERB_APP_SECRET=YOUR_REVERB_APP_SECRET
REVERB_HOST=ws.accounting.yourdomain.com
REVERB_PORT=443
REVERB_SCHEME=https

BROADCAST_DRIVER=reverb
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

# Laravel Telescope Configuration
TELESCOPE_ENABLED=true
TELESCOPE_DRIVER=database

# Multi-Tenant Configuration
TENANT_DEFAULT_STRATEGY=shared
TENANT_SUBDOMAIN_ENABLED=true
TENANT_DOMAIN_ENABLED=true
APP_DOMAIN=accounting.yourdomain.com

# Laravel Jetstream Configuration
JETSTREAM_STACK=inertia
JETSTREAM_FEATURES=teams,api,profile-photos,account-deletion

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true
PERFORMANCE_METRICS_BUFFER_SIZE=1000
SLOW_OPERATION_THRESHOLD_MS=500

# Security Configuration
SANCTUM_STATEFUL_DOMAINS=accounting.yourdomain.com,*.accounting.yourdomain.com
SESSION_DOMAIN=.accounting.yourdomain.com

# Mail Configuration
MAIL_MAILER=ses
MAIL_FROM_ADDRESS=noreply@accounting.yourdomain.com
MAIL_FROM_NAME="Laravel Accounting Platform"

# AWS SES Configuration
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_DEFAULT_REGION=us-east-1
AWS_SES_REGION=us-east-1

# Logging
LOG_CHANNEL=stack
LOG_STACK=single,slack
LOG_LEVEL=info

# Monitoring & Alerting
SLACK_WEBHOOK_URL=YOUR_SLACK_WEBHOOK_URL
```

### **3.2: Staging Environment**

#### **Staging Configuration**
```bash
# .env.staging
APP_NAME="Laravel Accounting Platform (Staging)"
APP_ENV=staging
APP_DEBUG=true
APP_URL=https://staging.accounting.yourdomain.com

# Reduced resource allocation for staging
HORIZON_WORKERS=2
REVERB_MAX_CONNECTIONS=100
PERFORMANCE_METRICS_BUFFER_SIZE=100
```

---

## 🚀 **PHASE 4: Deployment Scripts**

### **4.1: Forge Deployment Script**

#### **Production Deployment Script**
```bash
#!/bin/bash
# forge-deploy.sh

cd /home/forge/accounting.yourdomain.com

# Enable maintenance mode
php artisan down --retry=60

# Pull latest changes
git pull origin main

# Install/update dependencies
composer install --no-dev --optimize-autoloader
npm ci
npm run build

# Clear and cache configuration
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Run database migrations (landlord first)
php artisan migrate --database=landlord --force

# Run tenant migrations for shared databases
php artisan migrate --database=tenant_shared_1 --force
php artisan migrate --database=tenant_shared_2 --force

# Clear application cache
php artisan cache:clear
php artisan queue:restart

# Restart services
sudo supervisorctl restart horizon
sudo supervisorctl restart reverb

# Disable maintenance mode
php artisan up

# Send deployment notification
php artisan deployment:notify --environment=production
```

### **4.2: Laravel Cloud Deployment Configuration**

#### **Cloud Deployment Pipeline**
```yaml
# .laravel-cloud/deploy.yml
name: Production Deployment
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: laravel-cloud
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.2
          extensions: mbstring, xml, ctype, iconv, intl, pdo_mysql, dom, filter, gd, iconv, json, mbstring, redis
          
      - name: Install dependencies
        run: |
          composer install --no-dev --optimize-autoloader
          npm ci
          npm run build
          
      - name: Run tests
        run: |
          php artisan test --parallel
          
      - name: Deploy to Laravel Cloud
        run: |
          laravel-cloud deploy production \
            --wait \
            --health-check \
            --rollback-on-failure
            
      - name: Run post-deployment tasks
        run: |
          laravel-cloud artisan production migrate --force
          laravel-cloud artisan production config:cache
          laravel-cloud artisan production route:cache
          laravel-cloud artisan production view:cache
          laravel-cloud artisan production queue:restart
```

---

## 📊 **PHASE 5: Monitoring & Scaling Configuration**

### **5.1: Laravel Cloud Auto-Scaling**

#### **Auto-Scaling Configuration**
```yaml
# auto-scaling.yml
scaling_policies:
  web_servers:
    metric: cpu_utilization
    target: 70
    scale_up:
      threshold: 80
      instances: 2
      cooldown: 300
    scale_down:
      threshold: 30
      instances: 1
      cooldown: 600
      
  queue_workers:
    metric: queue_size
    target: 100
    scale_up:
      threshold: 500
      instances: 2
      cooldown: 180
    scale_down:
      threshold: 10
      instances: 1
      cooldown: 300
      
  websocket_servers:
    metric: connection_count
    target: 800
    scale_up:
      threshold: 900
      instances: 1
      cooldown: 300
    scale_down:
      threshold: 200
      instances: 0
      cooldown: 600
```

### **5.2: Health Checks & Monitoring**

#### **Health Check Configuration**
```php
// config/health.php
return [
    'checks' => [
        'database' => [
            'landlord' => DatabaseCheck::new()->connectionName('landlord'),
            'tenant_shared_1' => DatabaseCheck::new()->connectionName('tenant_shared_1'),
            'tenant_shared_2' => DatabaseCheck::new()->connectionName('tenant_shared_2'),
        ],
        'redis' => [
            'cache' => RedisCheck::new()->connectionName('cache'),
            'sessions' => RedisCheck::new()->connectionName('sessions'),
            'queues' => RedisCheck::new()->connectionName('queues'),
        ],
        'horizon' => HorizonCheck::new(),
        'reverb' => ReverbCheck::new(),
        'telescope' => TelescopeCheck::new(),
    ],
    
    'notifications' => [
        'slack' => [
            'webhook_url' => env('SLACK_WEBHOOK_URL'),
            'channel' => '#alerts',
        ],
        'email' => [
            'to' => ['admin@yourdomain.com'],
        ],
    ],
];
```

### **5.3: Performance Monitoring Integration**

#### **Laravel Cloud Monitoring**
```php
// config/monitoring.php
return [
    'laravel_cloud' => [
        'enabled' => env('LARAVEL_CLOUD_MONITORING', true),
        'api_key' => env('LARAVEL_CLOUD_API_KEY'),
        'project_id' => env('LARAVEL_CLOUD_PROJECT_ID'),
        
        'metrics' => [
            'response_time' => true,
            'throughput' => true,
            'error_rate' => true,
            'database_queries' => true,
            'queue_jobs' => true,
            'memory_usage' => true,
            'cpu_usage' => true,
        ],
        
        'alerts' => [
            'response_time_threshold' => 1000, // ms
            'error_rate_threshold' => 5, // %
            'queue_wait_time_threshold' => 300, // seconds
        ],
    ],
];
```

---

## 🔐 **PHASE 6: Security & SSL Configuration**

### **6.1: SSL Certificate Management**

#### **Wildcard SSL Setup**
```bash
# Setup wildcard SSL for multi-tenant subdomains
forge ssl:create accounting.yourdomain.com \
    --domains="accounting.yourdomain.com,*.accounting.yourdomain.com" \
    --type=letsencrypt \
    --auto-renew
```

### **6.2: Security Headers Configuration**

#### **Nginx Security Headers**
```nginx
# Security headers for production
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 📋 **PHASE 7: Backup & Disaster Recovery**

### **7.1: Database Backup Strategy**

#### **Automated Backup Configuration**
```yaml
# backup-config.yml
backups:
  databases:
    schedule: "0 2 * * *" # Daily at 2 AM
    retention: 30 # days
    compression: gzip
    encryption: true
    
    targets:
      - landlord
      - tenant_shared_1
      - tenant_shared_2
      
  files:
    schedule: "0 3 * * *" # Daily at 3 AM
    retention: 7 # days
    paths:
      - storage/app
      - storage/logs
      
  redis:
    schedule: "0 1 * * *" # Daily at 1 AM
    retention: 7 # days
```

### **7.2: Disaster Recovery Plan**

#### **Recovery Procedures**
```bash
#!/bin/bash
# disaster-recovery.sh

# 1. Restore database from backup
laravel-cloud backup:restore database \
    --backup-id=BACKUP_ID \
    --environment=production

# 2. Restore application files
laravel-cloud backup:restore files \
    --backup-id=BACKUP_ID \
    --environment=production

# 3. Restart services
laravel-cloud service:restart production --all

# 4. Verify system health
laravel-cloud health:check production

# 5. Send recovery notification
laravel-cloud notify:send "System recovery completed" \
    --channel=slack \
    --environment=production
```

---

## 🎯 **PHASE 8: Go-Live Checklist**

### **8.1: Pre-Deployment Checklist**

#### **Infrastructure Verification**
- [ ] Laravel Cloud project configured and tested
- [ ] Laravel Forge servers provisioned and configured
- [ ] Database clusters created and accessible
- [ ] Redis clusters configured and tested
- [ ] SSL certificates installed and verified
- [ ] DNS records configured for main domain and wildcards
- [ ] Load balancers configured and tested
- [ ] Backup systems configured and tested

#### **Application Verification**
- [ ] All environment variables configured
- [ ] Database migrations tested on staging
- [ ] Queue workers configured and running
- [ ] WebSocket server configured and tested
- [ ] Monitoring systems active and alerting
- [ ] Health checks passing
- [ ] Performance tests completed
- [ ] Security scans completed

### **8.2: Deployment Execution**

#### **Go-Live Steps**
1. **Final staging deployment and testing**
2. **Production database setup and migration**
3. **Production application deployment**
4. **DNS cutover to production servers**
5. **SSL certificate verification**
6. **Service health verification**
7. **Performance monitoring activation**
8. **User acceptance testing**
9. **Go-live announcement**

---

## 📈 **PHASE 9: Post-Deployment Monitoring**

### **9.1: Performance Monitoring**

#### **Key Metrics to Monitor**
- **Response Time**: < 200ms average
- **Throughput**: Requests per second
- **Error Rate**: < 1% target
- **Database Performance**: Query time < 50ms
- **Queue Processing**: Job wait time < 30s
- **WebSocket Connections**: Active connections and latency
- **Memory Usage**: < 80% on all servers
- **CPU Usage**: < 70% average

### **9.2: Scaling Triggers**

#### **Auto-Scaling Thresholds**
```yaml
scaling_thresholds:
  scale_up:
    cpu_usage: 80%
    memory_usage: 85%
    response_time: 500ms
    queue_size: 1000
    
  scale_down:
    cpu_usage: 30%
    memory_usage: 40%
    response_time: 100ms
    queue_size: 10
```

---

## 🎉 **Conclusion**

This comprehensive deployment guide provides everything needed to successfully deploy the Laravel Multi-Tenant Accounting Platform using Laravel Forge and Laravel Cloud. The configuration ensures:

✅ **Scalable Infrastructure**: Auto-scaling based on demand  
✅ **High Availability**: Multi-server setup with load balancing  
✅ **Security**: SSL, security headers, and encrypted backups  
✅ **Performance**: Optimized for enterprise workloads  
✅ **Monitoring**: Comprehensive monitoring and alerting  
✅ **Disaster Recovery**: Automated backups and recovery procedures  

**The platform is ready for enterprise-scale deployment with Laravel's modern cloud infrastructure!** 🚀

---

**Next Steps**: Execute deployment phases in order and monitor system performance post-deployment.
