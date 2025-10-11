import React, { useState, useEffect, useRef } from 'react';

/**
 * useDebounce Hook
 * Debounces a value to prevent excessive updates and improve performance
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * useDebouncedCallback Hook
 * Creates a debounced version of a callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    deps: React.DependencyList = []
): T {
    const timeoutRef = useRef<NodeJS.Timeout>();
    const callbackRef = useRef<T>(callback);

    // Update callback ref when dependencies change
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback, ...deps]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedCallback = useRef<T>(((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }) as T);

    return debouncedCallback.current;
}

/**
 * useDebouncedSearch Hook
 * Specialized hook for search functionality with loading state
 */
export function useDebouncedSearch(
    searchTerm: string,
    delay: number = 300
): {
    debouncedSearchTerm: string;
    isSearching: boolean;
} {
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (searchTerm !== debouncedSearchTerm) {
            setIsSearching(true);
        }

        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setIsSearching(false);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, delay, debouncedSearchTerm]);

    return {
        debouncedSearchTerm,
        isSearching,
    };
}

/**
 * useDebouncedEffect Hook
 * Runs an effect with debounced dependencies
 */
export function useDebouncedEffect(
    effect: React.EffectCallback,
    deps: React.DependencyList,
    delay: number
): void {
    const [debouncedDeps, setDebouncedDeps] = useState(deps);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedDeps(deps);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, deps);

    useEffect(effect, debouncedDeps);
}

export default useDebounce;
