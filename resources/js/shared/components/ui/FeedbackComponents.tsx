/**
 * Feedback Components
 * User feedback and communication components
 * Built with HeadlessUI and unified design patterns
 */

import React, { forwardRef, useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Transition } from '@headlessui/react';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/20/solid';
import { cn, getSizeClasses, getColorClasses, getTransitionClasses } from './utils';
import { ToastProps, AlertProps, ProgressProps, SkeletonProps, Size, ColorScheme } from './types';

// =============================================================================
// TOAST SYSTEM
// =============================================================================

interface Toast extends ToastProps {
  id: string;
  createdAt: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<ToastProps, 'onClose'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<ToastProps, 'onClose'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      createdAt: Date.now(),
      duration: toast.duration ?? 5000,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-toast space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

const ToastComponent = forwardRef<HTMLDivElement, ToastProps & { id?: string }>(
  ({ 
    colorScheme = 'primary',
    title,
    description,
    duration = 5000,
    closable = true,
    onClose,
    action,
    className,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = useState(true);
    const colorStyles = getColorClasses(colorScheme);

    const handleClose = () => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 150); // Wait for animation
    };

    const getIcon = () => {
      switch (colorScheme) {
        case 'success':
          return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
        case 'warning':
          return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
        case 'error':
          return <XCircleIcon className="h-5 w-5 text-red-400" />;
        case 'info':
          return <InformationCircleIcon className="h-5 w-5 text-blue-400" />;
        default:
          return <InformationCircleIcon className="h-5 w-5 text-primary-400" />;
      }
    };

    return (
      <Transition
        show={isVisible}
        enter="transform ease-out duration-300 transition"
        enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enterTo="translate-y-0 opacity-100 sm:translate-x-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          ref={ref}
          className={cn(
            'max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
            className
          )}
          {...props}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                {title && (
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {title}
                  </p>
                )}
                {description && (
                  <p className={cn(
                    'text-sm text-gray-500 dark:text-gray-400',
                    title && 'mt-1'
                  )}>
                    {description}
                  </p>
                )}
                {action && (
                  <div className="mt-3">
                    {action}
                  </div>
                )}
              </div>
              {closable && (
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Transition>
    );
  }
);

ToastComponent.displayName = 'Toast';

// =============================================================================
// ALERT COMPONENT
// =============================================================================

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ 
    size = 'md',
    colorScheme = 'info',
    title,
    description,
    closable = false,
    onClose,
    icon,
    action,
    className,
    children,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = useState(true);
    const sizeStyles = getSizeClasses(size);
    const colorStyles = getColorClasses(colorScheme);

    const handleClose = () => {
      setIsVisible(false);
      onClose?.();
    };

    const getDefaultIcon = () => {
      switch (colorScheme) {
        case 'success':
          return <CheckCircleIcon className="h-5 w-5" />;
        case 'warning':
          return <ExclamationTriangleIcon className="h-5 w-5" />;
        case 'error':
          return <XCircleIcon className="h-5 w-5" />;
        case 'info':
        default:
          return <InformationCircleIcon className="h-5 w-5" />;
      }
    };

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-md border',
          sizeStyles.padding,
          colorStyles.light,
          colorStyles.border,
          className
        )}
        {...props}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            {icon || (
              <div className={colorStyles.text}>
                {getDefaultIcon()}
              </div>
            )}
          </div>
          <div className="ml-3 flex-1">
            {title && (
              <h3 className={cn('text-sm font-medium', colorStyles.text)}>
                {title}
              </h3>
            )}
            {(description || children) && (
              <div className={cn(
                'text-sm',
                colorStyles.text,
                'opacity-90',
                title && 'mt-2'
              )}>
                {description || children}
              </div>
            )}
            {action && (
              <div className="mt-4">
                {action}
              </div>
            )}
          </div>
          {closable && (
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className={cn(
                    'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                    colorStyles.text,
                    'hover:opacity-75',
                    colorStyles.ring
                  )}
                  onClick={handleClose}
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

// =============================================================================
// PROGRESS COMPONENT
// =============================================================================

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    size = 'md',
    colorScheme = 'primary',
    value,
    max = 100,
    showValue = false,
    format,
    indeterminate = false,
    className,
    ...props 
  }, ref) => {
    const sizeStyles = getSizeClasses(size);
    const colorStyles = getColorClasses(colorScheme);
    
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const displayValue = format ? format(value, max) : `${Math.round(percentage)}%`;

    const heightClasses = {
      xs: 'h-1',
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4',
      xl: 'h-5',
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {showValue && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {displayValue}
            </span>
          </div>
        )}
        <div className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          heightClasses[size]
        )}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-out',
              colorStyles.bg,
              indeterminate && 'animate-pulse'
            )}
            style={{ 
              width: indeterminate ? '100%' : `${percentage}%`,
              ...(indeterminate && {
                background: `linear-gradient(90deg, transparent, ${colorStyles.bg.replace('bg-', '')}, transparent)`,
                animation: 'progress-indeterminate 2s infinite linear'
              })
            }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

// =============================================================================
// LOADING COMPONENT
// =============================================================================

interface LoadingProps {
  size?: Size;
  text?: string;
  overlay?: boolean;
  className?: string;
}

export const Loading = forwardRef<HTMLDivElement, LoadingProps>(
  ({ 
    size = 'md',
    text,
    overlay = false,
    className,
    ...props 
  }, ref) => {
    const sizeStyles = getSizeClasses(size);

    const spinnerSizes = {
      xs: 'h-4 w-4',
      sm: 'h-6 w-6',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
    };

    const spinner = (
      <div className="flex flex-col items-center justify-center">
        <ArrowPathIcon className={cn(
          'animate-spin text-primary-600',
          spinnerSizes[size]
        )} />
        {text && (
          <p className={cn(
            'text-gray-600 dark:text-gray-400 mt-2',
            sizeStyles.text
          )}>
            {text}
          </p>
        )}
      </div>
    );

    if (overlay) {
      return (
        <div
          ref={ref}
          className={cn(
            'fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-loading flex items-center justify-center',
            className
          )}
          {...props}
        >
          {spinner}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center p-4', className)}
        {...props}
      >
        {spinner}
      </div>
    );
  }
);

Loading.displayName = 'Loading';

// =============================================================================
// SKELETON COMPONENT
// =============================================================================

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    active = true,
    avatar = false,
    paragraph = true,
    title = true,
    loading = true,
    children,
    className,
    ...props 
  }, ref) => {
    if (!loading && children) {
      return <>{children}</>;
    }

    const avatarConfig = typeof avatar === 'object' ? avatar : { size: 'md', shape: 'circle' };
    const paragraphConfig = typeof paragraph === 'object' ? paragraph : { rows: 3 };
    const titleConfig = typeof title === 'object' ? title : { width: '60%' };

    const baseClasses = cn(
      'bg-gray-200 dark:bg-gray-700 rounded',
      active && 'animate-pulse'
    );

    return (
      <div ref={ref} className={cn('space-y-3', className)} {...props}>
        <div className="flex items-start space-x-4">
          {avatar && (
            <div className={cn(
              baseClasses,
              avatarConfig.shape === 'circle' ? 'rounded-full' : 'rounded',
              avatarConfig.size === 'sm' ? 'h-8 w-8' : 
              avatarConfig.size === 'lg' ? 'h-16 w-16' : 'h-12 w-12'
            )} />
          )}
          <div className="flex-1 space-y-2">
            {title && (
              <div 
                className={cn(baseClasses, 'h-4')}
                style={{ width: titleConfig.width }}
              />
            )}
            {paragraph && (
              <div className="space-y-2">
                {Array.from({ length: paragraphConfig.rows || 3 }).map((_, i) => {
                  const widths = paragraphConfig.width;
                  let width = '100%';
                  
                  if (Array.isArray(widths)) {
                    width = widths[i] || '100%';
                  } else if (typeof widths === 'string' || typeof widths === 'number') {
                    width = widths;
                  } else if (i === (paragraphConfig.rows || 3) - 1) {
                    width = '60%'; // Last line is shorter
                  }
                  
                  return (
                    <div 
                      key={i}
                      className={cn(baseClasses, 'h-3')}
                      style={{ width }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

interface EmptyProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const Empty = forwardRef<HTMLDivElement, EmptyProps>(
  ({ 
    icon,
    title = 'No data',
    description,
    action,
    className,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="mb-4 text-gray-400">
            {React.cloneElement(icon as React.ReactElement, {
              className: 'h-16 w-16'
            })}
          </div>
        )}
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            {description}
          </p>
        )}
        {action && action}
      </div>
    );
  }
);

Empty.displayName = 'Empty';

// =============================================================================
// EXPORTS
// =============================================================================

export {
  ToastProvider,
  useToast,
  Alert,
  Progress,
  Loading,
  Skeleton,
  Empty,
};

// Export types
export type {
  LoadingProps,
  EmptyProps,
};
