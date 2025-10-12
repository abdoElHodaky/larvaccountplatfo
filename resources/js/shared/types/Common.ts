/**
 * Common Shared Types
 */

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface FormErrors {
    [key: string]: string | string[];
}

export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

export interface NavigationItem {
    name: string;
    href: string;
    icon?: React.ComponentType<any>;
    current?: boolean;
    children?: NavigationItem[];
    badge?: string | number;
    permission?: string;
}

export interface BreadcrumbItem {
    name: string;
    href?: string;
    current?: boolean;
}

export interface BaseEntity {
    id: number;
    created_at: string;
    updated_at: string;
}
