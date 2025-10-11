/**
 * MSW (Mock Service Worker) Request Handlers
 * Phase 9: Testing Infrastructure - Updated for MSW 2.x
 */

import { http, graphql, HttpResponse } from 'msw';

// REST API Handlers
export const restHandlers = [
  // Authentication endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
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
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      user: {
        id: 2,
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user',
      },
      token: 'mock-jwt-token-new',
    });
  }),

  http.get('/api/auth/user', () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
    });
  }),

  // Accounting endpoints
  http.get('/api/accounts', () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          code: '1000',
          name: 'Cash',
          type: 'asset',
          balance: 10000,
          isActive: true,
        },
        {
          id: 2,
          code: '2000',
          name: 'Accounts Payable',
          type: 'liability',
          balance: 5000,
          isActive: true,
        },
      ],
      meta: {
        total: 2,
        per_page: 10,
        current_page: 1,
      },
    });
  }),

  http.post('/api/accounts', () => {
    return HttpResponse.json({
      id: 3,
      code: '3000',
      name: 'New Account',
      type: 'asset',
      balance: 0,
      isActive: true,
    }, { status: 201 });
  }),

  http.get('/api/transactions', () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          date: '2023-01-01',
          description: 'Test Transaction',
          amount: 100,
          type: 'debit',
          account_id: 1,
        },
      ],
      meta: {
        total: 1,
        per_page: 10,
        current_page: 1,
      },
    });
  }),

  http.post('/api/transactions', () => {
    return HttpResponse.json({
      id: 2,
      date: '2023-01-02',
      description: 'New Transaction',
      amount: 200,
      type: 'credit',
      account_id: 1,
    }, { status: 201 });
  }),

  // Reports endpoints
  http.get('/api/reports/balance-sheet', () => {
    return HttpResponse.json({
      assets: {
        current: 15000,
        fixed: 25000,
        total: 40000,
      },
      liabilities: {
        current: 8000,
        longTerm: 12000,
        total: 20000,
      },
      equity: {
        total: 20000,
      },
    });
  }),

  http.get('/api/reports/income-statement', () => {
    return HttpResponse.json({
      revenue: 50000,
      expenses: 30000,
      netIncome: 20000,
      period: '2023-01-01 to 2023-12-31',
    });
  }),

  // Error handling
  http.get('/api/error-test', () => {
    return HttpResponse.json(
      { error: 'Test error' },
      { status: 500 }
    );
  }),
];

// GraphQL Handlers
export const graphqlHandlers = [
  graphql.query('GetAccounts', () => {
    return HttpResponse.json({
      data: {
        accounts: [
          {
            id: '1',
            code: '1000',
            name: 'Cash',
            type: 'ASSET',
            balance: 10000,
          },
        ],
      },
    });
  }),

  graphql.mutation('CreateAccount', () => {
    return HttpResponse.json({
      data: {
        createAccount: {
          id: '2',
          code: '2000',
          name: 'New Account',
          type: 'ASSET',
          balance: 0,
        },
      },
    });
  }),
];

// Combined handlers
export const handlers = [...restHandlers, ...graphqlHandlers];

