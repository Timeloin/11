import { IItem, ILocation, IStockTransaction, ITeam, ITeamMember, Role, CustomPermissions, IPurchase, ISale, IInventoryCount } from '@/types';
import { resolvePermissions } from './permissions';

// Pre-seeded Memory State matching the user screenshots
let demoTeams: ITeam[] = [
  {
    _id: 'team_1',
    name: 'simran mobile shop',
    ownerId: 'user_1',
    inviteCode: 'SIMRAN88',
    currency: '₹',
    lowStockThresholdDefault: 5,
    createdAt: new Date().toISOString(),
  }
];

let demoLocations: ILocation[] = [
  {
    _id: 'loc_1',
    teamId: 'team_1',
    name: 'Default Location',
    isDefault: true,
    isArchived: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'loc_2',
    teamId: 'team_1',
    name: 'Main Counter',
    isDefault: false,
    isArchived: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'loc_3',
    teamId: 'team_1',
    name: 'Back Warehouse',
    isDefault: false,
    isArchived: false,
    createdAt: new Date().toISOString(),
  }
];

let demoItems: IItem[] = [
  {
    _id: 'item_1',
    teamId: 'team_1',
    sku: 'MOB-VIVO-V29',
    name: 'vivo V29 5G (128GB, Velvet Red)',
    description: 'Smartphone with 50MP OIS camera',
    category: 'mobile phone',
    brand: 'vivo',
    unit: 'pcs',
    costPrice: 1000,
    sellingPrice: 1500,
    minStock: 5,
    barcodes: ['8901234567890', 'VIVO-V29-RED'],
    images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80'],
    stockByLocation: [
      { locationId: 'loc_1', locationName: 'Default Location', quantity: 12 },
      { locationId: 'loc_2', locationName: 'Main Counter', quantity: 3 }
    ],
    totalStock: 15,
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'item_2',
    teamId: 'team_1',
    sku: 'MOB-SAM-S24',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Flagship AI smartphone',
    category: 'mobile phone',
    brand: 'samsung',
    unit: 'pcs',
    costPrice: 85000,
    sellingPrice: 119999,
    minStock: 4,
    barcodes: ['8806091234567'],
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=400&q=80'],
    stockByLocation: [
      { locationId: 'loc_1', locationName: 'Default Location', quantity: 2 },
    ],
    totalStock: 2, // Low stock alert!
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'item_3',
    teamId: 'team_1',
    sku: 'ACC-TEMP-UNIV',
    name: '9D Tempered Glass Protector',
    description: 'Edge-to-edge screen protection',
    category: 'accessories',
    brand: 'generic',
    unit: 'pcs',
    costPrice: 40,
    sellingPrice: 150,
    minStock: 20,
    barcodes: ['6901234567891'],
    images: ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=400&q=80'],
    stockByLocation: [
      { locationId: 'loc_1', locationName: 'Default Location', quantity: 80 },
      { locationId: 'loc_2', locationName: 'Main Counter', quantity: 25 }
    ],
    totalStock: 105,
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

let demoTransactions: IStockTransaction[] = [
  {
    _id: 'txn_1',
    teamId: 'team_1',
    type: 'stock_in',
    referenceNo: 'TXN-001094',
    toLocationId: 'loc_1',
    toLocationName: 'Default Location',
    items: [
      { itemId: 'item_1', sku: 'MOB-VIVO-V29', name: 'vivo V29 5G (128GB, Velvet Red)', quantity: 10, unitCost: 1000 }
    ],
    totalQuantity: 10,
    reason: 'Initial shipment arrival',
    userId: 'user_1',
    userName: 'Admin User',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  }
];

let demoMembers: ITeamMember[] = [
  {
    _id: 'member_1',
    teamId: 'team_1',
    userId: 'user_1',
    name: 'Simran Admin',
    email: 'admin@simranmobile.com',
    role: 'admin',
    status: 'active',
    joinedAt: new Date().toISOString(),
  },
  {
    _id: 'member_2',
    teamId: 'team_1',
    userId: 'user_2',
    name: 'Rahul Sharma (Sales)',
    email: 'rahul@simranmobile.com',
    role: 'sales',
    status: 'active',
    joinedAt: new Date().toISOString(),
  },
  {
    _id: 'member_3',
    teamId: 'team_1',
    userId: 'user_3',
    name: 'Amit Patel (Warehouse)',
    email: 'amit@simranmobile.com',
    role: 'inventory',
    status: 'active',
    joinedAt: new Date().toISOString(),
  }
];

let demoCategories: string[] = ['mobile phone', 'accessories', 'smartwatch', 'tablets', 'audio'];
let demoBrands: string[] = ['vivo', 'samsung', 'apple', 'oneplus', 'generic', 'boat'];

export class InventoryStore {
  // Teams
  static async getTeam(teamId: string): Promise<ITeam | null> {
    return demoTeams.find(t => t._id === teamId) || null;
  }

  static async listTeams(): Promise<ITeam[]> {
    return demoTeams;
  }

  static async createTeam(name: string, ownerId: string, currency = '₹'): Promise<ITeam> {
    const newTeam: ITeam = {
      _id: 'team_' + Math.random().toString(36).substr(2, 9),
      name,
      ownerId,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      currency,
      lowStockThresholdDefault: 5,
      createdAt: new Date().toISOString(),
    };
    demoTeams.push(newTeam);
    
    // Add default location
    demoLocations.push({
      _id: 'loc_' + Math.random().toString(36).substr(2, 9),
      teamId: newTeam._id,
      name: 'Default Location',
      isDefault: true,
      isArchived: false,
      createdAt: new Date().toISOString(),
    });

    return newTeam;
  }

  static async joinTeamByCode(inviteCode: string, userId: string, userName: string, email: string): Promise<ITeam | null> {
    const team = demoTeams.find(t => t.inviteCode.toUpperCase() === inviteCode.trim().toUpperCase());
    if (!team) return null;

    const existing = demoMembers.find(m => m.teamId === team._id && m.userId === userId);
    if (!existing) {
      demoMembers.push({
        _id: 'member_' + Math.random().toString(36).substr(2, 9),
        teamId: team._id,
        userId,
        name: userName,
        email,
        role: 'sales',
        status: 'active',
        joinedAt: new Date().toISOString(),
      });
    }
    return team;
  }

  // Locations
  static async getLocations(teamId: string): Promise<ILocation[]> {
    return demoLocations.filter(l => l.teamId === teamId && !l.isArchived);
  }

  static async addLocation(teamId: string, name: string): Promise<ILocation> {
    const loc: ILocation = {
      _id: 'loc_' + Math.random().toString(36).substr(2, 9),
      teamId,
      name,
      isDefault: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };
    demoLocations.push(loc);
    return loc;
  }

  // Items
  static async getItems(teamId: string, query?: { search?: string; category?: string; brand?: string; lowStockOnly?: boolean }): Promise<IItem[]> {
    let items = demoItems.filter(i => i.teamId === teamId && !i.isArchived);

    if (query?.search) {
      const q = query.search.toLowerCase().trim();
      items = items.filter(i => 
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.barcodes.some(b => b.toLowerCase().includes(q))
      );
    }

    if (query?.category && query.category !== 'all') {
      items = items.filter(i => i.category.toLowerCase() === query.category?.toLowerCase());
    }

    if (query?.brand && query.brand !== 'all') {
      items = items.filter(i => i.brand.toLowerCase() === query.brand?.toLowerCase());
    }

    if (query?.lowStockOnly) {
      items = items.filter(i => i.totalStock <= i.minStock);
    }

    return items;
  }

  static async getItemById(teamId: string, itemId: string): Promise<IItem | null> {
    return demoItems.find(i => i.teamId === teamId && i._id === itemId && !i.isArchived) || null;
  }

  static async findItemByBarcode(teamId: string, barcode: string): Promise<IItem | null> {
    return demoItems.find(i => 
      i.teamId === teamId && 
      !i.isArchived && 
      i.barcodes.some(b => b.trim() === barcode.trim())
    ) || null;
  }

  static async createItem(teamId: string, itemData: Partial<IItem>): Promise<IItem> {
    const defaultLoc = demoLocations.find(l => l.teamId === teamId && l.isDefault) || demoLocations[0];
    const initialQty = itemData.totalStock || 0;
    
    const stockByLocation = itemData.stockByLocation || [
      {
        locationId: defaultLoc ? defaultLoc._id : 'loc_default',
        locationName: defaultLoc ? defaultLoc.name : 'Default Location',
        quantity: initialQty
      }
    ];

    const newItem: IItem = {
      _id: 'item_' + Math.random().toString(36).substr(2, 9),
      teamId,
      sku: itemData.sku || 'SKU-' + Math.floor(100000 + Math.random() * 900000),
      name: itemData.name || 'Untitled Item',
      description: itemData.description || '',
      category: itemData.category || 'General',
      brand: itemData.brand || 'Generic',
      unit: itemData.unit || 'pcs',
      costPrice: Number(itemData.costPrice) || 0,
      sellingPrice: Number(itemData.sellingPrice) || 0,
      minStock: Number(itemData.minStock) || 5,
      barcodes: itemData.barcodes && itemData.barcodes.length > 0 ? itemData.barcodes : ['BC-' + Date.now()],
      images: itemData.images || ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=400&q=80'],
      stockByLocation,
      totalStock: stockByLocation.reduce((acc, curr) => acc + curr.quantity, 0),
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    demoItems.unshift(newItem);

    // If initial stock was given, log a Stock In transaction
    if (newItem.totalStock > 0) {
      await this.recordTransaction({
        teamId,
        type: 'stock_in',
        toLocationId: stockByLocation[0].locationId,
        toLocationName: stockByLocation[0].locationName,
        items: [{
          itemId: newItem._id,
          sku: newItem.sku,
          name: newItem.name,
          quantity: newItem.totalStock,
          unitCost: newItem.costPrice,
          unitPrice: newItem.sellingPrice,
        }],
        totalQuantity: newItem.totalStock,
        reason: 'Initial Item Creation',
        userId: 'user_1',
        userName: 'Admin User',
      });
    }

    return newItem;
  }

  static async updateItem(teamId: string, itemId: string, update: Partial<IItem>): Promise<IItem | null> {
    const idx = demoItems.findIndex(i => i.teamId === teamId && i._id === itemId);
    if (idx === -1) return null;

    demoItems[idx] = {
      ...demoItems[idx],
      ...update,
      updatedAt: new Date().toISOString()
    };
    return demoItems[idx];
  }

  static async deleteItem(teamId: string, itemId: string): Promise<boolean> {
    const item = demoItems.find(i => i.teamId === teamId && i._id === itemId);
    if (item) {
      item.isArchived = true;
      return true;
    }
    return false;
  }

  // Stock Operations & Transactions
  static async recordTransaction(data: Omit<IStockTransaction, '_id' | 'referenceNo' | 'createdAt'>): Promise<IStockTransaction> {
    const txn: IStockTransaction = {
      _id: 'txn_' + Math.random().toString(36).substr(2, 9),
      referenceNo: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      ...data,
      createdAt: new Date().toISOString()
    };

    // Update Item Quantities
    for (const line of txn.items) {
      const item = demoItems.find(i => i.teamId === txn.teamId && i._id === line.itemId);
      if (!item) continue;

      if (txn.type === 'stock_in' || txn.type === 'purchase') {
        const targetLocId = txn.toLocationId;
        let locEntry = item.stockByLocation.find(l => l.locationId === targetLocId);
        if (!locEntry) {
          locEntry = { locationId: targetLocId || 'loc_default', locationName: txn.toLocationName || 'Default Location', quantity: 0 };
          item.stockByLocation.push(locEntry);
        }
        locEntry.quantity += line.quantity;
      } else if (txn.type === 'stock_out' || txn.type === 'sale') {
        const fromLocId = txn.fromLocationId;
        let locEntry = item.stockByLocation.find(l => l.locationId === fromLocId);
        if (!locEntry) {
          locEntry = { locationId: fromLocId || 'loc_default', locationName: txn.fromLocationName || 'Default Location', quantity: 0 };
          item.stockByLocation.push(locEntry);
        }
        locEntry.quantity = Math.max(0, locEntry.quantity - line.quantity);
      } else if (txn.type === 'move') {
        // Decrease from source
        let fromLoc = item.stockByLocation.find(l => l.locationId === txn.fromLocationId);
        if (fromLoc) fromLoc.quantity = Math.max(0, fromLoc.quantity - line.quantity);

        // Increase in destination
        let toLoc = item.stockByLocation.find(l => l.locationId === txn.toLocationId);
        if (!toLoc) {
          toLoc = { locationId: txn.toLocationId || 'loc_default', locationName: txn.toLocationName || 'Default Location', quantity: 0 };
          item.stockByLocation.push(toLoc);
        }
        toLoc.quantity += line.quantity;
      } else if (txn.type === 'adjust') {
        const loc = item.stockByLocation.find(l => l.locationId === txn.toLocationId || l.locationId === txn.fromLocationId);
        if (loc) {
          loc.quantity = line.quantity; // Explicit overwrite to new physical count
        }
      }

      item.totalStock = item.stockByLocation.reduce((acc, curr) => acc + curr.quantity, 0);
      item.updatedAt = new Date().toISOString();
    }

    demoTransactions.unshift(txn);
    return txn;
  }

  static async getTransactions(teamId: string, limit = 50): Promise<IStockTransaction[]> {
    return demoTransactions.filter(t => t.teamId === teamId).slice(0, limit);
  }

  // Categories & Brands
  static async getCategories(): Promise<string[]> {
    return demoCategories;
  }

  static async addCategory(cat: string): Promise<string> {
    if (!demoCategories.includes(cat.toLowerCase())) {
      demoCategories.push(cat.toLowerCase());
    }
    return cat.toLowerCase();
  }

  static async getBrands(): Promise<string[]> {
    return demoBrands;
  }

  static async addBrand(brand: string): Promise<string> {
    if (!demoBrands.includes(brand.toLowerCase())) {
      demoBrands.push(brand.toLowerCase());
    }
    return brand.toLowerCase();
  }

  // Members & Roles
  static async getMembers(teamId: string): Promise<ITeamMember[]> {
    return demoMembers.filter(m => m.teamId === teamId);
  }

  static async inviteMember(teamId: string, name: string, email: string, role: Role, customPermissions?: CustomPermissions): Promise<ITeamMember> {
    const member: ITeamMember = {
      _id: 'member_' + Math.random().toString(36).substr(2, 9),
      teamId,
      userId: 'user_' + Math.random().toString(36).substr(2, 7),
      name,
      email,
      role,
      customPermissions,
      status: 'active',
      joinedAt: new Date().toISOString(),
    };
    demoMembers.push(member);
    return member;
  }

  static async updateMemberRole(memberId: string, role: Role, customPermissions?: CustomPermissions): Promise<ITeamMember | null> {
    const m = demoMembers.find(mem => mem._id === memberId);
    if (!m) return null;
    m.role = role;
    if (customPermissions) m.customPermissions = customPermissions;
    return m;
  }

  // Metrics
  static async getDashboardMetrics(teamId: string) {
    const items = demoItems.filter(i => i.teamId === teamId && !i.isArchived);
    const txns = demoTransactions.filter(t => t.teamId === teamId);
    
    // Today filter
    const today = new Date().toISOString().split('T')[0];
    const todayTxns = txns.filter(t => t.createdAt.startsWith(today));
    
    const stockInToday = todayTxns
      .filter(t => t.type === 'stock_in' || t.type === 'purchase')
      .reduce((acc, t) => acc + t.totalQuantity, 0);

    const stockOutToday = todayTxns
      .filter(t => t.type === 'stock_out' || t.type === 'sale')
      .reduce((acc, t) => acc + t.totalQuantity, 0);

    const lowStockCount = items.filter(i => i.totalStock <= i.minStock).length;
    const totalInventoryValue = items.reduce((acc, i) => acc + (i.totalStock * i.costPrice), 0);

    return {
      totalItems: items.length,
      totalInventoryValue,
      stockInToday,
      stockOutToday,
      lowStockCount,
      todayDateStr: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date()),
    };
  }
}
