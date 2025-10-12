/**
 * Navigation Icons - Phase 5
 * Animated navigation icons with HeadlessUI integration
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
import { createLiveIcon, type LiveIconProps } from './APIENDPOINTS';

// Navigation-specific animations
export const navigationAnimations = {
  slideLeft: [
    { transform: 'translateX(0)' },
    { transform: 'translateX(-4px)' },
    { transform: 'translateX(0)' }
  ],
  slideRight: [
    { transform: 'translateX(0)' },
    { transform: 'translateX(4px)' },
    { transform: 'translateX(0)' }
  ],
  slideUp: [
    { transform: 'translateY(0)' },
    { transform: 'translateY(-4px)' },
    { transform: 'translateY(0)' }
  ],
  slideDown: [
    { transform: 'translateY(0)' },
    { transform: 'translateY(4px)' },
    { transform: 'translateY(0)' }
  ],
  menuToggle: [
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(90deg)' }
  ]
} as const;

// Enhanced navigation icons
export const LiveHomeIcon = createLiveIcon(HomeIcon, 'pulse');
export const LiveChevronLeftIcon = createLiveIcon(ChevronLeftIcon, 'bounce');
export const LiveChevronRightIcon = createLiveIcon(ChevronRightIcon, 'bounce');
export const LiveChevronUpIcon = createLiveIcon(ChevronUpIcon, 'bounce');
export const LiveChevronDownIcon = createLiveIcon(ChevronDownIcon, 'bounce');
export const LiveArrowLeftIcon = createLiveIcon(ArrowLeftIcon, 'bounce');
export const LiveArrowRightIcon = createLiveIcon(ArrowRightIcon, 'bounce');

// Special menu toggle icon with enhanced animation
export const LiveMenuToggleIcon: React.FC<LiveIconProps & { isOpen?: boolean }> = ({
  isOpen = false,
  size = 'md',
  color = 'gray',
  animated = true,
  className = '',
  onClick,
  ...props
}) => {
  const iconRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    const icon = iconRef.current;
    if (!icon || !animated) return;

    const keyframes = isOpen 
      ? [{ transform: 'rotate(0deg)' }, { transform: 'rotate(90deg)' }]
      : [{ transform: 'rotate(90deg)' }, { transform: 'rotate(0deg)' }];

    const animation = icon.animate(keyframes, {
      duration: 200,
      easing: 'ease-out',
      fill: 'forwards'
    });

    return () => animation.cancel();
  }, [isOpen, animated]);

  const IconComponent = isOpen ? XMarkIcon : Bars3Icon;
  const LiveIcon = createLiveIcon(IconComponent);

  return (
    <LiveIcon
      ref={iconRef}
      size={size}
      color={color}
      animated={animated}
      className={className}
      onClick={onClick}
      {...props}
    />
  );
};

// Breadcrumb navigation component
export const LiveBreadcrumbIcon: React.FC<LiveIconProps> = (props) => {
  return (
    <LiveChevronRightIcon
      {...props}
      size="sm"
      color="secondary"
      trigger="visible"
      className="mx-2"
    />
  );
};

// Back navigation component
export const LiveBackIcon: React.FC<LiveIconProps & { label?: string }> = ({
  label = 'Back',
  ...props
}) => {
  return (
    <div className="flex items-center space-x-2 cursor-pointer group">
      <LiveArrowLeftIcon
        {...props}
        trigger="hover"
        className="group-hover:-translate-x-1 transition-transform"
      />
      {label && (
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
          {label}
        </span>
      )}
    </div>
  );
};

