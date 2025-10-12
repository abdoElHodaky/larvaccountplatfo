/**
 * Status Connection Icons
 * Simple status icons for the application
 */

import React from 'react';
import { 
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  DocumentIcon,
  BuildingLibraryIcon,
  ArchiveBoxIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon,
  CogIcon,
  GiftIcon,
  BuildingOfficeIcon,
  RocketLaunchIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

export interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const LiveInfoIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <InformationCircleIcon className={className} {...props} />
);

export const LiveWarningIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ExclamationTriangleIcon className={className} {...props} />
);

export const LiveErrorIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <XCircleIcon className={className} {...props} />
);

export const LiveSuccessIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <CheckCircleIcon className={className} {...props} />
);

// Additional status icons
export const StatusChartIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ChartBarIcon className={className} {...props} />
);

export const StatusDocumentIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <DocumentIcon className={className} {...props} />
);

export const StatusBankIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <BuildingLibraryIcon className={className} {...props} />
);

export const StatusBoxIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ArchiveBoxIcon className={className} {...props} />
);

export const StatusTrendUpIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ArrowTrendingUpIcon className={className} {...props} />
);

export const StatusTrendDownIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ArrowTrendingDownIcon className={className} {...props} />
);

export const StatusTrendRightIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ArrowRightIcon className={className} {...props} />
);

export const ActionSettingsIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <CogIcon className={className} {...props} />
);

export const StatusFreeIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <GiftIcon className={className} {...props} />
);

export const StatusBusinessIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <BuildingOfficeIcon className={className} {...props} />
);

export const StatusEnterpriseIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <RocketLaunchIcon className={className} {...props} />
);

export const StatusWaveIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <SignalIcon className={className} {...props} />
);

// Status components
export const StatusIndicator: React.FC<IconProps> = LiveInfoIcon;
export const ConnectionStatus: React.FC<IconProps> = LiveInfoIcon;
export const BatteryStatus: React.FC<IconProps> = LiveInfoIcon;
export const ProgressStatus: React.FC<IconProps> = LiveInfoIcon;
