/**
 * Navigation Components
 * Comprehensive navigation system with sidebar, breadcrumbs, and tabs
 * Built with HeadlessUI and TailwindCSS
 */

import React, { forwardRef, ReactNode, Fragment, useState } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/20/solid';
import { cn } from './HeadlessUIComponents';

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

interface SidebarItem {
  key: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
  children?: SidebarItem[];
  onClick?: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  width?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'floating' | 'bordered';
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  collapsed = false,
  onToggle,
  width = 'md',
  variant = 'default',
  className,
}) => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const widthClasses = {
    sm: collapsed ? 'w-16' : 'w-48',
    md: collapsed ? 'w-16' : 'w-64',
    lg: collapsed ? 'w-16' : 'w-80',
  };

  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
    floating: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 m-4',
    bordered: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg',
  };

  const toggleItem = (key: string) => {
    setOpenItems(prev => 
      prev.includes(key) 
        ? prev.filter(item => item !== key)
        : [...prev, key]
    );
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems.includes(item.key);
    const paddingLeft = collapsed ? 'pl-4' : `pl-${4 + level * 4}`;

    return (
      <div key={item.key}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleItem(item.key);
            }
            item.onClick?.();
          }}
          disabled={item.disabled}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
            paddingLeft,
            item.active 
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
            item.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center min-w-0 flex-1">
            {item.icon && (
              <span className={cn(
                'flex-shrink-0',
                collapsed ? 'mr-0' : 'mr-3'
              )}>
                {item.icon}
              </span>
            )}
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </div>
          
          {!collapsed && (
            <div className="flex items-center space-x-2">
              {item.badge && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <ChevronRightIcon
                  className={cn(
                    'h-4 w-4 text-gray-400 transition-transform duration-200',
                    isOpen && 'rotate-90'
                  )}
                />
              )}
            </div>
          )}
        </button>

        {hasChildren && !collapsed && (
          <Transition
            show={isOpen}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <div className="mt-1 space-y-1">
              {item.children?.map(child => renderSidebarItem(child, level + 1))}
            </div>
          </Transition>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      'flex flex-col h-full transition-all duration-300',
      widthClasses[width],
      variantClasses[variant],
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Navigation
          </h2>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {collapsed ? (
              <Bars3Icon className="h-5 w-5" />
            ) : (
              <XMarkIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => renderSidebarItem(item))}
      </nav>
    </div>
  );
};

// =============================================================================
// BREADCRUMB COMPONENT
// =============================================================================

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  current?: boolean;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  maxItems?: number;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRightIcon className="h-4 w-4 text-gray-400" />,
  maxItems,
  className,
}) => {
  const displayItems = maxItems && items.length > maxItems
    ? [
        items[0],
        { label: '...', href: undefined, icon: undefined },
        ...items.slice(-(maxItems - 2))
      ]
    : items;

  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {displayItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 flex-shrink-0">
                {separator}
              </span>
            )}
            
            {item.href || item.onClick ? (
              <button
                onClick={item.onClick}
                className={cn(
                  'flex items-center text-sm font-medium transition-colors duration-200',
                  item.current
                    ? 'text-gray-900 dark:text-white cursor-default'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.icon && (
                  <span className="mr-2 flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            ) : (
              <span className={cn(
                'flex items-center text-sm font-medium',
                item.current
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              )}>
                {item.icon && (
                  <span className="mr-2 flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// =============================================================================
// NAVBAR COMPONENT
// =============================================================================

interface NavbarItem {
  key: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

interface NavbarProps {
  items: NavbarItem[];
  brand?: ReactNode;
  actions?: ReactNode;
  variant?: 'default' | 'transparent' | 'bordered';
  sticky?: boolean;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  items,
  brand,
  actions,
  variant = 'default',
  sticky = false,
  className,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 shadow-sm',
    transparent: 'bg-transparent',
    bordered: 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
  };

  return (
    <nav className={cn(
      'relative z-fixed',
      variantClasses[variant],
      sticky && 'sticky top-0',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand */}
          <div className="flex items-center">
            {brand}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={item.onClick}
                disabled={item.disabled}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                  item.active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {item.icon && (
                  <span className="mr-2">{item.icon}</span>
                )}
                {item.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {actions}
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Transition
        show={mobileMenuOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  item.onClick?.();
                  setMobileMenuOpen(false);
                }}
                disabled={item.disabled}
                className={cn(
                  'flex items-center w-full px-3 py-2 text-base font-medium rounded-md transition-colors duration-200',
                  item.active
                    ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {item.icon && (
                  <span className="mr-3">{item.icon}</span>
                )}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Transition>
    </nav>
  );
};

// =============================================================================
// PAGINATION COMPONENT
// =============================================================================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust if we're near the beginning or end
    if (currentPage <= halfVisible) {
      endPage = Math.min(totalPages, maxVisiblePages);
    }
    if (currentPage + halfVisible >= totalPages) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav className={cn('flex items-center justify-center space-x-1', className)}>
      {/* First page */}
      {showFirstLast && currentPage > 1 && (
        <button
          onClick={() => onPageChange(1)}
          className={cn(
            'rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            sizeClasses[size]
          )}
        >
          First
        </button>
      )}

      {/* Previous page */}
      {showPrevNext && currentPage > 1 && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className={cn(
            'rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            sizeClasses[size]
          )}
        >
          Previous
        </button>
      )}

      {/* Page numbers */}
      {visiblePages.map((page, index) => (
        <Fragment key={index}>
          {page === '...' ? (
            <span className={cn('text-gray-500', sizeClasses[size])}>
              ...
            </span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              className={cn(
                'rounded-md border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                page === currentPage
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50',
                sizeClasses[size]
              )}
            >
              {page}
            </button>
          )}
        </Fragment>
      ))}

      {/* Next page */}
      {showPrevNext && currentPage < totalPages && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className={cn(
            'rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            sizeClasses[size]
          )}
        >
          Next
        </button>
      )}

      {/* Last page */}
      {showFirstLast && currentPage < totalPages && (
        <button
          onClick={() => onPageChange(totalPages)}
          className={cn(
            'rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            sizeClasses[size]
          )}
        >
          Last
        </button>
      )}
    </nav>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Sidebar,
  Breadcrumb,
  Navbar,
  Pagination,
};

// Export types for external use
export type {
  SidebarItem,
  SidebarProps,
  BreadcrumbItem,
  BreadcrumbProps,
  NavbarItem,
  NavbarProps,
  PaginationProps,
};
