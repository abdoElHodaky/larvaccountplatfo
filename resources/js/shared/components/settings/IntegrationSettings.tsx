/**
 * Integration Settings Component
 * Manage third-party integrations and API connections
 */

import React, { useState } from 'react';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  icon: string;
  category: 'accounting' | 'payment' | 'banking' | 'crm' | 'other';
  lastSync?: string;
  config?: Record<string, any>;
}

interface IntegrationSettingsProps {
  integrations?: Integration[];
  onConnect?: (integrationId: string, config: Record<string, any>) => void;
  onDisconnect?: (integrationId: string) => void;
  onSync?: (integrationId: string) => void;
  className?: string;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  integrations = [],
  onConnect,
  onDisconnect,
  onSync,
  className = ''
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, any>>({});

  const defaultIntegrations: Integration[] = [
    {
      id: '1',
      name: 'QuickBooks Online',
      description: 'Sync transactions and accounts with QuickBooks Online',
      status: 'connected',
      icon: '📊',
      category: 'accounting',
      lastSync: '2023-12-01T10:30:00Z',
      config: { apiKey: '***', companyId: 'QB123' }
    },
    {
      id: '2',
      name: 'Stripe',
      description: 'Process payments and sync transaction data',
      status: 'connected',
      icon: '💳',
      category: 'payment',
      lastSync: '2023-12-01T09:15:00Z',
      config: { publishableKey: 'pk_***', webhookUrl: 'https://app.com/webhook' }
    },
    {
      id: '3',
      name: 'Bank of America',
      description: 'Import bank transactions automatically',
      status: 'disconnected',
      icon: '🏦',
      category: 'banking',
      config: {}
    },
    {
      id: '4',
      name: 'Salesforce',
      description: 'Sync customer data and invoices',
      status: 'error',
      icon: '☁️',
      category: 'crm',
      lastSync: '2023-11-30T14:20:00Z',
      config: { instanceUrl: 'https://company.salesforce.com', clientId: 'SF123' }
    },
    {
      id: '5',
      name: 'Slack',
      description: 'Send notifications and alerts to Slack channels',
      status: 'disconnected',
      icon: '💬',
      category: 'other',
      config: {}
    }
  ];

  const displayIntegrations = integrations.length > 0 ? integrations : defaultIntegrations;

  const categories = [
    { id: 'all', label: 'All Integrations' },
    { id: 'accounting', label: 'Accounting' },
    { id: 'payment', label: 'Payments' },
    { id: 'banking', label: 'Banking' },
    { id: 'crm', label: 'CRM' },
    { id: 'other', label: 'Other' }
  ];

  const filteredIntegrations = activeCategory === 'all' 
    ? displayIntegrations 
    : displayIntegrations.filter(integration => integration.category === activeCategory);

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigForm(integration.config || {});
    setShowConfigModal(true);
  };

  const handleSaveConfig = () => {
    if (selectedIntegration) {
      onConnect?.(selectedIntegration.id, configForm);
      setShowConfigModal(false);
      setSelectedIntegration(null);
      setConfigForm({});
    }
  };

  const handleDisconnect = (integration: Integration) => {
    if (confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      onDisconnect?.(integration.id);
    }
  };

  const getStatusBadge = (status: Integration['status']) => {
    const colors = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getConfigFields = (integration: Integration) => {
    const commonFields = {
      'QuickBooks Online': [
        { key: 'apiKey', label: 'API Key', type: 'password' },
        { key: 'companyId', label: 'Company ID', type: 'text' }
      ],
      'Stripe': [
        { key: 'publishableKey', label: 'Publishable Key', type: 'text' },
        { key: 'secretKey', label: 'Secret Key', type: 'password' },
        { key: 'webhookUrl', label: 'Webhook URL', type: 'url' }
      ],
      'Bank of America': [
        { key: 'username', label: 'Username', type: 'text' },
        { key: 'password', label: 'Password', type: 'password' },
        { key: 'accountNumber', label: 'Account Number', type: 'text' }
      ],
      'Salesforce': [
        { key: 'instanceUrl', label: 'Instance URL', type: 'url' },
        { key: 'clientId', label: 'Client ID', type: 'text' },
        { key: 'clientSecret', label: 'Client Secret', type: 'password' }
      ],
      'Slack': [
        { key: 'webhookUrl', label: 'Webhook URL', type: 'url' },
        { key: 'channel', label: 'Default Channel', type: 'text' }
      ]
    };
    return commonFields[integration.name as keyof typeof commonFields] || [];
  };

  return (
    <div className={`integration-settings ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Integration Settings</h3>
          <p className="text-sm text-gray-600 mt-1">
            Connect and manage third-party integrations for your accounting platform
          </p>
        </div>

        {/* Category Filter */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeCategory === category.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {category.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map(integration => (
              <div key={integration.id} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{integration.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{integration.name}</h4>
                      <span className={getStatusBadge(integration.status)}>
                        {integration.status}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

                {integration.lastSync && (
                  <p className="text-xs text-gray-500 mb-4">
                    Last sync: {formatDate(integration.lastSync)}
                  </p>
                )}

                <div className="flex space-x-2">
                  {integration.status === 'connected' ? (
                    <>
                      <button
                        onClick={() => onSync?.(integration.id)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Sync Now
                      </button>
                      <button
                        onClick={() => handleConnect(integration)}
                        className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => handleDisconnect(integration)}
                        className="px-3 py-2 text-sm text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration)}
                      className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {integration.status === 'error' && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                    Connection error. Please check your configuration and try again.
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredIntegrations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔌</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations found</h3>
              <p className="text-gray-600">
                No integrations available for the selected category.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">{selectedIntegration.icon}</span>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Configure {selectedIntegration.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Enter your connection details
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {getConfigFields(selectedIntegration).map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={configForm[field.key] || ''}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        [field.key]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}

                {getConfigFields(selectedIntegration).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No configuration required for this integration.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    setSelectedIntegration(null);
                    setConfigForm({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  {selectedIntegration.status === 'connected' ? 'Update' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationSettings;
