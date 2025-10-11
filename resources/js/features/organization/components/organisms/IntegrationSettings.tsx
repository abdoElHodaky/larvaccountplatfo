import React, { Fragment, memo, useMemo, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Badge,
  useColorModeValue,
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
  Textarea,
  Switch,
  Alert,
  AlertIcon,
  Flex,
  Spacer,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiCheck,
  FiRefreshCw
} from 'react-icons/fi';
import { CardContainer } from '@/shared/components/molecules/Container';
import { useMemoizedCallback } from '@/shared/hooks';

/**
 * Integration Settings Component
 * Manage third-party API integrations, webhooks, and external services
 */

export interface Integration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'oauth' | 'database';
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  description: string;
  icon?: string;
  config: Record<string, any>;
  lastSync?: Date;
  createdAt: Date;
  webhookUrl?: string;
  apiKey?: string;
  isEnabled: boolean;
}

export interface IntegrationSettingsProps {
  integrations?: Integration[];
  onIntegrationCreate?: (integration: Omit<Integration, 'id' | 'createdAt'>) => Promise<void>;
  onIntegrationUpdate?: (id: string, integration: Partial<Integration>) => Promise<void>;
  onIntegrationDelete?: (id: string) => Promise<void>;
  onIntegrationTest?: (id: string) => Promise<boolean>;
  onIntegrationSync?: (id: string) => Promise<void>;
  loading?: boolean;
  canManageIntegrations?: boolean;
}

const INTEGRATION_TYPES = [
  { value: 'api', label: 'REST API', description: 'Connect to external REST APIs' },
  { value: 'webhook', label: 'Webhook', description: 'Receive real-time notifications' },
  { value: 'oauth', label: 'OAuth', description: 'Secure third-party authentication' },
  { value: 'database', label: 'Database', description: 'Direct database connections' },
] as const;

const POPULAR_PROVIDERS = [
  { name: 'QuickBooks', type: 'api', icon: '/icons/quickbooks.png' },
  { name: 'Xero', type: 'api', icon: '/icons/xero.png' },
  { name: 'Stripe', type: 'webhook', icon: '/icons/stripe.png' },
  { name: 'PayPal', type: 'api', icon: '/icons/paypal.png' },
  { name: 'Slack', type: 'webhook', icon: '/icons/slack.png' },
  { name: 'Microsoft Graph', type: 'oauth', icon: '/icons/microsoft.png' },
] as const;

const STATUS_COLORS = {
  active: 'green',
  inactive: 'gray',
  error: 'red',
  pending: 'orange',
} as const;

export const IntegrationSettings = memo<IntegrationSettingsProps>(({
  integrations = [],
  onIntegrationCreate,
  onIntegrationUpdate,
  onIntegrationDelete,
  onIntegrationTest,
  onIntegrationSync,
  loading = false,
  canManageIntegrations = true,
}) => {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'api' as Integration['type'],
    provider: '',
    description: '',
    config: {},
    webhookUrl: '',
    apiKey: '',
    isEnabled: true,
  });
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleCreateIntegration = useMemoizedCallback(async () => {
    if (!onIntegrationCreate) return;
    
    try {
      await onIntegrationCreate({
        ...formData,
        status: 'pending',
      });
      
      toast({
        title: 'Integration created successfully',
        status: 'success',
        duration: 3000,
      });
      
      setFormData({
        name: '',
        type: 'api',
        provider: '',
        description: '',
        config: {},
        webhookUrl: '',
        apiKey: '',
        isEnabled: true,
      });
      onCreateClose();
    } catch (error) {
      toast({
        title: 'Failed to create integration',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  }, [formData, onIntegrationCreate, toast, onCreateClose]);

  const handleEditIntegration = useMemoizedCallback(async () => {
    if (!selectedIntegration || !onIntegrationUpdate) return;
    
    try {
      await onIntegrationUpdate(selectedIntegration.id, formData);
      
      toast({
        title: 'Integration updated successfully',
        status: 'success',
        duration: 3000,
      });
      
      onEditClose();
      setSelectedIntegration(null);
    } catch (error) {
      toast({
        title: 'Failed to update integration',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  }, [selectedIntegration, formData, onIntegrationUpdate, toast, onEditClose]);

  const handleDeleteIntegration = useMemoizedCallback(async (integrationId: string) => {
    if (!onIntegrationDelete) return;
    
    try {
      await onIntegrationDelete(integrationId);
      toast({
        title: 'Integration deleted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to delete integration',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  }, [onIntegrationDelete, toast]);

  const handleTestIntegration = useMemoizedCallback(async (integrationId: string) => {
    if (!onIntegrationTest) return;
    
    try {
      const success = await onIntegrationTest(integrationId);
      toast({
        title: success ? 'Integration test successful' : 'Integration test failed',
        status: success ? 'success' : 'error',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Integration test failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  }, [onIntegrationTest, toast]);

  const handleSyncIntegration = useMemoizedCallback(async (integrationId: string) => {
    if (!onIntegrationSync) return;
    
    try {
      await onIntegrationSync(integrationId);
      toast({
        title: 'Integration sync started',
        status: 'info',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to sync integration',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  }, [onIntegrationSync, toast]);

  const openEditModal = useMemoizedCallback((integration: Integration) => {
    setSelectedIntegration(integration);
    setFormData({
      name: integration.name,
      type: integration.type,
      provider: integration.provider,
      description: integration.description,
      config: integration.config,
      webhookUrl: integration.webhookUrl || '',
      apiKey: integration.apiKey || '',
      isEnabled: integration.isEnabled,
    });
    onEditOpen();
  }, [onEditOpen]);

  const integrationStats = useMemo(() => {
    const stats = {
      total: integrations.length,
      active: integrations.filter(i => i.status === 'active').length,
      error: integrations.filter(i => i.status === 'error').length,
      byType: {} as Record<Integration['type'], number>,
    };
    
    integrations.forEach(integration => {
      stats.byType[integration.type] = (stats.byType[integration.type] || 0) + 1;
    });
    
    return stats;
  }, [integrations]);

  if (!canManageIntegrations) {
    return (
      <CardContainer>
        <Alert status="warning">
          <AlertIcon />
          You don't have permission to manage integrations.
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
              Integration Settings
            </Text>
            <Text color="gray.500">
              Manage third-party integrations and API connections
            </Text>
          </VStack>
          <Spacer />
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={onCreateOpen}
            isLoading={loading}
          >
            Add Integration
          </Button>
        </Flex>

        {/* Stats Cards */}
        <HStack spacing={4}>
          <CardContainer flex={1}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {integrationStats.total}
              </Text>
              <Text fontSize="sm" color="gray.500">Total Integrations</Text>
            </VStack>
          </CardContainer>
          <CardContainer flex={1}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {integrationStats.active}
              </Text>
              <Text fontSize="sm" color="gray.500">Active</Text>
            </VStack>
          </CardContainer>
          <CardContainer flex={1}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="red.500">
                {integrationStats.error}
              </Text>
              <Text fontSize="sm" color="gray.500">Errors</Text>
            </VStack>
          </CardContainer>
        </HStack>

        {/* Popular Integrations */}
        <CardContainer>
          <VStack align="stretch" spacing={4}>
            <Text fontSize="lg" fontWeight="semibold">Popular Integrations</Text>
            <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
              {POPULAR_PROVIDERS.map((provider) => (
                <VStack
                  key={provider.name}
                  p={4}
                  borderRadius="md"
                  border="1px"
                  borderColor={borderColor}
                  cursor="pointer"
                  _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, provider: provider.name, type: provider.type }));
                    onCreateOpen();
                  }}
                >
                  <Box w={8} h={8} bg="gray.200" borderRadius="md" />
                  <Text fontSize="sm" fontWeight="medium" textAlign="center">
                    {provider.name}
                  </Text>
                </VStack>
              ))}
            </SimpleGrid>
          </VStack>
        </CardContainer>

        {/* Integrations List */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
          {integrations.map((integration) => (
            <CardContainer key={integration.id}>
              <VStack align="stretch" spacing={3}>
                <Flex align="center">
                  <HStack>
                    <Box w={8} h={8} bg="gray.200" borderRadius="md" />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="semibold">{integration.name}</Text>
                      <Text fontSize="sm" color="gray.500">{integration.provider}</Text>
                    </VStack>
                  </HStack>
                  <Spacer />
                  <Badge colorScheme={STATUS_COLORS[integration.status]} variant="subtle">
                    {integration.status}
                  </Badge>
                </Flex>

                <Text fontSize="sm" color="gray.600">
                  {integration.description}
                </Text>

                <HStack>
                  <Badge variant="outline">{integration.type}</Badge>
                  {integration.lastSync && (
                    <Text fontSize="xs" color="gray.500">
                      Last sync: {integration.lastSync.toLocaleDateString()}
                    </Text>
                  )}
                </HStack>

                <Divider />

                <HStack spacing={2}>
                  <Switch
                    size="sm"
                    isChecked={integration.isEnabled}
                    onChange={(e) => onIntegrationUpdate?.(integration.id, { isEnabled: e.target.checked })}
                  />
                  <Text fontSize="sm">Enabled</Text>
                  <Spacer />
                  <IconButton
                    icon={<FiRefreshCw />}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSyncIntegration(integration.id)}
                    title="Sync"
                  />
                  <IconButton
                    icon={<FiCheck />}
                    size="sm"
                    variant="ghost"
                    colorScheme="green"
                    onClick={() => handleTestIntegration(integration.id)}
                    title="Test Connection"
                  />
                  <IconButton
                    icon={<FiEdit2 />}
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(integration)}
                    title="Edit"
                  />
                  <IconButton
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDeleteIntegration(integration.id)}
                    title="Delete"
                  />
                </HStack>
              </VStack>
            </CardContainer>
          ))}
        </SimpleGrid>
      </VStack>

      {/* Create Integration Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Integration</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Tabs>
              <TabList>
                <Tab>Basic Info</Tab>
                <Tab>Configuration</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Integration Name</FormLabel>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter integration name"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Provider</FormLabel>
                      <Input
                        value={formData.provider}
                        onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                        placeholder="e.g., QuickBooks, Stripe, Xero"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Type</FormLabel>
                      <SimpleGrid columns={2} spacing={2}>
                        {INTEGRATION_TYPES.map((type) => (
                          <Box
                            key={type.value}
                            p={3}
                            borderRadius="md"
                            border="2px"
                            borderColor={formData.type === type.value ? 'blue.500' : borderColor}
                            cursor="pointer"
                            onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                          >
                            <Text fontWeight="medium">{type.label}</Text>
                            <Text fontSize="sm" color="gray.500">{type.description}</Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this integration does"
                      />
                    </FormControl>
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <VStack spacing={4}>
                    {formData.type === 'webhook' && (
                      <FormControl>
                        <FormLabel>Webhook URL</FormLabel>
                        <Input
                          value={formData.webhookUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                          placeholder="https://your-app.com/webhook"
                        />
                      </FormControl>
                    )}
                    {(formData.type === 'api' || formData.type === 'oauth') && (
                      <FormControl>
                        <FormLabel>API Key</FormLabel>
                        <Input
                          type="password"
                          value={formData.apiKey}
                          onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                          placeholder="Enter API key or token"
                        />
                      </FormControl>
                    )}
                    <FormControl>
                      <FormLabel>Enable Integration</FormLabel>
                      <Switch
                        isChecked={formData.isEnabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, isEnabled: e.target.checked }))}
                      />
                    </FormControl>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateIntegration} isLoading={loading}>
              Create Integration
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Integration Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Integration</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Integration Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter integration name"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this integration does"
                />
              </FormControl>
              {formData.type === 'webhook' && (
                <FormControl>
                  <FormLabel>Webhook URL</FormLabel>
                  <Input
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://your-app.com/webhook"
                  />
                </FormControl>
              )}
              {(formData.type === 'api' || formData.type === 'oauth') && (
                <FormControl>
                  <FormLabel>API Key</FormLabel>
                  <Input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter API key or token"
                  />
                </FormControl>
              )}
              <FormControl>
                <FormLabel>Enable Integration</FormLabel>
                <Switch
                  isChecked={formData.isEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, isEnabled: e.target.checked }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleEditIntegration} isLoading={loading}>
              Update Integration
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Fragment>
  );
});

IntegrationSettings.displayName = 'IntegrationSettings';

export default IntegrationSettings;
