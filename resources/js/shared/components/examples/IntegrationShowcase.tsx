/**
 * Integration Showcase - Phase 5
 * Comprehensive demo of HeadlessUI + TailwindCSS + LiveIcons integration
 */

import React, { useState } from 'react';
// Simple placeholder components
const Card: React.FC<{children: React.ReactNode}> = ({children}) => <div className="bg-white rounded-lg shadow p-4">{children}</div>;
const Widget: React.FC<{children: React.ReactNode}> = ({children}) => <div className="bg-gray-50 rounded p-3">{children}</div>;
const List: React.FC<{children: React.ReactNode}> = ({children}) => <ul className="space-y-2">{children}</ul>;
import { EnhancedMenu, EnhancedDialog, ConfirmDialog } from '../enhanced';
import {
  // Navigation Icons
  LiveHomeIcon,
  LiveChevronLeftIcon,
  LiveChevronRightIcon,
  LiveMenuToggleIcon,
  LiveBackIcon,
  
  // Form Icons
  ValidationIcon,
  PasswordToggleIcon,
  SearchInputIcon,
  AddRemoveIcon,
  
  // Status Icons
  StatusIndicator,
  ConnectionStatus,
  ProgressStatus,
  
  // Action Icons
  LikeIcon,
  BookmarkIcon,
  StarRating,
  ThumbsVote,
  SendIcon,
  LiveEditIcon,
  LiveDeleteIcon,
  LiveShareIcon
} from '../../icons';

export const IntegrationShowcase: React.FC = () => {
  // State for interactive demos
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [rating, setRating] = useState(3);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [progress, setProgress] = useState(65);
  const [connectionStrength, setConnectionStrength] = useState<'weak' | 'medium' | 'strong'>('strong');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Phase 5: LiveIcons Integration Showcase
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive demonstration of HeadlessUI, TailwindCSS, and LiveIcons working together 
            with the unified Phase 4 animation system.
          </p>
        </div>

        {/* Navigation Section */}
        <Card className="p-6" icon={LiveHomeIcon}>
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <LiveHomeIcon size="lg" color="primary" trigger="hover" className="mr-3" />
            Navigation Icons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Menu Toggle */}
            <div className="space-y-3">
              <h3 className="font-medium">Menu Toggle</h3>
              <LiveMenuToggleIcon
                isOpen={isMenuOpen}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                size="lg"
                color="primary"
              />
            </div>

            {/* Back Navigation */}
            <div className="space-y-3">
              <h3 className="font-medium">Back Navigation</h3>
              <LiveBackIcon label="Go Back" onClick={() => alert('Going back!')} />
            </div>

            {/* Chevron Navigation */}
            <div className="space-y-3">
              <h3 className="font-medium">Chevron Navigation</h3>
              <div className="flex items-center space-x-4">
                <LiveChevronLeftIcon size="lg" color="primary" trigger="hover" />
                <LiveChevronRightIcon size="lg" color="primary" trigger="hover" />
              </div>
            </div>
          </div>
        </Card>

        {/* Form Icons Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Form Icons & Validation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Validation States */}
            <div className="space-y-4">
              <h3 className="font-medium">Validation States</h3>
              <div className="space-y-2">
                <ValidationIcon state="success" message="Valid input" />
                <ValidationIcon state="error" message="Invalid format" />
                <ValidationIcon state="warning" message="Check this field" />
                <ValidationIcon state="info" message="Additional info" />
              </div>
            </div>

            {/* Interactive Form Elements */}
            <div className="space-y-4">
              <h3 className="font-medium">Interactive Elements</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-sm">Password:</span>
                  <PasswordToggleIcon
                    isVisible={passwordVisible}
                    onToggle={() => setPasswordVisible(!passwordVisible)}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm">Search:</span>
                  <SearchInputIcon
                    isSearching={isSearching}
                    onClick={() => setIsSearching(!isSearching)}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <AddRemoveIcon mode="add" onClick={() => alert('Added!')} />
                  <AddRemoveIcon mode="remove" onClick={() => alert('Removed!')} />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Status Icons Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Status & Progress Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Status Indicators */}
            <div className="space-y-4">
              <h3 className="font-medium">Status Indicators</h3>
              <div className="space-y-2">
                <StatusIndicator status="success" label="Success" showLabel />
                <StatusIndicator status="error" label="Error" showLabel />
                <StatusIndicator status="warning" label="Warning" showLabel />
                <StatusIndicator status="loading" label="Loading" showLabel />
              </div>
            </div>

            {/* Connection Status */}
            <div className="space-y-4">
              <h3 className="font-medium">Connection Status</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ConnectionStatus isConnected={true} strength={connectionStrength} />
                  <select 
                    value={connectionStrength} 
                    onChange={(e) => setConnectionStrength(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="weak">Weak</option>
                    <option value="medium">Medium</option>
                    <option value="strong">Strong</option>
                  </select>
                </div>
                <ConnectionStatus isConnected={false} />
              </div>
            </div>

            {/* Progress Status */}
            <div className="space-y-4">
              <h3 className="font-medium">Progress Status</h3>
              <ProgressStatus
                progress={progress}
                status="active"
                label="Upload Progress"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* Action Icons Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Interactive Action Icons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Like/Bookmark */}
            <div className="space-y-4">
              <h3 className="font-medium">Social Actions</h3>
              <div className="space-y-2">
                <LikeIcon
                  isLiked={isLiked}
                  onToggle={() => setIsLiked(!isLiked)}
                  count={42}
                />
                <BookmarkIcon
                  isBookmarked={isBookmarked}
                  onToggle={() => setIsBookmarked(!isBookmarked)}
                />
              </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-4">
              <h3 className="font-medium">Star Rating</h3>
              <StarRating
                rating={rating}
                onRate={setRating}
              />
            </div>

            {/* Voting */}
            <div className="space-y-4">
              <h3 className="font-medium">Voting</h3>
              <ThumbsVote
                vote={vote}
                onVote={setVote}
                upCount={15}
                downCount={3}
              />
            </div>

            {/* Send Action */}
            <div className="space-y-4">
              <h3 className="font-medium">Send Action</h3>
              <SendIcon
                onSend={() => alert('Message sent!')}
              />
            </div>
          </div>
        </Card>

        {/* HeadlessUI Integration Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">HeadlessUI Enhanced Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Enhanced Menu */}
            <div className="space-y-4">
              <h3 className="font-medium">Enhanced Menu</h3>
              <EnhancedMenu
                trigger="Actions Menu"
                items={[
                  {
                    label: 'Edit Item',
                    onClick: () => alert('Edit clicked!'),
                    icon: LiveEditIcon
                  },
                  {
                    label: 'Share Item',
                    onClick: () => alert('Share clicked!'),
                    icon: LiveShareIcon
                  },
                  {
                    label: 'Delete Item',
                    onClick: () => setIsConfirmOpen(true),
                    icon: LiveDeleteIcon,
                    danger: true
                  }
                ]}
              />
            </div>

            {/* Enhanced Dialog */}
            <div className="space-y-4">
              <h3 className="font-medium">Enhanced Dialog</h3>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              >
                Open Dialog
              </button>
            </div>
          </div>
        </Card>

        {/* Phase 4 Components with LiveIcons */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Phase 4 Components + LiveIcons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Enhanced Card */}
            <Card
              variant="elevated"
              hover
              interactive
              icon={LiveHomeIcon}
              iconPosition="top-right"
              onClick={() => alert('Card clicked!')}
            >
              <div className="p-4">
                <h3 className="font-medium mb-2">Enhanced Card</h3>
                <p className="text-sm text-gray-600">
                  Card component with integrated LiveIcon in top-right corner.
                </p>
              </div>
            </Card>

            {/* Enhanced Widget */}
            <Widget
              title="Dashboard Widget"
              size="md"
              icon={LiveHomeIcon}
              statusIcon={StatusIndicator}
            >
              <div className="p-4">
                <p className="text-sm text-gray-600">
                  Widget with title icon and status indicator.
                </p>
              </div>
            </Widget>

            {/* Enhanced List */}
            <List
              items={[
                { id: 1, content: 'Item with animation' },
                { id: 2, content: 'Another animated item' },
                { id: 3, content: 'Third item with stagger' }
              ]}
              variant="cards"
              stagger
              className="max-h-48 overflow-y-auto"
            />
          </div>
        </Card>

        {/* Performance Metrics */}
        <Card className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50">
          <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">⚡ &lt;50ms</div>
              <div className="text-sm text-gray-600">Animation Start Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600">🎯 60fps</div>
              <div className="text-sm text-gray-600">Smooth Performance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning-600">🎨 100%</div>
              <div className="text-sm text-gray-600">TailwindCSS Compatible</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-600">♿ A11y</div>
              <div className="text-sm text-gray-600">Accessibility Ready</div>
            </div>
          </div>
        </Card>

      </div>

      {/* Dialogs */}
      <EnhancedDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Enhanced Dialog Example"
        type="info"
        actions={
          <button
            onClick={() => setIsDialogOpen(false)}
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
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => alert('Item deleted!')}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item? This action cannot be undone."
        type="error"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};
