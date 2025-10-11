import { useState, useEffect, useRef } from 'react';
import { useMemoizedCallback } from '@/shared/hooks';

/**
 * Chart Data Management Hook
 * Performance-optimized data fetching and processing for charts
 */

export interface ChartDataOptions {
    refreshInterval?: number;
    enableRealTime?: boolean;
    cacheKey?: string;
    transformData?: (data: any[]) => any[];
    filterData?: (data: any[]) => any[];
    sortData?: (data: any[]) => any[];
}

export interface UseChartDataReturn<T = any> {
    data: T[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    updateData: (newData: T[]) => void;
    clearCache: () => void;
    lastUpdated: Date | null;
}

export function useChartData<T = any>(
    fetchFunction: () => Promise<T[]>,
    options: ChartDataOptions = {}
): UseChartDataReturn<T> {
    const { refreshInterval = 0, cacheKey, transformData, filterData, sortData } = options;

    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const cacheRef = useRef<Map<string, { data: T[]; timestamp: number }>>(new Map());
    const abortControllerRef = useRef<AbortController | null>(null);

    // Memoized data processing pipeline
    const processData = useMemoizedCallback(
        (rawData: T[]): T[] => {
            let processedData = [...rawData];

            // Apply transformations in order
            if (transformData) {
                processedData = transformData(processedData);
            }

            if (filterData) {
                processedData = filterData(processedData);
            }

            if (sortData) {
                processedData = sortData(processedData);
            }

            return processedData;
        },
        [transformData, filterData, sortData]
    );

    // Memoized cache operations
    const getCachedData = useMemoizedCallback((key: string) => {
        const cached = cacheRef.current.get(key);
        if (cached) {
            // Check if cache is still valid (5 minutes)
            const isValid = Date.now() - cached.timestamp < 5 * 60 * 1000;
            if (isValid) {
                return cached.data;
            } else {
                cacheRef.current.delete(key);
            }
        }
        return null;
    }, []);

    const setCachedData = useMemoizedCallback((key: string, data: T[]) => {
        cacheRef.current.set(key, {
            data: [...data],
            timestamp: Date.now(),
        });
    }, []);

    // Memoized fetch function with caching and error handling
    const fetchData = useMemoizedCallback(
        async (useCache = true): Promise<void> => {
            try {
                // Cancel previous request
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }

                // Create new abort controller
                abortControllerRef.current = new AbortController();

                // Check cache first
                if (useCache && cacheKey) {
                    const cachedData = getCachedData(cacheKey);
                    if (cachedData) {
                        const processedData = processData(cachedData);
                        setData(processedData);
                        setLoading(false);
                        setError(null);
                        return;
                    }
                }

                setLoading(true);
                setError(null);

                // Fetch fresh data
                const rawData = await fetchFunction();

                // Check if request was aborted
                if (abortControllerRef.current?.signal.aborted) {
                    return;
                }

                // Process and cache data
                const processedData = processData(rawData);

                if (cacheKey) {
                    setCachedData(cacheKey, rawData);
                }

                setData(processedData);
                setLastUpdated(new Date());
                setError(null);
            } catch (err) {
                if (abortControllerRef.current?.signal.aborted) {
                    return;
                }

                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to fetch chart data';
                setError(errorMessage);
                console.error('Chart data fetch error:', err);
            } finally {
                if (!abortControllerRef.current?.signal.aborted) {
                    setLoading(false);
                }
            }
        },
        [fetchFunction, cacheKey, getCachedData, setCachedData, processData]
    );

    // Memoized refresh function
    const refresh = useMemoizedCallback(async (): Promise<void> => {
        await fetchData(false); // Skip cache on manual refresh
    }, [fetchData]);

    // Memoized update function for real-time updates
    const updateData = useMemoizedCallback(
        (newData: T[]): void => {
            const processedData = processData(newData);
            setData(processedData);
            setLastUpdated(new Date());

            // Update cache
            if (cacheKey) {
                setCachedData(cacheKey, newData);
            }
        },
        [processData, cacheKey, setCachedData]
    );

    // Memoized cache clear function
    const clearCache = useMemoizedCallback((): void => {
        if (cacheKey) {
            cacheRef.current.delete(cacheKey);
        } else {
            cacheRef.current.clear();
        }
    }, [cacheKey]);

    // Initial data fetch
    useEffect(() => {
        fetchData();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchData]);

    // Set up refresh interval
    useEffect(() => {
        if (refreshInterval > 0) {
            intervalRef.current = setInterval(() => {
                fetchData();
            }, refreshInterval);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [refreshInterval, fetchData]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        data,
        loading,
        error,
        refresh,
        updateData,
        clearCache,
        lastUpdated,
    };
}

/**
 * Hook for financial time-series data
 */
export function useFinancialTimeSeriesData(
    fetchFunction: () => Promise<any[]>,
    options: ChartDataOptions = {}
) {
    return useChartData(fetchFunction, {
        ...options,
        sortData: (data) => {
            // Default sort by date/timestamp
            return data.sort((a, b) => {
                const dateA = new Date(a.date || a.timestamp || 0).getTime();
                const dateB = new Date(b.date || b.timestamp || 0).getTime();
                return dateA - dateB;
            });
        },
        transformData: (data) => {
            // Ensure financial data has proper formatting
            return data.map((item) => ({
                ...item,
                date: item.date || item.timestamp,
                // Ensure numeric values are properly typed
                ...Object.keys(item).reduce((acc, key) => {
                    if (typeof item[key] === 'string' && !isNaN(Number(item[key]))) {
                        acc[key] = Number(item[key]);
                    } else {
                        acc[key] = item[key];
                    }
                    return acc;
                }, {} as any),
            }));
        },
        ...options,
    });
}

/**
 * Hook for categorical financial data (pie charts, bar charts)
 */
export function useFinancialCategoricalData(
    fetchFunction: () => Promise<any[]>,
    options: ChartDataOptions = {}
) {
    return useChartData(fetchFunction, {
        ...options,
        transformData: (data) => {
            // Ensure categorical data has proper structure
            return data.map((item) => ({
                name: item.name || item.category || item.label,
                value: Number(item.value || item.amount || 0),
                ...item,
            }));
        },
        sortData: (data) => {
            // Default sort by value (descending)
            return data.sort((a, b) => (b.value || 0) - (a.value || 0));
        },
        ...options,
    });
}

export default useChartData;
