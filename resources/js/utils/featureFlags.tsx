/**
 * Feature Flags Utility for Frontend
 * Manages feature flags for different deployment environments
 */

interface FeatureFlags {
  pwa: boolean;
  offlineSupport: boolean;
  pushNotifications: boolean;
  realTimeCollaboration: boolean;
  advancedReporting: boolean;
  mobileApp: boolean;
  multiCurrency: boolean;
  inventoryManagement: boolean;
  integrationServices: boolean;
  performanceMonitoring: boolean;
  realTimeStockUpdates: boolean;
  realTimeFinancialUpdates: boolean;
  reportScheduling: boolean;
  emailReports: boolean;
  twoFactorAuth: boolean;
  dataExport: boolean;
  bulkOperations: boolean;
  advancedSearch: boolean;
  customFields: boolean;
  workflowAutomation: boolean;
  thirdPartyIntegrations: boolean;
}

// Default feature flags (can be overridden by server-side data)
const defaultFeatures: FeatureFlags = {
  pwa: true,
  offlineSupport: false,
  pushNotifications: false,
  realTimeCollaboration: true,
  advancedReporting: true,
  mobileApp: true,
  multiCurrency: true,
  inventoryManagement: true,
  integrationServices: true,
  performanceMonitoring: true,
  realTimeStockUpdates: false,
  realTimeFinancialUpdates: true,
  reportScheduling: true,
  emailReports: true,
  twoFactorAuth: true,
  dataExport: true,
  bulkOperations: true,
  advancedSearch: true,
  customFields: true,
  workflowAutomation: false,
  thirdPartyIntegrations: true,
};

// Cloud deployment profile (simplified features)
const cloudProfile: FeatureFlags = {
  pwa: false,
  offlineSupport: false,
  pushNotifications: false,
  realTimeCollaboration: false,
  advancedReporting: false,
  mobileApp: false,
  multiCurrency: false,
  inventoryManagement: true,
  integrationServices: false,
  performanceMonitoring: false,
  realTimeStockUpdates: false,
  realTimeFinancialUpdates: true,
  reportScheduling: false,
  emailReports: true,
  twoFactorAuth: true,
  dataExport: true,
  bulkOperations: true,
  advancedSearch: false,
  customFields: false,
  workflowAutomation: false,
  thirdPartyIntegrations: false,
};

// Forge deployment profile (moderate features)
const forgeProfile: FeatureFlags = {
  pwa: true,
  offlineSupport: false,
  pushNotifications: false,
  realTimeCollaboration: false,
  advancedReporting: true,
  mobileApp: false,
  multiCurrency: false,
  inventoryManagement: true,
  integrationServices: true,
  performanceMonitoring: true,
  realTimeStockUpdates: false,
  realTimeFinancialUpdates: true,
  reportScheduling: true,
  emailReports: true,
  twoFactorAuth: true,
  dataExport: true,
  bulkOperations: true,
  advancedSearch: true,
  customFields: true,
  workflowAutomation: false,
  thirdPartyIntegrations: true,
};

class FeatureFlagManager {
  private features: FeatureFlags;
  private profile: string;

  constructor() {
    this.profile = this.detectDeploymentProfile();
    this.features = this.getProfileFeatures();
    this.loadServerFeatures();
  }

  /**
   * Detect deployment profile based on environment
   */
  private detectDeploymentProfile(): string {
    const url = window.location.hostname;
    
    if (url.includes('laravel.cloud')) {
      return 'cloud';
    }
    
    if (window.FORGE_DEPLOYMENT) {
      return 'forge';
    }
    
    return 'enterprise';
  }

  /**
   * Get features for current profile
   */
  private getProfileFeatures(): FeatureFlags {
    switch (this.profile) {
      case 'cloud':
        return { ...cloudProfile };
      case 'forge':
        return { ...forgeProfile };
      default:
        return { ...defaultFeatures };
    }
  }

  /**
   * Load feature flags from server
   */
  private async loadServerFeatures(): Promise<void> {
    try {
      const response = await fetch('/api/features');
      if (response.ok) {
        const serverFeatures = await response.json();
        this.features = { ...this.features, ...serverFeatures };
      }
    } catch (error) {
      console.warn('Failed to load server feature flags, using defaults:', error);
    }
  }

  /**
   * Check if a feature is enabled
   */
  public isEnabled(feature: keyof FeatureFlags): boolean {
    return this.features[feature] || false;
  }

  /**
   * Check if a feature is disabled
   */
  public isDisabled(feature: keyof FeatureFlags): boolean {
    return !this.isEnabled(feature);
  }

  /**
   * Get all enabled features
   */
  public getEnabledFeatures(): Partial<FeatureFlags> {
    const enabled: Partial<FeatureFlags> = {};
    Object.entries(this.features).forEach(([key, value]) => {
      if (value) {
        enabled[key as keyof FeatureFlags] = value;
      }
    });
    return enabled;
  }

  /**
   * Get current deployment profile
   */
  public getProfile(): string {
    return this.profile;
  }

  /**
   * Get all features
   */
  public getAllFeatures(): FeatureFlags {
    return { ...this.features };
  }

  /**
   * Update features (for testing or dynamic updates)
   */
  public updateFeatures(newFeatures: Partial<FeatureFlags>): void {
    this.features = { ...this.features, ...newFeatures };
  }
}

// Create singleton instance
const featureFlags = new FeatureFlagManager();

// Export convenience functions
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlags.isEnabled(feature);
};

export const isFeatureDisabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlags.isDisabled(feature);
};

export const getEnabledFeatures = (): Partial<FeatureFlags> => {
  return featureFlags.getEnabledFeatures();
};

export const getDeploymentProfile = (): string => {
  return featureFlags.getProfile();
};

export const getAllFeatures = (): FeatureFlags => {
  return featureFlags.getAllFeatures();
};

// Export types
export type { FeatureFlags };

// Export manager instance for advanced usage
export { featureFlags as FeatureFlagManager };

// React hook for feature flags
export const useFeatureFlag = (feature: keyof FeatureFlags): boolean => {
  return featureFlags.isEnabled(feature);
};

// React hook for multiple features
export const useFeatureFlags = (features: (keyof FeatureFlags)[]): Record<string, boolean> => {
  const result: Record<string, boolean> = {};
  features.forEach(feature => {
    result[feature] = featureFlags.isEnabled(feature);
  });
  return result;
};

// Conditional component wrapper
export const FeatureGate: React.FC<{
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ feature, children, fallback = null }) => {
  return featureFlags.isEnabled(feature) ? <>{children}</> : <>{fallback}</>;
};

export default featureFlags;
