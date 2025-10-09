import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import UserManagement, { User } from '@/features/organization/components/organisms/UserManagement';

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    permissions: ['all'],
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'accountant',
    status: 'active',
    permissions: ['transactions.view', 'reports.view'],
    createdAt: new Date('2024-01-02'),
  },
];

// Test wrapper with ChakraProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider>{children}</ChakraProvider>
);

describe('UserManagement', () => {
  it('renders user management interface', () => {
    render(
      <TestWrapper>
        <UserManagement users={mockUsers} canManageUsers={true} />
      </TestWrapper>
    );

    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Manage team members, roles, and permissions')).toBeInTheDocument();
    expect(screen.getByText('Add User')).toBeInTheDocument();
  });

  it('displays user statistics correctly', () => {
    render(
      <TestWrapper>
        <UserManagement users={mockUsers} canManageUsers={true} />
      </TestWrapper>
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    // Check that the number 2 appears (indicating 2 users)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  it('displays users in table format', () => {
    render(
      <TestWrapper>
        <UserManagement users={mockUsers} canManageUsers={true} />
      </TestWrapper>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('shows permission warning when user cannot manage users', () => {
    render(
      <TestWrapper>
        <UserManagement users={mockUsers} canManageUsers={false} />
      </TestWrapper>
    );

    expect(screen.getByText("You don't have permission to manage users.")).toBeInTheDocument();
  });

  it('opens create user modal when Add User button is clicked', async () => {
    render(
      <TestWrapper>
        <UserManagement users={mockUsers} canManageUsers={true} />
      </TestWrapper>
    );

    const addButton = screen.getByText('Add User');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument();
    });
  });

  it('calls onUserCreate when form is submitted', async () => {
    const mockOnUserCreate = vi.fn().mockResolvedValue(undefined);
    
    render(
      <TestWrapper>
        <UserManagement 
          users={mockUsers} 
          canManageUsers={true}
          onUserCreate={mockOnUserCreate}
        />
      </TestWrapper>
    );

    // Open modal
    fireEvent.click(screen.getByText('Add User'));

    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument();
    });

    // Fill form
    const nameInput = screen.getByPlaceholderText('Enter user name');
    const emailInput = screen.getByPlaceholderText('Enter email address');
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Submit form
    const createButton = screen.getByRole('button', { name: 'Create User' });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnUserCreate).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        role: 'viewer',
        status: 'active',
        permissions: ['dashboard.view', 'reports.view'],
      });
    });
  });

  it('displays user roles with correct badges', () => {
    render(
      <TestWrapper>
        <UserManagement users={mockUsers} canManageUsers={true} />
      </TestWrapper>
    );

    // Check for role badges
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('accountant')).toBeInTheDocument();
  });

  it('displays user status correctly', () => {
    render(
      <TestWrapper>
        <UserManagement users={mockUsers} canManageUsers={true} />
      </TestWrapper>
    );

    // Both users are active
    const activeStatuses = screen.getAllByText('active');
    expect(activeStatuses).toHaveLength(2);
  });

  it('handles loading state', () => {
    render(
      <TestWrapper>
        <UserManagement users={mockUsers} canManageUsers={true} loading={true} />
      </TestWrapper>
    );

    // Check that the component renders even in loading state
    expect(screen.getByText('User Management')).toBeInTheDocument();
    // The Add User button might be disabled or have different behavior when loading
    const addButton = screen.getByText('Add User');
    expect(addButton).toBeInTheDocument();
  });
});
