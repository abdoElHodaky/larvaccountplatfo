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

## Phase 2 & 3 Completed Features

### ✅ Security & Error Handling
- **Rate Limiting**: GraphQL requests limited to 100/minute per user
- **Connection Limits**: Max 5 connections per user, 100 per organization
- **Error Handling**: Comprehensive retry logic with exponential backoff
- **WebSocket Security**: JWT token authentication and connection validation

### ✅ Performance Optimizations
- **Query Caching**: Intelligent caching with TTL and tag-based invalidation
- **Optimized Hooks**: Performance-optimized GraphQL hooks with caching
- **Pagination Support**: Infinite scroll and debounced search
- **Batch Operations**: Bulk mutation support for better performance

### ✅ UI Enhancements
- **Simplified Animations**: Clean transition system with highlight effects
- **Live Icons**: Comprehensive icon system with animation support
- **Enhanced Dashboard**: Beautiful real-time dashboard with live indicators
- **Responsive Design**: Mobile-friendly with dark mode support

## Advanced Usage

### Using Enhanced Components
```tsx
import { EnhancedRealtimeDashboard } from './components/EnhancedRealtimeDashboard';
import { useRealtimeWithRetry } from './hooks/useRealtimeWithRetry';
import { useOptimizedGraphQLQuery } from './hooks/useOptimizedGraphQL';

// Enhanced dashboard with animations
<EnhancedRealtimeDashboard organizationId="1" />

// Real-time with retry logic
const { connected, error, retry } = useRealtimeWithRetry('1', {
  maxRetries: 5,
  retryDelay: 3000
});

// Optimized GraphQL with caching
const { data, loading } = useOptimizedGraphQLQuery(query, variables, {
  cacheTime: 300000,
  staleTime: 60000
});
```

### Animation System
```tsx
import { useAnimation, transitions } from './animations/transitions';

const { highlightUpdate } = useAnimation();
const elementRef = useRef();

// Highlight element when data updates
useEffect(() => {
  if (newData) {
    highlightUpdate(elementRef);
  }
}, [newData]);
```

### Icon System
```tsx
import { icons, LiveStatus } from './icons/LiveIcons';

// Live status indicator
<LiveStatus connected={connected} loading={loading} error={error} />

// Individual icons
<icons.transaction size="lg" className="text-green-600" />
<icons.liveData size="md" animated />
```

## Production Deployment

### Environment Variables
```env
# Security
GRAPHQL_RATE_LIMIT_PER_MINUTE=100
WS_MAX_CONNECTIONS_PER_USER=5
WS_MAX_CONNECTIONS_PER_ORG=100

# Performance
LIGHTHOUSE_CACHE_ENABLE=true
LIGHTHOUSE_QUERY_CACHE_TTL=300
REDIS_HOST=your-redis-host

# Real-time
REVERB_HOST=your-domain.com
REVERB_PORT=443
REVERB_SCHEME=https
```

### Monitoring
- Connection count monitoring
- Rate limit metrics
- Cache hit rates
- Real-time event throughput

## Next Steps (Optional)

- Implement offline support with service workers
- Add comprehensive monitoring dashboard
- Set up alerting for connection issues
- Implement advanced caching strategies
