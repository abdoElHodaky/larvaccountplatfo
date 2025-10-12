# Alova.js + GraphQL + Socket.io Integration Architecture

## Overview

This document describes the comprehensive integration of three modern technologies in the Laravel Accounting Platform:

- **Alova.js**: Lightweight, performant HTTP client for REST and GraphQL APIs
- **GraphQL**: Query language and runtime for APIs with Laravel Lighthouse
- **Socket.io**: Real-time bidirectional event-based communication

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │    │   (Laravel)     │    │   (MySQL)       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Alova.js    │◄┼────┼►│ GraphQL     │◄┼────┼►│ Accounting  │ │
│ │ Client      │ │    │ │ Lighthouse  │ │    │ │ Tables      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Socket.io   │◄┼────┼►│ Laravel     │◄┼────┼►│ Inventory   │ │
│ │ Client      │ │    │ │ Reverb      │ │    │ │ Tables      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Real-time   │◄┼────┼►│ Broadcasting│◄┼────┼►│ Dashboard   │ │
│ │ Hooks       │ │    │ │ Events      │ │    │ │ Metrics     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Integration

### Alova.js Configuration

The platform uses dual Alova.js clients:

1. **REST Client** (`alovaInstance`): For traditional REST API calls
2. **GraphQL Client** (`graphqlClient`): For GraphQL operations

```typescript
// Alova.js REST Client
export const alovaInstance = createAlova({
  baseURL: '/api',
  statesHook: ReactHook,
  requestAdapter: adapterFetch(),
  timeout: 10000,
  // Authentication, CSRF, and organization context
  beforeRequest(method) {
    // JWT token injection
    // CSRF token handling
    // Organization headers
  }
});

// Alova.js GraphQL Client
export const graphqlClient = createAlova({
  baseURL: '/api/graphql',
  statesHook: ReactHook,
  requestAdapter: adapterFetch(),
  timeout: 15000,
  // GraphQL-specific configuration
});
```

### Socket.io Integration

Real-time functionality is implemented through modular hooks:

```typescript
// Real-time Dashboard Updates
const { metrics, widgets, lastUpdate } = useRealtimeDashboard(organizationId);

// Real-time Accounting Updates
const { transactions, accounts } = useRealtimeAccounting(organizationId);

// Real-time Inventory Updates
const { products, stockMovements } = useRealtimeInventory(organizationId);

// Real-time Notifications
const { notifications, unreadCount } = useRealtimeNotifications(userId);
```

### GraphQL Integration

Advanced GraphQL hooks provide comprehensive data management:

```typescript
// Query Hook
const { data, loading, error, refetch } = useGraphQLQuery(GET_ACCOUNTS);

// Mutation Hook
const [createTransaction, { loading, error }] = useGraphQLMutation(CREATE_TRANSACTION);

// Paginated Query Hook
const { data, loading, loadMore, hasMore } = usePaginatedGraphQLQuery(GET_TRANSACTIONS);
```

## Backend Integration

### GraphQL Schema

Comprehensive GraphQL schema with:
- **Queries**: Data retrieval operations
- **Mutations**: Data modification operations
- **Subscriptions**: Real-time data updates
- **Types**: Complete type definitions for all entities

```graphql
type Query {
  # Accounting Queries
  accountingDashboard: AccountingDashboard
  accounts: [Account!]!
  transactions: [Transaction!]!
  
  # Inventory Queries
  inventoryDashboard: InventoryDashboard
  products: [Product!]!
  lowStockProducts: [Product!]!
}

type Mutation {
  # Accounting Mutations
  createAccount(input: CreateAccountInput!): Account
  createTransaction(input: CreateTransactionInput!): Transaction
  
  # Inventory Mutations
  createProduct(input: CreateProductInput!): Product
  updateStock(input: UpdateStockInput!): StockMovement
}

type Subscription {
  # Real-time subscriptions
  transactionUpdates(organizationId: ID!): Transaction
  stockUpdates(organizationId: ID!): Product
  dashboardMetricsUpdates(organizationId: ID!): DashboardMetrics
}
```

### Broadcasting Events

Domain events automatically broadcast real-time updates:

```php
// Transaction Events
class TransactionCreated extends BroadcastableDomainEvent
{
    protected function getChannelNames(): array
    {
        return [
            'accounting',
            'dashboard',
            "organization.{$this->transaction->organization_id}",
        ];
    }
    
    public function broadcastAs(): string
    {
        return 'accounting:transaction_created';
    }
}

// Inventory Events
class StockUpdated extends BroadcastableDomainEvent
{
    protected function getChannelNames(): array
    {
        return [
            'inventory',
            'dashboard',
            "organization.{$this->product->organization_id}",
        ];
    }
    
    public function broadcastAs(): string
    {
        return 'inventory:stock_updated';
    }
}
```

### Event Listeners

Automatic event broadcasting through Eloquent model events:

```php
class BroadcastTransactionEvents
{
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            'eloquent.created: App\Features\Accounting\Models\Transaction',
            [BroadcastTransactionEvents::class, 'handleTransactionCreated']
        );
    }
    
    public function handleTransactionCreated($event, $data): void
    {
        $transaction = $data[0];
        
        // Broadcast transaction event
        TransactionCreated::dispatch($transaction);
        
        // Update dashboard metrics
        $this->updateDashboardMetrics($transaction);
    }
}
```

## Data Flow

### 1. GraphQL Query Flow

```
Frontend (Alova.js) → GraphQL Endpoint → Lighthouse → Model → Database
                                     ↓
Frontend ← JSON Response ← GraphQL Response ← Query Result ← Data
```

### 2. Real-time Update Flow

```
Database Change → Model Event → Event Listener → Broadcasting Event
                                                        ↓
Frontend Socket.io ← Laravel Reverb ← WebSocket Channel ← Event Broadcast
```

### 3. Mutation with Real-time Updates

```
Frontend Mutation → GraphQL Mutation → Model Update → Database
                                            ↓
                                    Event Triggered
                                            ↓
                              Broadcasting Event
                                            ↓
                    All Connected Clients ← Real-time Update
```

## Authentication & Security

### JWT/Sanctum Integration

- **GraphQL Endpoints**: Protected with `auth:sanctum` middleware
- **WebSocket Connections**: Authenticated using JWT tokens
- **Organization Context**: Multi-tenant isolation through headers

### CORS Configuration

```php
// GraphQL CORS
'paths' => ['api/*', 'graphql', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
'allowed_headers' => ['*'],
```

## Performance Optimization

### Caching Strategy

1. **Alova.js Caching**: 5-minute default cache for GET requests
2. **GraphQL Caching**: Custom cache keys for GraphQL queries
3. **Redis Caching**: Backend query result caching
4. **Cache Invalidation**: Real-time cache updates via events

### Query Optimization

- **N+1 Prevention**: Proper eager loading in GraphQL resolvers
- **Database Indexing**: Optimized indexes for frequent queries
- **Pagination**: Built-in pagination for large datasets
- **Field Selection**: GraphQL field-level query optimization

## Monitoring & Logging

### Real-time Monitoring

- **Connection Status**: Socket.io connection health monitoring
- **Event Broadcasting**: Event dispatch and delivery tracking
- **GraphQL Performance**: Query execution time monitoring
- **Error Tracking**: Comprehensive error logging and alerting

### Metrics Collection

```php
// Dashboard Metrics Calculation
private function calculateAccountingMetrics(int $organizationId): array
{
    return [
        'total_revenue' => $this->calculateRevenue($organizationId),
        'total_expenses' => $this->calculateExpenses($organizationId),
        'net_income' => $revenue - $expenses,
        'cash_flow' => $this->calculateCashFlow($organizationId),
        'updated_at' => now()->toISOString(),
    ];
}
```

## Testing Strategy

### Integration Tests

Comprehensive test suite covering:

- **GraphQL Authentication**: JWT token validation
- **Real-time Broadcasting**: Event dispatch verification
- **Data Consistency**: Cross-system data integrity
- **Performance**: Concurrent request handling
- **Error Handling**: Graceful failure scenarios

```php
/** @test */
public function it_broadcasts_events_when_transactions_are_created()
{
    // Create transaction via GraphQL
    $response = $this->postJson('/graphql', [
        'query' => 'mutation CreateTransaction($input: CreateTransactionInput!) { ... }',
        'variables' => ['input' => $transactionData],
    ]);
    
    // Verify events were dispatched
    Event::assertDispatched(TransactionCreated::class);
    Event::assertDispatched(MetricsUpdated::class);
}
```

## Deployment Considerations

### Production Configuration

1. **Laravel Reverb**: WebSocket server configuration
2. **Queue Workers**: Background job processing for events
3. **Redis**: Session and cache storage
4. **Load Balancing**: Sticky sessions for WebSocket connections

### Environment Variables

```env
# GraphQL Configuration
LIGHTHOUSE_CACHE_ENABLE=true
LIGHTHOUSE_QUERY_CACHE_TTL=3600

# Broadcasting Configuration
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=production
REVERB_HOST=wss://your-domain.com
REVERB_PORT=443
REVERB_SCHEME=https

# Performance Configuration
GRAPHQL_QUERY_MAX_COMPLEXITY=1000
GRAPHQL_QUERY_MAX_DEPTH=15
```

## Future Enhancements

### Planned Features

1. **GraphQL Subscriptions**: Real-time GraphQL subscriptions
2. **Advanced Caching**: Multi-layer caching strategy
3. **Offline Support**: Progressive Web App capabilities
4. **Analytics Integration**: Real-time analytics dashboard
5. **Mobile Support**: React Native integration

### Scalability Improvements

- **Horizontal Scaling**: Multi-server WebSocket support
- **Database Sharding**: Advanced multi-tenant architecture
- **CDN Integration**: Static asset optimization
- **Microservices**: Service-oriented architecture migration

## Conclusion

This integration provides a robust, scalable, and performant foundation for real-time accounting and inventory management. The combination of Alova.js, GraphQL, and Socket.io creates a modern, responsive user experience while maintaining data consistency and system reliability.

The architecture supports:
- ✅ Real-time collaboration
- ✅ Efficient data fetching
- ✅ Scalable WebSocket connections
- ✅ Comprehensive error handling
- ✅ Production-ready performance
- ✅ Extensive testing coverage
