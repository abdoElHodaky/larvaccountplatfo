/**
 * Advanced Cache Strategies for AlovaJS
 * Implements intelligent caching patterns for different data types
 */

export interface CacheStrategy {
  expire: number;
  mode: 'memory' | 'localStorage' | 'sessionStorage';
  key?: (method: any) => string;
  shouldCache?: (method: any, response: any) => boolean;
  invalidateOn?: string[];
}

export interface CacheConfig {
  [key: string]: CacheStrategy;
}

/**
 * Financial Data Cache Strategies
 * Different expiration times based on data volatility
 */
export const FinancialCacheStrategies: CacheConfig = {
  // Account balances - moderate volatility
  'accounts': {
    expire: 300000, // 5 minutes
    mode: 'memory',
    key: (method) => `account:${method.url}:${method.data?.organizationId}`,
    invalidateOn: ['transaction_created', 'transaction_updated', 'account_updated']
  },
  
  // Transactions - high volatility
  'transactions': {
    expire: 60000, // 1 minute
    mode: 'memory',
    key: (method) => `transaction:${method.url}:${JSON.stringify(method.data?.filters || {})}`,
    invalidateOn: ['transaction_created', 'transaction_updated', 'transaction_deleted']
  },
  
  // Reports - can be cached longer as they're expensive to generate
  'reports': {
    expire: 900000, // 15 minutes
    mode: 'localStorage',
    key: (method) => `report:${method.data?.type}:${method.data?.dateRange?.start}:${method.data?.dateRange?.end}`,
    shouldCache: (method, response) => {
      // Only cache successful reports
      return response && !response.errors && response.data;
    },
    invalidateOn: ['transaction_created', 'transaction_updated', 'account_updated']
  },
  
  // Chart of accounts - low volatility
  'chart_of_accounts': {
    expire: 1800000, // 30 minutes
    mode: 'localStorage',
    key: (method) => `coa:${method.data?.organizationId}`,
    invalidateOn: ['account_created', 'account_updated', 'account_deleted']
  },
  
  // User preferences - very low volatility
  'user_preferences': {
    expire: 3600000, // 1 hour
    mode: 'localStorage',
    key: (method) => `prefs:${method.data?.userId}`,
    invalidateOn: ['user_preferences_updated']
  },
  
  // Organization settings - low volatility
  'organization_settings': {
    expire: 1800000, // 30 minutes
    mode: 'localStorage',
    key: (method) => `org_settings:${method.data?.organizationId}`,
    invalidateOn: ['organization_updated', 'settings_updated']
  }
};

/**
 * GraphQL-specific cache strategies
 */
export const GraphQLCacheStrategies: CacheConfig = {
  // Queries - cacheable
  'query': {
    expire: 300000, // 5 minutes default
    mode: 'memory',
    key: (method) => {
      const { query, variables } = method.data || {};
      const queryHash = btoa(query?.replace(/\s+/g, ' ').trim() || '');
      const variablesHash = btoa(JSON.stringify(variables || {}));
      return `gql:query:${queryHash}:${variablesHash}`;
    },
    shouldCache: (method, response) => {
      // Don't cache if there are errors
      if (response?.errors && response.errors.length > 0) {
        return false;
      }
      
      // Don't cache mutations
      const query = method.data?.query || '';
      if (query.trim().toLowerCase().startsWith('mutation')) {
        return false;
      }
      
      return true;
    }
  },
  
  // Mutations - never cached
  'mutation': {
    expire: 0,
    mode: 'memory',
    shouldCache: () => false
  },
  
  // Subscriptions - never cached
  'subscription': {
    expire: 0,
    mode: 'memory',
    shouldCache: () => false
  }
};

/**
 * Cache invalidation patterns
 */
export const CacheInvalidationPatterns = {
  // Financial data patterns
  ACCOUNT_PATTERNS: [
    /^account:/,
    /^coa:/,
    /^report:/
  ],
  
  TRANSACTION_PATTERNS: [
    /^transaction:/,
    /^account:/,
    /^report:/
  ],
  
  REPORT_PATTERNS: [
    /^report:/
  ],
  
  // GraphQL patterns
  GRAPHQL_PATTERNS: [
    /^gql:query:/
  ]
};

/**
 * Smart cache key generator
 */
export class CacheKeyGenerator {
  /**
   * Generate cache key for REST endpoints
   */
  static forRestEndpoint(method: any, strategy?: CacheStrategy): string {
    if (strategy?.key) {
      return strategy.key(method);
    }
    
    const url = method.url;
    const params = method.data ? JSON.stringify(method.data) : '';
    const orgId = method.config?.headers?.['X-Organization-ID'] || '';
    
    return `rest:${method.type}:${url}:${btoa(params)}:${orgId}`;
  }
  
  /**
   * Generate cache key for GraphQL operations
   */
  static forGraphQLOperation(method: any): string {
    const { query, variables } = method.data || {};
    
    // Extract operation name if available
    const operationMatch = query?.match(/(?:query|mutation|subscription)\s+(\w+)/);
    const operationName = operationMatch ? operationMatch[1] : 'anonymous';
    
    // Create hash of query and variables
    const queryHash = btoa(query?.replace(/\s+/g, ' ').trim() || '');
    const variablesHash = btoa(JSON.stringify(variables || {}));
    
    return `gql:${operationName}:${queryHash}:${variablesHash}`;
  }
}

/**
 * Cache invalidation manager
 */
export class CacheInvalidationManager {
  private static invalidationListeners: Map<string, Set<() => void>> = new Map();
  
  /**
   * Register cache invalidation listener
   */
  static onInvalidate(pattern: string, callback: () => void): () => void {
    if (!this.invalidationListeners.has(pattern)) {
      this.invalidationListeners.set(pattern, new Set());
    }
    
    this.invalidationListeners.get(pattern)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.invalidationListeners.get(pattern)?.delete(callback);
    };
  }
  
  /**
   * Trigger cache invalidation
   */
  static invalidate(event: string, patterns?: RegExp[]): void {
    const patternsToCheck = patterns || this.getDefaultPatterns(event);
    
    patternsToCheck.forEach(pattern => {
      this.invalidationListeners.forEach((callbacks, key) => {
        if (pattern.test(key)) {
          callbacks.forEach(callback => callback());
        }
      });
    });
  }
  
  /**
   * Get default invalidation patterns for events
   */
  private static getDefaultPatterns(event: string): RegExp[] {
    switch (event) {
      case 'transaction_created':
      case 'transaction_updated':
      case 'transaction_deleted':
        return CacheInvalidationPatterns.TRANSACTION_PATTERNS;
        
      case 'account_created':
      case 'account_updated':
      case 'account_deleted':
        return CacheInvalidationPatterns.ACCOUNT_PATTERNS;
        
      case 'report_generated':
        return CacheInvalidationPatterns.REPORT_PATTERNS;
        
      default:
        return CacheInvalidationPatterns.GRAPHQL_PATTERNS;
    }
  }
}

/**
 * Adaptive cache strategy selector
 */
export class AdaptiveCacheStrategy {
  /**
   * Select appropriate cache strategy based on request characteristics
   */
  static selectStrategy(method: any): CacheStrategy {
    const url = method.url?.toLowerCase() || '';
    const data = method.data || {};
    
    // Financial data strategies
    if (url.includes('/accounts')) {
      return FinancialCacheStrategies.accounts;
    }
    
    if (url.includes('/transactions')) {
      return FinancialCacheStrategies.transactions;
    }
    
    if (url.includes('/reports')) {
      return FinancialCacheStrategies.reports;
    }
    
    if (url.includes('/chart-of-accounts')) {
      return FinancialCacheStrategies.chart_of_accounts;
    }
    
    // GraphQL strategies
    if (url.includes('/graphql')) {
      const query = data.query?.trim().toLowerCase() || '';
      
      if (query.startsWith('mutation')) {
        return GraphQLCacheStrategies.mutation;
      }
      
      if (query.startsWith('subscription')) {
        return GraphQLCacheStrategies.subscription;
      }
      
      return GraphQLCacheStrategies.query;
    }
    
    // Default strategy
    return {
      expire: 300000, // 5 minutes
      mode: 'memory'
    };
  }
  
  /**
   * Determine if request should be cached
   */
  static shouldCache(method: any, response: any): boolean {
    const strategy = this.selectStrategy(method);
    
    if (strategy.shouldCache) {
      return strategy.shouldCache(method, response);
    }
    
    // Default caching logic
    if (method.type === 'GET') {
      return true;
    }
    
    // Don't cache mutations or errors
    if (method.type !== 'GET' || (response?.errors && response.errors.length > 0)) {
      return false;
    }
    
    return true;
  }
}

