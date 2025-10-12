/**
 * Navigation Connection Icons
 * Simple navigation icons for the application
 */

import React from 'react';
import {
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

// Basic navigation icons
export const NavHomeIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <HomeIcon className={className} {...props} />
);

export const NavLeftIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ChevronLeftIcon className={className} {...props} />
);

export const NavRightIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ChevronRightIcon className={className} {...props} />
);

export const NavUpIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ChevronUpIcon className={className} {...props} />
);

export const NavDownIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ChevronDownIcon className={className} {...props} />
);

export const NavBackIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ArrowLeftIcon className={className} {...props} />
);

export const NavForwardIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ArrowRightIcon className={className} {...props} />
);

export const NavMenuIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <Bars3Icon className={className} {...props} />
);

export const NavCloseIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <XMarkIcon className={className} {...props} />
);

// Utility functions
export const createLiveIcon = (IconComponent: React.ComponentType<any>) => IconComponent;
export const DynamicIcon: React.FC<IconProps> = NavHomeIcon;
export const preloadIcons = () => {};
export const iconExists = (name: string) => true;
export const getIconSuggestions = (name: string) => [];
export const iconRegistry = {};
