/**
 * Enhanced Dialog Component - Phase 5
 * HeadlessUI Dialog enhanced with LiveIcons and TailwindCSS styling
 */

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  LiveXMarkIcon,
  LiveInfoIcon,
  LiveWarningIcon,
  LiveErrorIcon,
  LiveSuccessIcon,
  type LiveIconProps 
} from '../../icons';

interface EnhancedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  type?: 'default' | 'info' | 'warning' | 'error' | 'success';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  animated?: boolean;
  // Actions
  actions?: React.ReactNode;
  // LiveIcons integration
  icon?: React.ComponentType<LiveIconProps>;
  iconProps?: LiveIconProps;
}

export const EnhancedDialog: React.FC<EnhancedDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  type = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  animated = true,
  actions,
  icon: CustomIcon,
  iconProps = {}
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  const typeConfig = {
    default: { 
      icon: LiveInfoIcon, 
      iconColor: 'primary' as const,
      borderColor: 'border-primary-200',
      bgColor: 'bg-primary-50'
    },
    info: { 
      icon: LiveInfoIcon, 
      iconColor: 'primary' as const,
      borderColor: 'border-primary-200',
      bgColor: 'bg-primary-50'
    },
    warning: { 
      icon: LiveWarningIcon, 
      iconColor: 'warning' as const,
      borderColor: 'border-warning-200',
      bgColor: 'bg-warning-50'
    },
    error: { 
      icon: LiveErrorIcon, 
      iconColor: 'danger' as const,
      borderColor: 'border-danger-200',
      bgColor: 'bg-danger-50'
    },
    success: { 
      icon: LiveSuccessIcon, 
      iconColor: 'success' as const,
      borderColor: 'border-success-200',
      bgColor: 'bg-success-50'
    }
  };

  const config = typeConfig[type];
  const IconComponent = CustomIcon || config.icon;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={closeOnOverlayClick ? onClose : () => {}}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter={animated ? "ease-out duration-300" : ""}
          enterFrom={animated ? "opacity-0" : ""}
          enterTo={animated ? "opacity-100" : ""}
          leave={animated ? "ease-in duration-200" : ""}
          leaveFrom={animated ? "opacity-100" : ""}
          leaveTo={animated ? "opacity-0" : ""}
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        {/* Dialog container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter={animated ? "ease-out duration-300" : ""}
              enterFrom={animated ? "opacity-0 scale-95" : ""}
              enterTo={animated ? "opacity-100 scale-100" : ""}
              leave={animated ? "ease-in duration-200" : ""}
              leaveFrom={animated ? "opacity-100 scale-100" : ""}
              leaveTo={animated ? "opacity-0 scale-95" : ""}
            >
              <Dialog.Panel className={`
                w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all
                ${type !== 'default' ? `border-l-4 ${config.borderColor}` : ''}
              `}>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {(title || type !== 'default') && (
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full
                        ${type !== 'default' ? config.bgColor : 'bg-gray-100'}
                      `}>
                        <IconComponent
                          size="md"
                          color={config.iconColor}
                          trigger="visible"
                          {...iconProps}
                        />
                      </div>
                    )}
                    {title && (
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        {title}
                      </Dialog.Title>
                    )}
                  </div>
                  
                  {showCloseButton && (
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <LiveXMarkIcon
                        size="md"
                        color="secondary"
                        trigger="hover"
                      />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="mt-4">
                  {children}
                </div>

                {/* Actions */}
                {actions && (
                  <div className="mt-6 flex justify-end space-x-3">
                    {actions}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Preset dialog configurations
export const ConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'warning' | 'error' | 'info';
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <EnhancedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      type={type}
      size="sm"
      actions={
        <>
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`
              inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
              ${type === 'error' ? 'bg-danger-600 hover:bg-danger-700 focus:ring-danger-500' : 
                type === 'warning' ? 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500' :
                'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'}
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-500">{message}</p>
    </EnhancedDialog>
  );
};

