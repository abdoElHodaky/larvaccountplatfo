/**
 * Socket.IO Event Types
 * Centralized type definitions for all real-time events
 */

// Connection Events
export interface ConnectionEvents {
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  reconnect: (attemptNumber: number) => void;
  reconnect_attempt: (attemptNumber: number) => void;
  reconnect_error: (error: Error) => void;
  reconnect_failed: () => void;
  auth_error: (error: { message: string; code: string }) => void;
}

// Room Events
export interface RoomEvents {
  join_room: (room: string) => void;
  leave_room: (room: string) => void;
  room_joined: (room: string) => void;
  room_left: (room: string) => void;
  room_error: (error: { room: string; message: string }) => void;
}

// Dashboard Events
export interface DashboardEvents {
  'dashboard:metrics_updated': (data: {
    organizationId: string;
    metrics: {
      totalRevenue: number;
      totalExpenses: number;
      netIncome: number;
      cashFlow: number;
      accountsReceivable: number;
      accountsPayable: number;
      bankBalance: number;
    };
    timestamp: string;
  }) => void;

  'dashboard:widget_updated': (data: {
    organizationId: string;
    widgetId: string;
    widget: {
      id: string;
      type: string;
      title: string;
      data: any;
      configuration: Record<string, any>;
    };
    timestamp: string;
  }) => void;

  'dashboard:widget_position_updated': (data: {
    organizationId: string;
    widgetId: string;
    position: { x: number; y: number; width: number; height: number };
    timestamp: string;
  }) => void;

  'dashboard:widget_added': (data: {
    organizationId: string;
    widget: {
      id: string;
      type: string;
      title: string;
      position: { x: number; y: number; width: number; height: number };
      configuration: Record<string, any>;
    };
    timestamp: string;
  }) => void;

  'dashboard:widget_removed': (data: {
    organizationId: string;
    widgetId: string;
    timestamp: string;
  }) => void;
}

// Accounting Events
export interface AccountingEvents {
  'accounting:transaction_created': (data: {
    organizationId: string;
    transaction: {
      id: string;
      date: string;
      reference: string;
      description: string;
      amount: number;
      type: 'debit' | 'credit';
      accountId: string;
      account: {
        id: string;
        name: string;
        code: string;
      };
    };
    timestamp: string;
  }) => void;

  'accounting:transaction_updated': (data: {
    organizationId: string;
    transaction: {
      id: string;
      date: string;
      reference: string;
      description: string;
      amount: number;
      type: 'debit' | 'credit';
      accountId: string;
    };
    changes: Record<string, any>;
    timestamp: string;
  }) => void;

  'accounting:transaction_deleted': (data: {
    organizationId: string;
    transactionId: string;
    accountId: string;
    timestamp: string;
  }) => void;

  'accounting:account_balance_updated': (data: {
    organizationId: string;
    account: {
      id: string;
      code: string;
      name: string;
      balance: number;
      previousBalance: number;
      balanceChange: number;
    };
    timestamp: string;
  }) => void;

  'accounting:journal_entry_posted': (data: {
    organizationId: string;
    journalEntry: {
      id: string;
      reference: string;
      description: string;
      date: string;
      totalAmount: number;
      transactionCount: number;
    };
    timestamp: string;
  }) => void;

  'accounting:reconciliation_completed': (data: {
    organizationId: string;
    reconciliation: {
      id: string;
      accountId: string;
      accountName: string;
      statementDate: string;
      reconciledTransactions: number;
      discrepancy: number;
    };
    timestamp: string;
  }) => void;
}

// Inventory Events
export interface InventoryEvents {
  'inventory:stock_updated': (data: {
    organizationId: string;
    item: {
      id: string;
      sku: string;
      name: string;
      quantity: number;
      previousQuantity: number;
      quantityChange: number;
      location?: string;
    };
    reason: 'sale' | 'purchase' | 'adjustment' | 'transfer';
    timestamp: string;
  }) => void;

  'inventory:low_stock_alert': (data: {
    organizationId: string;
    item: {
      id: string;
      sku: string;
      name: string;
      currentQuantity: number;
      minimumQuantity: number;
    };
    timestamp: string;
  }) => void;

  'inventory:item_created': (data: {
    organizationId: string;
    item: {
      id: string;
      sku: string;
      name: string;
      category: string;
      quantity: number;
      unitPrice: number;
    };
    timestamp: string;
  }) => void;
}

// Purchase Events
export interface PurchaseEvents {
  'purchase:order_created': (data: {
    organizationId: string;
    purchaseOrder: {
      id: string;
      orderNumber: string;
      vendorId: string;
      vendorName: string;
      totalAmount: number;
      status: 'draft' | 'pending' | 'approved' | 'rejected';
      itemCount: number;
    };
    timestamp: string;
  }) => void;

  'purchase:order_status_changed': (data: {
    organizationId: string;
    purchaseOrderId: string;
    orderNumber: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    timestamp: string;
  }) => void;

  'purchase:order_approved': (data: {
    organizationId: string;
    purchaseOrder: {
      id: string;
      orderNumber: string;
      vendorName: string;
      totalAmount: number;
      approvedBy: string;
    };
    timestamp: string;
  }) => void;

  'purchase:invoice_received': (data: {
    organizationId: string;
    invoice: {
      id: string;
      invoiceNumber: string;
      vendorId: string;
      vendorName: string;
      amount: number;
      dueDate: string;
      purchaseOrderId?: string;
    };
    timestamp: string;
  }) => void;
}

// User Events
export interface UserEvents {
  'user:profile_updated': (data: {
    userId: string;
    changes: Record<string, any>;
    timestamp: string;
  }) => void;

  'user:preferences_updated': (data: {
    userId: string;
    preferences: Record<string, any>;
    timestamp: string;
  }) => void;

  'user:organization_switched': (data: {
    userId: string;
    previousOrganizationId: string;
    newOrganizationId: string;
    timestamp: string;
  }) => void;
}

// Notification Events
export interface NotificationEvents {
  'notification:new': (data: {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    userId: string;
    organizationId?: string;
    actionUrl?: string;
    timestamp: string;
  }) => void;

  'notification:read': (data: {
    notificationId: string;
    userId: string;
    timestamp: string;
  }) => void;

  'notification:dismissed': (data: {
    notificationId: string;
    userId: string;
    timestamp: string;
  }) => void;
}

// System Events
export interface SystemEvents {
  'system:maintenance_scheduled': (data: {
    maintenanceId: string;
    scheduledAt: string;
    duration: number;
    message: string;
    timestamp: string;
  }) => void;

  'system:backup_completed': (data: {
    backupId: string;
    organizationId: string;
    size: number;
    duration: number;
    timestamp: string;
  }) => void;

  'system:integration_status_changed': (data: {
    integrationId: string;
    organizationId: string;
    integration: string;
    previousStatus: string;
    newStatus: string;
    timestamp: string;
  }) => void;
}

// Combined Event Types
export type AllSocketEvents = 
  & ConnectionEvents 
  & RoomEvents 
  & DashboardEvents 
  & AccountingEvents 
  & InventoryEvents 
  & PurchaseEvents 
  & UserEvents 
  & NotificationEvents 
  & SystemEvents;

// Event Categories
export const EventCategories = {
  CONNECTION: ['connect', 'disconnect', 'connect_error', 'reconnect', 'auth_error'],
  ROOM: ['join_room', 'leave_room', 'room_joined', 'room_left'],
  DASHBOARD: ['dashboard:metrics_updated', 'dashboard:widget_updated', 'dashboard:widget_added'],
  ACCOUNTING: ['accounting:transaction_created', 'accounting:account_balance_updated', 'accounting:journal_entry_posted'],
  INVENTORY: ['inventory:stock_updated', 'inventory:low_stock_alert', 'inventory:item_created'],
  PURCHASE: ['purchase:order_created', 'purchase:order_status_changed', 'purchase:invoice_received'],
  USER: ['user:profile_updated', 'user:preferences_updated', 'user:organization_switched'],
  NOTIFICATION: ['notification:new', 'notification:read', 'notification:dismissed'],
  SYSTEM: ['system:maintenance_scheduled', 'system:backup_completed', 'system:integration_status_changed']
} as const;

// Room naming conventions
export const RoomNames = {
  dashboard: (organizationId: string) => `dashboard:${organizationId}`,
  accounting: (organizationId: string) => `accounting:${organizationId}`,
  inventory: (organizationId: string) => `inventory:${organizationId}`,
  purchase: (organizationId: string) => `purchase:${organizationId}`,
  user: (userId: string) => `user:${userId}`,
  organization: (organizationId: string) => `organization:${organizationId}`,
  admin: () => 'admin'
} as const;

