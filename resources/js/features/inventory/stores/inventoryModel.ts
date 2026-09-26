/**
 * Inventory Rematch Model
 * Manages inventory items, stock levels, and warehouse operations
 */

import { createModel } from '@rematch/core';
import { PATTERNS } from '@/shared/types/PATTERNS';
import { inventoryApi } from '../services/inventoryApi';

// Types
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  unit: string; // 'piece', 'kg', 'liter', etc.
  barcode?: string;
  supplier?: {
    id: string;
    name: string;
    contactInfo: string;
  };
  warehouse?: {
    id: string;
    name: string;
    location: string;
  };
  status: 'active' | 'inactive' | 'discontinued';
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  item: InventoryItem;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  unitPrice?: number;
  totalValue: number;
  reason: string;
  reference?: string;
  warehouseId?: string;
  warehouse?: {
    id: string;
    name: string;
  };
  createdBy: string;
  createdAt: string;
}

export interface InventoryFilters {
  searchTerm: string;
  categories: string[];
  status: 'active' | 'inactive' | 'discontinued' | null;
  stockLevel: 'low' | 'normal' | 'high' | 'out-of-stock' | null;
  warehouseId: string | null;
  dateRange: {
    start: string;
    end: string;
  } | null;
  priceRange: {
    min: number;
    max: number;
  } | null;
}

export interface InventoryState {
  // Items
  items: InventoryItem[];
  selectedItem: InventoryItem | null;
  itemsLoading: boolean;

  // Stock movements
  stockMovements: StockMovement[];
  selectedMovement: StockMovement | null;
  movementsLoading: boolean;

  // Categories and metadata
  categories: string[];
  warehouses: Array<{ id: string; name: string; location: string }>;

  // UI state
  filters: InventoryFilters;
  currentView: 'items' | 'movements' | 'reports';
  error: string | null;
}

const initialFilters: InventoryFilters = {
  searchTerm: '',
  categories: [],
  status: null,
  stockLevel: null,
  warehouseId: null,
  dateRange: null,
  priceRange: null,
};

const initialState: InventoryState = {
  items: [],
  selectedItem: null,
  itemsLoading: false,
  stockMovements: [],
  selectedMovement: null,
  movementsLoading: false,
  categories: [],
  warehouses: [],
  filters: initialFilters,
  currentView: 'items',
  error: null,
};

export const inventoryModel = createModel<InventoryState>()({
  name: 'inventory',
  state: initialState,

  reducers: {
    // Items reducers
    setItems: (state, items: InventoryItem[]) => ({
      ...state,
      items,
      itemsLoading: false,
    }),

    addItem: (state, item: InventoryItem) => ({
      ...state,
      items: [...state.items, item],
    }),

    updateItem: (state, updatedItem: InventoryItem) => ({
      ...state,
      items: state.items.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      ),
    }),

    removeItem: (state, itemId: string) => ({
      ...state,
      items: state.items.filter(item => item.id !== itemId),
      selectedItem: state.selectedItem?.id === itemId ? null : state.selectedItem,
    }),

    setSelectedItem: (state, item: InventoryItem | null) => ({
      ...state,
      selectedItem: item,
    }),

    setItemsLoading: (state, loading: boolean) => ({
      ...state,
      itemsLoading: loading,
    }),

    // Stock movements reducers
    setStockMovements: (state, movements: StockMovement[]) => ({
      ...state,
      stockMovements: movements,
      movementsLoading: false,
    }),

    addStockMovement: (state, movement: StockMovement) => ({
      ...state,
      stockMovements: [movement, ...state.stockMovements],
    }),

    setSelectedMovement: (state, movement: StockMovement | null) => ({
      ...state,
      selectedMovement: movement,
    }),

    setMovementsLoading: (state, loading: boolean) => ({
      ...state,
      movementsLoading: loading,
    }),

    // Metadata reducers
    setCategories: (state, categories: string[]) => ({
      ...state,
      categories,
    }),

    setWarehouses: (state, warehouses: Array<{ id: string; name: string; location: string }>) => ({
      ...state,
      warehouses,
    }),

    // UI state reducers
    updateFilters: (state, newFilters: Partial<InventoryFilters>) => ({
      ...state,
      filters: { ...state.filters, ...newFilters },
    }),

    resetFilters: (state) => ({
      ...state,
      filters: initialFilters,
    }),

    setCurrentView: (state, view: 'items' | 'movements' | 'reports') => ({
      ...state,
      currentView: view,
    }),

    setError: (state, error: string | null) => ({
      ...state,
      error,
      itemsLoading: false,
      movementsLoading: false,
    }),

    clearError: (state) => ({
      ...state,
      error: null,
    }),
  },

  effects: (dispatch) => ({
    // Item effects
    async fetchItems(filters?: Partial<InventoryFilters>) {
      dispatch.inventory.setItemsLoading(true);
      dispatch.inventory.clearError();

      try {
        const response = await inventoryApi.getItems(filters);
        dispatch.inventory.setItems(response.data);
      } catch (error: any) {
        dispatch.inventory.setError(error.message || 'Failed to fetch inventory items');
      }
    },

    async createItem(itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) {
      dispatch.inventory.clearError();

      try {
        const response = await inventoryApi.createItem(itemData);
        dispatch.inventory.addItem(response.data);
        return { success: true, data: response.data };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to create inventory item';
        dispatch.inventory.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },

    async updateItem(payload: { id: string; data: Partial<InventoryItem> }) {
      dispatch.inventory.clearError();

      try {
        const response = await inventoryApi.updateItem(payload.id, payload.data);
        dispatch.inventory.updateItem({ data: payload.data, ...response.data } as InventoryItem & { data: Partial<InventoryItem> });
        return { success: true, data: response.data };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to update inventory item';
        dispatch.inventory.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },

    async deleteItem(itemId: string) {
      dispatch.inventory.clearError();

      try {
        await inventoryApi.deleteItem(itemId);
        dispatch.inventory.removeItem(itemId);
        return { success: true };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to delete inventory item';
        dispatch.inventory.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },

    // Stock movement effects
    async fetchStockMovements(filters?: Partial<InventoryFilters>) {
      dispatch.inventory.setMovementsLoading(true);
      dispatch.inventory.clearError();

      try {
        const response = await inventoryApi.getStockMovements(filters);
        dispatch.inventory.setStockMovements(response.data);
      } catch (error: any) {
        dispatch.inventory.setError(error.message || 'Failed to fetch stock movements');
      }
    },

    async createStockMovement(movementData: Omit<StockMovement, 'id' | 'createdAt'>) {
      dispatch.inventory.clearError();

      try {
        const response = await inventoryApi.createStockMovement(movementData);
        dispatch.inventory.addStockMovement(response.data);

        // Update item stock quantity
        if (response.data.item) {
          dispatch.inventory.updateItem({ data: response.data.item, ...response.data.item } as InventoryItem & { data: Partial<InventoryItem> });
        }

        return { success: true, data: response.data };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to create stock movement';
        dispatch.inventory.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },

    // Metadata effects
    async fetchCategories() {
      try {
        const response = await inventoryApi.getCategories();
        dispatch.inventory.setCategories(response.data);
      } catch (error: any) {
        console.error('Failed to fetch categories:', error);
      }
    },

    async fetchWarehouses() {
      try {
        const response = await inventoryApi.getWarehouses();
        dispatch.inventory.setWarehouses(response.data);
      } catch (error: any) {
        console.error('Failed to fetch warehouses:', error);
      }
    },

    // Initialization
    async initializeInventory() {
      await Promise.all([
        dispatch.inventory.fetchItems(),
        dispatch.inventory.fetchCategories(),
        dispatch.inventory.fetchWarehouses(),
      ]);
    },
  }),
});

export type InventoryModel = typeof inventoryModel;