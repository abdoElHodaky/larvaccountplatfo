/**
 * Authentication and User Types
 */

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    avatar?: string;
    role?: string;
    permissions?: string[];
    created_at: string;
    updated_at: string;
}

export interface Tenant {
    id: number;
    name: string;
    slug: string;
    domain?: string;
    subdomain?: string;
    logo?: string;
    settings?: Record<string, any>;
    subscription_status?: string;
    created_at: string;
    updated_at: string;
}

export interface Organization {
    id: number;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    website?: string;
    industry?: string;
    size?: string;
    settings?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface PageProps<T extends Record<string, unknown> = Record<string, unknown>> {
    auth: {
        user: User;
        tenant?: Tenant;
        organization?: Organization;
        permissions?: string[];
    };
    flash?: {
        message?: string;
        error?: string;
        success?: string;
        warning?: string;
    };
    errors?: Record<string, string>;
    [key: string]: any;
}
