// Shared constants
export const API_ENDPOINTS = {
    ACCOUNTS: '/api/accounts',
    TRANSACTIONS: '/api/transactions',
    REPORTS: '/api/reports',
    USERS: '/api/users',
    ORGANIZATIONS: '/api/organizations',
} as const;

export const ROUTES = {
    DASHBOARD: '/dashboard',
    ACCOUNTS: '/accounts',
    TRANSACTIONS: '/transactions',
    REPORTS: '/reports',
    SETTINGS: '/settings',
} as const;

export const COLORS = {
    PRIMARY: '#3B82F6',
    SECONDARY: '#6B7280',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#06B6D4',
} as const;

export const BREAKPOINTS = {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
} as const;
