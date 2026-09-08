export type Role = 'admin' | 'manager' | 'sales' | 'inventory' | 'viewer';

export interface CustomPermissions {
  canCreateItem?: boolean;
  canEditItem?: boolean;
  canDeleteItem?: boolean;
  canViewCostPrice?: boolean;
  canStockIn?: boolean;
  canStockOut?: boolean;
  canMoveStock?: boolean;
  canAdjustStock?: boolean;
  canCreatePurchase?: boolean;
  canCreateSale?: boolean;
  canCreateReturn?: boolean;
  canInventoryCount?: boolean;
  canManageMembers?: boolean;
  canManageLocations?: boolean;
  canExportData?: boolean;
  canViewAuditLogs?: boolean;
  canViewReports?: boolean;
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  activeTeamId?: string;
  role?: Role;
  permissions?: CustomPermissions;
}

export interface ILocation {
  _id: string;
  teamId: string;
  name: string;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface IStockLocation {
  locationId: string;
  locationName: string;
  quantity: number;
}

export interface IItem {
  _id: string;
  teamId: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  brand: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  minStock: number;
  barcodes: string[];
  images: string[];
  stockByLocation: IStockLocation[];
  totalStock: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'stock_in'
  | 'stock_out'
  | 'move'
  | 'adjust'
  | 'purchase'
  | 'sale'
  | 'return'
  | 'count_reconciliation';

export interface ITransactionItem {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost?: number;
  unitPrice?: number;
}

export interface IStockTransaction {
  _id: string;
  teamId: string;
  type: TransactionType;
  referenceNo: string;
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId?: string;
  toLocationName?: string;
  items: ITransactionItem[];
  totalQuantity: number;
  reason?: string;
  contactName?: string;
  invoiceNo?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface ITeamMember {
  _id: string;
  teamId: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  customPermissions?: CustomPermissions;
  status: 'active' | 'invited' | 'suspended';
  joinedAt: string;
}

export interface ITeam {
  _id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  currency: string;
  lowStockThresholdDefault: number;
  createdAt: string;
}

export interface IPurchase {
  _id: string;
  teamId: string;
  invoiceNo: string;
  supplierName: string;
  locationId: string;
  locationName: string;
  items: ITransactionItem[];
  totalAmount: number;
  status: 'received' | 'pending';
  userId: string;
  userName: string;
  createdAt: string;
}

export interface ISale {
  _id: string;
  teamId: string;
  receiptNo: string;
  customerName: string;
  locationId: string;
  locationName: string;
  items: ITransactionItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'other';
  userId: string;
  userName: string;
  createdAt: string;
}

export interface IInventoryCount {
  _id: string;
  teamId: string;
  locationId: string;
  locationName: string;
  status: 'in_progress' | 'completed' | 'applied';
  countedItems: {
    itemId: string;
    name: string;
    sku: string;
    systemStock: number;
    countedStock: number;
    difference: number;
  }[];
  notes?: string;
  userId: string;
  userName: string;
  createdAt: string;
  completedAt?: string;
}
