/**
 * Sales Types
 * Comprehensive types for sales management features
 */

import { BaseEntity } from '@/shared/types/common';

export interface Customer extends BaseEntity {
    organization_id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    type: 'individual' | 'business';
    status: 'active' | 'inactive';
    credit_limit?: number;
    payment_terms?: string;
    notes?: string;
    total_orders?: number;
    total_spent?: number;
    last_order_date?: string;
}

export interface SalesOrder extends BaseEntity {
    organization_id: number;
    customer_id: number;
    order_number: string;
    status: 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    order_date: string;
    due_date?: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    notes?: string;
    customer?: Customer;
    order_items?: SalesOrderItem[];
}

export interface SalesOrderItem extends BaseEntity {
    sales_order_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_amount: number;
    product?: {
        id: number;
        name: string;
        sku: string;
        price: number;
    };
}

export interface SalesStats {
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    monthlyRevenue: number;
    monthlyGrowth: number;
    topCustomers: number;
    pendingOrders: number;
}

export interface SalesTrends {
    labels: string[];
    revenue: number[];
    orders: number[];
}

export interface DashboardData {
    overview: SalesStats;
    recentOrders: SalesOrder[];
    topCustomers: Customer[];
    salesTrends: SalesTrends;
}
