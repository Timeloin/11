import { IItem, ILocation, IStockTransaction, ITeam, ITeamMember, Role, CustomPermissions } from '@/types';
import { connectDB } from './db';
import Team from '@/models/Team';
import Location from '@/models/Location';
import Item from '@/models/Item';
import StockTransaction from '@/models/StockTransaction';
import TeamMember from '@/models/TeamMember';

// Fallback in-memory state when MONGODB_URI is absent
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
    barcodes: ['8901234567890'],
    images: [],
    stockByLocation: [
      { locationId: 'loc_1', locationName: 'Default Location', quantity: 12 },
      { locationId: 'loc_2', locationName: 'Main Counter', quantity: 3 }
    ],
    totalStock: 15,
    isArchived: false,
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
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
  }
];

let demoCategories: string[] = ['mobile phone', 'accessories', 'smartwatch', 'tablets', 'audio'];
let demoBrands: string[] = ['vivo', 'samsung', 'apple', 'oneplus', 'generic', 'boat'];

async function initMongoSeed() {
  try {
    const conn = await connectDB();
    if (!conn) return;

    const teamCount = await Team.countDocuments();
    if (teamCount === 0) {
      const newTeam = await Team.create({
        name: 'simran mobile shop',
        ownerId: '65f000000000000000000001',
        inviteCode: 'SIMRAN88',
        currency: '₹',
        lowStockThresholdDefault: 5,
      });

      const newLoc = await Location.create({
        teamId: newTeam._id,
        name: 'Default Location',
        isDefault: true,
        isArchived: false,
      });

      const newItem = await Item.create({
        teamId: newTeam._id,
        sku: 'MOB-VIVO-V29',
        name: 'vivo V29 5G (128GB, Velvet Red)',
        description: 'Smartphone with 50MP OIS camera',
        category: 'mobile phone',
        brand: 'vivo',
        unit: 'pcs',
        costPrice: 1000,
        sellingPrice: 1500,
        minStock: 5,
        barcodes: ['8901234567890'],
        images: [],
        stockByLocation: [{ locationId: newLoc._id, locationName: newLoc.name, quantity: 15 }],
        totalStock: 15,
        isArchived: false,
      });

      await StockTransaction.create({
        teamId: newTeam._id,
        type: 'stock_in',
        referenceNo: 'TXN-100001',
        toLocationId: newLoc._id,
        toLocationName: newLoc.name,
        items: [{
          itemId: newItem._id,
          sku: newItem.sku,
          name: newItem.name,
          quantity: 15,
          unitCost: 1000,
          unitPrice: 1500,
        }],
        totalQuantity: 15,
        reason: 'Initial Store Setup',
        userId: '65f000000000000000000001',
        userName: 'Admin User',
      });
    }
  } catch (err) {
    console.error('MongoDB init error:', err);
  }
}

export class InventoryStore {
  // Teams
  static async listTeams(): Promise<ITeam[]> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        await initMongoSeed();
        const teams = await Team.find({}).lean();
        if (teams && teams.length > 0) return JSON.parse(JSON.stringify(teams));
      } catch (e) {
        console.error('MongoDB listTeams error:', e);
      }
    }
    return demoTeams;
  }

  static async getTeam(teamId: string): Promise<ITeam | null> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const t = await Team.findById(teamId).lean();
        if (t) return JSON.parse(JSON.stringify(t));
      } catch (e) {}
    }
    return demoTeams.find(t => t._id === teamId) || null;
  }

  static async createTeam(name: string, ownerId: string, currency = '₹'): Promise<ITeam> {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const t = await Team.create({
          name,
          ownerId: ownerId.startsWith('user_') ? '65f000000000000000000001' : ownerId,
          inviteCode,
          currency,
          lowStockThresholdDefault: 5,
        });
        await Location.create({
          teamId: t._id,
          name: 'Default Location',
          isDefault: true,
          isArchived: false,
        });
        return JSON.parse(JSON.stringify(t));
      } catch (e) {
        console.error('MongoDB createTeam error:', e);
      }
    }

    const newTeam: ITeam = {
      _id: 'team_' + Math.random().toString(36).substr(2, 9),
      name,
      ownerId,
      inviteCode,
      currency,
      lowStockThresholdDefault: 5,
      createdAt: new Date().toISOString(),
    };
    demoTeams.push(newTeam);
    return newTeam;
  }

  static async joinTeamByCode(inviteCode: string, userId: string, userName: string, email: string): Promise<ITeam | null> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const team = await Team.findOne({ inviteCode: inviteCode.trim().toUpperCase() }).lean();
        if (team) return JSON.parse(JSON.stringify(team));
      } catch (e) {}
    }
    return demoTeams.find(t => t.inviteCode.toUpperCase() === inviteCode.trim().toUpperCase()) || null;
  }

  // Locations
  static async getLocations(teamId: string): Promise<ILocation[]> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const locs = await Location.find({ teamId, isArchived: false }).lean();
        if (locs && locs.length > 0) return JSON.parse(JSON.stringify(locs));
      } catch (e) {}
    }
    return demoLocations.filter(l => l.teamId === teamId && !l.isArchived);
  }

  static async addLocation(teamId: string, name: string): Promise<ILocation> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const loc = await Location.create({ teamId, name, isDefault: false, isArchived: false });
        return JSON.parse(JSON.stringify(loc));
      } catch (e) {}
    }

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
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        let filter: any = { teamId, isArchived: false };
        if (query?.search) {
          filter.$or = [
            { name: { $regex: query.search, $options: 'i' } },
            { sku: { $regex: query.search, $options: 'i' } },
            { barcodes: { $in: [query.search] } }
          ];
        }
        if (query?.category && query.category !== 'all') filter.category = query.category;
        if (query?.brand && query.brand !== 'all') filter.brand = query.brand;

        const items = await Item.find(filter).sort({ createdAt: -1 }).lean();
        if (items) {
          let parsed = JSON.parse(JSON.stringify(items));
          if (query?.lowStockOnly) {
            parsed = parsed.filter((i: IItem) => Number(i.totalStock || 0) <= Number(i.minStock || 5));
          }
          if (parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error('MongoDB getItems error:', e);
      }
    }

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
      items = items.filter(i => Number(i.totalStock) <= Number(i.minStock));
    }
    return items;
  }

  static async getItemById(teamId: string, itemId: string): Promise<IItem | null> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const it = await Item.findOne({ _id: itemId, teamId, isArchived: false }).lean();
        if (it) return JSON.parse(JSON.stringify(it));
      } catch (e) {}
    }
    return demoItems.find(i => i.teamId === teamId && i._id === itemId && !i.isArchived) || null;
  }

  static async findItemByBarcode(teamId: string, barcode: string): Promise<IItem | null> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const it = await Item.findOne({ teamId, barcodes: barcode.trim(), isArchived: false }).lean();
        if (it) return JSON.parse(JSON.stringify(it));
      } catch (e) {}
    }
    return demoItems.find(i => 
      i.teamId === teamId && 
      !i.isArchived && 
      i.barcodes.some(b => b.trim() === barcode.trim())
    ) || null;
  }

  static async createItem(teamId: string, itemData: Partial<IItem>): Promise<IItem> {
    const initialQty = Number(itemData.totalStock) || 0;
    const defaultLoc = demoLocations.find(l => l.teamId === teamId && l.isDefault) || demoLocations[0];
    
    const stockByLocation = itemData.stockByLocation || [
      {
        locationId: defaultLoc ? defaultLoc._id : 'loc_1',
        locationName: defaultLoc ? defaultLoc.name : 'Default Location',
        quantity: initialQty
      }
    ];

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const newItem = await Item.create({
          teamId,
          sku: itemData.sku || 'SKU-' + Date.now().toString().slice(-6),
          name: itemData.name || 'Untitled Item',
          description: itemData.description || '',
          category: itemData.category || 'General',
          brand: itemData.brand || 'Generic',
          unit: itemData.unit || 'pcs',
          costPrice: Number(itemData.costPrice) || 0,
          sellingPrice: Number(itemData.sellingPrice) || 0,
          minStock: Number(itemData.minStock) || 5,
          barcodes: itemData.barcodes && itemData.barcodes.length > 0 ? itemData.barcodes : ['BC-' + Date.now()],
          images: [],
          stockByLocation,
          totalStock: initialQty,
          isArchived: false,
        });

        if (initialQty > 0) {
          await StockTransaction.create({
            teamId,
            type: 'stock_in',
            referenceNo: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
            toLocationId: stockByLocation[0].locationId,
            toLocationName: stockByLocation[0].locationName,
            items: [{
              itemId: newItem._id,
              sku: newItem.sku,
              name: newItem.name,
              quantity: initialQty,
              unitCost: Number(itemData.costPrice) || 0,
              unitPrice: Number(itemData.sellingPrice) || 0,
            }],
            totalQuantity: initialQty,
            reason: 'Initial Item Creation',
            userId: '65f000000000000000000001',
            userName: 'Admin User',
          });
        }

        return JSON.parse(JSON.stringify(newItem));
      } catch (e) {
        console.error('MongoDB createItem error:', e);
      }
    }

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
      images: [],
      stockByLocation,
      totalStock: initialQty,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    demoItems.unshift(newItem);
    return newItem;
  }

  static async updateItem(teamId: string, itemId: string, update: Partial<IItem>): Promise<IItem | null> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const updated = await Item.findOneAndUpdate({ _id: itemId, teamId }, { ...update, updatedAt: new Date() }, { new: true }).lean();
        if (updated) return JSON.parse(JSON.stringify(updated));
      } catch (e) {}
    }

    const idx = demoItems.findIndex(i => i.teamId === teamId && i._id === itemId);
    if (idx === -1) return null;
    demoItems[idx] = { ...demoItems[idx], ...update, updatedAt: new Date().toISOString() };
    return demoItems[idx];
  }

  static async deleteItem(teamId: string, itemId: string): Promise<boolean> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        await Item.findOneAndUpdate({ _id: itemId, teamId }, { isArchived: true });
        return true;
      } catch (e) {}
    }

    const item = demoItems.find(i => i.teamId === teamId && i._id === itemId);
    if (item) {
      item.isArchived = true;
      return true;
    }
    return false;
  }

  // Transactions
  static async recordTransaction(data: Omit<IStockTransaction, '_id' | 'referenceNo' | 'createdAt'>): Promise<IStockTransaction> {
    const referenceNo = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    const totalQty = Number(data.totalQuantity) || data.items.reduce((acc, it) => acc + Number(it.quantity || 0), 0);

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const txn = await StockTransaction.create({
          ...data,
          totalQuantity: totalQty,
          referenceNo,
          userId: '65f000000000000000000001',
        });

        for (const line of data.items) {
          const item = await Item.findById(line.itemId);
          if (!item) continue;
          const qty = Number(line.quantity) || 0;

          if (data.type === 'stock_in' || data.type === 'purchase') {
            const loc = item.stockByLocation.find((l: any) => l.locationId.toString() === data.toLocationId?.toString());
            if (loc) loc.quantity += qty;
            else item.stockByLocation.push({ locationId: data.toLocationId, locationName: data.toLocationName || 'Default Location', quantity: qty });
          } else if (data.type === 'stock_out' || data.type === 'sale') {
            const loc = item.stockByLocation.find((l: any) => l.locationId.toString() === data.fromLocationId?.toString());
            if (loc) loc.quantity = Math.max(0, loc.quantity - qty);
          } else if (data.type === 'move') {
            const fromLoc = item.stockByLocation.find((l: any) => l.locationId.toString() === data.fromLocationId?.toString());
            if (fromLoc) fromLoc.quantity = Math.max(0, fromLoc.quantity - qty);
            const toLoc = item.stockByLocation.find((l: any) => l.locationId.toString() === data.toLocationId?.toString());
            if (toLoc) toLoc.quantity += qty;
            else item.stockByLocation.push({ locationId: data.toLocationId, locationName: data.toLocationName || 'Default Location', quantity: qty });
          } else if (data.type === 'adjust') {
            const loc = item.stockByLocation.find((l: any) => l.locationId.toString() === data.toLocationId?.toString() || l.locationId.toString() === data.fromLocationId?.toString());
            if (loc) loc.quantity = qty;
          }

          item.totalStock = item.stockByLocation.reduce((acc: number, curr: any) => acc + Number(curr.quantity || 0), 0);
          await item.save();
        }

        return JSON.parse(JSON.stringify(txn));
      } catch (e) {
        console.error('MongoDB recordTransaction error:', e);
      }
    }

    const txn: IStockTransaction = {
      _id: 'txn_' + Math.random().toString(36).substr(2, 9),
      referenceNo,
      ...data,
      totalQuantity: totalQty,
      createdAt: new Date().toISOString()
    };

    for (const line of txn.items) {
      const item = demoItems.find(i => i.teamId === txn.teamId && i._id === line.itemId);
      if (!item) continue;
      const qty = Number(line.quantity) || 0;
      if (txn.type === 'stock_in') {
        let loc = item.stockByLocation.find(l => l.locationId === txn.toLocationId);
        if (!loc) {
          loc = { locationId: txn.toLocationId || 'loc_1', locationName: txn.toLocationName || 'Default Location', quantity: 0 };
          item.stockByLocation.push(loc);
        }
        loc.quantity += qty;
      } else if (txn.type === 'stock_out') {
        let loc = item.stockByLocation.find(l => l.locationId === txn.fromLocationId);
        if (loc) loc.quantity = Math.max(0, loc.quantity - qty);
      } else if (txn.type === 'move') {
        let fromLoc = item.stockByLocation.find(l => l.locationId === txn.fromLocationId);
        if (fromLoc) fromLoc.quantity = Math.max(0, fromLoc.quantity - qty);
        let toLoc = item.stockByLocation.find(l => l.locationId === txn.toLocationId);
        if (!toLoc) {
          toLoc = { locationId: txn.toLocationId || 'loc_1', locationName: txn.toLocationName || 'Default Location', quantity: 0 };
          item.stockByLocation.push(toLoc);
        }
        toLoc.quantity += qty;
      } else if (txn.type === 'adjust') {
        let loc = item.stockByLocation.find(l => l.locationId === txn.toLocationId || l.locationId === txn.fromLocationId);
        if (loc) loc.quantity = qty;
      }
      item.totalStock = item.stockByLocation.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
    }
    demoTransactions.unshift(txn);
    return txn;
  }

  static async getTransactions(teamId: string, limit = 50): Promise<IStockTransaction[]> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const txns = await StockTransaction.find({ teamId }).sort({ createdAt: -1 }).limit(limit).lean();
        if (txns && txns.length > 0) return JSON.parse(JSON.stringify(txns));
      } catch (e) {}
    }
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

  // Members
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
    const items = await this.getItems(teamId);
    const txns = await this.getTransactions(teamId);
    
    const today = new Date().toISOString().split('T')[0];
    const todayTxns = txns.filter(t => t.createdAt && t.createdAt.startsWith(today));
    
    const stockInToday = todayTxns
      .filter(t => t.type === 'stock_in' || t.type === 'purchase')
      .reduce((acc, t) => acc + (Number(t.totalQuantity) || 0), 0);

    const stockOutToday = todayTxns
      .filter(t => t.type === 'stock_out' || t.type === 'sale')
      .reduce((acc, t) => acc + (Number(t.totalQuantity) || 0), 0);

    const lowStockCount = items.filter(i => (Number(i.totalStock) || 0) <= (Number(i.minStock) || 0)).length;
    const totalInventoryValue = items.reduce((acc, i) => acc + ((Number(i.totalStock) || 0) * (Number(i.costPrice) || 0)), 0);

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
