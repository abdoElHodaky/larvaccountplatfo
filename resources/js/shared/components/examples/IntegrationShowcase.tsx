/**
 * Integration Showcase - Phase 5
 * Comprehensive demo of HeadlessUI + TailwindCSS + LiveIcons integration
 */

import React from 'react';
import { EnhancedDialog, ConfirmDialog } from '../enhanced';
import { Card } from '../';

export const IntegrationShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">


        {/* Performance Metrics */}
        <Card className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50">
          <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">Fast</div>
              <div className="text-sm text-gray-600">Animation Start Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600">60fps</div>
              <div className="text-sm text-gray-600">Smooth Performance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning-600">100%</div>
              <div className="text-sm text-gray-600">TailwindCSS Compatible</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-600">A11y</div>
              <div className="text-sm text-gray-600">Accessibility Ready</div>
            </div>
          </div>
        </Card>

      </div>

      {/* Dialogs */}
      <EnhancedDialog
        isOpen={false}
        onClose={() => {}}
        title="Enhanced Dialog Example"
        type="info"
        actions={
          <button
            onClick={() => {}}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            Close
          </button>
        }
      >
        <p className="text-gray-600">
          This is an enhanced HeadlessUI dialog with LiveIcons integration and TailwindCSS styling.
          It includes animated icons, proper focus management, and accessibility features.
        </p>
      </EnhancedDialog>

      <ConfirmDialog
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item? This action cannot be undone."
        type="error"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};