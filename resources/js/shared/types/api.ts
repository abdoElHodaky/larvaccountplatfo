/**
 * API Type Definitions
 * 
 * Standardized interfaces for API requests, responses, and data handling.
 * These provide consistent patterns for all API interactions.
 */

import { HttpMethod, ID, AsyncState, Filter, Sort, Search, DateRange } from './core';

// Base API response structure
export interface BaseApiResponse<T = any> {
  data: T;
  message?: string;
  status: ApiStatus;
  timestamp: string;
  requestId?: string;
}

// API status types
export type ApiStatus = 'success' | 'error' | 'loading' | 'idle';

// Paginated response structure
export interface PaginatedResponse<T> extends BaseApiResponse<T[]> {
  pagination: PaginationMeta;
}

// Pagination metadata
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  firstItem: number;
  lastItem: number;
}

// API error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  statusCode?: number;
  timestamp?: string;
  requestId?: string;
  stack?: string; // Only in development
}

// Validation error structure
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// API request configuration
export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTtl?: number;
}

// Query parameters for list endpoints
export interface ListQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
  include?: string[];
  fields?: string[];
}

// Advanced query parameters
export interface AdvancedQueryParams extends ListQueryParams {
  filters?: Filter[];
  sorts?: Sort[];
  searches?: Search[];
  dateRange?: DateRange;
  groupBy?: string[];
  aggregate?: AggregateFunction[];
}

// Aggregate function types
export interface AggregateFunction {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct';
  alias?: string;
}

// Bulk operation request
export interface BulkOperationRequest<T = any> {
  operation: 'create' | 'update' | 'delete';
  items: T[];
  options?: {
    validateOnly?: boolean;
    continueOnError?: boolean;
    batchSize?: number;
  };
}

// Bulk operation response
export interface BulkOperationResponse<T = any> {
  successful: T[];
  failed: BulkOperationError<T>[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
}

// Bulk operation error
export interface BulkOperationError<T = any> {
  item: T;
  error: ApiError;
  index: number;
}

// File upload request
export interface FileUploadRequest {
  file: File;
  filename?: string;
  folder?: string;
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
}

// File upload response
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  uploadedAt: string;
}

// Export request
export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  filters?: Record<string, any>;
  fields?: string[];
  filename?: string;
  options?: Record<string, any>;
}

// Export response
export interface ExportResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  filename: string;
  size?: number;
  progress?: number;
  error?: string;
  createdAt: string;
  expiresAt?: string;
}

// Import request
export interface ImportRequest {
  file: File;
  mapping?: Record<string, string>;
  options?: {
    skipHeader?: boolean;
    delimiter?: string;
    encoding?: string;
    validateOnly?: boolean;
  };
}

// Import response
export interface ImportResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary?: {
    total: number;
    imported: number;
    skipped: number;
    errors: number;
  };
  errors?: ImportError[];
  progress?: number;
  createdAt: string;
}

// Import error
export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

// WebSocket message structure
export interface WebSocketMessage<T = any> {
  type: string;
  event: string;
  data: T;
  timestamp: string;
  id?: string;
  channel?: string;
}

// Real-time subscription options
export interface SubscriptionOptions {
  channel: string;
  events?: string[];
  filters?: Record<string, any>;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// Cache configuration
export interface CacheConfig {
  key: string;
  ttl?: number; // Time to live in seconds
  tags?: string[];
  invalidateOn?: string[];
}

// Rate limiting information
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// API client configuration
export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
  };
  cache?: {
    enabled: boolean;
    ttl: number;
    storage: 'memory' | 'localStorage' | 'sessionStorage';
  };
  rateLimit?: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

// Request interceptor
export type RequestInterceptor = (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>;

// Response interceptor
export type ResponseInterceptor = (response: BaseApiResponse) => BaseApiResponse | Promise<BaseApiResponse>;

// Hook result interfaces for data fetching
export interface UseDataResult<T> extends AsyncState {
  data: T | null;
  refetch: () => Promise<void>;
  mutate: (data: Partial<T>) => Promise<void>;
  invalidate: () => void;
}

// Hook result for mutations
export interface UseMutationResult<T, V = any> extends AsyncState {
  mutate: (variables: V) => Promise<T>;
  reset: () => void;
  data: T | null;
}

// Hook result for subscriptions
export interface UseSubscriptionResult<T> extends AsyncState {
  data: T | null;
  subscribe: (options: SubscriptionOptions) => void;
  unsubscribe: () => void;
  isConnected: boolean;
}

// Hook result for paginated data
export interface UsePaginatedDataResult<T> extends UseDataResult<T[]> {
  pagination: PaginationMeta | null;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
}

// Hook result for infinite scroll
export interface UseInfiniteDataResult<T> extends AsyncState {
  data: T[];
  fetchNextPage: () => Promise<void>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  refetch: () => Promise<void>;
}

// Search result structure
export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  suggestions?: string[];
  facets?: SearchFacet[];
  took: number; // Search time in milliseconds
}

// Search facet
export interface SearchFacet {
  field: string;
  values: SearchFacetValue[];
}

// Search facet value
export interface SearchFacetValue {
  value: string;
  count: number;
  selected?: boolean;
}

// Autocomplete result
export interface AutocompleteResult<T = any> {
  value: T;
  label: string;
  description?: string;
  category?: string;
  icon?: string;
  metadata?: Record<string, any>;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
}

// Individual health check
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}

// API metrics
export interface ApiMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  endpoints: EndpointMetric[];
  errors: ErrorMetric[];
  timestamp: string;
}

// Endpoint metric
export interface EndpointMetric {
  path: string;
  method: HttpMethod;
  requests: number;
  averageResponseTime: number;
  errorRate: number;
}

// Error metric
export interface ErrorMetric {
  code: string;
  count: number;
  percentage: number;
  lastOccurrence: string;
}

// Common API response types
export type CreateResponse<T> = BaseApiResponse<T>;
export type UpdateResponse<T> = BaseApiResponse<T>;
export type DeleteResponse = BaseApiResponse<{ deleted: boolean; id: ID }>;
export type ListResponse<T> = PaginatedResponse<T>;
export type DetailResponse<T> = BaseApiResponse<T>;

// Common error codes
export const API_ERROR_CODES = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  
  // Custom errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  TIMEOUT: 504,
} as const;
