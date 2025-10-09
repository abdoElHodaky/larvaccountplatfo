/**
 * Custom Report Builder Component
 * Interactive builder for creating custom reports
 */

import React, { useState } from 'react';

interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  category: 'transaction' | 'account' | 'customer' | 'product' | 'custom';
  description: string;
}

interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
  value: string | number | [string | number, string | number];
}

interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

interface CustomReport {
  name: string;
  description: string;
  fields: string[];
  filters: ReportFilter[];
  sorting: ReportSort[];
  groupBy?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface CustomReportBuilderProps {
  onSave?: (report: CustomReport) => void;
  onPreview?: (report: CustomReport) => void;
  onCancel?: () => void;
  initialReport?: CustomReport;
  className?: string;
}

export const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
  onSave,
  onPreview,
  onCancel,
  initialReport,
  className = ''
}) => {
  const [activeStep, setActiveStep] = useState<'basic' | 'fields' | 'filters' | 'sorting' | 'preview'>('basic');
  
  const [report, setReport] = useState<CustomReport>({
    name: initialReport?.name || '',
    description: initialReport?.description || '',
    fields: initialReport?.fields || [],
    filters: initialReport?.filters || [],
    sorting: initialReport?.sorting || [],
    groupBy: initialReport?.groupBy || '',
    dateRange: initialReport?.dateRange || {
      start: '',
      end: ''
    }
  });

  const availableFields: ReportField[] = [
    // Transaction fields
    { id: 'transaction_id', name: 'Transaction ID', type: 'text', category: 'transaction', description: 'Unique transaction identifier' },
    { id: 'transaction_date', name: 'Transaction Date', type: 'date', category: 'transaction', description: 'Date of the transaction' },
    { id: 'transaction_amount', name: 'Amount', type: 'currency', category: 'transaction', description: 'Transaction amount' },
    { id: 'transaction_description', name: 'Description', type: 'text', category: 'transaction', description: 'Transaction description' },
    { id: 'transaction_type', name: 'Type', type: 'text', category: 'transaction', description: 'Transaction type (debit/credit)' },
    
    // Account fields
    { id: 'account_name', name: 'Account Name', type: 'text', category: 'account', description: 'Name of the account' },
    { id: 'account_code', name: 'Account Code', type: 'text', category: 'account', description: 'Account code' },
    { id: 'account_type', name: 'Account Type', type: 'text', category: 'account', description: 'Type of account' },
    { id: 'account_balance', name: 'Account Balance', type: 'currency', category: 'account', description: 'Current account balance' },
    
    // Customer fields
    { id: 'customer_name', name: 'Customer Name', type: 'text', category: 'customer', description: 'Customer name' },
    { id: 'customer_email', name: 'Customer Email', type: 'text', category: 'customer', description: 'Customer email address' },
    { id: 'customer_total_spent', name: 'Total Spent', type: 'currency', category: 'customer', description: 'Total amount spent by customer' },
    
    // Product fields
    { id: 'product_name', name: 'Product Name', type: 'text', category: 'product', description: 'Product name' },
    { id: 'product_price', name: 'Product Price', type: 'currency', category: 'product', description: 'Product price' },
    { id: 'product_quantity', name: 'Quantity', type: 'number', category: 'product', description: 'Product quantity' }
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
    { value: 'between', label: 'Between' }
  ];

  const steps = [
    { id: 'basic', label: 'Basic Info', completed: report.name && report.description },
    { id: 'fields', label: 'Select Fields', completed: report.fields.length > 0 },
    { id: 'filters', label: 'Add Filters', completed: true }, // Optional step
    { id: 'sorting', label: 'Sort & Group', completed: true }, // Optional step
    { id: 'preview', label: 'Preview', completed: false }
  ] as const;

  const handleFieldToggle = (fieldId: string) => {
    setReport(prev => ({
      ...prev,
      fields: prev.fields.includes(fieldId)
        ? prev.fields.filter(f => f !== fieldId)
        : [...prev.fields, fieldId]
    }));
  };

  const handleAddFilter = () => {
    const newFilter: ReportFilter = {
      id: Date.now().toString(),
      field: availableFields[0].id,
      operator: 'equals',
      value: ''
    };
    setReport(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  };

  const handleUpdateFilter = (filterId: string, updates: Partial<ReportFilter>) => {
    setReport(prev => ({
      ...prev,
      filters: prev.filters.map(filter =>
        filter.id === filterId ? { ...filter, ...updates } : filter
      )
    }));
  };

  const handleRemoveFilter = (filterId: string) => {
    setReport(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.id !== filterId)
    }));
  };

  const handleAddSort = () => {
    if (report.fields.length > 0) {
      const newSort: ReportSort = {
        field: report.fields[0],
        direction: 'asc'
      };
      setReport(prev => ({
        ...prev,
        sorting: [...prev.sorting, newSort]
      }));
    }
  };

  const handleUpdateSort = (index: number, updates: Partial<ReportSort>) => {
    setReport(prev => ({
      ...prev,
      sorting: prev.sorting.map((sort, i) =>
        i === index ? { ...sort, ...updates } : sort
      )
    }));
  };

  const handleRemoveSort = (index: number) => {
    setReport(prev => ({
      ...prev,
      sorting: prev.sorting.filter((_, i) => i !== index)
    }));
  };

  const getFieldName = (fieldId: string) => {
    return availableFields.find(f => f.id === fieldId)?.name || fieldId;
  };

  const canProceed = () => {
    switch (activeStep) {
      case 'basic':
        return report.name && report.description;
      case 'fields':
        return report.fields.length > 0;
      default:
        return true;
    }
  };

  const fieldsByCategory = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ReportField[]>);

  return (
    <div className={`custom-report-builder ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Custom Report Builder</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create a custom report tailored to your specific needs
          </p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    activeStep === step.id
                      ? 'bg-blue-600 text-white'
                      : step.completed
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.completed && activeStep !== step.id ? '✓' : index + 1}
                </button>
                <span className={`ml-2 text-sm font-medium ${
                  activeStep === step.id ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Basic Info Step */}
          {activeStep === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Name *
                </label>
                <input
                  type="text"
                  value={report.name}
                  onChange={(e) => setReport(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter report name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={report.description}
                  onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what this report will show"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={report.dateRange?.start || ''}
                    onChange={(e) => setReport(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange!, start: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={report.dateRange?.end || ''}
                    onChange={(e) => setReport(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange!, end: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Fields Step */}
          {activeStep === 'fields' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Select Fields to Include ({report.fields.length} selected)
                </h4>
                
                {Object.entries(fieldsByCategory).map(([category, fields]) => (
                  <div key={category} className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                      {category} Fields
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {fields.map(field => (
                        <label key={field.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={report.fields.includes(field.id)}
                            onChange={() => handleFieldToggle(field.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{field.name}</div>
                            <div className="text-xs text-gray-500">{field.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters Step */}
          {activeStep === 'filters' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-md font-medium text-gray-900">
                  Add Filters ({report.filters.length})
                </h4>
                <button
                  onClick={handleAddFilter}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Add Filter
                </button>
              </div>

              {report.filters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No filters added. Click "Add Filter" to create your first filter.
                </div>
              ) : (
                <div className="space-y-4">
                  {report.filters.map(filter => (
                    <div key={filter.id} className="flex items-center space-x-3 p-4 border rounded-md">
                      <select
                        value={filter.field}
                        onChange={(e) => handleUpdateFilter(filter.id, { field: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {availableFields.map(field => (
                          <option key={field.id} value={field.id}>{field.name}</option>
                        ))}
                      </select>

                      <select
                        value={filter.operator}
                        onChange={(e) => handleUpdateFilter(filter.id, { operator: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {operators.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={filter.value as string}
                        onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Filter value"
                      />

                      <button
                        onClick={() => handleRemoveFilter(filter.id)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sorting Step */}
          {activeStep === 'sorting' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-md font-medium text-gray-900">
                  Sorting & Grouping
                </h4>
                <button
                  onClick={handleAddSort}
                  disabled={report.fields.length === 0}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:bg-gray-300"
                >
                  Add Sort
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group By (Optional)
                </label>
                <select
                  value={report.groupBy || ''}
                  onChange={(e) => setReport(prev => ({ ...prev, groupBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No grouping</option>
                  {report.fields.map(fieldId => (
                    <option key={fieldId} value={fieldId}>{getFieldName(fieldId)}</option>
                  ))}
                </select>
              </div>

              {report.sorting.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Sort Order</h5>
                  {report.sorting.map((sort, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-md">
                      <select
                        value={sort.field}
                        onChange={(e) => handleUpdateSort(index, { field: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {report.fields.map(fieldId => (
                          <option key={fieldId} value={fieldId}>{getFieldName(fieldId)}</option>
                        ))}
                      </select>

                      <select
                        value={sort.direction}
                        onChange={(e) => handleUpdateSort(index, { direction: e.target.value as 'asc' | 'desc' })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </select>

                      <button
                        onClick={() => handleRemoveSort(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {activeStep === 'preview' && (
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-900">Report Preview</h4>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="font-medium text-gray-900 mb-2">{report.name}</h5>
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Fields ({report.fields.length}):</strong>
                    <ul className="mt-1 space-y-1">
                      {report.fields.map(fieldId => (
                        <li key={fieldId} className="text-gray-600">• {getFieldName(fieldId)}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <strong>Filters ({report.filters.length}):</strong>
                    {report.filters.length === 0 ? (
                      <p className="text-gray-600 mt-1">No filters applied</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {report.filters.map(filter => (
                          <li key={filter.id} className="text-gray-600">
                            • {getFieldName(filter.field)} {filter.operator} {filter.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {report.groupBy && (
                  <div className="mt-4">
                    <strong>Grouped by:</strong> {getFieldName(report.groupBy)}
                  </div>
                )}

                {report.sorting.length > 0 && (
                  <div className="mt-4">
                    <strong>Sorted by:</strong>
                    <ul className="mt-1 space-y-1">
                      {report.sorting.map((sort, index) => (
                        <li key={index} className="text-gray-600">
                          • {getFieldName(sort.field)} ({sort.direction === 'asc' ? 'Ascending' : 'Descending'})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <div>
            {activeStep !== 'basic' && (
              <button
                onClick={() => {
                  const currentIndex = steps.findIndex(s => s.id === activeStep);
                  if (currentIndex > 0) {
                    setActiveStep(steps[currentIndex - 1].id);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>

            {activeStep === 'preview' ? (
              <>
                <button
                  onClick={() => onPreview?.(report)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  Preview Report
                </button>
                <button
                  onClick={() => onSave?.(report)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Save Report
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  const currentIndex = steps.findIndex(s => s.id === activeStep);
                  if (currentIndex < steps.length - 1) {
                    setActiveStep(steps[currentIndex + 1].id);
                  }
                }}
                disabled={!canProceed()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomReportBuilder;
