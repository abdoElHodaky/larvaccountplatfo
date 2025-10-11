/**
 * Data Display Components
 * Comprehensive data visualization and display components
 * Built with HeadlessUI and unified design patterns
 */

import React, { forwardRef, useState, useMemo, ReactNode } from 'react';
import {
    ChevronUpIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    UserIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    MinusIcon,
} from '@heroicons/react/20/solid';
import { cn, getSizeClasses, getColorClasses, formatCurrency, getTransitionClasses } from './utils';
import {
    TableProps,
    TableColumn,
    CardProps,
    BadgeProps,
    AvatarProps,
    Size,
    ColorScheme,
} from './types';

// =============================================================================
// DATA TABLE COMPONENT
// =============================================================================

export function DataTable<T = any>({
    columns,
    data,
    loading = false,
    pagination,
    rowKey = 'id',
    onRow,
    scroll,
    size = 'md',
    className,
    ...props
}: TableProps<T>) {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');

    const sizeStyles = getSizeClasses(size);

    // Handle sorting
    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    // Process data with sorting and filtering
    const processedData = useMemo(() => {
        let result = [...data];

        // Apply search
        if (searchQuery) {
            result = result.filter((item) =>
                Object.values(item as any).some((value) =>
                    String(value).toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        }

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                result = result.filter((item) =>
                    String((item as any)[key])
                        .toLowerCase()
                        .includes(value.toLowerCase())
                );
            }
        });

        // Apply sorting
        if (sortColumn) {
            result.sort((a, b) => {
                const aValue = (a as any)[sortColumn];
                const bValue = (b as any)[sortColumn];

                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, sortColumn, sortDirection, filters, searchQuery]);

    const getRowKey = (record: T, index: number): string => {
        if (typeof rowKey === 'function') {
            return rowKey(record);
        }
        return String((record as any)[rowKey] || index);
    };

    if (loading) {
        return (
            <div className='animate-pulse'>
                <div className='h-10 bg-gray-200 rounded mb-4'></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className='h-12 bg-gray-100 rounded mb-2'></div>
                ))}
            </div>
        );
    }

    return (
        <div className={cn('overflow-hidden', className)} {...props}>
            {/* Search and Filters */}
            <div className='mb-4 flex flex-col sm:flex-row gap-4'>
                <div className='relative flex-1'>
                    <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <input
                        type='text'
                        placeholder='Search...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500'
                    />
                </div>
                <button className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'>
                    <FunnelIcon className='h-4 w-4' />
                    Filters
                </button>
            </div>

            {/* Table */}
            <div className='overflow-x-auto' style={scroll}>
                <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                    <thead className='bg-gray-50 dark:bg-gray-800'>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={cn(
                                        'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
                                        column.align === 'center' && 'text-center',
                                        column.align === 'right' && 'text-right'
                                    )}
                                    style={{ width: column.width }}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className='flex items-center gap-2'>
                                        {column.title}
                                        {column.sortable && (
                                            <ArrowsUpDownIcon className='h-4 w-4' />
                                        )}
                                        {sortColumn === column.key &&
                                            (sortDirection === 'asc' ? (
                                                <ChevronUpIcon className='h-4 w-4' />
                                            ) : (
                                                <ChevronDownIcon className='h-4 w-4' />
                                            ))}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className='bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700'>
                        {processedData.map((record, index) => (
                            <tr
                                key={getRowKey(record, index)}
                                className='hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                                {...(onRow ? onRow(record, index) : {})}
                            >
                                {columns.map((column) => {
                                    const value = column.dataIndex
                                        ? (record as any)[column.dataIndex]
                                        : null;
                                    const content = column.render
                                        ? column.render(value, record, index)
                                        : value;

                                    return (
                                        <td
                                            key={column.key}
                                            className={cn(
                                                'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
                                                column.align === 'center' && 'text-center',
                                                column.align === 'right' && 'text-right'
                                            )}
                                        >
                                            {content}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && typeof pagination === 'object' && (
                <div className='mt-4 flex items-center justify-between'>
                    <div className='text-sm text-gray-700 dark:text-gray-300'>
                        Showing {(pagination.current - 1) * pagination.pageSize + 1} to{' '}
                        {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
                        {pagination.total} results
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={() =>
                                pagination.onChange(pagination.current - 1, pagination.pageSize)
                            }
                            disabled={pagination.current <= 1}
                            className='p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                        >
                            <ChevronLeftIcon className='h-4 w-4' />
                        </button>
                        <span className='px-4 py-2 text-sm'>
                            Page {pagination.current} of{' '}
                            {Math.ceil(pagination.total / pagination.pageSize)}
                        </span>
                        <button
                            onClick={() =>
                                pagination.onChange(pagination.current + 1, pagination.pageSize)
                            }
                            disabled={
                                pagination.current >=
                                Math.ceil(pagination.total / pagination.pageSize)
                            }
                            className='p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                        >
                            <ChevronRightIcon className='h-4 w-4' />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// CARD COMPONENT
// =============================================================================

export const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            size = 'md',
            title,
            subtitle,
            actions,
            cover,
            hoverable = false,
            loading = false,
            children,
            className,
            ...props
        },
        ref
    ) => {
        const sizeStyles = getSizeClasses(size);

        if (loading) {
            return (
                <div className='animate-pulse bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
                    <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                    <div className='h-3 bg-gray-200 rounded w-1/2 mb-4'></div>
                    <div className='space-y-2'>
                        <div className='h-3 bg-gray-200 rounded'></div>
                        <div className='h-3 bg-gray-200 rounded w-5/6'></div>
                    </div>
                </div>
            );
        }

        return (
            <div
                ref={ref}
                className={cn(
                    'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
                    hoverable &&
                        'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer',
                    getTransitionClasses('all'),
                    className
                )}
                {...props}
            >
                {cover && <div className='rounded-t-lg overflow-hidden'>{cover}</div>}

                {(title || subtitle || actions) && (
                    <div
                        className={cn(
                            'flex items-start justify-between',
                            sizeStyles.padding,
                            'border-b border-gray-200 dark:border-gray-700'
                        )}
                    >
                        <div className='flex-1 min-w-0'>
                            {title && (
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 truncate'>
                                    {title}
                                </h3>
                            )}
                            {subtitle && (
                                <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        {actions && <div className='ml-4 flex-shrink-0'>{actions}</div>}
                    </div>
                )}

                {children && <div className={sizeStyles.padding}>{children}</div>}
            </div>
        );
    }
);

Card.displayName = 'Card';

// =============================================================================
// BADGE COMPONENT
// =============================================================================

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    (
        {
            size = 'md',
            colorScheme = 'primary',
            count,
            dot = false,
            showZero = false,
            offset,
            children,
            className,
            ...props
        },
        ref
    ) => {
        const sizeStyles = getSizeClasses(size);
        const colorStyles = getColorClasses(colorScheme);

        if (dot) {
            return (
                <span className='relative inline-block'>
                    {children}
                    <span
                        ref={ref}
                        className={cn(
                            'absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white dark:ring-gray-800',
                            colorStyles.bg,
                            className
                        )}
                        style={
                            offset
                                ? {
                                      transform: `translate(${offset[0]}px, ${offset[1]}px)`,
                                  }
                                : undefined
                        }
                        {...props}
                    />
                </span>
            );
        }

        if (count !== undefined) {
            const displayCount = count > 99 ? '99+' : count.toString();
            const shouldShow = count > 0 || showZero;

            if (!shouldShow) {
                return <>{children}</>;
            }

            return (
                <span className='relative inline-block'>
                    {children}
                    <span
                        ref={ref}
                        className={cn(
                            'absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 rounded-full',
                            colorStyles.bg,
                            className
                        )}
                        style={
                            offset
                                ? {
                                      transform: `translate(${offset[0]}px, ${offset[1]}px)`,
                                  }
                                : undefined
                        }
                        {...props}
                    >
                        {displayCount}
                    </span>
                </span>
            );
        }

        return (
            <span
                ref={ref}
                className={cn(
                    'inline-flex items-center rounded-full font-medium',
                    sizeStyles.text,
                    sizeStyles.padding,
                    colorStyles.light,
                    className
                )}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';

// =============================================================================
// AVATAR COMPONENT
// =============================================================================

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
    ({ size = 'md', src, alt, name, icon, shape = 'circle', className, ...props }, ref) => {
        const [imageError, setImageError] = useState(false);
        const sizeStyles = getSizeClasses(size);

        const getInitials = (name: string) => {
            return name
                .split(' ')
                .map((word) => word.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2);
        };

        const avatarClasses = cn(
            'inline-flex items-center justify-center font-medium text-white bg-gray-500 overflow-hidden',
            shape === 'circle' ? 'rounded-full' : 'rounded-md',
            sizeStyles.height,
            sizeStyles.height.replace('h-', 'w-'),
            sizeStyles.text,
            className
        );

        return (
            <div ref={ref} className={avatarClasses} {...props}>
                {src && !imageError ? (
                    <img
                        src={src}
                        alt={alt || name}
                        className='w-full h-full object-cover'
                        onError={() => setImageError(true)}
                    />
                ) : name ? (
                    <span>{getInitials(name)}</span>
                ) : icon ? (
                    React.cloneElement(icon as React.ReactElement, {
                        className: cn(sizeStyles.icon, 'text-white'),
                    })
                ) : (
                    <UserIcon className={cn(sizeStyles.icon, 'text-white')} />
                )}
            </div>
        );
    }
);

Avatar.displayName = 'Avatar';

// =============================================================================
// STAT COMPONENT
// =============================================================================

interface StatProps {
    title: string;
    value: string | number;
    change?: {
        value: number;
        type: 'increase' | 'decrease' | 'neutral';
        period?: string;
    };
    icon?: ReactNode;
    colorScheme?: ColorScheme;
    loading?: boolean;
    className?: string;
}

export const Stat = forwardRef<HTMLDivElement, StatProps>(
    (
        {
            title,
            value,
            change,
            icon,
            colorScheme = 'primary',
            loading = false,
            className,
            ...props
        },
        ref
    ) => {
        const colorStyles = getColorClasses(colorScheme);

        if (loading) {
            return (
                <div className='animate-pulse bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
                    <div className='h-4 bg-gray-200 rounded w-1/2 mb-2'></div>
                    <div className='h-8 bg-gray-200 rounded w-3/4 mb-2'></div>
                    <div className='h-3 bg-gray-200 rounded w-1/3'></div>
                </div>
            );
        }

        return (
            <div
                ref={ref}
                className={cn(
                    'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
                    className
                )}
                {...props}
            >
                <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                        <p className='text-sm font-medium text-gray-600 dark:text-gray-400 truncate'>
                            {title}
                        </p>
                        <p className='text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1'>
                            {typeof value === 'number' ? formatCurrency(value) : value}
                        </p>
                        {change && (
                            <div className='flex items-center mt-2'>
                                {change.type === 'increase' && (
                                    <TrendingUpIcon className='h-4 w-4 text-green-500 mr-1' />
                                )}
                                {change.type === 'decrease' && (
                                    <TrendingDownIcon className='h-4 w-4 text-red-500 mr-1' />
                                )}
                                {change.type === 'neutral' && (
                                    <MinusIcon className='h-4 w-4 text-gray-500 mr-1' />
                                )}
                                <span
                                    className={cn(
                                        'text-sm font-medium',
                                        change.type === 'increase' &&
                                            'text-green-600 dark:text-green-400',
                                        change.type === 'decrease' &&
                                            'text-red-600 dark:text-red-400',
                                        change.type === 'neutral' &&
                                            'text-gray-600 dark:text-gray-400'
                                    )}
                                >
                                    {change.value > 0 ? '+' : ''}
                                    {change.value}%
                                    {change.period && (
                                        <span className='text-gray-500 ml-1'>{change.period}</span>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className={cn('p-3 rounded-lg', colorStyles.light)}>
                            {React.cloneElement(icon as React.ReactElement, {
                                className: cn('h-6 w-6', colorStyles.text),
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

Stat.displayName = 'Stat';

// =============================================================================
// LIST COMPONENT
// =============================================================================

interface ListItem {
    key: string;
    title: string;
    description?: string;
    avatar?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    href?: string;
    onClick?: () => void;
}

interface ListProps {
    items: ListItem[];
    loading?: boolean;
    className?: string;
}

export const List = forwardRef<HTMLDivElement, ListProps>(
    ({ items, loading = false, className, ...props }, ref) => {
        if (loading) {
            return (
                <div className='animate-pulse space-y-4'>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className='flex items-center space-x-4'>
                            <div className='h-10 w-10 bg-gray-200 rounded-full'></div>
                            <div className='flex-1 space-y-2'>
                                <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                                <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div
                ref={ref}
                className={cn(
                    'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700',
                    className
                )}
                {...props}
            >
                {items.map((item) => (
                    <div
                        key={item.key}
                        className={cn(
                            'flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                            (item.href || item.onClick) && 'cursor-pointer'
                        )}
                        onClick={item.onClick}
                    >
                        <div className='flex items-center space-x-4 flex-1 min-w-0'>
                            {item.avatar && (
                                <Avatar src={item.avatar} name={item.title} size='md' />
                            )}
                            {item.icon && !item.avatar && (
                                <div className='flex-shrink-0'>
                                    {React.cloneElement(item.icon as React.ReactElement, {
                                        className: 'h-6 w-6 text-gray-400',
                                    })}
                                </div>
                            )}
                            <div className='flex-1 min-w-0'>
                                <p className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                                    {item.title}
                                </p>
                                {item.description && (
                                    <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        {item.actions && <div className='flex-shrink-0 ml-4'>{item.actions}</div>}
                    </div>
                ))}
            </div>
        );
    }
);

List.displayName = 'List';

// =============================================================================
// EXPORTS
// =============================================================================

export { DataTable, Card, Badge, Avatar, Stat, List };

// Export types
export type { StatProps, ListItem, ListProps };
