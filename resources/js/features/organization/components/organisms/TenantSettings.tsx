/**
 * Tenant Settings Component
 * Manage tenant-specific configuration and settings
 */

import React, { useState } from 'react';

interface TenantConfig {
  name: string;
  domain: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  fiscalYearStart: string;
  features: {
    multiCurrency: boolean;
    advancedReporting: boolean;
    apiAccess: boolean;
    customBranding: boolean;
  };
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

interface TenantSettingsProps {
  initialConfig?: Partial<TenantConfig>;
  onSave: (config: TenantConfig) => void;
  className?: string;
}

export const TenantSettings: React.FC<TenantSettingsProps> = ({
  initialConfig = {},
  onSave,
  className = ''
}) => {
  const [config, setConfig] = useState<TenantConfig>({
    name: initialConfig.name || '',
    domain: initialConfig.domain || '',
    timezone: initialConfig.timezone || 'UTC',
    currency: initialConfig.currency || 'USD',
    dateFormat: initialConfig.dateFormat || 'MM/DD/YYYY',
    fiscalYearStart: initialConfig.fiscalYearStart || '01-01',
    features: {
      multiCurrency: false,
      advancedReporting: false,
      apiAccess: false,
      customBranding: false,
      ...initialConfig.features
    },
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#6B7280',
      ...initialConfig.branding
    },
    notifications: {
      email: true,
      sms: false,
      push: true,
      ...initialConfig.notifications
    }
  });

  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'branding' | 'notifications'>('general');

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];

  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'
  ];

  const dateFormats = [
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD',
    'DD-MM-YYYY',
    'MM-DD-YYYY'
  ];

  const handleSave = () => {
    onSave(config);
  };

  const updateConfig = (updates: Partial<TenantConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateFeatures = (feature: keyof TenantConfig['features'], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      features: { ...prev.features, [feature]: value }
    }));
  };

  const updateBranding = (updates: Partial<TenantConfig['branding']>) => {
    setConfig(prev => ({
      ...prev,
      branding: { ...prev.branding, ...updates }
    }));
  };

  const updateNotifications = (type: keyof TenantConfig['notifications'], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [type]: value }
    }));
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'features', label: 'Features' },
    { id: 'branding', label: 'Branding' },
    { id: 'notifications', label: 'Notifications' }
  ] as const;

  return (
    <div className={`tenant-settings ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Tenant Settings</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure your organization's settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => updateConfig({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={config.domain}
                    onChange={(e) => updateConfig({ domain: e.target.value })}
                    placeholder="example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={config.timezone}
                    onChange={(e) => updateConfig({ timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={config.currency}
                    onChange={(e) => updateConfig({ currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Format
                  </label>
                  <select
                    value={config.dateFormat}
                    onChange={(e) => updateConfig({ dateFormat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {dateFormats.map(format => (
                      <option key={format} value={format}>{format}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiscal Year Start
                  </label>
                  <input
                    type="text"
                    value={config.fiscalYearStart}
                    onChange={(e) => updateConfig({ fiscalYearStart: e.target.value })}
                    placeholder="MM-DD"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div className="space-y-4">
                {Object.entries(config.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {feature === 'multiCurrency' && 'Support multiple currencies in transactions'}
                        {feature === 'advancedReporting' && 'Access to advanced reporting features'}
                        {feature === 'apiAccess' && 'Enable API access for integrations'}
                        {feature === 'customBranding' && 'Customize the application appearance'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => updateFeatures(feature as keyof TenantConfig['features'], e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={config.branding.primaryColor}
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.branding.primaryColor}
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={config.branding.secondaryColor}
                      onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.branding.secondaryColor}
                      onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Upload your organization logo</p>
                  <button className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Choose File
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="space-y-4">
                {Object.entries(config.notifications).map(([type, enabled]) => (
                  <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">{type} Notifications</h4>
                      <p className="text-sm text-gray-600">
                        {type === 'email' && 'Receive notifications via email'}
                        {type === 'sms' && 'Receive notifications via SMS'}
                        {type === 'push' && 'Receive push notifications in the browser'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => updateNotifications(type as keyof TenantConfig['notifications'], e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t mt-8">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantSettings;
