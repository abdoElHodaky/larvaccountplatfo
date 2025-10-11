/**
 * Animated Sidebar Component - Phase 3 Integration
 * Enhanced sidebar with smooth slide animations and navigation transitions
 */

import React, { useRef, useCallback, forwardRef, useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useAnimation } from '../providers/AnimationProvider';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  current?: boolean;
  children?: NavigationItem[];
}

interface AnimatedSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  animationType?: 'slide' | 'fade' | 'scale' | 'bounce';
  className?: string;
}

export const AnimatedSidebar = forwardRef<HTMLDivElement, AnimatedSidebarProps>(({
  isOpen,
  onClose,
  animationType = 'slide',
  className = '',
  ...props
}, ref) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { animate, presets, isReducedMotion } = useAnimation();
  const { url } = usePage();

  // Navigation data
  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: '🏠',
      current: url === '/dashboard',
    },
    {
      name: 'Accounting',
      href: '/accounting',
      icon: '📊',
      current: url.startsWith('/accounting'),
      children: [
        { name: 'Chart of Accounts', href: '/accounting/accounts', icon: '📋' },
        { name: 'Transactions', href: '/accounting/transactions', icon: '💰' },
        { name: 'Journal Entries', href: '/accounting/journal', icon: '📝' },
        { name: 'Reports', href: '/accounting/reports', icon: '📈' },
      ],
    },
    {
      name: 'Invoicing',
      href: '/invoicing',
      icon: '🧾',
      current: url.startsWith('/invoicing'),
      children: [
        { name: 'Invoices', href: '/invoicing/invoices', icon: '📄' },
        { name: 'Customers', href: '/invoicing/customers', icon: '👥' },
        { name: 'Products', href: '/invoicing/products', icon: '📦' },
        { name: 'Templates', href: '/invoicing/templates', icon: '🎨' },
      ],
    },
    {
      name: 'Banking',
      href: '/banking',
      icon: '🏦',
      current: url.startsWith('/banking'),
      children: [
        { name: 'Accounts', href: '/banking/accounts', icon: '💳' },
        { name: 'Transactions', href: '/banking/transactions', icon: '💸' },
        { name: 'Reconciliation', href: '/banking/reconciliation', icon: '⚖️' },
        { name: 'Transfers', href: '/banking/transfers', icon: '🔄' },
      ],
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: '📦',
      current: url.startsWith('/inventory'),
      children: [
        { name: 'Products', href: '/inventory/products', icon: '📦' },
        { name: 'Categories', href: '/inventory/categories', icon: '🏷️' },
        { name: 'Stock Levels', href: '/inventory/stock', icon: '📊' },
        { name: 'Adjustments', href: '/inventory/adjustments', icon: '⚖️' },
      ],
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: '📈',
      current: url.startsWith('/reports'),
      children: [
        { name: 'Financial Reports', href: '/reports/financial', icon: '💰' },
        { name: 'Tax Reports', href: '/reports/tax', icon: '📋' },
        { name: 'Custom Reports', href: '/reports/custom', icon: '🎯' },
        { name: 'Analytics', href: '/reports/analytics', icon: '📊' },
      ],
    },
  ];

  const organizationNavigation: NavigationItem[] = [
    {
      name: 'Organization Settings',
      href: '/organization/settings',
      icon: '⚙️',
      current: url.startsWith('/organization/settings'),
    },
    {
      name: 'Team Management',
      href: '/organization/users',
      icon: '👥',
      current: url.startsWith('/organization/users'),
    },
    {
      name: 'Billing & Plans',
      href: '/organization/billing',
      icon: '💳',
      current: url.startsWith('/organization/billing'),
    },
    {
      name: 'Integrations',
      href: '/organization/integrations',
      icon: '🔗',
      current: url.startsWith('/organization/integrations'),
    },
  ];

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsVisible(true);
    } else {
      document.body.style.overflow = '';
      setIsVisible(false);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Animation handlers
  const handleOpen = useCallback(async () => {
    if (isReducedMotion) return;

    const sidebar = sidebarRef.current;
    const overlay = overlayRef.current;

    if (sidebar && overlay) {
      setIsAnimating(true);
      
      try {
        switch (animationType) {
          case 'slide':
            await Promise.all([
              animate(overlay, [
                { opacity: 0 },
                { opacity: 1 }
              ], { ...presets.normal }),
              animate(sidebar, [
                { transform: 'translateX(-100%)' },
                { transform: 'translateX(0%)' }
              ], { ...presets.normal })
            ]);
            break;

          case 'fade':
            await Promise.all([
              animate(overlay, [
                { opacity: 0 },
                { opacity: 1 }
              ], { ...presets.normal }),
              animate(sidebar, [
                { opacity: 0, transform: 'translateX(-20px)' },
                { opacity: 1, transform: 'translateX(0px)' }
              ], { ...presets.normal })
            ]);
            break;

          case 'scale':
            await Promise.all([
              animate(overlay, [
                { opacity: 0 },
                { opacity: 1 }
              ], { ...presets.normal }),
              animate(sidebar, [
                { opacity: 0, transform: 'translateX(-100%) scale(0.95)' },
                { opacity: 1, transform: 'translateX(0%) scale(1)' }
              ], { ...presets.spring })
            ]);
            break;

          case 'bounce':
            await Promise.all([
              animate(overlay, [
                { opacity: 0 },
                { opacity: 1 }
              ], { ...presets.normal }),
              animate(sidebar, [
                { transform: 'translateX(-100%)' },
                { transform: 'translateX(10px)' },
                { transform: 'translateX(0%)' }
              ], { ...presets.spring })
            ]);
            break;
        }
      } catch (error) {
        console.warn('Sidebar open animation failed:', error);
      } finally {
        setIsAnimating(false);
      }
    }
  }, [animate, animationType, presets, isReducedMotion]);

  const handleClose = useCallback(async () => {
    if (isAnimating) return;

    if (!isReducedMotion) {
      const sidebar = sidebarRef.current;
      const overlay = overlayRef.current;

      if (sidebar && overlay) {
        setIsAnimating(true);
        
        try {
          switch (animationType) {
            case 'slide':
              await Promise.all([
                animate(overlay, [
                  { opacity: 1 },
                  { opacity: 0 }
                ], { ...presets.fast }),
                animate(sidebar, [
                  { transform: 'translateX(0%)' },
                  { transform: 'translateX(-100%)' }
                ], { ...presets.fast })
              ]);
              break;

            case 'fade':
              await Promise.all([
                animate(overlay, [
                  { opacity: 1 },
                  { opacity: 0 }
                ], { ...presets.fast }),
                animate(sidebar, [
                  { opacity: 1, transform: 'translateX(0px)' },
                  { opacity: 0, transform: 'translateX(-20px)' }
                ], { ...presets.fast })
              ]);
              break;

            case 'scale':
              await Promise.all([
                animate(overlay, [
                  { opacity: 1 },
                  { opacity: 0 }
                ], { ...presets.fast }),
                animate(sidebar, [
                  { opacity: 1, transform: 'translateX(0%) scale(1)' },
                  { opacity: 0, transform: 'translateX(-100%) scale(0.95)' }
                ], { ...presets.fast })
              ]);
              break;

            case 'bounce':
              await Promise.all([
                animate(overlay, [
                  { opacity: 1 },
                  { opacity: 0 }
                ], { ...presets.fast }),
                animate(sidebar, [
                  { transform: 'translateX(0%)' },
                  { transform: 'translateX(-100%)' }
                ], { ...presets.fast })
              ]);
              break;
          }
        } catch (error) {
          console.warn('Sidebar close animation failed:', error);
        } finally {
          setIsAnimating(false);
        }
      }
    }

    onClose();
  }, [animate, animationType, presets, isReducedMotion, isAnimating, onClose]);

  // Trigger open animation
  useEffect(() => {
    if (isOpen && isVisible) {
      handleOpen();
    }
  }, [isOpen, isVisible, handleOpen]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  if (!isVisible) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
        onClick={handleOverlayClick}
      />

      {/* Sidebar */}
      <div
        ref={(node) => {
          sidebarRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:translate-x-0 lg:static lg:inset-0
          ${className}
        `}
        {...props}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AccountPlatform</h1>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {/* Main Navigation */}
            <div className="space-y-1">
              {navigation.map((item, index) => (
                <AnimatedNavigationItem
                  key={item.name}
                  item={item}
                  url={url}
                  index={index}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Organization Navigation */}
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Organization
              </div>
              {organizationNavigation.map((item, index) => (
                <AnimatedNavigationItem
                  key={item.name}
                  item={item}
                  url={url}
                  index={index + navigation.length}
                  isOrganization
                />
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="text-xs text-gray-500 text-center">
              © 2024 AccountPlatform
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

AnimatedSidebar.displayName = 'AnimatedSidebar';

/**
 * Animated Navigation Item Component
 */
interface AnimatedNavigationItemProps {
  item: NavigationItem;
  url: string;
  index: number;
  isOrganization?: boolean;
}

const AnimatedNavigationItem: React.FC<AnimatedNavigationItemProps> = ({
  item,
  url,
  index,
  isOrganization = false,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { animate, presets, isReducedMotion } = useAnimation();

  // Handle hover animations
  const handleMouseEnter = useCallback(async () => {
    setIsHovered(true);
    
    if (!isReducedMotion) {
      const element = itemRef.current;
      if (element) {
        try {
          await animate(element, [
            { transform: 'translateX(0px)' },
            { transform: 'translateX(4px)' }
          ], { ...presets.fast, fillMode: 'forwards' });
        } catch (error) {
          console.warn('Navigation item hover animation failed:', error);
        }
      }
    }
  }, [animate, presets, isReducedMotion]);

  const handleMouseLeave = useCallback(async () => {
    setIsHovered(false);
    
    if (!isReducedMotion) {
      const element = itemRef.current;
      if (element) {
        try {
          await animate(element, [
            { transform: 'translateX(4px)' },
            { transform: 'translateX(0px)' }
          ], { ...presets.fast, fillMode: 'forwards' });
        } catch (error) {
          console.warn('Navigation item leave animation failed:', error);
        }
      }
    }
  }, [animate, presets, isReducedMotion]);

  return (
    <div ref={itemRef}>
      <Link
        href={item.href}
        className={`
          group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
          ${item.current
            ? isOrganization
              ? 'bg-gray-100 text-gray-900'
              : 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
            : isOrganization
              ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
          }
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="mr-3 text-lg">{item.icon}</span>
        {item.name}
      </Link>
      
      {/* Sub-navigation */}
      {item.children && item.current && (
        <div className="ml-6 mt-1 space-y-1">
          {item.children.map((child, childIndex) => (
            <AnimatedSubNavigationItem
              key={child.name}
              item={child}
              url={url}
              index={childIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Animated Sub-Navigation Item Component
 */
interface AnimatedSubNavigationItemProps {
  item: NavigationItem;
  url: string;
  index: number;
}

const AnimatedSubNavigationItem: React.FC<AnimatedSubNavigationItemProps> = ({
  item,
  url,
  index,
}) => {
  const itemRef = useRef<HTMLAnchorElement>(null);
  const { animate, presets, isReducedMotion } = useAnimation();

  // Handle click animation
  const handleClick = useCallback(async () => {
    if (!isReducedMotion) {
      const element = itemRef.current;
      if (element) {
        try {
          await animate(element, [
            { transform: 'scale(1)' },
            { transform: 'scale(0.98)' },
            { transform: 'scale(1)' }
          ], { ...presets.fast });
        } catch (error) {
          console.warn('Sub-navigation item click animation failed:', error);
        }
      }
    }
  }, [animate, presets, isReducedMotion]);

  return (
    <Link
      ref={itemRef}
      href={item.href}
      className={`
        group flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150
        ${url === item.href
          ? 'bg-blue-50 text-blue-600 font-medium'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
      onClick={handleClick}
    >
      <span className="mr-3">{item.icon}</span>
      {item.name}
    </Link>
  );
};
