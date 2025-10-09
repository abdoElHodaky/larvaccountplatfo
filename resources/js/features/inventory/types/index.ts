/**
 * Inventory Types
 * Comprehensive types for inventory management features
 */

import { BaseEntity } from '@/shared/types/common';

export interface Product extends BaseEntity {
    organization_id: number;
    name: string;
    sku: string;
    description?: string;
    price: number;
    cost: number;
    category_id?: number;
    category?: ProductCategory;
    stock_levels?: StockLevel[];
    stock_movements?: StockMovement[];
    low_stock_threshold: number;
    is_active: boolean;
    metadata?: Record<string, any>;
    total_stock?: number;
    is_low_stock?: boolean;
}

export interface ProductCategory extends BaseEntity {
    organization_id: number;
    name: string;
    description?: string;
    parent_id?: number;
    parent?: ProductCategory;
    children?: ProductCategory[];
    is_active: boolean;
}

export interface StockLevel extends BaseEntity {
    product_id: number;
    warehouse_id: number;
    quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    product?: Product;
    warehouse?: Warehouse;
}

export interface StockMovement extends BaseEntity {
    product_id: number;
    warehouse_id: number;
    type: 'in' | 'out' | 'adjustment' | 'transfer';
    quantity: number;
    reference?: string;
    notes?: string;
    created_by: number;
    product?: Product;
    warehouse?: Warehouse;
}

export interface Warehouse extends BaseEntity {
    organization_id: number;
    name: string;
    code: string;
    address?: string;
    is_active: boolean;
    is_default: boolean;
}

export interface InventoryStats {
    totalProducts: number;
    totalCategories: number;
    totalWarehouses: number;
    lowStockProducts: number;
    totalStockValue: number;
    totalStockQuantity: number;
    recentMovements: number;
}

export interface DashboardData {
    products: Product[];
    lowStockProducts: Product[];
    recentMovements: StockMovement[];
    categories: ProductCategory[];
    warehouses: Warehouse[];
    stats: InventoryStats;
}
