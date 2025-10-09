/**
 * Report Builder Component
 * Tool for building custom financial reports
 */

import React, { useState } from 'react';

interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'currency';
  category: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity';
}

interface ReportFilter {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
  value: string | number;
  value2?: string | number; // for 'between' operator
}

interface ReportConfig {
  title: string;
  description: string;
  fields: string[];
  filters: ReportFilter[];
  groupBy?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  dateRange: {
    start: string;
    end: string;
  };
}

interface ReportBuilderProps {
  onGenerateReport: (config: ReportConfig) => void;
  onSaveTemplate?: (config: ReportConfig) => void;
  className?: string;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  onGenerateReport,
  onSaveTemplate,
  className = ''
}) => {
  const [config, setConfig] = useState<ReportConfig>({
    title: '',
    description: '',
    fields: [],
    filters: [],
    sortBy: '',
    sortOrder: 'asc',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const availableFields: ReportField[] = [
    { id: 'date', name: 'Date', type: 'date', category: 'revenue' },
    { id: 'account', name: 'Account', type: 'text', category: 'revenue' },
    { id: 'description', name: 'Description', type: 'text', category: 'revenue' },
    { id: 'amount', name: 'Amount', type: 'currency', category: 'revenue' },
    { id: 'debit', name: 'Debit', type: 'currency', category: 'expense' },
    { id: 'credit', name: 'Credit', type: 'currency', category: 'revenue' },
    { id: 'balance', name: 'Balance', type: 'currency', category: 'asset' },
    { id: 'category', name: 'Category', type: 'text', category: 'revenue' },
    { id: 'reference', name: 'Reference', type: 'text', category: 'revenue' }
  ];

  const handleFieldToggle = (fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.includes(fieldId)
        ? prev.fields.filter(f => f !== fieldId)
        : [...prev.fields, fieldId]
    }));
  };

  const handleAddFilter = () => {
    setConfig(prev => ({
      ...prev,
      filters: [
        ...prev.filters,
        {
          field: availableFields[0].id,
          operator: 'equals',
          value: ''
        }
      ]
    }));
  };

  const handleUpdateFilter = (index: number, updates: Partial<ReportFilter>) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => 
        i === index ? { ...filter, ...updates } : filter
      )
    }));
  };

  const handleRemoveFilter = (index: number) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const handleGenerate = () => {
    if (config.title && config.fields.length > 0) {
      onGenerateReport(config);
    }
  };

  const handleSave = () => {
    if (config.title && onSaveTemplate) {
      onSaveTemplate(config);
    }
  };

  return (
    <div className={`report-builder ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Report Builder</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create custom financial reports with your preferred fields and filters
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Title *
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter report title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={config.description}
                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the report"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="date"
                  value={config.dateRange.start}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={config.dateRange.end}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Fields Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Fields *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableFields.map(field => (
                <label key={field.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.fields.includes(field.id)}
                    onChange={() => handleFieldToggle(field.id)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{field.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Filters
              </label>
              <button
                onClick={handleAddFilter}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Filter
              </button>
            </div>
            
            {config.filters.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No filters applied</p>
            ) : (
              <div className="space-y-3">
                {config.filters.map((filter, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                    <select
                      value={filter.field}
                      onChange={(e) => handleUpdateFilter(index, { field: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {availableFields.map(field => (
                        <option key={field.id} value={field.id}>{field.name}</option>
                      ))}
                    </select>
                    
                    <select
                      value={filter.operator}
                      onChange={(e) => handleUpdateFilter(index, { operator: e.target.value as any })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                      <option value="between">Between</option>
                    </select>
                    
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => handleUpdateFilter(index, { value: e.target.value })}
                      placeholder="Value"
                      className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                    />
                    
                    <button
                      onClick={() => handleRemoveFilter(index)}
                      className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sorting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={config.sortBy}
                onChange={(e) => setConfig(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No sorting</option>
                {availableFields.map(field => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                value={config.sortOrder}
                onChange={(e) => setConfig(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            {onSaveTemplate && (
              <button
                onClick={handleSave}
                disabled={!config.title}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={!config.title || config.fields.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
