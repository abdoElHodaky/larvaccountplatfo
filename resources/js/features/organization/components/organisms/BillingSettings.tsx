/**
 * Billing Settings Component
 * Manage subscription, billing, and payment information
 */

import React, { useState } from 'react';

interface BillingInfo {
  plan: {
    name: string;
    price: number;
    interval: 'monthly' | 'yearly';
    features: string[];
  };
  nextBilling: string;
  paymentMethod: {
    type: 'card' | 'bank';
    last4: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  billingAddress: {
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    downloadUrl?: string;
  }>;
}

interface BillingSettingsProps {
  billingInfo?: BillingInfo;
  onUpdatePlan?: (planId: string) => void;
  onUpdatePaymentMethod?: (paymentMethod: any) => void;
  onUpdateBillingAddress?: (address: BillingInfo['billingAddress']) => void;
  onDownloadInvoice?: (invoiceId: string) => void;
  className?: string;
}

export const BillingSettings: React.FC<BillingSettingsProps> = ({
  billingInfo,
  onUpdatePlan,
  onUpdatePaymentMethod,
  onUpdateBillingAddress,
  onDownloadInvoice,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'payment' | 'billing' | 'invoices'>('plan');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [addressForm, setAddressForm] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const defaultBillingInfo: BillingInfo = {
    plan: {
      name: 'Professional',
      price: 49,
      interval: 'monthly',
      features: [
        'Unlimited transactions',
        'Advanced reporting',
        'Multi-currency support',
        'API access',
        'Priority support'
      ]
    },
    nextBilling: '2024-01-15T00:00:00Z',
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025
    },
    billingAddress: {
      name: 'John Doe',
      email: 'john@example.com',
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'United States'
    },
    invoices: [
      {
        id: 'inv_001',
        date: '2023-12-15T00:00:00Z',
        amount: 49,
        status: 'paid',
        downloadUrl: '/invoices/inv_001.pdf'
      },
      {
        id: 'inv_002',
        date: '2023-11-15T00:00:00Z',
        amount: 49,
        status: 'paid',
        downloadUrl: '/invoices/inv_002.pdf'
      },
      {
        id: 'inv_003',
        date: '2023-10-15T00:00:00Z',
        amount: 49,
        status: 'paid',
        downloadUrl: '/invoices/inv_003.pdf'
      }
    ]
  };

  const displayBillingInfo = billingInfo || defaultBillingInfo;

  const availablePlans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 19,
      interval: 'monthly' as const,
      features: [
        'Up to 100 transactions/month',
        'Basic reporting',
        'Email support'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 49,
      interval: 'monthly' as const,
      features: [
        'Unlimited transactions',
        'Advanced reporting',
        'Multi-currency support',
        'API access',
        'Priority support'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      interval: 'monthly' as const,
      features: [
        'Everything in Professional',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        'Advanced security'
      ]
    }
  ];

  const handleUpdateAddress = () => {
    onUpdateBillingAddress?.(addressForm);
    setShowAddressModal(false);
  };

  const handleEditAddress = () => {
    setAddressForm(displayBillingInfo.billingAddress);
    setShowAddressModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`;
  };

  const tabs = [
    { id: 'plan', label: 'Plan & Billing' },
    { id: 'payment', label: 'Payment Method' },
    { id: 'billing', label: 'Billing Address' },
    { id: 'invoices', label: 'Invoices' }
  ] as const;

  return (
    <div className={`billing-settings ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Billing Settings</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your subscription, payment methods, and billing information
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
          {/* Plan & Billing Tab */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {displayBillingInfo.plan.name} Plan
                    </h4>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {formatCurrency(displayBillingInfo.plan.price)}
                      <span className="text-sm font-normal text-gray-600">
                        /{displayBillingInfo.plan.interval}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Next billing: {formatDate(displayBillingInfo.nextBilling)}
                    </p>
                  </div>
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                    Current Plan
                  </span>
                </div>
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Features included:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {displayBillingInfo.plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Available Plans */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {availablePlans.map(plan => (
                    <div
                      key={plan.id}
                      className={`border rounded-lg p-6 ${
                        plan.name === displayBillingInfo.plan.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <h5 className="font-medium text-gray-900">{plan.name}</h5>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {formatCurrency(plan.price)}
                        <span className="text-sm font-normal text-gray-600">/{plan.interval}</span>
                      </p>
                      <ul className="text-sm text-gray-600 mt-4 space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => onUpdatePlan?.(plan.id)}
                        disabled={plan.name === displayBillingInfo.plan.name}
                        className={`w-full mt-4 px-4 py-2 text-sm font-medium rounded-md ${
                          plan.name === displayBillingInfo.plan.name
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {plan.name === displayBillingInfo.plan.name ? 'Current Plan' : 'Upgrade'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">Payment Method</h4>
                    <div className="mt-2 flex items-center">
                      <div className="w-8 h-5 bg-blue-600 rounded mr-2"></div>
                      <span className="text-sm text-gray-900">
                        {displayBillingInfo.paymentMethod.brand} ending in {displayBillingInfo.paymentMethod.last4}
                      </span>
                    </div>
                    {displayBillingInfo.paymentMethod.expiryMonth && displayBillingInfo.paymentMethod.expiryYear && (
                      <p className="text-sm text-gray-600 mt-1">
                        Expires {displayBillingInfo.paymentMethod.expiryMonth}/{displayBillingInfo.paymentMethod.expiryYear}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
                  >
                    Update
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="text-yellow-400 mr-3">⚠️</div>
                  <div>
                    <h5 className="text-sm font-medium text-yellow-800">Secure Payment Processing</h5>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your payment information is securely processed by our payment provider. We never store your full card details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Address Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Billing Address</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium text-gray-900">{displayBillingInfo.billingAddress.name}</p>
                      <p>{displayBillingInfo.billingAddress.email}</p>
                      <p>{displayBillingInfo.billingAddress.address}</p>
                      <p>
                        {displayBillingInfo.billingAddress.city}, {displayBillingInfo.billingAddress.state} {displayBillingInfo.billingAddress.zipCode}
                      </p>
                      <p>{displayBillingInfo.billingAddress.country}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleEditAddress}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Billing History</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayBillingInfo.invoices.map(invoice => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(invoice.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(invoice.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusBadge(invoice.status)}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {invoice.downloadUrl && (
                              <button
                                onClick={() => onDownloadInvoice?.(invoice.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Download
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Payment Method</h3>
              <p className="text-sm text-gray-600 mb-4">
                You will be redirected to our secure payment processor to update your payment method.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onUpdatePaymentMethod?.({});
                    setShowPaymentModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Billing Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={addressForm.email}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={addressForm.address}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={addressForm.country}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateAddress}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSettings;
