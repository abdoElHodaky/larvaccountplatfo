/**
 * MSW (Mock Service Worker) Request Handlers
 * Phase 9: Testing Infrastructure
 */

import { http, graphql } from 'msw';

// REST API Handlers
export const restHandlers = [
  // Authentication endpoints
  http.post('/api/auth/login', () => {
    return Response.json({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
        },
        token: 'mock-jwt-token',
      });
  }),

  http.post('/api/auth/logout', () => {
    return Response.json({ success: true });
  }),

  // Accounting endpoints
  http.get('/api/accounting/accounts', () => {
    return Response.json({
      data: [
        {
          id: '1',
          name: 'Cash',
          type: 'asset',
          balance: 10000,
          code: '1000',
        },
        {
          id: '2',
          name: 'Accounts Receivable',
          type: 'asset',
          balance: 5000,
          code: '1200',
        },
      ],
    });
  }),

  http.get('/api/accounting/transactions', () => {
    return Response.json({
      data: [
        {
          id: '1',
          date: '2024-01-01',
          description: 'Test Transaction',
          amount: 100,
          type: 'debit',
          accountId: '1',
        },
      ],
    });
  }),

  // Reporting endpoints
  http.get('/api/reports/financial', () => {
    return Response.json({
      data: {
        revenue: 50000,
        expenses: 30000,
        profit: 20000,
        chartData: [
          { month: 'Jan', revenue: 4000, expenses: 2400 },
          { month: 'Feb', revenue: 3000, expenses: 1398 },
          { month: 'Mar', revenue: 2000, expenses: 9800 },
        ],
      },
    });
  }),
];

// GraphQL Handlers
export const graphqlHandlers = [
  // User queries
  graphql.query('GetCurrentUser', () => {
    return Response.json({
      data: {
        currentUser: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: true,
          },
        },
      }
    });
  }),

  // Accounting queries
  graphql.query('GetChartOfAccounts', () => {
    return Response.json({
      data: {
        chartOfAccounts: [
          {
            id: '1',
            name: 'Cash',
            type: 'ASSET',
            balance: 10000,
            code: '1000',
            parentId: null,
          },
          {
            id: '2',
            name: 'Accounts Receivable',
            type: 'ASSET',
            balance: 5000,
            code: '1200',
            parentId: null,
          },
        ],
      }
    });
  }),

  graphql.query('GetTransactions', () => {
    return Response.json({
      data: {
        transactions: {
          edges: [
            {
              node: {
                id: '1',
                date: '2024-01-01',
                description: 'Test Transaction',
                amount: 100,
                type: 'DEBIT',
                account: {
                  id: '1',
                  name: 'Cash',
                },
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      }
    });
  }),

  // Mutations
  graphql.mutation('UpdateUserPreferences', ({ variables }) => {
    return Response.json({
      data: {
        updateUserPreferences: {
          id: '1',
          preferences: variables.preferences,
        },
      }
    });
  }),

  graphql.mutation('ReconcileTransactions', ({ variables }) => {
    return Response.json({
      data: {
        reconcileTransactions: {
          success: true,
          reconciledCount: variables.transactionIds.length,
          errors: [],
        },
      }
    });
  }),
];

// Combined handlers
export const handlers = [...restHandlers, ...graphqlHandlers];
