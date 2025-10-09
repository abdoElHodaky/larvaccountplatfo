/**
 * Report Dashboard Component
 * Main dashboard for viewing and managing reports
 */

import React, { useState } from 'react';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'operational' | 'custom';
  status: 'active' | 'draft' | 'archived';
  lastRun: string;
  createdBy: string;
  createdAt: string;
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

interface ReportDashboardProps {
  reports?: Report[];
  onCreateReport?: () => void;
  onEditReport?: (report: Report) => void;
  onRunReport?: (reportId: string) => void;
  onDeleteReport?: (reportId: string) => void;
  className?: string;
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({
  reports = [],
  onCreateReport,
  onEditReport,
  onRunReport,
  onDeleteReport,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'financial' | 'operational' | 'custom'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'lastRun' | 'createdAt'>('name');

  const defaultReports: Report[] = [
    {
      id: '1',
      name: 'Monthly Financial Summary',
      description: 'Comprehensive monthly financial overview including P&L, balance sheet, and cash flow',
      type: 'financial',
      status: 'active',
      lastRun: '2023-12-01T10:30:00Z',
      createdBy: 'John Doe',
      createdAt: '2023-01-15T09:00:00Z',
      schedule: 'monthly'
    },
    {
      id: '2',
      name: 'Weekly Sales Report',
      description: 'Weekly sales performance and trends analysis',
      type: 'operational',
      status: 'active',
      lastRun: '2023-11-30T14:20:00Z',
      createdBy: 'Jane Smith',
      createdAt: '2023-02-20T11:30:00Z',
      schedule: 'weekly'
    },
    {
      id: '3',
      name: 'Custom Expense Analysis',
      description: 'Custom report for analyzing expense patterns by category',
      type: 'custom',
      status: 'draft',
      lastRun: '2023-11-28T09:15:00Z',
      createdBy: 'Mike Johnson',
      createdAt: '2023-03-10T16:45:00Z'
    },
    {
      id: '4',
      name: 'Quarterly Tax Report',
      description: 'Quarterly tax preparation and compliance report',
      type: 'financial',
      status: 'active',
      lastRun: '2023-10-01T08:00:00Z',
      createdBy: 'Sarah Wilson',
      createdAt: '2023-01-05T12:00:00Z',
      schedule: 'quarterly'
    }
  ];

  const displayReports = reports.length > 0 ? reports : defaultReports;

  const filteredReports = displayReports
    .filter(report => activeTab === 'all' || report.type === activeTab)
    .filter(report => 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'lastRun':
          return new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime();
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const getStatusBadge = (status: Report['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`;
  };

  const getTypeBadge = (type: Report['type']) => {
    const colors = {
      financial: 'bg-blue-100 text-blue-800',
      operational: 'bg-purple-100 text-purple-800',
      custom: 'bg-orange-100 text-orange-800'
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${colors[type]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const tabs = [
    { id: 'all', label: 'All Reports', count: displayReports.length },
    { id: 'financial', label: 'Financial', count: displayReports.filter(r => r.type === 'financial').length },
    { id: 'operational', label: 'Operational', count: displayReports.filter(r => r.type === 'operational').length },
    { id: 'custom', label: 'Custom', count: displayReports.filter(r => r.type === 'custom').length }
  ] as const;

  return (
    <div className={`report-dashboard ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Report Dashboard</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create, manage, and run your business reports
              </p>
            </div>
            <button
              onClick={onCreateReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Create Report
            </button>
          </div>
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
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'lastRun' | 'createdAt')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="lastRun">Sort by Last Run</option>
                <option value="createdAt">Sort by Created Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="p-6">
          {filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map(report => (
                <div key={report.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex space-x-2">
                      <span className={getTypeBadge(report.type)}>
                        {report.type}
                      </span>
                      <span className={getStatusBadge(report.status)}>
                        {report.status}
                      </span>
                    </div>
                    {report.schedule && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {report.schedule}
                      </span>
                    )}
                  </div>

                  <h4 className="font-medium text-gray-900 mb-2">{report.name}</h4>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{report.description}</p>

                  <div className="text-xs text-gray-500 mb-4">
                    <p>Last run: {formatDate(report.lastRun)}</p>
                    <p>Created by: {report.createdBy}</p>
                    <p>Created: {formatDate(report.createdAt)}</p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => onRunReport?.(report.id)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Run Report
                    </button>
                    <button
                      onClick={() => onEditReport?.(report)}
                      className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteReport?.(report.id)}
                      className="px-3 py-2 text-sm text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms.'
                  : 'Create your first report to get started with business intelligence.'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={onCreateReport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Create Your First Report
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {filteredReports.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {displayReports.filter(r => r.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active Reports</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {displayReports.filter(r => r.schedule).length}
                </div>
                <div className="text-sm text-gray-600">Scheduled Reports</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {displayReports.filter(r => r.type === 'custom').length}
                </div>
                <div className="text-sm text-gray-600">Custom Reports</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {displayReports.filter(r => r.status === 'draft').length}
                </div>
                <div className="text-sm text-gray-600">Draft Reports</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDashboard;
