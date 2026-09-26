/**
 * Inventory API Service
 * Handles all inventory-related API calls with GraphQL integration
 */

import { apolloClient } from '../../../shared/services/graphql/apolloClient';
import { gql } from '@apollo/client';
import type { InventoryItem, StockMovement, InventoryFilters } from '../stores/inventoryModel';
import type { ApiResponse } from '@/shared/types';
import type { ApolloCache } from '@apollo/client';

// GraphQL Queries
const GET_INVENTORY_ITEMS = gql`
  query GetInventoryItems($filters: InventoryFiltersInput) {
    inventoryItems(filters: $filters) {
      id
      sku
      name
      description
      category
      subcategory
      unitPrice
      costPrice
      stockQuantity
      minStockLevel
      maxStockLevel
      reorderPoint
      unit
      barcode
      supplier {
        id
        name
        contactInfo
      }
      warehouse {
        id
        name
        location
      }
      status
      tags
      images
      createdAt
      updatedAt
    }
  }
`;

const GET_STOCK_MOVEMENTS = gql`
  query GetStockMovements($filters: InventoryFiltersInput) {
    stockMovements(filters: $filters) {
      id
      itemId
      item {
        id
        sku
        name
        unit
      }
      type
      quantity
      unitPrice
      totalValue
      reason
      reference
      warehouseId
      warehouse {
        id
        name
      }
      createdBy
      createdAt
    }
  }
`;

const GET_CATEGORIES = gql`
  query GetInventoryCategories {
    inventoryCategories {
      name
      subcategories
    }
  }
`;

const GET_WAREHOUSES = gql`
  query GetWarehouses {
    warehouses {
      id
      name
      location
      capacity
      currentStock
    }
  }
`;

// GraphQL Mutations
const CREATE_INVENTORY_ITEM = gql`
  mutation CreateInventoryItem($input: CreateInventoryItemInput!) {
    createInventoryItem(input: $input) {
      id
      sku
      name
      description
      category
      subcategory
      unitPrice
      costPrice
      stockQuantity
      minStockLevel
      maxStockLevel
      reorderPoint
      unit
      barcode
      supplier {
        id
        name
        contactInfo
      }
      warehouse {
        id
        name
        location
      }
      status
      tags
      images
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_INVENTORY_ITEM = gql`
  mutation UpdateInventoryItem($id: ID!, $input: UpdateInventoryItemInput!) {
    updateInventoryItem(id: $id, input: $input) {
      id
      sku
      name
      description
      category
      subcategory
      unitPrice
      costPrice
      stockQuantity
      minStockLevel
      maxStockLevel
      reorderPoint
      unit
      barcode
      supplier {
        id
        name
        contactInfo
      }
      warehouse {
        id
        name
        location
      }
      status
      tags
      images
      createdAt
      updatedAt
    }
  }
`;

const DELETE_INVENTORY_ITEM = gql`
  mutation DeleteInventoryItem($id: ID!) {
    deleteInventoryItem(id: $id) {
      success
      message
    }
  }
`;

const CREATE_STOCK_MOVEMENT = gql`
  mutation CreateStockMovement($input: CreateStockMovementInput!) {
    createStockMovement(input: $input) {
      id
      itemId
      item {
        id
        sku
        name
        stockQuantity
        unit
      }
      type
      quantity
      unitPrice
      totalValue
      reason
      reference
      warehouseId
      warehouse {
        id
        name
      }
      createdBy
      createdAt
    }
  }
`;

// API Service Class
export class InventoryApiService {
  // Inventory items methods
  async getItems(filters?: Partial<InventoryFilters>): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const { data } = await apolloClient.query({
        query: GET_INVENTORY_ITEMS,
        variables: { filters },
        fetchPolicy: 'cache-first',
      });

      return {
        data: data.inventoryItems,
        success: true,
      };
    } catch (error: any) {
      console.error('Failed to fetch inventory items:', error);
      throw new Error(error.message || 'Failed to fetch inventory items');
    }
  }

  async createItem(itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<InventoryItem>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_INVENTORY_ITEM,
        variables: { input: itemData },
        update: (cache: ApolloCache<any>, { data: mutationData }: { data: { createInventoryItem: InventoryItem } }) => {
          // Update cache with new item
          const existingItems = cache.readQuery({ query: GET_INVENTORY_ITEMS });
          if (existingItems) {
            cache.writeQuery({
              query: GET_INVENTORY_ITEMS,
              data: {
                inventoryItems: [...(existingItems as any).inventoryItems, mutationData.createInventoryItem],
              },
            });
          }
        },
      });

      return {
        data: data.createInventoryItem,
        success: true,
        message: 'Inventory item created successfully',
      };
    } catch (error: any) {
      console.error('Failed to create inventory item:', error);
      throw new Error(error.message || 'Failed to create inventory item');
    }
  }

  async updateItem(id: string, itemData: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_INVENTORY_ITEM,
        variables: { id, input: itemData },
        update: (cache: ApolloCache<any>, { data: mutationData }: { data: { updateInventoryItem: InventoryItem; } }) => {
          // Update cache
          const updatedItem = mutationData.updateInventoryItem;
          if (updatedItem) {
            const itemId = cache.identify({ __typename: 'InventoryItem', id: updatedItem.id });
            // Update each field in the item
            Object.keys(updatedItem).forEach(key => {
              // Skip __typename as it's used for identification
              if (key !== '__typename') {
                cache.modify({
                  id: itemId,
                  fields: {
                    [key]: () => updatedItem[key as keyof InventoryItem],
                  },
                });
              }
            });
          }
        },
      });

      return {
        data: data.updateInventoryItem,
        success: true,
        message: 'Inventory item updated successfully',
      };
    } catch (error: any) {
      console.error('Failed to update inventory item:', error);
      throw new Error(error.message || 'Failed to update inventory item');
    }
  }

  async deleteItem(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_INVENTORY_ITEM,
        variables: { id },
        update: (cache) => {
          // Remove from cache
          cache.evict({ id: cache.identify({ __typename: 'InventoryItem', id }) });
          cache.gc();
        },
      });

      return {
        data: data.deleteInventoryItem.success,
        success: true,
        message: data.deleteInventoryItem.message,
      };
    } catch (error: any) {
      console.error('Failed to delete inventory item:', error);
      throw new Error(error.message || 'Failed to delete inventory item');
    }
  }

  // Stock movements methods
  async getStockMovements(filters?: Partial<InventoryFilters>): Promise<ApiResponse<StockMovement[]>> {
    try {
      const { data } = await apolloClient.query({
        query: GET_STOCK_MOVEMENTS,
        variables: { filters },
        fetchPolicy: 'cache-first',
      });

      return {
        data: data.stockMovements,
        success: true,
      };
    } catch (error: any) {
      console.error('Failed to fetch stock movements:', error);
      throw new Error(error.message || 'Failed to fetch stock movements');
    }
  }

  async createStockMovement(movementData: Omit<StockMovement, 'id' | 'createdAt'>): Promise<ApiResponse<StockMovement>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_STOCK_MOVEMENT,
        variables: { input: movementData },
        update: (cache: ApolloCache<any>, { data: mutationData }: { data: { createStockMovement: StockMovement; } }) => {
          // Update cache with new movement
          const existingMovements = cache.readQuery({ query: GET_STOCK_MOVEMENTS });
          if (existingMovements) {
            cache.writeQuery({
              query: GET_STOCK_MOVEMENTS,
              data: {
                stockMovements: [mutationData.createStockMovement, ...(existingMovements as any).stockMovements],
              },
            });
          }

          // Update item stock quantity in cache
          if (mutationData.createStockMovement.item) {
            cache.modify({
              id: cache.identify({ 
                __typename: 'InventoryItem', 
                id: mutationData.createStockMovement.itemId 
              }),
              fields: {
                stockQuantity: () => mutationData.createStockMovement.item.stockQuantity,
              },
            });
          }
        },
      });

      return {
        data: data.createStockMovement,
        success: true,
        message: 'Stock movement created successfully',
      };
    } catch (error: any) {
      console.error('Failed to create stock movement:', error);
      throw new Error(error.message || 'Failed to create stock movement');
    }
  }

  // Metadata methods
  async getCategories(): Promise<ApiResponse<string[]>> {
    try {
      const { data } = await apolloClient.query({
        query: GET_CATEGORIES,
        fetchPolicy: 'cache-first',
      });

      // Flatten categories and subcategories
      const categories = data.inventoryCategories.reduce((acc: string[], category: any) => {
        acc.push(category.name);
        if (category.subcategories) {
          acc.push(...category.subcategories);
        }
        return acc;
      }, []);

      return {
        data: categories,
        success: true,
      };
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      throw new Error(error.message || 'Failed to fetch categories');
    }
  }

  async getWarehouses(): Promise<ApiResponse<Array<{ id: string; name: string; location: string }>>> {
    try {
      const { data } = await apolloClient.query({
        query: GET_WAREHOUSES,
        fetchPolicy: 'cache-first',
      });

      return {
        data: data.warehouses.map((warehouse: any) => ({
          id: warehouse.id,
          name: warehouse.name,
          location: warehouse.location,
        })),
        success: true,
      };
    } catch (error: any) {
      console.error('Failed to fetch warehouses:', error);
      throw new Error(error.message || 'Failed to fetch warehouses');
    }
  }

  // Utility methods
  async getLowStockItems(): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const response = await this.getItems({ stockLevel: 'low' });
      return response;
    } catch (error: any) {
      console.error('Failed to get low stock items:', error);
      throw new Error(error.message || 'Failed to get low stock items');
    }
  }

  async getOutOfStockItems(): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const response = await this.getItems({ stockLevel: 'out-of-stock' });
      return response;
    } catch (error: any) {
      console.error('Failed to get out of stock items:', error);
      throw new Error(error.message || 'Failed to get out of stock items');
    }
  }

  async getInventoryValue(): Promise<ApiResponse<{ totalValue: number; itemCount: number }>> {
    try {
      const response = await this.getItems();
      const items = response.data;
      
      const totalValue = items.reduce((sum, item) => sum + (item.stockQuantity * item.costPrice), 0);
      const itemCount = items.length;

      return {
        data: { totalValue, itemCount },
        success: true,
      };
    } catch (error: any) {
      console.error('Failed to calculate inventory value:', error);
      throw new Error(error.message || 'Failed to calculate inventory value');
    }
  }
}

// Create and export singleton instance
export const inventoryApi = new InventoryApiService();
