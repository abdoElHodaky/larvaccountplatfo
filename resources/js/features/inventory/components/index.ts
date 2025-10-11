/**
 * Inventory Components - Phase 9 Structure
 * Re-export all inventory components
 */

// Basic inventory components structure
export { default as InventoryList } from './organisms/InventoryList';
export { default as ItemForm } from './molecules/ItemForm';
export { default as StockAlert } from './atoms/StockAlert';

// Types
export type { InventoryItem, StockLevel } from '../types';
