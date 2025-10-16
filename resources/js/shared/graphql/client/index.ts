/**
 * GraphQL Client Configuration
 * Centralized Apollo Client setup with enhanced features
 */

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';

// Create HTTP link
const httpLink = createHttpLink({
  uri: '/api/graphql',
  credentials: 'same-origin',
});

// Authentication link
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth_token');
  const organizationId = localStorage.getItem('organization_id');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-organization-id': organizationId || '',
      'x-requested-with': 'XMLHttpRequest',
    }
  };
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`);
    
    // Handle authentication errors
    if (networkError.statusCode === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('organization_id');
      window.location.href = '/login';
    }
  }
});

// Retry link for failed requests
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => !!error
  }
});

// Cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Account: {
      fields: {
        children: {
          merge(existing = [], incoming) {
            return incoming;
          }
        },
        transactions: {
          keyArgs: ['accountId'],
          merge(existing = { data: [], paginatorInfo: {} }, incoming) {
            return {
              ...incoming,
              data: [...existing.data, ...incoming.data]
            };
          }
        }
      }
    },
    Organization: {
      fields: {
        accounts: {
          merge(existing = [], incoming) {
            return incoming;
          }
        }
      }
    },
    Query: {
      fields: {
        accounts: {
          keyArgs: ['organizationId', 'type', 'parentId'],
          merge(existing = [], incoming) {
            return incoming;
          }
        }
      }
    }
  }
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([
    errorLink,
    retryLink,
    authLink,
    httpLink
  ]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network'
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first'
    },
    mutate: {
      errorPolicy: 'all'
    }
  },
  connectToDevTools: process.env.NODE_ENV === 'development'
});

// Export client instance
export default apolloClient;
