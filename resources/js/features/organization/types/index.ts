/**
 * Organization Types
 * Types for organization management and administration
 */

import { BaseEntity } from '@/shared/types/common';

// Re-export from shared types
export type { Organization } from '@/shared/types/auth';

// Organization-specific types
export interface OrganizationStats {
    totalUsers: number;
    totalProjects: number;
    totalRevenue: number;
    monthlyGrowth: number;
}

export interface OrganizationActivity extends BaseEntity {
    type: string;
    description: string;
    user_name: string;
}

export interface OrganizationSettings {
    id: number;
    organization_id: number;
    timezone: string;
    date_format: string;
    currency: string;
    language: string;
    notifications_enabled: boolean;
    two_factor_required: boolean;
    created_at: string;
    updated_at: string;
}
