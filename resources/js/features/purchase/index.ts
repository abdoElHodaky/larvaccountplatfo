/**
 * Purchase Module
 * Handles purchase orders, vendor management, and procurement processes
 */

// Components
export { default as PurchaseOrderList } from './components/PurchaseOrderList';
export { default as PurchaseOrderForm } from './components/PurchaseOrderForm';
export { default as VendorSelector } from './components/VendorSelector';

// Pages
export { default as PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
export { default as CreatePurchaseOrderPage } from './pages/CreatePurchaseOrderPage';
export { default as VendorManagementPage } from './pages/VendorManagementPage';

// Services
export { default as purchaseService } from './services/purchaseService';
export { default as vendorService } from './services/vendorService';

// Stores
export { default as purchaseStore } from './stores/purchaseStore';

// Types
export type {
  PurchaseOrder,
  PurchaseOrderItem,
  Vendor,
  PurchaseOrderStatus,
  VendorContact
} from './types';

// Hooks
export { usePurchaseOrders } from './hooks/usePurchaseOrders';
export { useVendors } from './hooks/useVendors';
export { usePurchaseOrderForm } from './hooks/usePurchaseOrderForm';

