# Real-time Setup Guide (Simplified)

## Quick Start

### 1. Backend Setup

```bash
# Install dependencies (if not already installed)
composer install

# Configure environment
cp .env.example.realtime .env.local
# Edit .env.local with your settings

# Run migrations (if needed)
php artisan migrate

# Start Laravel Reverb server
php artisan reverb:start

# Start queue workers (in separate terminal)
php artisan queue:work
```

### 2. Frontend Setup

```bash
# Install frontend dependencies
npm install socket.io-client alova

# Add to your React app
import { useRealtimeDashboard } from './hooks/useRealtime';
import { useDashboardMetrics } from './hooks/useGraphQL';
```

### 3. Basic Usage

```tsx
// In your React component
function Dashboard() {
  const organizationId = "1";
  
  // GraphQL data fetching
  const { data, loading } = useDashboardMetrics(organizationId);
  
  // Real-time updates
  const { metrics, connected } = useRealtimeDashboard(organizationId);
  
  return (
    <div>
      <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
      <div>Revenue: ${metrics?.total_revenue || data?.total_revenue}</div>
    </div>
  );
}
```

## Architecture

```
Frontend (React) → Alova.js → GraphQL → Laravel
       ↓              ↓         ↓         ↓
Socket.io Client → WebSocket → Reverb → Broadcasting Events
```

## Key Features

- ✅ **Real-time Transactions**: Instant updates when transactions are created/updated
- ✅ **Live Inventory**: Stock level changes broadcast immediately
- ✅ **Dashboard Metrics**: Financial metrics update in real-time
- ✅ **Multi-tenant**: Organization-based channel isolation
- ✅ **Authentication**: JWT token-based WebSocket authentication

## Testing

```bash
# Test GraphQL endpoint
curl -X POST http://localhost:8000/graphql \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ accounts { data { id name } } }"}'

# Test WebSocket connection (browser console)
const socket = io('ws://localhost:8080', {
  auth: { token: 'YOUR_TOKEN', organizationId: '1' }
});
socket.on('connect', () => console.log('Connected!'));
```

## Production Deployment

1. **Environment Variables**:
   ```env
   BROADCAST_CONNECTION=reverb
   REVERB_HOST=your-domain.com
   REVERB_PORT=443
   REVERB_SCHEME=https
   ```

2. **SSL Configuration**: Configure SSL certificates for WebSocket connections

3. **Queue Workers**: Set up supervisor for queue workers

4. **Redis**: Configure Redis for scaling multiple servers

## Troubleshooting

- **Connection Issues**: Check CORS settings and authentication tokens
- **Events Not Broadcasting**: Verify queue workers are running
- **Performance**: Monitor Redis memory usage and connection limits

## Next Steps

- Add rate limiting for WebSocket connections
- Implement offline support with service workers
- Add comprehensive error handling and retry logic
- Set up monitoring and alerting for real-time systems
