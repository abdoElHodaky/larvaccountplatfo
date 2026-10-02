/**
 * Form Icons - Phase 5
 * Animated form icons with validation states and HeadlessUI integration
 */

import React from 'react';
import {
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { createLiveIcon, DynamicIcon } from './CreateLiveIcon';
import type { IconProps } from './ICONSIZES';
import { ICON_ANIMATIONS } from './ICONSIZES';

// Icon components
const iconComponents = {
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  EnvelopeIcon
};

// Mapping from icon component to registry key
const iconMap: Record<keyof typeof iconComponents, string> = {
  CheckIcon: 'status-success',
  XMarkIcon: 'nav-close',
  ExclamationTriangleIcon: 'status-warning',
  InformationCircleIcon: 'status-info',
  EyeIcon: 'action-view',
  EyeSlashIcon: 'action-eye-slash',
  MagnifyingGlassIcon: 'form-search',
  PlusIcon: 'action-add',
  MinusIcon: 'action-minus',
  CalendarIcon: 'form-calendar',
  ClockIcon: 'form-clock',
  UserIcon: 'form-user',
  EnvelopeIcon: 'form-email'
};

// Form-specific animations
export const formAnimations = {
  checkmark: [
    { transform: 'scale(0) rotate(0deg)', opacity: 0 },
    { transform: 'scale(1.2) rotate(180deg)', opacity: 1 },
    { transform: 'scale(1) rotate(180deg)', opacity: 1 }
  ],
  error: [
    { transform: 'scale(1) rotate(0deg)' },
    { transform: 'scale(1.1) rotate(-5deg)' },
    { transform: 'scale(1.1) rotate(5deg)' },
    { transform: 'scale(1) rotate(0deg)' }
  ],
  warning: [
    { transform: 'scale(1)' },
    { transform: 'scale(1.1)' },
    { transform: 'scale(1)' }
  ],
  toggle: [
    { transform: 'rotateY(0deg)' },
    { transform: 'rotateY(180deg)' }
  ] as Keyframe[]
};

// Basic form icons - using iconRegistry for dynamic loading
export const LiveCheckIcon = createLiveIcon(iconMap.CheckIcon, 'success');
export const LiveXMarkIcon = createLiveIcon(iconMap.XMarkIcon, 'error');
export const LiveExclamationIcon = createLiveIcon(iconMap.ExclamationTriangleIcon, 'shake');
export const LiveInfoIcon = createLiveIcon(iconMap.InformationCircleIcon, 'pulse');
export const LiveSearchIcon = createLiveIcon(iconMap.MagnifyingGlassIcon, 'pulse');
export const LivePlusIcon = createLiveIcon(iconMap.PlusIcon, 'bounce');
export const LiveMinusIcon = createLiveIcon(iconMap.MinusIcon, 'bounce');
export const LiveCalendarIcon = createLiveIcon(iconMap.CalendarIcon, 'pulse');
export const LiveClockIcon = createLiveIcon(iconMap.ClockIcon, 'pulse');
export const LiveUserIcon = createLiveIcon(iconMap.UserIcon, 'pulse');
export const LiveMailIcon = createLiveIcon(iconMap.EnvelopeIcon, 'pulse');

// Validation state icon component
export const ValidationIcon: React.FC<IconProps & {
  state: 'success' | 'error' | 'warning' | 'info' | 'idle';
  message?: string;
}> = ({ state, message, size = 'sm', className = '', ...props }) => {
  const iconConfig = {
    success: { Icon: LiveCheckIcon, color: 'success' as const, animation: 'checkmark' },
    error: { Icon: LiveXMarkIcon, color: 'danger' as const, animation: 'error' },
    warning: { Icon: LiveExclamationIcon, color: 'warning' as const, animation: 'warning' },
    info: { Icon: LiveInfoIcon, color: 'primary' as const, animation: 'pulse' },
    idle: { Icon: null, color: 'gray' as const, animation: null }
  };

  const config = iconConfig[state];

  if (!config.Icon) return null;

  return (
    <div className="flex items-center space-x-1">
      <config.Icon
        size={size}
        color={config.color}
        trigger="visible"
        className={className}
        {...props}
      />
      {message && (
        <span className={`text-xs ${
          state === 'success' ? 'text-success-600' :
          state === 'error' ? 'text-danger-600' :
          state === 'warning' ? 'text-warning-600' :
          state === 'info' ? 'text-primary-600' :
          'text-gray-600'
        }`}>
          {message}
        </span>
      )}
    </div>
  );
};

// Password visibility toggle
export const PasswordToggleIcon: React.FC<IconProps & {
  isVisible: boolean;
  onToggle: () => void;
}> = ({ isVisible, onToggle, size = 'md', ...props }) => {
  const iconRef = React.useRef<SVGSVGElement>(null);

  const handleToggle = () => {
    const icon = iconRef.current;
    if (icon) {
      icon.animate(formAnimations.toggle, {
        duration: 200,
        easing: 'ease-out',
        fill: 'forwards'
      });
    }
    onToggle();
  };

  return (
    <DynamicIcon
      ref={iconRef}
      name={isVisible ? 'action-eye-slash' : 'action-view'}
      size={size}
      color="secondary"
      trigger="hover"
      onClick={handleToggle}
      className="cursor-pointer"
      {...props}
    />
  );
};

// Search input icon with loading state
export const SearchInputIcon: React.FC<IconProps & {
  isSearching?: boolean;
}> = ({ isSearching = false, size = 'md', className = '', ...props }) => {
  const iconRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    const icon = iconRef.current;
    if (!icon || !isSearching) return;

    const animation = icon.animate(ICON_ANIMATIONS.loading, {
      duration: 1000,
      easing: 'linear',
      iterations: Infinity
    });

    return () => animation.cancel();
  }, [isSearching]);

  return (
    <DynamicIcon
      ref={iconRef}
      name="magnifying-glass"
      size={size}
      color={isSearching ? 'primary' : 'secondary'}
      animated={!isSearching}
      trigger="hover"
      className={`${isSearching ? 'animate-spin' : ''} ${className}`}
      {...props}
    />
  );
};

// Add/Remove button icons
export const AddRemoveIcon: React.FC<IconProps & {
  mode: 'add' | 'remove';
  onClick: () => void;
}> = ({ mode, onClick, size = 'sm', ...props }) => {
  return (
    <div className={`
      inline-flex items-center justify-center rounded-full p-1
      ${mode === 'add' ? 'bg-success-50 hover:bg-success-100' : 'bg-danger-50 hover:bg-danger-100'}
      transition-colors cursor-pointer
    `}>
      <DynamicIcon
        name={mode === 'add' ? 'action-add' : 'action-minus'}
        size={size}
        color={mode === 'add' ? 'success' : 'danger'}
        trigger="click"
        onClick={onClick}
        {...props}
      />
    </div>
  );
};

// Form field wrapper with validation
export const FormFieldIcon: React.FC<{
  children: React.ReactNode;
  validation?: {
    state: 'success' | 'error' | 'warning' | 'info' | 'idle';
    message?: string;
  };
  icon?: React.ComponentType<IconProps>;
  iconProps?: IconProps;
}> = ({ children, validation, icon: Icon, iconProps = {} }) => {
  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {Icon && (
          <Icon
            size="sm"
            color="secondary"
            trigger="hover"
            {...iconProps}
          />
        )}
        <div className="flex-1">{children}</div>
        {validation && validation.state !== 'idle' && (
          <ValidationIcon
            state={validation.state}
            message={validation.message}
          />
        )}
      </div>
    </div>
  );
};

// Form icon exports
export const FormSearchIcon = LiveSearchIcon;
export const FormFilterIcon = LiveSearchIcon; // Placeholder - using SearchIcon for now
export const FormCalendarIcon = LiveCalendarIcon;
export const FormClockIcon = LiveClockIcon;
export const FormUserIcon = LiveUserIcon;
export const FormEmailIcon = LiveMailIcon;