# 🔌 GraphQL API Documentation

## 📋 **Table of Contents**

- [🎯 API Overview](#-api-overview)
- [🔐 Authentication](#-authentication)
- [📊 Dashboard API](#-dashboard-api)
- [🏦 Accounting API](#-accounting-api)
- [🤝 Collaboration API](#-collaboration-api)
- [🔒 Security API](#-security-api)
- [📈 Analytics API](#-analytics-api)
- [🛠️ Development Tools](#️-development-tools)

---

## 🎯 **API Overview**

The Laravel Accounting Platform uses GraphQL for efficient, type-safe API communication with Alova.js as the client library.

### **🏗️ GraphQL Schema Structure**

```graphql
type Query {
  # Dashboard queries
  dashboardMetrics(input: DashboardMetricsInput!): DashboardMetrics!
  dashboardWidgets(organizationId: ID!): [DashboardWidget!]!
  
  # Accounting queries
  accounts(input: AccountsInput!): AccountConnection!
  transactions(input: TransactionsInput!): TransactionConnection!
  accountBalances(organizationId: ID!, asOfDate: Date!): [AccountBalance!]!
  trialBalance(organizationId: ID!, asOfDate: Date!): TrialBalance!
  
  # Analytics queries
  performanceMetrics(input: PerformanceMetricsInput!): PerformanceMetrics!
  userAnalytics(input: UserAnalyticsInput!): UserAnalytics!
  
  # Security queries
  securityEvents(input: SecurityEventsInput!): SecurityEventConnection!
  securityMetrics(organizationId: ID!): SecurityMetrics!
}

type Mutation {
  # Dashboard mutations
  updateDashboardWidget(input: UpdateDashboardWidgetInput!): DashboardWidget!
  createDashboardWidget(input: CreateDashboardWidgetInput!): DashboardWidget!
  
  # Accounting mutations
  createTransaction(input: CreateTransactionInput!): Transaction!
  updateTransaction(input: UpdateTransactionInput!): Transaction!
  createAccount(input: CreateAccountInput!): Account!
  
  # Collaboration mutations
  joinDocument(input: JoinDocumentInput!): CollaborationSession!
  updateDocument(input: UpdateDocumentInput!): DocumentUpdate!
  
  # Security mutations
  recordSecurityEvent(input: SecurityEventInput!): SecurityEvent!
  updateSecurityPolicy(input: SecurityPolicyInput!): SecurityPolicy!
}

type Subscription {
  # Real-time dashboard updates
  dashboardMetricsUpdated(organizationId: ID!): DashboardMetrics!
  dashboardWidgetUpdated(dashboardId: ID!): DashboardWidget!
  
  # Real-time accounting updates
  transactionCreated(organizationId: ID!): Transaction!
  accountBalanceUpdated(organizationId: ID!): AccountBalance!
  
  # Real-time collaboration
  documentUpdated(documentId: ID!): DocumentUpdate!
  userPresenceChanged(documentId: ID!): UserPresence!
  
  # Real-time security events
  securityEventOccurred(organizationId: ID!): SecurityEvent!
}
```

---

## 🔐 **Authentication**

### **🔑 JWT Token Authentication**

All GraphQL requests require authentication via JWT tokens.

#### **Authentication Headers:**
```typescript
// Alova.js authentication setup
const alovaInstance = createAlova({
  baseURL: '/graphql',
  beforeRequest(method) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      method.config.headers.Authorization = `Bearer ${token}`;
    }
  },
  responded: {
    onSuccess(response) {
      return response.json();
    },
    onError(error) {
      if (error.status === 401) {
        // Handle token expiration
        refreshAuthToken();
      }
      throw error;
    }
  }
});
```

#### **Token Refresh Flow:**
```typescript
// Automatic token refresh
const refreshAuthToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  
  const { access_token, refresh_token: newRefreshToken } = await response.json();
  
  localStorage.setItem('auth_token', access_token);
  localStorage.setItem('refresh_token', newRefreshToken);
};
```

### **🛡️ Rate Limiting**

API requests are rate-limited to prevent abuse:

- **Authenticated Users**: 1000 requests per hour
- **Anonymous Users**: 100 requests per hour
- **GraphQL Introspection**: 10 requests per hour

---

## 📊 **Dashboard API**

### **📈 Dashboard Metrics Query**

Retrieve real-time dashboard metrics with filtering and aggregation.

#### **Query Definition:**
```graphql
query GetDashboardMetrics($input: DashboardMetricsInput!) {
  dashboardMetrics(input: $input) {
    revenue {
      current
      previous
      percentageChange
      trend
    }
    expenses {
      current
      previous
      percentageChange
      trend
    }
    profit {
      current
      previous
      percentageChange
      trend
    }
    cashFlow {
      inflow
      outflow
      netFlow
      projectedFlow
    }
    topAccounts {
      id
      name
      balance
      percentageOfTotal
    }
    recentTransactions {
      id
      date
      description
      amount
      account {
        id
        name
      }
    }
    lastUpdated
    isRealtime
  }
}
```

#### **Input Types:**
```graphql
input DashboardMetricsInput {
  organizationId: ID!
  dateRange: DateRangeInput!
  metricTypes: [MetricType!]!
  currency: String = "USD"
  includeProjections: Boolean = false
}

input DateRangeInput {
  start: Date!
  end: Date!
  period: PeriodType = CUSTOM
}

enum MetricType {
  REVENUE
  EXPENSES
  PROFIT
  CASH_FLOW
  ACCOUNTS_RECEIVABLE
  ACCOUNTS_PAYABLE
}

enum PeriodType {
  TODAY
  YESTERDAY
  THIS_WEEK
  LAST_WEEK
  THIS_MONTH
  LAST_MONTH
  THIS_QUARTER
  LAST_QUARTER
  THIS_YEAR
  LAST_YEAR
  CUSTOM
}
```

#### **Usage Example:**
```typescript
// Dashboard metrics with Alova.js
const { data: metrics, loading, error, send } = useRequest(
  () => alovaInstance.Post('/graphql', {
    query: GET_DASHBOARD_METRICS,
    variables: {
      input: {
        organizationId: orgId,
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31',
          period: 'THIS_YEAR'
        },
        metricTypes: ['REVENUE', 'EXPENSES', 'PROFIT'],
        currency: 'USD',
        includeProjections: true
      }
    }
  }),
  {
    immediate: true,
    pollingTime: 30000, // Poll every 30 seconds
    cacheFor: 300000   // Cache for 5 minutes
  }
);
```

### **🎯 Dashboard Widgets Query**

Retrieve and manage dashboard widgets with real-time updates.

#### **Query Definition:**
```graphql
query GetDashboardWidgets($organizationId: ID!) {
  dashboardWidgets(organizationId: $organizationId) {
    id
    type
    title
    position {
      x
      y
      width
      height
    }
    configuration
    data
    lastUpdated
    isVisible
    permissions {
      canEdit
      canDelete
      canMove
    }
  }
}
```

#### **Widget Types:**
```graphql
enum WidgetType {
  REVENUE_CHART
  EXPENSE_BREAKDOWN
  CASH_FLOW_GRAPH
  ACCOUNT_BALANCES
  RECENT_TRANSACTIONS
  PROFIT_LOSS_SUMMARY
  CUSTOM_METRIC
  KPI_INDICATOR
}
```

---

## 🏦 **Accounting API**

### **💰 Accounts Query**

Retrieve chart of accounts with hierarchical structure and real-time balances.

#### **Query Definition:**
```graphql
query GetAccounts($input: AccountsInput!) {
  accounts(input: $input) {
    edges {
      node {
        id
        code
        name
        type
        parentAccount {
          id
          name
          code
        }
        childAccounts {
          id
          name
          code
          balance
        }
        balance
        currency
        isActive
        description
        createdAt
        updatedAt
        lastTransactionDate
        transactionCount
        permissions {
          canEdit
          canDelete
          canViewTransactions
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

#### **Input Types:**
```graphql
input AccountsInput {
  organizationId: ID!
  accountType: [AccountType!]
  isActive: Boolean
  searchTerm: String
  parentAccountId: ID
  first: Int = 20
  after: String
  orderBy: AccountOrderBy = NAME_ASC
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
}

enum AccountOrderBy {
  NAME_ASC
  NAME_DESC
  CODE_ASC
  CODE_DESC
  BALANCE_ASC
  BALANCE_DESC
  CREATED_AT_ASC
  CREATED_AT_DESC
}
```

### **📋 Transactions Query**

Retrieve transactions with advanced filtering and real-time updates.

#### **Query Definition:**
```graphql
query GetTransactions($input: TransactionsInput!) {
  transactions(input: $input) {
    edges {
      node {
        id
        date
        description
        reference
        amount
        currency
        status
        type
        journalEntries {
          id
          account {
            id
            name
            code
          }
          debitAmount
          creditAmount
          description
        }
        attachments {
          id
          filename
          url
          type
        }
        tags
        createdBy {
          id
          name
          email
        }
        createdAt
        updatedAt
        isReconciled
        reconciliationDate
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
    totalAmount
    summary {
      totalDebits
      totalCredits
      transactionCount
      averageAmount
    }
  }
}
```

#### **Transaction Creation Mutation:**
```graphql
mutation CreateTransaction($input: CreateTransactionInput!) {
  createTransaction(input: $input) {
    id
    date
    description
    amount
    status
    journalEntries {
      id
      account {
        id
        name
      }
      debitAmount
      creditAmount
    }
    errors {
      field
      message
    }
  }
}

input CreateTransactionInput {
  organizationId: ID!
  date: Date!
  description: String!
  reference: String
  journalEntries: [JournalEntryInput!]!
  attachments: [AttachmentInput!]
  tags: [String!]
}

input JournalEntryInput {
  accountId: ID!
  debitAmount: Decimal
  creditAmount: Decimal
  description: String
}
```

---

## 🤝 **Collaboration API**

### **👥 Real-time Collaboration**

Enable real-time collaborative editing with presence awareness.

#### **Join Document Mutation:**
```graphql
mutation JoinDocument($input: JoinDocumentInput!) {
  joinDocument(input: $input) {
    sessionId
    documentId
    userId
    permissions {
      canEdit
      canComment
      canShare
    }
    collaborators {
      id
      name
      avatar
      status
      cursorPosition
      lastActivity
    }
    documentState
    version
  }
}

input JoinDocumentInput {
  documentId: ID!
  documentType: DocumentType!
  organizationId: ID!
}

enum DocumentType {
  DASHBOARD
  ACCOUNT
  TRANSACTION
  REPORT
}
```

#### **Document Update Subscription:**
```graphql
subscription DocumentUpdated($documentId: ID!) {
  documentUpdated(documentId: $documentId) {
    id
    type
    operation
    data
    userId
    timestamp
    version
    conflicts {
      field
      conflictType
      resolution
    }
  }
}
```

#### **Usage Example:**
```typescript
// Real-time collaboration with Alova.js
const { data: collaborationSession } = useRequest(
  () => alovaInstance.Post('/graphql', {
    query: JOIN_DOCUMENT,
    variables: {
      input: {
        documentId: dashboardId,
        documentType: 'DASHBOARD',
        organizationId: orgId
      }
    }
  })
);

// Subscribe to document updates
const { data: documentUpdates } = useWatcher(
  () => alovaInstance.Post('/graphql', {
    query: DOCUMENT_UPDATED_SUBSCRIPTION,
    variables: { documentId: dashboardId }
  }),
  [dashboardId],
  {
    immediate: true
  }
);
```

---

## 🔒 **Security API**

### **🛡️ Security Events Query**

Monitor and analyze security events with advanced filtering.

#### **Query Definition:**
```graphql
query GetSecurityEvents($input: SecurityEventsInput!) {
  securityEvents(input: $input) {
    edges {
      node {
        id
        type
        severity
        userId
        sessionId
        ipAddress
        userAgent
        resource
        action
        timestamp
        details
        blocked
        resolved
        resolvedBy {
          id
          name
        }
        resolvedAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
    summary {
      totalEvents
      blockedAttempts
      suspiciousActivities
      policyViolations
      riskScore
    }
  }
}

input SecurityEventsInput {
  organizationId: ID!
  eventType: [SecurityEventType!]
  severity: [SecuritySeverity!]
  dateRange: DateRangeInput!
  userId: ID
  ipAddress: String
  resolved: Boolean
  first: Int = 50
  after: String
}

enum SecurityEventType {
  AUTHENTICATION
  AUTHORIZATION
  DATA_ACCESS
  SUSPICIOUS_ACTIVITY
  POLICY_VIOLATION
}

enum SecuritySeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

### **📊 Security Metrics Query**

Get comprehensive security metrics and threat analysis.

#### **Query Definition:**
```graphql
query GetSecurityMetrics($organizationId: ID!) {
  securityMetrics(organizationId: $organizationId) {
    totalEvents
    blockedAttempts
    suspiciousActivities
    policyViolations
    activeThreats
    riskScore
    lastIncident
    threatsByType {
      type
      count
      severity
    }
    topThreats {
      ipAddress
      threatCount
      lastActivity
      riskScore
    }
    securityPolicies {
      id
      name
      type
      enabled
      violationCount
    }
  }
}
```

---

## 📈 **Analytics API**

### **📊 Performance Metrics Query**

Retrieve comprehensive performance analytics and monitoring data.

#### **Query Definition:**
```graphql
query GetPerformanceMetrics($input: PerformanceMetricsInput!) {
  performanceMetrics(input: $input) {
    apiMetrics {
      endpoint
      method
      averageResponseTime
      requestCount
      errorRate
      cacheHitRate
    }
    uiMetrics {
      component
      averageRenderTime
      interactionCount
      errorCount
      memoryUsage
    }
    webVitals {
      lcp
      fid
      cls
      ttfb
      fcp
    }
    userAnalytics {
      activeUsers
      sessionDuration
      pageViews
      bounceRate
      conversionRate
    }
    systemMetrics {
      cpuUsage
      memoryUsage
      diskUsage
      networkLatency
    }
  }
}

input PerformanceMetricsInput {
  organizationId: ID!
  dateRange: DateRangeInput!
  metricTypes: [PerformanceMetricType!]!
  aggregation: AggregationType = HOURLY
}

enum PerformanceMetricType {
  API_PERFORMANCE
  UI_PERFORMANCE
  WEB_VITALS
  USER_ANALYTICS
  SYSTEM_METRICS
}

enum AggregationType {
  MINUTE
  HOURLY
  DAILY
  WEEKLY
  MONTHLY
}
```

---

## 🛠️ **Development Tools**

### **🔍 GraphQL Introspection**

Enable GraphQL schema introspection for development tools.

#### **Introspection Query:**
```graphql
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      ...FullType
    }
    directives {
      name
      description
      locations
      args {
        ...InputValue
      }
    }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args {
      ...InputValue
    }
    type {
      ...TypeRef
    }
    isDeprecated
    deprecationReason
  }
  inputFields {
    ...InputValue
  }
  interfaces {
    ...TypeRef
  }
  enumValues(includeDeprecated: true) {
    name
    description
    isDeprecated
    deprecationReason
  }
  possibleTypes {
    ...TypeRef
  }
}

fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}
```

### **🧪 Testing Utilities**

GraphQL testing utilities for development and testing.

#### **Mock GraphQL Server:**
```typescript
// Mock GraphQL server for testing
import { graphql } from 'msw';

export const graphqlHandlers = [
  graphql.query('GetDashboardMetrics', (req, res, ctx) => {
    return res(
      ctx.data({
        dashboardMetrics: {
          revenue: {
            current: 150000,
            previous: 120000,
            percentageChange: 25,
            trend: 'UP'
          },
          expenses: {
            current: 80000,
            previous: 75000,
            percentageChange: 6.67,
            trend: 'UP'
          },
          profit: {
            current: 70000,
            previous: 45000,
            percentageChange: 55.56,
            trend: 'UP'
          }
        }
      })
    );
  }),

  graphql.mutation('CreateTransaction', (req, res, ctx) => {
    const { input } = req.variables;
    return res(
      ctx.data({
        createTransaction: {
          id: 'new-transaction-id',
          date: input.date,
          description: input.description,
          amount: input.journalEntries.reduce((sum, entry) => 
            sum + (entry.debitAmount || entry.creditAmount), 0
          ),
          status: 'PENDING'
        }
      })
    );
  })
];
```

### **📊 Performance Monitoring**

Monitor GraphQL query performance and optimization.

#### **Query Performance Tracking:**
```typescript
// GraphQL performance monitoring
const performancePlugin = {
  requestDidStart() {
    return {
      willSendRequest(requestContext) {
        requestContext.request.http.startTime = Date.now();
      },
      willSendResponse(requestContext) {
        const duration = Date.now() - requestContext.request.http.startTime;
        
        // Record performance metrics
        performanceMonitor.recordAPIMetric({
          endpoint: '/graphql',
          method: 'POST',
          query: requestContext.request.query,
          variables: requestContext.request.variables,
          responseTime: duration,
          statusCode: requestContext.response.http.status,
          cached: requestContext.response.http.cached
        });
      }
    };
  }
};
```

---

## 📚 **Related Documentation**

- [🔄 Real-time Events](REALTIME_EVENTS.md)
- [🔐 Authentication Guide](AUTHENTICATION.md)
- [📊 Analytics API](ANALYTICS_API.md)
- [🏗️ Architecture Overview](../architecture/SYSTEM_ARCHITECTURE.md)
- [🧪 Testing Guide](../testing/TESTING_GUIDE.md)

---

**This GraphQL API documentation provides comprehensive coverage of all available queries, mutations, and subscriptions in the Laravel Accounting Platform, enabling efficient and type-safe API integration.**
