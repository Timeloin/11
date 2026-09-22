export type Role = 'superadmin' | 'admin' | 'manager' | 'sales' | 'inventory' | 'viewer';

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
  isReadOnly?: boolean;
}

export interface UserSession {
  userId: string;
  name: string;
  userName?: string;
  email: string;
  activeTeamId?: string;
  role?: Role;
  isSuperAdmin?: boolean;
  permissions?: CustomPermissions;
  subscription?: {
    type: 'days' | 'lifetime';
    expiresAt?: string;
    isRevoked: boolean;
    daysRemaining?: number;
    isValid: boolean;
  };
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
  password?: string;
  role: Role;
  customPermissions?: CustomPermissions;
  status: 'active' | 'invited' | 'suspended';
  joinedAt: string;
}

export interface ITeam {
  _id: string;
  name: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  inviteCode: string;
  currency: string;
  lowStockThresholdDefault: number;
  subscriptionType: 'days' | 'lifetime';
  subscriptionDays?: number;
  subscriptionExpiresAt?: string;
  isAccessRevoked: boolean;
  appIcon?: string;
  createdAt: string;
}

export interface ISubAdminInfo {
  userId: string;
  name: string;
  email: string;
  teamId: string;
  shopName: string;
  subscriptionType: 'days' | 'lifetime';
  subscriptionExpiresAt?: string;
  isAccessRevoked: boolean;
  daysRemaining: number;
  isValid: boolean;
  membersCount: number;
  itemsCount: number;
  createdAt: string;
}
