/**
 * Organization Utilities
 * Multi-tenant organization management utilities
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Local storage keys
const CURRENT_ORG_ID_KEY = 'current_organization_id';
const CURRENT_ORG_KEY = 'current_organization';

/**
 * Get the current organization ID from localStorage
 */
export function getCurrentOrganizationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_ORG_ID_KEY);
}

/**
 * Set the current organization ID in localStorage
 */
export function setCurrentOrganizationId(orgId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_ORG_ID_KEY, orgId);
}

/**
 * Clear the current organization ID from localStorage
 */
export function clearCurrentOrganizationId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_ORG_ID_KEY);
}

/**
 * Get the current organization object from localStorage
 */
export function getCurrentOrganization(): Organization | null {
  if (typeof window === 'undefined') return null;
  const orgData = localStorage.getItem(CURRENT_ORG_KEY);
  return orgData ? JSON.parse(orgData) : null;
}

/**
 * Set the current organization object in localStorage
 */
export function setCurrentOrganization(org: Organization): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_ORG_KEY, JSON.stringify(org));
  setCurrentOrganizationId(org.id);
}

/**
 * Check if user has access to a specific organization
 */
export function hasOrganizationAccess(orgId: string): boolean {
  // This would typically check against user permissions
  // For now, return true if it's the current organization
  return getCurrentOrganizationId() === orgId;
}

/**
 * Generate organization-specific URL
 */
export function getOrganizationUrl(path: string, orgId?: string): string {
  const currentOrgId = orgId || getCurrentOrganizationId();
  if (!currentOrgId) return path;
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/org/${currentOrgId}/${cleanPath}`;
}

/**
 * Extract organization ID from URL
 */
export function extractOrganizationIdFromUrl(url: string): string | null {
  const match = url.match(/\/org\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Switch to a different organization
 */
export function switchOrganization(org: Organization): void {
  setCurrentOrganization(org);
  // Trigger a page reload or navigation to update the UI
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

/**
 * Get organization-specific cache key
 */
export function getOrgCacheKey(key: string, orgId?: string): string {
  const currentOrgId = orgId || getCurrentOrganizationId();
  return currentOrgId ? `${key}_org_${currentOrgId}` : key;
}
