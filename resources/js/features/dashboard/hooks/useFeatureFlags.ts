import { useState, useEffect } from 'react';

interface FeatureFlags {
  useRestApi: boolean;
  useWebSocket: boolean;
  useMobileDashboard: boolean;
  usePWA: boolean;
  enableRealTimeUpdates: boolean;
}

const defaultFlags: FeatureFlags = {
  useRestApi: true, // Enable REST API by default
  useWebSocket: true, // Enable WebSocket by default
  useMobileDashboard: true, // Enable mobile dashboard
  usePWA: true, // Enable PWA features
  enableRealTimeUpdates: true, // Enable real-time updates
};

// Feature flags can be controlled via environment variables
const getFeatureFlagsFromEnv = (): Partial<FeatureFlags> => {
  if (typeof window === 'undefined') return {};
  
  return {
    useRestApi: import.meta.env.VITE_FEATURE_REST_API !== 'false',
    useWebSocket: import.meta.env.VITE_FEATURE_WEBSOCKET !== 'false',
    useMobileDashboard: import.meta.env.VITE_FEATURE_MOBILE_DASHBOARD !== 'false',
    usePWA: import.meta.env.VITE_FEATURE_PWA !== 'false',
    enableRealTimeUpdates: import.meta.env.VITE_FEATURE_REALTIME !== 'false',
  };
};

/**
 * Hook for managing feature flags in the dashboard
 * Allows safe rollout of new features with runtime toggles
 */
export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlags>(() => ({
    ...defaultFlags,
    ...getFeatureFlagsFromEnv(),
  }));

  useEffect(() => {
    // Listen for feature flag updates from localStorage or other sources
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboard_feature_flags' && e.newValue) {
        try {
          const updatedFlags = JSON.parse(e.newValue);
          setFlags(prev => ({ ...prev, ...updatedFlags }));
        } catch (error) {
          console.warn('Failed to parse feature flags from localStorage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check for stored feature flags on mount
    try {
      const storedFlags = localStorage.getItem('dashboard_feature_flags');
      if (storedFlags) {
        const parsedFlags = JSON.parse(storedFlags);
        setFlags(prev => ({ ...prev, ...parsedFlags }));
      }
    } catch (error) {
      console.warn('Failed to load feature flags from localStorage:', error);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateFlag = (key: keyof FeatureFlags, value: boolean) => {
    setFlags(prev => {
      const newFlags = { ...prev, [key]: value };
      
      // Persist to localStorage for consistency across tabs
      try {
        localStorage.setItem('dashboard_feature_flags', JSON.stringify(newFlags));
      } catch (error) {
        console.warn('Failed to save feature flags to localStorage:', error);
      }
      
      return newFlags;
    });
  };

  const resetFlags = () => {
    setFlags(defaultFlags);
    try {
      localStorage.removeItem('dashboard_feature_flags');
    } catch (error) {
      console.warn('Failed to clear feature flags from localStorage:', error);
    }
  };

  return {
    flags,
    updateFlag,
    resetFlags,
    // Convenience getters
    isRestApiEnabled: flags.useRestApi,
    isWebSocketEnabled: flags.useWebSocket,
    isMobileDashboardEnabled: flags.useMobileDashboard,
    isPWAEnabled: flags.usePWA,
    isRealTimeEnabled: flags.enableRealTimeUpdates,
  };
};

/**
 * Hook for checking if a specific feature is enabled
 */
export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const { flags } = useFeatureFlags();
  return flags[flag];
};

/**
 * Higher-order component for feature flag-based rendering
 */
export const withFeatureFlag = <P extends object>(
  Component: React.ComponentType<P>,
  flag: keyof FeatureFlags,
  fallback?: React.ComponentType<P>
) => {
  return (props: P) => {
    const isEnabled = useFeatureFlag(flag);
    
    if (!isEnabled && fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent {...props} />;
    }
    
    return isEnabled ? <Component {...props} /> : null;
  };
};

export type { FeatureFlags };
