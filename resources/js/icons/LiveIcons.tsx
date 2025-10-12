import React from 'react';

// Simplified live icons for real-time features
export interface IconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8'
};

// Connection Status Icons
export function ConnectionIcon({ size = 'md', className = '', animated = false }: IconProps) {
  const baseClass = `${sizeClasses[size]} ${className}`;
  const animationClass = animated ? 'animate-pulse' : '';
  
  return (
    <svg className={`${baseClass} ${animationClass}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );
}

export function DisconnectedIcon({ size = 'md', className = '', animated = false }: IconProps) {
  const baseClass = `${sizeClasses[size]} ${className}`;
  const animationClass = animated ? 'animate-bounce' : '';
  
  return (
    <svg className={`${baseClass} ${animationClass}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
    </svg>
  );
}

// Real-time Data Icons
export function LiveDataIcon({ size = 'md', className = '', animated = true }: IconProps) {
  const baseClass = `${sizeClasses[size]} ${className}`;
  const animationClass = animated ? 'animate-spin' : '';
  
  return (
    <svg className={`${baseClass} ${animationClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export function TransactionIcon({ size = 'md', className = '' }: IconProps) {
  return (
    <svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );
}

export function InventoryIcon({ size = 'md', className = '' }: IconProps) {
  return (
    <svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

export function DashboardIcon({ size = 'md', className = '' }: IconProps) {
  return (
    <svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

// Status Indicators
export function LoadingIcon({ size = 'md', className = '' }: IconProps) {
  return (
    <svg className={`${sizeClasses[size]} ${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

export function SuccessIcon({ size = 'md', className = '' }: IconProps) {
  return (
    <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );
}

export function ErrorIcon({ size = 'md', className = '' }: IconProps) {
  return (
    <svg className={`${sizeClasses[size]} ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
    </svg>
  );
}

// Notification Icons
export function NotificationIcon({ size = 'md', className = '', animated = false }: IconProps) {
  const baseClass = `${sizeClasses[size]} ${className}`;
  const animationClass = animated ? 'animate-bounce' : '';
  
  return (
    <svg className={`${baseClass} ${animationClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5V13" />
    </svg>
  );
}

// Composite Status Component
export function LiveStatus({ 
  connected, 
  loading, 
  error, 
  size = 'md' 
}: { 
  connected: boolean; 
  loading: boolean; 
  error?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <LoadingIcon size={size} className="text-yellow-500" />
        <span className="text-sm text-yellow-600">Connecting...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <ErrorIcon size={size} className="text-red-500" />
        <span className="text-sm text-red-600">Error: {error}</span>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center space-x-2">
        <ConnectionIcon size={size} className="text-green-500" animated />
        <span className="text-sm text-green-600">Live</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <DisconnectedIcon size={size} className="text-gray-500" />
      <span className="text-sm text-gray-600">Offline</span>
    </div>
  );
}

// Icon registry for easy access
export const icons = {
  connection: ConnectionIcon,
  disconnected: DisconnectedIcon,
  liveData: LiveDataIcon,
  transaction: TransactionIcon,
  inventory: InventoryIcon,
  dashboard: DashboardIcon,
  loading: LoadingIcon,
  success: SuccessIcon,
  error: ErrorIcon,
  notification: NotificationIcon,
  liveStatus: LiveStatus
};
