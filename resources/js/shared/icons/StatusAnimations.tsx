/**
 * Status Icons - Phase 5
 * Animated status and state icons with contextual colors
 */

import React from 'react';
import { createLiveIcon, DynamicIcon, type LiveIconProps } from './CreateLiveIcon';

// Status-specific animations
export const statusAnimations = {
  success: [
    { transform: 'scale(0.8)', opacity: 0.5 },
    { transform: 'scale(1.2)', opacity: 1 },
    { transform: 'scale(1)', opacity: 1 }
  ],
  error: [
    { transform: 'scale(1) rotate(0deg)' },
    { transform: 'scale(1.1) rotate(-10deg)' },
    { transform: 'scale(1.1) rotate(10deg)' },
    { transform: 'scale(1) rotate(0deg)' }
  ],
  warning: [
    { transform: 'scale(1)' },
    { transform: 'scale(1.15)' },
    { transform: 'scale(1)' }
  ],
  info: [
    { transform: 'scale(1)', opacity: 0.7 },
    { transform: 'scale(1.1)', opacity: 1 },
    { transform: 'scale(1)', opacity: 1 }
  ],
  loading: [
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(360deg)' }
  ],
  pulse: [
    { opacity: 0.5 },
    { opacity: 1 },
    { opacity: 0.5 }
  ]
} as const;

// Basic status icons
export const LiveSuccessIcon = createLiveIcon('status-success', 'success');
export const LiveErrorIcon = createLiveIcon('status-error', 'error');
export const LiveWarningIcon = createLiveIcon('status-warning', 'shake');
export const LiveInfoIcon = createLiveIcon('status-info', 'pulse');
export const LiveLoadingIcon = createLiveIcon('status-loading', 'loading');
export const LiveActiveIcon = createLiveIcon('status-active', 'pulse');
export const LiveSecureIcon = createLiveIcon('status-secure', 'success');

// Status icon exports for shared/icons/index.ts
export const StatusSuccessIcon = LiveSuccessIcon;
export const StatusErrorIcon = LiveErrorIcon;
export const StatusWarningIcon = LiveWarningIcon;
export const StatusInfoIcon = LiveInfoIcon;
export const StatusLoadingIcon = LiveLoadingIcon;
export const StatusChartIcon = LiveInfoIcon; // Placeholder
export const StatusDocumentIcon = LiveInfoIcon; // Placeholder
export const StatusBankIcon = LiveInfoIcon; // Placeholder
export const StatusBoxIcon = LiveInfoIcon; // Placeholder
export const StatusTrendUpIcon = LiveInfoIcon; // Placeholder
export const StatusTrendDownIcon = LiveInfoIcon; // Placeholder
export const StatusTrendRightIcon = LiveInfoIcon; // Placeholder
export const StatusFreeIcon = LiveInfoIcon; // Placeholder
export const StatusBusinessIcon = LiveInfoIcon; // Placeholder
export const StatusEnterpriseIcon = LiveInfoIcon; // Placeholder
export const StatusWaveIcon = LiveInfoIcon; // Placeholder

// Backward compatibility exports
export const SuccessIcon = LiveSuccessIcon;
export const ErrorIcon = LiveErrorIcon;
export const LoadingIcon = LiveLoadingIcon;

// Status indicator component
export const StatusIndicator: React.FC<LiveIconProps & {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'idle';
  label?: string;
  showLabel?: boolean;
  pulse?: boolean;
}> = ({ 
  status, 
  label, 
  showLabel = false, 
  pulse = false,
  size = 'md', 
  className = '',
  ...props 
}) => {
  const statusConfig = {
    success: { 
      Icon: LiveSuccessIcon, 
      color: 'success' as const, 
      bgColor: 'bg-success-50',
      textColor: 'text-success-700',
      defaultLabel: 'Success'
    },
    error: { 
      Icon: LiveErrorIcon, 
      color: 'danger' as const, 
      bgColor: 'bg-danger-50',
      textColor: 'text-danger-700',
      defaultLabel: 'Error'
    },
    warning: { 
      Icon: LiveWarningIcon, 
      color: 'warning' as const, 
      bgColor: 'bg-warning-50',
      textColor: 'text-warning-700',
      defaultLabel: 'Warning'
    },
    info: { 
      Icon: LiveInfoIcon, 
      color: 'primary' as const, 
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-700',
      defaultLabel: 'Info'
    },
    loading: { 
      Icon: LiveLoadingIcon, 
      color: 'secondary' as const, 
      bgColor: 'bg-secondary-50',
      textColor: 'text-secondary-700',
      defaultLabel: 'Loading'
    },
    idle: { 
      Icon: LiveInfoIcon, 
      color: 'gray' as const, 
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      defaultLabel: 'Idle'
    }
  };

  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`
        inline-flex items-center justify-center rounded-full p-1
        ${config.bgColor}
        ${pulse ? 'animate-pulse' : ''}
      `}>
        <config.Icon
          size={size}
          color={config.color}
          trigger={status === 'loading' ? 'always' : 'visible'}
          {...props}
        />
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${config.textColor}`}>
          {displayLabel}
        </span>
      )}
    </div>
  );
};

// Connection status component
export const ConnectionStatus: React.FC<LiveIconProps & {
  isConnected: boolean;
  strength?: 'weak' | 'medium' | 'strong';
  type?: 'wifi' | 'signal';
}> = ({
  isConnected,
  strength = 'strong',
  type = 'wifi',
  size = 'md',
  className = '',
  ...props
}) => {
  const iconName = type === 'wifi' ? 'status-wifi' : 'status-signal';
  const LiveIcon = createLiveIcon(iconName);

  const strengthColors = {
    weak: 'text-danger-500',
    medium: 'text-warning-500',
    strong: 'text-success-500'
  };

  return (
    <div className={`relative ${className}`}>
      <LiveIcon
        size={size}
        color={isConnected ? 'success' : 'danger'}
        trigger={isConnected ? 'hover' : 'always'}
        className={`
          ${isConnected ? strengthColors[strength] : 'text-danger-500'}
          ${!isConnected ? 'animate-pulse' : ''}
        `}
        {...props}
      />
      {!isConnected && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-danger-500 rounded-full animate-ping" />
      )}
    </div>
  );
};

// Battery status component
export const BatteryStatus: React.FC<LiveIconProps & {
  level: number; // 0-100
  isCharging?: boolean;
}> = ({
  level,
  isCharging = false,
  size = 'md',
  className = '',
  ...props
}) => {
  const LiveBatteryIcon = createLiveIcon('status-active');

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'success';
    if (level > 20) return 'warning';
    return 'danger';
  };

  const color = getBatteryColor(level);

  return (
    <div className={`relative ${className}`}>
      <LiveBatteryIcon
        size={size}
        color={color}
        trigger={isCharging ? 'always' : 'hover'}
        className={isCharging ? 'animate-pulse' : ''}
        {...props}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-current">
          {level}%
        </span>
      </div>
      {isCharging && (
        <DynamicIcon
          name="status-active"
          size="xs"
          color="warning"
          className="absolute -top-1 -right-1"
        />
      )}
    </div>
  );
};

// Progress status with icon
export const ProgressStatus: React.FC<LiveIconProps & {
  progress: number; // 0-100
  status?: 'active' | 'paused' | 'completed' | 'error';
  label?: string;
}> = ({
  progress,
  status = 'active',
  label,
  size = 'md',
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <LiveSuccessIcon size={size} color="success" trigger="visible" />;
      case 'error':
        return <LiveErrorIcon size={size} color="danger" trigger="visible" />;
      case 'paused':
        return <LiveInfoIcon size={size} color="warning" trigger="hover" />;
      default:
        return <LiveLoadingIcon size={size} color="primary" trigger="always" />;
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {getStatusIcon()}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              status === 'completed' ? 'bg-success-500' :
              status === 'error' ? 'bg-danger-500' :
              status === 'paused' ? 'bg-warning-500' :
              'bg-primary-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
