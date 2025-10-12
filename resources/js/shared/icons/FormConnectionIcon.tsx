/**
 * Form Connection Icons
 * Simple form icons for the application
 */

import React from 'react';
import { 
  XMarkIcon, 
  CheckIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

export interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const LiveXMarkIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <XMarkIcon className={className} {...props} />
);

export const ValidationIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <CheckIcon className={className} {...props} />
);

export const PasswordToggleIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <EyeIcon className={className} {...props} />
);

export const SearchInputIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <MagnifyingGlassIcon className={className} {...props} />
);

export const AddRemoveIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <PlusIcon className={className} {...props} />
);
