/**
 * Shared Formatters Tests
 * 
 * Tests for all shared formatting utility functions
 */

import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    formatNumber,
    formatDate,
    formatRelativeTime,
    formatPercentage,
    formatFileSize,
    formatPhoneNumber,
    truncateText,
    capitalizeFirst,
    slugify
} from '../../../shared/utils/formatters';

describe('Shared Formatters', () => {
    describe('formatCurrency', () => {
        it('should format positive numbers as currency', () => {
            expect(formatCurrency(1234.56)).toBe('$1,234.56');
            expect(formatCurrency(0)).toBe('$0.00');
            expect(formatCurrency(1000000)).toBe('$1,000,000.00');
        });

        it('should format negative numbers as currency', () => {
            expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
        });

        it('should handle different currencies', () => {
            expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
            expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56');
        });

        it('should handle different locales', () => {
            expect(formatCurrency(1234.56, 'USD', 'de-DE')).toBe('1.234,56 $');
        });
    });

    describe('formatNumber', () => {
        it('should format numbers with commas', () => {
            expect(formatNumber(1234)).toBe('1,234');
            expect(formatNumber(1234567)).toBe('1,234,567');
            expect(formatNumber(0)).toBe('0');
        });

        it('should handle decimal places', () => {
            expect(formatNumber(1234.56, 2)).toBe('1,234.56');
            expect(formatNumber(1234.567, 1)).toBe('1,234.6');
        });

        it('should handle different locales', () => {
            expect(formatNumber(1234.56, 2, 'de-DE')).toBe('1.234,56');
        });
    });

    describe('formatDate', () => {
        it('should format dates correctly', () => {
            const date = new Date('2023-12-25T10:30:00Z');
            expect(formatDate(date)).toMatch(/12\/25\/2023/);
        });

        it('should handle date strings', () => {
            expect(formatDate('2023-12-25')).toMatch(/12\/25\/2023/);
        });

        it('should handle custom formats', () => {
            const date = new Date('2023-12-25T10:30:00Z');
            expect(formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' }))
                .toMatch(/December 25, 2023/);
        });

        it('should handle different locales', () => {
            const date = new Date('2023-12-25T10:30:00Z');
            expect(formatDate(date, undefined, 'de-DE')).toMatch(/25\.12\.2023/);
        });
    });

    describe('formatRelativeTime', () => {
        it('should format recent times', () => {
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            
            expect(formatRelativeTime(fiveMinutesAgo)).toMatch(/5 minutes ago/);
        });

        it('should format future times', () => {
            const now = new Date();
            const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
            
            expect(formatRelativeTime(inOneHour)).toMatch(/in 1 hour/);
        });
    });

    describe('formatPercentage', () => {
        it('should format percentages correctly', () => {
            expect(formatPercentage(0.1234)).toBe('12.34%');
            expect(formatPercentage(0.5)).toBe('50.00%');
            expect(formatPercentage(1)).toBe('100.00%');
        });

        it('should handle custom decimal places', () => {
            expect(formatPercentage(0.1234, 1)).toBe('12.3%');
            expect(formatPercentage(0.1234, 0)).toBe('12%');
        });

        it('should handle values over 100%', () => {
            expect(formatPercentage(1.5)).toBe('150.00%');
        });
    });

    describe('formatFileSize', () => {
        it('should format bytes correctly', () => {
            expect(formatFileSize(0)).toBe('0 B');
            expect(formatFileSize(512)).toBe('512 B');
            expect(formatFileSize(1023)).toBe('1023 B');
        });

        it('should format kilobytes correctly', () => {
            expect(formatFileSize(1024)).toBe('1.0 KB');
            expect(formatFileSize(1536)).toBe('1.5 KB');
        });

        it('should format megabytes correctly', () => {
            expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
            expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
        });

        it('should format gigabytes correctly', () => {
            expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
        });

        it('should handle custom decimal places', () => {
            expect(formatFileSize(1536, 2)).toBe('1.50 KB');
            expect(formatFileSize(1536, 0)).toBe('2 KB');
        });
    });

    describe('formatPhoneNumber', () => {
        it('should format US phone numbers', () => {
            expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
            expect(formatPhoneNumber('12345678901')).toBe('+1 (234) 567-8901');
        });

        it('should handle phone numbers with existing formatting', () => {
            expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
            expect(formatPhoneNumber('+1-234-567-8901')).toBe('+1 (234) 567-8901');
        });

        it('should handle invalid phone numbers', () => {
            expect(formatPhoneNumber('123')).toBe('123');
            expect(formatPhoneNumber('')).toBe('');
        });
    });

    describe('truncateText', () => {
        it('should truncate long text', () => {
            const longText = 'This is a very long text that should be truncated';
            expect(truncateText(longText, 20)).toBe('This is a very long...');
        });

        it('should not truncate short text', () => {
            const shortText = 'Short text';
            expect(truncateText(shortText, 20)).toBe('Short text');
        });

        it('should handle custom suffix', () => {
            const longText = 'This is a very long text';
            expect(truncateText(longText, 15, ' [more]')).toBe('This is a very [more]');
        });

        it('should handle edge cases', () => {
            expect(truncateText('', 10)).toBe('');
            expect(truncateText('Test', 0)).toBe('...');
        });
    });

    describe('capitalizeFirst', () => {
        it('should capitalize first letter', () => {
            expect(capitalizeFirst('hello world')).toBe('Hello world');
            expect(capitalizeFirst('HELLO WORLD')).toBe('HELLO WORLD');
        });

        it('should handle empty strings', () => {
            expect(capitalizeFirst('')).toBe('');
        });

        it('should handle single characters', () => {
            expect(capitalizeFirst('a')).toBe('A');
            expect(capitalizeFirst('A')).toBe('A');
        });
    });

    describe('slugify', () => {
        it('should create URL-friendly slugs', () => {
            expect(slugify('Hello World')).toBe('hello-world');
            expect(slugify('This is a Test!')).toBe('this-is-a-test');
        });

        it('should handle special characters', () => {
            expect(slugify('Hello & World @ 2023')).toBe('hello-world-2023');
            expect(slugify('café résumé')).toBe('cafe-resume');
        });

        it('should handle multiple spaces and dashes', () => {
            expect(slugify('  hello   world  ')).toBe('hello-world');
            expect(slugify('hello---world')).toBe('hello-world');
        });

        it('should handle empty strings', () => {
            expect(slugify('')).toBe('');
            expect(slugify('   ')).toBe('');
        });
    });
});
