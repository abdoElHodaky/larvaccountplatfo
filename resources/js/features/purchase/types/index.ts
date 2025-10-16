/**
 * Purchase Module Types
 * Type definitions for purchase orders, vendors, and procurement
 */

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  vendor?: Vendor;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId?: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity?: number;
  unit: string;
}

export interface Vendor {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: VendorAddress;
  contacts: VendorContact[];
  paymentTerms?: string;
  taxId?: string;
  isActive: boolean;
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface VendorContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  isPrimary: boolean;
}

export type PurchaseOrderStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent_to_vendor'
  | 'partially_received'
  | 'fully_received'
  | 'cancelled'
  | 'closed';

export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus[];
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CreatePurchaseOrderRequest {
  vendorId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: Omit<PurchaseOrderItem, 'id' | 'purchaseOrderId'>[];
  notes?: string;
}

export interface UpdatePurchaseOrderRequest extends Partial<CreatePurchaseOrderRequest> {
  status?: PurchaseOrderStatus;
  actualDeliveryDate?: string;
}

export interface PurchaseOrderSummary {
  totalOrders: number;
  totalAmount: number;
  pendingOrders: number;
  overdueOrders: number;
  topVendors: Array<{
    vendorId: string;
    vendorName: string;
    orderCount: number;
    totalAmount: number;
  }>;
}

