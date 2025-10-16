/**
 * Enhanced GraphQL Adapter for AlovaJS
 * Provides advanced GraphQL integration with batching, caching, and error handling
 */

import { graphqlClient } from './alova.config';
import { CacheInvalidationManager, AdaptiveCacheStrategy } from './cacheStrategies';

export interface GraphQLOperation {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLBatchRequest {
  operations: GraphQLOperation[];
  batchId: string;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: Record<string, any>;
  }>;
  extensions?: Record<string, any>;
}

export interface GraphQLBatchResponse {
  responses: GraphQLResponse[];
  batchId: string;
}

/**
 * Enhanced GraphQL Client with advanced features
 */
export class EnhancedGraphQLClient {
  private batchQueue: Map<string, GraphQLOperation[]> = new Map();
  private batchTimeout: Map<string, NodeJS.Timeout> = new Map();
  private readonly batchDelay: number = 10; // 10ms batch delay
  private readonly maxBatchSize: number = 10;

  /**
   * Execute a single GraphQL operation
   */
  async execute<T = any>(operation: GraphQLOperation): Promise<GraphQLResponse<T>> {
    try {
      const method = graphqlClient.Post('/', {
        query: operation.query.trim(),
        variables: operation.variables || {},
        operationName: operation.operationName
      });

      // Apply adaptive caching strategy
      const strategy = AdaptiveCacheStrategy.selectStrategy(method);
      if (strategy) {
        method.config.cacheFor = {
          expire: strategy.expire,
          mode: strategy.mode,
          key: strategy.key ? strategy.key(method) : undefined
        };
      }

      const response = await method;
      
      // Handle cache invalidation
      this.handleCacheInvalidation(operation, response);
      
      return response;
    } catch (error) {
      console.error('GraphQL execution error:', error);
      throw this.enhanceError(error, operation);
    }
  }

  /**
   * Execute multiple GraphQL operations in batch
   */
  async executeBatch(operations: GraphQLOperation[]): Promise<GraphQLBatchResponse> {
    const batchId = this.generateBatchId();
    
    try {
      const method = graphqlClient.Post('/', {
        batch: operations.map(op => ({
          query: op.query.trim(),
          variables: op.variables || {},
          operationName: op.operationName
        }))
      });

      // Disable caching for batch requests
      method.config.cacheFor = false;

      const response = await method;
      
      return {
        responses: Array.isArray(response) ? response : [response],
        batchId
      };
    } catch (error) {
      console.error('GraphQL batch execution error:', error);
      throw this.enhanceError(error, { query: 'BATCH', variables: { operations } });
    }
  }

  /**
   * Add operation to batch queue
   */
  async queueOperation<T = any>(operation: GraphQLOperation): Promise<GraphQLResponse<T>> {
    return new Promise((resolve, reject) => {
      const batchId = this.getCurrentBatchId();
      
      if (!this.batchQueue.has(batchId)) {
        this.batchQueue.set(batchId, []);
      }

      const queue = this.batchQueue.get(batchId)!;
      queue.push({
        ...operation,
        resolve,
        reject
      } as any);

      // If batch is full, execute immediately
      if (queue.length >= this.maxBatchSize) {
        this.executeBatchQueue(batchId);
        return;
      }

      // Set timeout for batch execution
      if (!this.batchTimeout.has(batchId)) {
        const timeout = setTimeout(() => {
          this.executeBatchQueue(batchId);
        }, this.batchDelay);
        
        this.batchTimeout.set(batchId, timeout);
      }
    });
  }

  /**
   * Execute queued batch operations
   */
  private async executeBatchQueue(batchId: string): Promise<void> {
    const queue = this.batchQueue.get(batchId);
    const timeout = this.batchTimeout.get(batchId);

    if (!queue || queue.length === 0) return;

    // Clear timeout and queue
    if (timeout) {
      clearTimeout(timeout);
      this.batchTimeout.delete(batchId);
    }
    this.batchQueue.delete(batchId);

    try {
      const operations = queue.map(({ resolve, reject, ...op }) => op);
      const batchResponse = await this.executeBatch(operations);

      // Resolve individual promises
      batchResponse.responses.forEach((response, index) => {
        const queueItem = queue[index] as any;
        if (response.errors && response.errors.length > 0) {
          queueItem.reject(new Error(response.errors[0].message));
        } else {
          queueItem.resolve(response);
        }
      });
    } catch (error) {
      // Reject all promises in the batch
      queue.forEach((queueItem: any) => {
        queueItem.reject(error);
      });
    }
  }

  /**
   * Handle cache invalidation based on operation type
   */
  private handleCacheInvalidation(operation: GraphQLOperation, response: GraphQLResponse): void {
    const query = operation.query.trim().toLowerCase();
    
    // Only handle mutations for cache invalidation
    if (!query.startsWith('mutation')) return;
    
    // Extract mutation name
    const mutationMatch = query.match(/mutation\s+(\w+)/);
    const mutationName = mutationMatch ? mutationMatch[1] : 'unknown';
    
    // Map mutation names to cache invalidation events
    const invalidationEvents: Record<string, string> = {
      'createTransaction': 'transaction_created',
      'updateTransaction': 'transaction_updated',
      'deleteTransaction': 'transaction_deleted',
      'createAccount': 'account_created',
      'updateAccount': 'account_updated',
      'deleteAccount': 'account_deleted',
      'generateReport': 'report_generated'
    };
    
    const event = invalidationEvents[mutationName];
    if (event) {
      CacheInvalidationManager.invalidate(event);
    }
  }

  /**
   * Enhance error with additional context
   */
  private enhanceError(error: any, operation: GraphQLOperation): Error {
    const enhancedError = new Error(error.message || 'GraphQL operation failed');
    
    // Add operation context
    (enhancedError as any).operation = {
      query: operation.query.substring(0, 200) + '...',
      variables: operation.variables,
      operationName: operation.operationName
    };
    
    // Add original error
    (enhancedError as any).originalError = error;
    
    // Add timestamp
    (enhancedError as any).timestamp = new Date().toISOString();
    
    return enhancedError;
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current batch ID (for batching within same tick)
   */
  private getCurrentBatchId(): string {
    const now = Date.now();
    return `batch_${Math.floor(now / this.batchDelay)}`;
  }

  /**
   * Clear all pending batches
   */
  clearBatches(): void {
    this.batchTimeout.forEach(timeout => clearTimeout(timeout));
    this.batchTimeout.clear();
    this.batchQueue.clear();
  }

  /**
   * Get batch queue status
   */
  getBatchStatus(): {
    queuedBatches: number;
    totalOperations: number;
    pendingTimeouts: number;
  } {
    const totalOperations = Array.from(this.batchQueue.values())
      .reduce((sum, queue) => sum + queue.length, 0);

    return {
      queuedBatches: this.batchQueue.size,
      totalOperations,
      pendingTimeouts: this.batchTimeout.size
    };
  }
}

/**
 * Global enhanced GraphQL client instance
 */
export const enhancedGraphQLClient = new EnhancedGraphQLClient();

/**
 * Convenience functions for common operations
 */

/**
 * Execute a GraphQL query
 */
export const query = <T = any>(
  queryString: string, 
  variables?: Record<string, any>,
  operationName?: string
): Promise<GraphQLResponse<T>> => {
  return enhancedGraphQLClient.execute<T>({
    query: queryString,
    variables,
    operationName
  });
};

/**
 * Execute a GraphQL mutation
 */
export const mutate = <T = any>(
  mutationString: string,
  variables?: Record<string, any>,
  operationName?: string
): Promise<GraphQLResponse<T>> => {
  return enhancedGraphQLClient.execute<T>({
    query: mutationString,
    variables,
    operationName
  });
};

/**
 * Queue a GraphQL operation for batching
 */
export const queueQuery = <T = any>(
  queryString: string,
  variables?: Record<string, any>,
  operationName?: string
): Promise<GraphQLResponse<T>> => {
  return enhancedGraphQLClient.queueOperation<T>({
    query: queryString,
    variables,
    operationName
  });
};

/**
 * GraphQL template literal tag for syntax highlighting
 */
export const gql = (strings: TemplateStringsArray, ...values: any[]): string => {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] || '');
  }, '');
};

/**
 * Type-safe GraphQL operation builder
 */
export class GraphQLOperationBuilder {
  private operation: GraphQLOperation = { query: '' };

  static query(name?: string): GraphQLOperationBuilder {
    const builder = new GraphQLOperationBuilder();
    builder.operation.query = name ? `query ${name}` : 'query';
    return builder;
  }

  static mutation(name?: string): GraphQLOperationBuilder {
    const builder = new GraphQLOperationBuilder();
    builder.operation.query = name ? `mutation ${name}` : 'mutation';
    return builder;
  }

  fields(fields: string): GraphQLOperationBuilder {
    this.operation.query += ` { ${fields} }`;
    return this;
  }

  variables(variables: Record<string, any>): GraphQLOperationBuilder {
    this.operation.variables = variables;
    return this;
  }

  operationName(name: string): GraphQLOperationBuilder {
    this.operation.operationName = name;
    return this;
  }

  build(): GraphQLOperation {
    return { ...this.operation };
  }

  async execute<T = any>(): Promise<GraphQLResponse<T>> {
    return enhancedGraphQLClient.execute<T>(this.operation);
  }
}

