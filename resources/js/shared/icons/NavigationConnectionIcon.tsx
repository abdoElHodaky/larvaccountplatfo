/**
 * Navigation Connection Icons
 * Additional navigation icons for the application
 */

import React from 'react';
import { Bars3Icon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const LiveMenuToggleIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <Bars3Icon className={className} {...props} />
);

export const LiveBackIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ArrowLeftIcon className={className} {...props} />
);
