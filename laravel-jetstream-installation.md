# Laravel Jetstream Installation & Setup Guide

## Installation Commands

```bash
# Install Laravel Jetstream
composer require laravel/jetstream

# Install Jetstream with Inertia.js stack and teams
php artisan jetstream:install inertia --teams

# Install and build Node dependencies
npm install && npm run build

# Run database migrations
php artisan migrate

# Publish Jetstream configuration (optional)
php artisan vendor:publish --tag=jetstream-config

# Publish Jetstream views (optional for customization)
php artisan vendor:publish --tag=jetstream-views
```

## Environment Configuration

Add to `.env`:
```env
# Jetstream Configuration
JETSTREAM_STACK=inertia
JETSTREAM_FEATURES=registration,reset-passwords,email-verification,update-profile-information,update-passwords,two-factor-authentication,delete-account,teams,api

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1,127.0.0.1:8000,::1,localhost:3000
SESSION_DOMAIN=localhost

# Multi-tenant Team Configuration
JETSTREAM_MULTI_TENANT=true
JETSTREAM_TENANT_MODEL=App\Models\Tenant
JETSTREAM_TEAM_MODEL=App\Models\Team

# Two-Factor Authentication
JETSTREAM_2FA_ENABLED=true
JETSTREAM_2FA_CONFIRM_PASSWORD=true

# API Token Configuration
SANCTUM_EXPIRATION=null
SANCTUM_TOKEN_PREFIX=
SANCTUM_MIDDLEWARE=auth:sanctum

# Team Management
JETSTREAM_TEAM_INVITATIONS=true
JETSTREAM_TEAM_PERMISSIONS=true
JETSTREAM_MAX_TEAMS_PER_USER=5

# Profile Management
JETSTREAM_PROFILE_PHOTOS=true
JETSTREAM_MANAGE_PROFILE_INFORMATION=true
JETSTREAM_UPDATE_PASSWORDS=true
JETSTREAM_DELETE_ACCOUNT=true
```

## Database Configuration

Jetstream will create the following migrations:
- `create_users_table` - Enhanced user model
- `create_password_resets_table` - Password reset functionality
- `create_failed_jobs_table` - Failed job tracking
- `create_personal_access_tokens_table` - API token management
- `create_teams_table` - Team management
- `create_team_user_table` - Team membership
- `create_team_invitations_table` - Team invitations

## Multi-Tenant Integration

### Custom Team Model
Create `app/Models/Team.php`:
```php
<?php

namespace App\Models;

use Laravel\Jetstream\Events\TeamCreated;
use Laravel\Jetstream\Events\TeamDeleted;
use Laravel\Jetstream\Events\TeamUpdated;
use Laravel\Jetstream\Team as JetstreamTeam;

class Team extends JetstreamTeam
{
    protected $fillable = [
        'name',
        'personal_team',
        'tenant_id', // Multi-tenant integration
    ];

    protected $dispatchesEvents = [
        'created' => TeamCreated::class,
        'updated' => TeamUpdated::class,
        'deleted' => TeamDeleted::class,
    ];

    /**
     * Get the tenant that owns the team.
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
```

### Custom User Model Enhancement
Update `app/Models/User.php`:
```php
<?php

namespace App\Models;

use Laravel\Jetstream\HasTeams;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Jetstream\HasProfilePhoto;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens;
    use HasFactory;
    use HasProfilePhoto;
    use HasTeams;
    use Notifiable;
    use TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'tenant_id', // Multi-tenant integration
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Get the tenant that owns the user.
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
```

## Features Configuration

### Available Jetstream Features
- `registration` - User registration
- `reset-passwords` - Password reset
- `email-verification` - Email verification
- `update-profile-information` - Profile management
- `update-passwords` - Password updates
- `two-factor-authentication` - 2FA support
- `delete-account` - Account deletion
- `teams` - Team management
- `api` - API token management

### Team Permissions
- `create` - Create resources
- `read` - View resources
- `update` - Update resources
- `delete` - Delete resources
- `manage-team` - Team management
- `manage-users` - User management

## API Token Scopes

### Accounting-Specific Scopes
- `accounts:read` - View accounts
- `accounts:write` - Create/update accounts
- `accounts:delete` - Delete accounts
- `reports:read` - View reports
- `reports:generate` - Generate reports
- `admin:full` - Full administrative access

## Security Configuration

### Sanctum Configuration
Update `config/sanctum.php`:
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
    Sanctum::currentApplicationUrlWithPort()
))),

'middleware' => [
    'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
    'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
],

'expiration' => env('SANCTUM_EXPIRATION'),
```

### CORS Configuration
Update `config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['*'],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

## Multi-Tenant Considerations

### Team-Tenant Relationship
- Each team belongs to a tenant
- Users can belong to multiple teams within the same tenant
- Cross-tenant team membership is restricted
- Team permissions are tenant-scoped

### API Token Scoping
- API tokens are scoped to specific tenants
- Token permissions are validated against tenant context
- Cross-tenant API access is prevented

### Session Management
- Sessions are tenant-aware
- User switching between tenants requires re-authentication
- Team context is maintained in session
