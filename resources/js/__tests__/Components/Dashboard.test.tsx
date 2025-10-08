import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import Dashboard from '../../Pages/Dashboard';
import theme from '../../theme';

// Mock the Inertia hooks
vi.mock('@inertiajs/react', () => ({
  usePage: () => ({
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

describe('Dashboard Component', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );
    
    // Check if the main dashboard container is rendered
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays welcome message', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );
    
    // Look for welcome text or dashboard title
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('renders metrics cards section', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );
    
    // Check for metrics or stats section
    const metricsSection = screen.getByTestId('metrics-section') || 
                          screen.getByText(/metrics/i) ||
                          screen.getByText(/overview/i);
    expect(metricsSection).toBeInTheDocument();
  });
});
