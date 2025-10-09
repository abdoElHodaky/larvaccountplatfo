import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import Dashboard from '../../features/dashboard/pages/Dashboard';
import { extendTheme } from '@chakra-ui/react';

// Create a basic theme for testing
const theme = extendTheme({});

// Mock the Inertia hooks
vi.mock('@inertiajs/react', () => ({
  Head: ({ children }: { children?: React.ReactNode }) => <div data-testid="head">{children}</div>,
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: any }) => 
    <a href={href} {...props}>{children}</a>,
  usePage: () => ({
    url: '/dashboard',
    props: {
      auth: {
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      tenant: {
        id: 1,
        name: 'Test Tenant',
        subscription_status: 'active',
      },
      flash: {},
    },
  }),
}));

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChakraProvider theme={theme}>
    {children}
  </ChakraProvider>
);

// Mock data for Dashboard props
const mockDashboardProps = {
  tenant: {
    id: 1,
    name: 'Test Tenant',
    subdomain: 'test',
    plan: 'basic',
    enabled_modules: ['accounting', 'inventory'],
    settings: { currency: 'USD' }
  },
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
    permissions: ['read', 'write']
  },
  stats: {
    organization: {
      total_users: 5,
      enabled_modules: 2,
      plan: 'basic',
      created_at: '2024-01-01'
    }
  },
  recentActivity: [
    {
      type: 'login',
      user: 'Test User',
      description: 'User logged in',
      timestamp: '2024-01-01T10:00:00Z'
    }
  ],
  quickActions: [
    {
      title: 'Create Invoice',
      description: 'Create a new invoice',
      icon: 'invoice',
      route: '/invoices/create',
      color: 'blue'
    }
  ]
};

describe('Dashboard Component', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <Dashboard {...mockDashboardProps} />
      </TestWrapper>
    );
    
    // Check if the main dashboard container is rendered
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays welcome message', () => {
    render(
      <TestWrapper>
        <Dashboard {...mockDashboardProps} />
      </TestWrapper>
    );
    
    // Look for welcome text with user name
    expect(screen.getByText(/welcome back, test user!/i)).toBeInTheDocument();
  });

  it('renders metrics cards section', () => {
    render(
      <TestWrapper>
        <Dashboard {...mockDashboardProps} />
      </TestWrapper>
    );
    
    // Check for stats cards - look for "Active Modules" text
    expect(screen.getByText(/active modules/i)).toBeInTheDocument();
  });
});
