/**
 * Test Setup Configuration
 * Comprehensive testing environment for Alova.js, Socket.io, and React components
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { afterEach, afterAll, beforeAll, vi } from 'vitest';
import { server } from './mocks/server';

// Configure React Testing Library
configure({
    testIdAttribute: 'data-testid',
    asyncUtilTimeout: 5000,
});

// Mock environment variables
process.env.VITE_API_URL = 'http://localhost:3000/api';
process.env.VITE_WEBSOCKET_URL = 'ws://localhost:6001';

// Setup MSW (Mock Service Worker)
beforeAll(() => {
    server.listen({
        onUnhandledRequest: 'warn',
    });
});

afterEach(() => {
    server.resetHandlers();
});

afterAll(() => {
    server.close();
});

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

// Mock WebSocket
class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = MockWebSocket.CONNECTING;
    url: string;
    onopen: ((event: Event) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    constructor(url: string) {
        this.url = url;
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            if (this.onopen) {
                this.onopen(new Event('open'));
            }
        }, 100);
    }

    send(_data: string | ArrayBuffer | Blob | ArrayBufferView): void {
        // Mock send implementation
    }

    close(code?: number, reason?: string): void {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
            this.onclose(new CloseEvent('close', { code, reason }));
        }
    }

    addEventListener(type: string, listener: EventListener): void {
        if (type === 'open') this.onopen = listener as any;
        if (type === 'close') this.onclose = listener as any;
        if (type === 'message') this.onmessage = listener as any;
        if (type === 'error') this.onerror = listener as any;
    }

    removeEventListener(type: string, _listener: EventListener): void {
        if (type === 'open') this.onopen = null;
        if (type === 'close') this.onclose = null;
        if (type === 'message') this.onmessage = null;
        if (type === 'error') this.onerror = null;
    }
}

global.WebSocket = MockWebSocket as any;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    root = null;
    rootMargin = '';
    thresholds = [];

    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
        return [];
    }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock PerformanceObserver
global.PerformanceObserver = class PerformanceObserver {
    static supportedEntryTypes = ['measure', 'navigation', 'resource'];

    constructor() {}
    observe() {}
    disconnect() {}
} as any;

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
    value: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
    },
    writable: false,
});

// Mock crypto for ID generation
Object.defineProperty(global, 'crypto', {
    value: {
        getRandomValues: (arr: Uint8Array) => {
            for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        },
    },
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
});

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
    console.error = vi.fn();
    console.warn = vi.fn();
});

afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
});

// Global test utilities
export const testUtils = {
    // Wait for async operations
    waitFor: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

    // Mock user data
    mockUser: {
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        organizationId: 1,
    },

    // Mock organization data
    mockOrganization: {
        id: 1,
        name: 'Test Organization',
        slug: 'test-org',
    },

    // Mock auth token
    mockAuthToken: 'mock-jwt-token-12345',

    // Setup authenticated user
    setupAuthenticatedUser: () => {
        localStorageMock.getItem.mockImplementation((key: string) => {
            if (key === 'auth_token') return testUtils.mockAuthToken;
            if (key === 'user_id') return testUtils.mockUser.id;
            if (key === 'current_organization_id') return testUtils.mockOrganization.id.toString();
            return null;
        });
    },

    // Clear auth
    clearAuth: () => {
        localStorageMock.getItem.mockReturnValue(null);
    },

    // Mock GraphQL response
    mockGraphQLResponse: (data: any, errors?: any[]) => ({
        data,
        errors,
    }),

    // Mock Socket.io events
    mockSocketEvents: {
        connect: () => new Event('connect'),
        disconnect: (reason: string) => new CustomEvent('disconnect', { detail: reason }),
        message: (data: any) => new CustomEvent('message', { detail: data }),
    },
};

// Export for use in tests
export { localStorageMock, sessionStorageMock };
