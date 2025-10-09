/**
 * Formatting Utilities
 * 
 * Common formatting functions used across the application
 */

/**
 * Format currency values
 */
export const formatCurrency = (amount: number, currency: string = 'USD', locale: string = 'en-US'): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(amount);
};

/**
 * Format numbers with locale-specific formatting
 */
export const formatNumber = (num: number, decimals?: number, locale: string = 'en-US'): string => {
    const options: Intl.NumberFormatOptions = {};
    if (decimals !== undefined) {
        options.minimumFractionDigits = decimals;
        options.maximumFractionDigits = decimals;
    }
    return new Intl.NumberFormat(locale, options).format(num);
};

/**
 * Format dates with locale-specific formatting
 */
export const formatDate = (dateString: string | Date, options?: Intl.DateTimeFormatOptions, locale: string = 'en-US'): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString(locale, options);
};

/**
 * Format date and time
 */
export const formatDateTime = (dateString: string | Date, locale: string = 'en-US'): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString(locale);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string | Date, locale: string = 'en-US'): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffInSeconds < 60) {
        return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
        return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
        return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
        return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
        return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
        return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
    return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format file sizes
 */
export const formatFileSize = (bytes: number, decimals: number = 1): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const value = bytes / Math.pow(k, i);
    
    // For bytes, don't show decimals
    if (i === 0) {
        return `${Math.round(value)} ${sizes[i]}`;
    }
    
    const formatted = decimals === 0 ? Math.round(value) : value.toFixed(decimals);
    
    return `${formatted} ${sizes[i]}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length === 0) return text;
    if (maxLength === 0) return suffix;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (text: string): string => {
    return text.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
};

/**
 * Format phone numbers
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return phoneNumber;
    
    // If already formatted, return as is
    if (phoneNumber.includes('(') && phoneNumber.includes(')')) {
        return phoneNumber;
    }
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle 11-digit numbers (with country code)
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
        }
    }
    
    // Handle 10-digit numbers
    if (cleaned.length === 10) {
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
    }
    
    return phoneNumber;
};

/**
 * Capitalize first letter of a string
 */
export const capitalizeFirst = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Create URL-friendly slug from text
 */
export const slugify = (text: string): string => {
    if (!text) return '';
    
    return text
        .toString()
        .toLowerCase()
        .trim()
        // Remove accents/diacritics
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Replace spaces and special characters with hyphens
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '');
};
