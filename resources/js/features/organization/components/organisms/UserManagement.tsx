import React, { Fragment, memo, useMemo, useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  Badge,
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Alert,
  AlertIcon,
  Flex,
  Spacer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiMoreVertical,
  FiShield
} from 'react-icons/fi';
import { CardContainer } from '@/shared/components/molecules/Container';
import { useMemoizedCallback } from '@/shared/hooks';

/**
 * User Management Component
 * Comprehensive user administration with roles, permissions, and team management
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'accountant' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  avatar?: string;
  permissions: string[];
  createdAt: Date;
}

export interface UserManagementProps {
  users?: User[];
  onUserCreate?: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  onUserUpdate?: (id: string, user: Partial<User>) => Promise<void>;
  onUserDelete?: (id: string) => Promise<void>;
  onRoleChange?: (id: string, role: User['role']) => Promise<void>;
  loading?: boolean;
  canManageUsers?: boolean;
}

const ROLE_COLORS = {
  admin: 'red',
  manager: 'blue',
  accountant: 'green',
  viewer: 'gray',
} as const;

const ROLE_PERMISSIONS = {
  admin: ['all'],
  manager: ['users.view', 'users.create', 'users.edit', 'reports.view', 'reports.create'],
  accountant: ['transactions.view', 'transactions.create', 'reports.view'],
  viewer: ['dashboard.view', 'reports.view'],
} as const;

export const UserManagement = memo<UserManagementProps>(({
  users = [],
  onUserCreate,
  onUserUpdate,
  onUserDelete,
  onRoleChange,
  loading = false,
  canManageUsers = true,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'viewer' as User['role'],
    status: 'active' as User['status'],
  });
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const toast = useToast();



  const handleCreateUser = useMemoizedCallback(async () => {
    if (!onUserCreate) return;
    
    try {
      await onUserCreate({
        ...formData,
        permissions: ROLE_PERMISSIONS[formData.role],
      });
      
      toast({
        title: 'User created successfully',
        status: 'success',
        duration: 3000,
      });
      
      setFormData({ name: '', email: '', role: 'viewer', status: 'active' });
      onCreateClose();
    } catch (error) {
      toast({
        title: 'Failed to create user',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  }, [formData, onUserCreate, toast, onCreateClose]);

  const handleEditUser = useMemoizedCallback(async () => {
    if (!selectedUser || !onUserUpdate) return;
    
    try {
      await onUserUpdate(selectedUser.id, formData);
      
      toast({
        title: 'User updated successfully',
        status: 'success',
        duration: 3000,
      });
      
      onEditClose();
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Failed to update user',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  }, [selectedUser, formData, onUserUpdate, toast, onEditClose]);

  const handleDeleteUser = useMemoizedCallback(async (userId: string) => {
    if (!onUserDelete) return;
    
    try {
      await onUserDelete(userId);
      toast({
        title: 'User deleted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to delete user',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  }, [onUserDelete, toast]);



  const openEditModal = useMemoizedCallback((user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    onEditOpen();
  }, [onEditOpen]);

  const userStats = useMemo(() => {
    const stats = {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      pending: users.filter(u => u.status === 'pending').length,
      byRole: {} as Record<User['role'], number>,
    };
    
    users.forEach(user => {
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
    });
    
    return stats;
  }, [users]);

  if (!canManageUsers) {
    return (
      <CardContainer>
        <Alert status="warning">
          <AlertIcon />
          You don't have permission to manage users.
        </Alert>
      </CardContainer>
    );
  }

  return (
    <Fragment>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center">
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold">
              User Management
            </Text>
            <Text color="gray.500">
              Manage team members, roles, and permissions
            </Text>
          </VStack>
          <Spacer />
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={onCreateOpen}
            isLoading={loading}
          >
            Add User
          </Button>
        </Flex>

        {/* Stats Cards */}
        <HStack spacing={4}>
          <CardContainer flex={1}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {userStats.total}
              </Text>
              <Text fontSize="sm" color="gray.500">Total Users</Text>
            </VStack>
          </CardContainer>
          <CardContainer flex={1}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {userStats.active}
              </Text>
              <Text fontSize="sm" color="gray.500">Active</Text>
            </VStack>
          </CardContainer>
          <CardContainer flex={1}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                {userStats.pending}
              </Text>
              <Text fontSize="sm" color="gray.500">Pending</Text>
            </VStack>
          </CardContainer>
        </HStack>

        {/* Users Table */}
        <CardContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Last Login</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <HStack>
                      <Avatar size="sm" name={user.name} src={user.avatar} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{user.name}</Text>
                        <Text fontSize="sm" color="gray.500">{user.email}</Text>
                      </VStack>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={ROLE_COLORS[user.role]} variant="subtle">
                      {user.role}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge 
                      colorScheme={user.status === 'active' ? 'green' : user.status === 'pending' ? 'orange' : 'red'}
                      variant="subtle"
                    >
                      {user.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm" color="gray.500">
                      {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}
                    </Text>
                  </Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList>
                        <MenuItem icon={<FiEdit2 />} onClick={() => openEditModal(user)}>
                          Edit User
                        </MenuItem>
                        <MenuItem icon={<FiShield />}>
                          Change Role
                        </MenuItem>
                        <MenuItem 
                          icon={<FiTrash2 />} 
                          color="red.500"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete User
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContainer>
      </VStack>

      {/* Create User Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter user name"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                >
                  <option value="viewer">Viewer</option>
                  <option value="accountant">Accountant</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as User['status'] }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateUser} isLoading={loading}>
              Create User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter user name"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                >
                  <option value="viewer">Viewer</option>
                  <option value="accountant">Accountant</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as User['status'] }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleEditUser} isLoading={loading}>
              Update User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Fragment>
  );
});

UserManagement.displayName = 'UserManagement';

export default UserManagement;
