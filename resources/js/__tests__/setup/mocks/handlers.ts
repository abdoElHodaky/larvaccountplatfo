/**
 * MSW (Mock Service Worker) Request Handlers
 * Phase 9: Testing Infrastructure
 */

import { rest, graphql } from 'msw';

// REST API Handlers
export const restHandlers = [
  // Authentication endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
        },
        token: 'mock-jwt-token',
      })
    );
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }));
  }),

  // Accounting endpoints
  rest.get('/api/accounting/accounts', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
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
      })
    );
  }),

  rest.get('/api/accounting/transactions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
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
      })
    );
  }),

  // Reporting endpoints
  rest.get('/api/reports/financial', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
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
      })
    );
  }),
];

// GraphQL Handlers
export const graphqlHandlers = [
  // User queries
  graphql.query('GetCurrentUser', (req, res, ctx) => {
    return res(
      ctx.data({
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
      })
    );
  }),

  // Accounting queries
  graphql.query('GetChartOfAccounts', (req, res, ctx) => {
    return res(
      ctx.data({
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
      })
    );
  }),

  graphql.query('GetTransactions', (req, res, ctx) => {
    return res(
      ctx.data({
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
      })
    );
  }),

  // Mutations
  graphql.mutation('UpdateUserPreferences', (req, res, ctx) => {
    return res(
      ctx.data({
        updateUserPreferences: {
          id: '1',
          preferences: req.variables.preferences,
        },
      })
    );
  }),

  graphql.mutation('ReconcileTransactions', (req, res, ctx) => {
    return res(
      ctx.data({
        reconcileTransactions: {
          success: true,
          reconciledCount: req.variables.transactionIds.length,
          errors: [],
        },
      })
    );
  }),
];

// Combined handlers
export const handlers = [...restHandlers, ...graphqlHandlers];
