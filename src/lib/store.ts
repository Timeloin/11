import mongoose from 'mongoose';
import { IItem, ILocation, IStockTransaction, ITeam, ITeamMember, Role, CustomPermissions, ISubAdminInfo, UserSession } from '@/types';
import { connectDB } from './db';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, hashPassword, comparePassword } from './auth';
import Team from '@/models/Team';
import Location from '@/models/Location';
import Item from '@/models/Item';
import StockTransaction from '@/models/StockTransaction';
import TeamMember from '@/models/TeamMember';
import User from '@/models/User';

// Fallback in-memory state
let demoTeams: ITeam[] = [
  {
    _id: 'team_1',
    name: 'simran mobile shop',
    ownerId: 'user_subadmin_1',
    ownerEmail: 'subadmin@simranmobile.com',
    ownerName: 'Simran Sub-Admin',
    inviteCode: 'SIMRAN88',
    currency: '₹',
    lowStockThresholdDefault: 5,
    subscriptionType: 'days',
    subscriptionDays: 10,
    subscriptionExpiresAt: new Date(Date.now() + 10 * 86400000).toISOString(),
    isAccessRevoked: false,
    createdAt: new Date().toISOString(),
  }
];

let demoUsers: any[] = [];

let demoLocations: ILocation[] = [
  {
    _id: 'loc_1',
    teamId: 'team_1',
    name: 'Default Location',
    isDefault: true,
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
      { locationId: 'loc_1', locationName: 'Default Location', quantity: 15 }
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
      { itemId: 'item_1', sku: 'MOB-VIVO-V29', name: 'vivo V29 5G (128GB, Velvet Red)', quantity: 15, unitCost: 1000 }
    ],
    totalQuantity: 15,
    reason: 'Initial stock setup',
    userId: 'user_subadmin_1',
    userName: 'Simran Sub-Admin',
    createdAt: new Date().toISOString(),
  }
];

let demoMembers: ITeamMember[] = [];
let demoCategories: string[] = ['mobile phone', 'accessories', 'smartwatch', 'tablets', 'audio'];
let demoBrands: string[] = ['vivo', 'samsung', 'apple', 'oneplus', 'generic', 'boat'];

export class InventoryStore {
  // Authentication: 1 Main Admin + Staff Members (No expiration limits)
  static async authenticateUser(email: string, pass: string): Promise<{
    success: boolean;
    error?: string;
    session?: UserSession;
  }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    const envAdminEmail = (process.env.SUPER_ADMIN_EMAIL || SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
    const envAdminPass = process.env.SUPER_ADMIN_PASSWORD || SUPER_ADMIN_PASSWORD || '';

    // 1. Main Admin direct login using Vercel env credentials
    if (envAdminEmail && envAdminPass && cleanEmail === envAdminEmail && cleanPass === envAdminPass) {
      let mainTeamId = 'team_1';
      if (process.env.MONGODB_URI) {
        try {
          await connectDB();
          let team = await Team.findOne({}).sort({ createdAt: 1 });
          if (!team) {
            team = await Team.create({
              name: 'Simran Mobile',
              ownerEmail: envAdminEmail,
              ownerName: 'Main Admin',
              inviteCode: 'SIMRAN88',
              currency: '₹',
            });
          }
          mainTeamId = team._id.toString();
        } catch (e) {
          console.error('Error fetching main team on admin login:', e);
        }
      }

      return {
        success: true,
        session: {
          userId: 'user_main_admin',
          name: 'Main Admin',
          email: envAdminEmail,
          role: 'admin',
          activeTeamId: mainTeamId,
          isSuperAdmin: false,
        },
      };
    }

    // 2. Check MongoDB for staff members / users
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const user = await User.findOne({ email: cleanEmail });
        if (user) {
          const isMatch =
            (user.plainPassword && user.plainPassword === cleanPass) ||
            (await comparePassword(cleanPass, user.passwordHash || ''));
          if (isMatch) {
            let team = await Team.findOne({ ownerId: user._id });
            let memberRole: Role = user.role || 'admin';
            let customPerms: CustomPermissions | undefined = undefined;

            if (!team) {
              const membership = await TeamMember.findOne({ userId: user._id });
              if (membership) {
                team = await Team.findById(membership.teamId);
                memberRole = membership.role;
                customPerms = membership.customPermissions;
              }
            }

            if (!team) {
              team = await Team.findOne({}).sort({ createdAt: 1 });
            }

            return {
              success: true,
              session: {
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                activeTeamId: team ? team._id.toString() : 'team_1',
                role: memberRole,
                isSuperAdmin: false,
                permissions: customPerms,
              },
            };
          }
        }
      } catch (err) {
        console.error('MongoDB Auth Error:', err);
      }
    }

    // 3. Fallback demo memory auth
    const memUser = demoUsers.find(
      (u) => u.email === cleanEmail && (u.plainPassword === cleanPass || cleanPass === 'password123')
    );
    if (memUser) {
      const team =
        demoTeams.find((t) => t.ownerId === memUser._id || t._id === memUser.defaultTeamId) || demoTeams[0];
      return {
        success: true,
        session: {
          userId: memUser._id,
          name: memUser.name,
          email: memUser.email,
          activeTeamId: team?._id || 'team_1',
          role: memUser.role || 'admin',
          isSuperAdmin: false,
        },
      };
    }

    // Also check demo members
    const memStaff = demoMembers.find(
      (m) => m.email.toLowerCase() === cleanEmail && (m.password === cleanPass || cleanPass === 'password123')
    );
    if (memStaff) {
      const team = demoTeams.find((t) => t._id === memStaff.teamId) || demoTeams[0];
      return {
        success: true,
        session: {
          userId: memStaff.userId,
          name: memStaff.name,
          email: memStaff.email,
          activeTeamId: team._id,
          role: memStaff.role,
          isSuperAdmin: false,
          permissions: memStaff.customPermissions,
        },
      };
    }

    return { success: false, error: 'Invalid email or password' };
  }

  // Bulk CSV Item Import
  static async importItems(
    teamId: string,
    itemsList: any[],
    operatorName: string = 'Main Admin'
  ): Promise<{ success: boolean; count: number; imported: number; updated: number }> {
    let imported = 0;
    let updated = 0;

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        let targetTeamId = teamId;
        if (!mongoose.isValidObjectId(targetTeamId) || targetTeamId === 'team_1') {
          const firstTeam = await Team.findOne({}).sort({ createdAt: 1 });
          if (firstTeam) targetTeamId = firstTeam._id.toString();
        }

        let defaultLoc = await Location.findOne({ teamId: targetTeamId, isDefault: true });
        if (!defaultLoc) {
          defaultLoc = await Location.findOne({ teamId: targetTeamId });
        }
        if (!defaultLoc) {
          defaultLoc = await Location.create({
            teamId: targetTeamId,
            name: 'Main Store',
            isDefault: true,
            isArchived: false,
          });
        }

        for (const raw of itemsList) {
          const name = String(raw.name || raw['Item Name'] || raw['Product Name'] || '').trim();
          if (!name) continue;

          const sku = String(
            raw.sku ||
              raw.SKU ||
              raw['Item Code'] ||
              `SKU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`
          ).trim();
          const category = String(raw.category || raw.Category || 'General').trim().toLowerCase();
          const brand = String(raw.brand || raw.Brand || 'Generic').trim().toLowerCase();
          const unit = String(raw.unit || raw.Unit || 'pcs').trim();
          const costPrice = Number(raw.costPrice || raw['Cost Price'] || raw.Cost || 0) || 0;
          const sellingPrice = Number(raw.sellingPrice || raw['Selling Price'] || raw.Price || 0) || 0;
          const totalStock =
            Number(raw.totalStock || raw['Total Stock'] || raw.Stock || raw.Quantity || 0) || 0;
          const minStock = Number(raw.minStock || raw['Safety Stock'] || raw['Min Stock'] || 5) || 5;
          const barcodes = raw.barcodes || (raw.Barcode ? [String(raw.Barcode).trim()] : []);

          let existingItem = await Item.findOne({ teamId: targetTeamId, sku });
          if (!existingItem) {
            existingItem = await Item.findOne({
              teamId: targetTeamId,
              name: { $regex: new RegExp(`^${name}$`, 'i') },
            });
          }

          if (existingItem) {
            existingItem.costPrice = costPrice || existingItem.costPrice;
            existingItem.sellingPrice = sellingPrice || existingItem.sellingPrice;
            existingItem.minStock = minStock || existingItem.minStock;
            if (totalStock > 0) {
              existingItem.totalStock += totalStock;
              const locEntry = existingItem.stockByLocation.find(
                (l: any) => l.locationId === defaultLoc._id.toString()
              );
              if (locEntry) {
                locEntry.quantity += totalStock;
              } else {
                existingItem.stockByLocation.push({
                  locationId: defaultLoc._id.toString(),
                  locationName: defaultLoc.name,
                  quantity: totalStock,
                });
              }
            }
            await existingItem.save();
            updated++;
          } else {
            const newItem = await Item.create({
              teamId: targetTeamId,
              sku,
              name,
              category,
              brand,
              unit,
              costPrice,
              sellingPrice,
              totalStock,
              minStock,
              barcodes,
              images: [],
              stockByLocation: [
                {
                  locationId: defaultLoc._id.toString(),
                  locationName: defaultLoc.name,
                  quantity: totalStock,
                },
              ],
            });

            if (totalStock > 0) {
              await StockTransaction.create({
                teamId: targetTeamId,
                type: 'stock_in',
                referenceNo: `IMP-${Date.now().toString().slice(-6)}`,
                toLocationId: defaultLoc._id.toString(),
                toLocationName: defaultLoc.name,
                items: [
                  { itemId: newItem._id.toString(), sku, name, quantity: totalStock, unitCost: costPrice },
                ],
                totalQuantity: totalStock,
                reason: 'CSV Bulk Import',
                userId: 'user_admin',
                userName: operatorName,
              });
            }
            imported++;
          }
        }

        return { success: true, count: itemsList.length, imported, updated };
      } catch (e: any) {
        console.error('Error importing items to DB:', e);
      }
    }

    // In-memory fallback
    for (const raw of itemsList) {
      const name = String(raw.name || raw['Item Name'] || raw['Product Name'] || '').trim();
      if (!name) continue;
      const sku = String(raw.sku || raw.SKU || `SKU-${Date.now().toString().slice(-6)}`).trim();
      const costPrice = Number(raw.costPrice || raw['Cost Price'] || 0) || 0;
      const sellingPrice = Number(raw.sellingPrice || raw['Selling Price'] || 0) || 0;
      const totalStock = Number(raw.totalStock || raw['Total Stock'] || 0) || 0;
      const minStock = Number(raw.minStock || raw['Safety Stock'] || 5) || 5;

      const existing = demoItems.find(
        (i) => i.sku === sku || i.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        existing.totalStock += totalStock;
        existing.costPrice = costPrice || existing.costPrice;
        existing.sellingPrice = sellingPrice || existing.sellingPrice;
        existing.minStock = minStock;
        updated++;
      } else {
        demoItems.push({
          _id: 'item_' + Date.now() + Math.random().toString().slice(-4),
          teamId,
          sku,
          name,
          category: String(raw.category || 'General').toLowerCase(),
          brand: String(raw.brand || 'Generic').toLowerCase(),
          unit: 'pcs',
          costPrice,
          sellingPrice,
          totalStock,
          minStock,
          barcodes: raw.barcodes || [],
          images: [],
          stockByLocation: [{ locationId: 'loc_1', locationName: 'Default Location', quantity: totalStock }],
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        imported++;
      }
    }

    return { success: true, count: itemsList.length, imported, updated };
  }

  // Add Staff Member with Email & Password
  static async addMemberWithCredentials(teamId: string, memberData: {
    name: string;
    email: string;
    password: string;
    role: Role;
    customPermissions?: CustomPermissions;
  }): Promise<ITeamMember> {
    const cleanEmail = memberData.email.trim().toLowerCase();

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const pHash = await hashPassword(memberData.password);
        
        let user = await User.findOne({ email: cleanEmail });
        if (!user) {
          user = await User.create({
            name: memberData.name,
            email: cleanEmail,
            passwordHash: pHash,
            plainPassword: memberData.password,
            role: memberData.role,
            isSuperAdmin: false,
            defaultTeamId: teamId,
          });
        }

        const member = await TeamMember.create({
          teamId,
          userId: user._id,
          name: memberData.name,
          email: cleanEmail,
          password: memberData.password,
          role: memberData.role,
          customPermissions: memberData.customPermissions,
          status: 'active',
        });

        return JSON.parse(JSON.stringify(member));
      } catch (err) {
        console.error('MongoDB addMember error:', err);
      }
    }

    const member: ITeamMember = {
      _id: 'member_' + Math.random().toString(36).substr(2, 7),
      teamId,
      userId: 'user_' + Math.random().toString(36).substr(2, 7),
      name: memberData.name,
      email: cleanEmail,
      password: memberData.password,
      role: memberData.role,
      customPermissions: memberData.customPermissions,
      status: 'active',
      joinedAt: new Date().toISOString(),
    };
    demoMembers.push(member);
    return member;
  }

  // Teams CRUD
  static async listTeams(): Promise<ITeam[]> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const teams = await Team.find({}).lean();
        if (teams && teams.length > 0) return JSON.parse(JSON.stringify(teams));
      } catch (e) {}
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

  static async createTeam(name: string, ownerId: string, currency: string = '₹'): Promise<ITeam> {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const team = await Team.create({
          name,
          ownerId,
          currency,
          inviteCode,
          subscriptionType: 'days',
          subscriptionDays: 10,
          subscriptionExpiresAt: new Date(Date.now() + 10 * 86400000),
          isAccessRevoked: false,
        });
        await Location.create({
          teamId: team._id,
          name: 'Default Location',
          isDefault: true,
          isArchived: false,
        });
        return JSON.parse(JSON.stringify(team));
      } catch (e) {
        console.error('MongoDB createTeam error:', e);
      }
    }

    const teamId = 'team_' + Math.random().toString(36).substr(2, 7);
    const newTeam: ITeam = {
      _id: teamId,
      name,
      ownerId,
      inviteCode,
      currency,
      lowStockThresholdDefault: 5,
      subscriptionType: 'days',
      subscriptionDays: 10,
      subscriptionExpiresAt: new Date(Date.now() + 10 * 86400000).toISOString(),
      isAccessRevoked: false,
      createdAt: new Date().toISOString(),
    };
    demoTeams.unshift(newTeam);
    demoLocations.push({
      _id: 'loc_' + Math.random().toString(36).substr(2, 7),
      teamId,
      name: 'Default Location',
      isDefault: true,
      isArchived: false,
      createdAt: new Date().toISOString(),
    });
    return newTeam;
  }

  static async joinTeamByCode(inviteCode: string, userId: string, userName: string, email: string): Promise<ITeam | null> {
    const code = inviteCode.trim().toUpperCase();
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const team = await Team.findOne({ inviteCode: code });
        if (team) {
          await TeamMember.create({
            teamId: team._id,
            userId,
            name: userName,
            email: email.trim().toLowerCase(),
            role: 'inventory',
            status: 'active',
          });
          return JSON.parse(JSON.stringify(team));
        }
      } catch (e) {
        console.error('MongoDB joinTeamByCode error:', e);
      }
    }

    const team = demoTeams.find(t => t.inviteCode?.toUpperCase() === code);
    if (team) {
      demoMembers.push({
        _id: 'member_' + Math.random().toString(36).substr(2, 7),
        teamId: team._id,
        userId,
        name: userName,
        email: email.trim().toLowerCase(),
        role: 'inventory',
        status: 'active',
        joinedAt: new Date().toISOString(),
      });
      return team;
    }
    return null;
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
      _id: 'loc_' + Math.random().toString(36).substr(2, 7),
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
        let filter: any = { isArchived: false };
        if (teamId && teamId !== 'all') filter.teamId = teamId;
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
          return parsed;
        }
      } catch (e) {
        console.error('MongoDB getItems error:', e);
      }
    }

    let items = demoItems.filter(i => (teamId === 'all' || i.teamId === teamId) && !i.isArchived);
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
      _id: 'item_' + Math.random().toString(36).substr(2, 7),
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

  static async getItemById(teamId: string, id: string): Promise<IItem | null> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        let filter: any = { _id: id, isArchived: false };
        if (teamId && teamId !== 'all') filter.teamId = teamId;
        const item = await Item.findOne(filter).lean();
        if (item) return JSON.parse(JSON.stringify(item));
      } catch (e) {
        console.error('MongoDB getItemById error:', e);
      }
    }
    return demoItems.find(i => i._id === id && (teamId === 'all' || i.teamId === teamId) && !i.isArchived) || null;
  }

  static async updateItem(teamId: string, id: string, data: Partial<IItem>): Promise<IItem | null> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        let filter: any = { _id: id };
        if (teamId && teamId !== 'all') filter.teamId = teamId;
        const item = await Item.findOneAndUpdate(
          filter,
          { ...data, updatedAt: new Date() },
          { new: true }
        ).lean();
        if (item) return JSON.parse(JSON.stringify(item));
      } catch (e) {
        console.error('MongoDB updateItem error:', e);
      }
    }

    const idx = demoItems.findIndex(i => i._id === id && (teamId === 'all' || i.teamId === teamId));
    if (idx !== -1) {
      demoItems[idx] = { ...demoItems[idx], ...data, updatedAt: new Date().toISOString() };
      return demoItems[idx];
    }
    return null;
  }

  static async deleteItem(teamId: string, id: string): Promise<boolean> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        let filter: any = { _id: id };
        if (teamId && teamId !== 'all') filter.teamId = teamId;
        await Item.findOneAndUpdate(filter, { isArchived: true });
        return true;
      } catch (e) {
        console.error('MongoDB deleteItem error:', e);
      }
    }

    const idx = demoItems.findIndex(i => i._id === id && (teamId === 'all' || i.teamId === teamId));
    if (idx !== -1) {
      demoItems[idx].isArchived = true;
      return true;
    }
    return false;
  }

  static async findItemByBarcode(teamId: string, code: string): Promise<IItem | null> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        let filter: any = { barcodes: code, isArchived: false };
        if (teamId && teamId !== 'all') filter.teamId = teamId;
        const item = await Item.findOne(filter).lean();
        if (item) return JSON.parse(JSON.stringify(item));
      } catch (e) {
        console.error('MongoDB findItemByBarcode error:', e);
      }
    }

    return demoItems.find(i => (teamId === 'all' || i.teamId === teamId) && !i.isArchived && i.barcodes.includes(code)) || null;
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
          userId: data.userId || '65f000000000000000000001',
          userName: data.userName || 'Admin User',
        });

        for (const line of data.items) {
          let item: any = null;
          try {
            item = await Item.findById(line.itemId);
          } catch (e) {}
          if (!item) {
            item = await Item.findOne({
              $or: [
                { _id: line.itemId },
                { sku: line.sku },
                { name: line.name }
              ]
            });
          }
          if (!item) continue;
          const qty = Number(line.quantity) || 0;

          if (!item.stockByLocation || item.stockByLocation.length === 0) {
            item.stockByLocation = [
              { 
                locationId: data.toLocationId || data.fromLocationId || 'loc_1', 
                locationName: data.toLocationName || data.fromLocationName || 'Default Location', 
                quantity: Number(item.totalStock) || 0 
              }
            ];
          }

          if (data.type === 'stock_in' || data.type === 'purchase') {
            let loc = item.stockByLocation.find((l: any) => data.toLocationId && l.locationId?.toString() === data.toLocationId?.toString());
            if (!loc && item.stockByLocation.length > 0) loc = item.stockByLocation[0];
            if (loc) {
              loc.quantity = (Number(loc.quantity) || 0) + qty;
            } else {
              item.stockByLocation.push({ locationId: data.toLocationId || 'loc_1', locationName: data.toLocationName || 'Default Location', quantity: qty });
            }
          } else if (data.type === 'stock_out' || data.type === 'sale') {
            let loc = item.stockByLocation.find((l: any) => data.fromLocationId && l.locationId?.toString() === data.fromLocationId?.toString());
            if (!loc && item.stockByLocation.length > 0) loc = item.stockByLocation[0];
            if (loc) {
              loc.quantity = Math.max(0, (Number(loc.quantity) || 0) - qty);
            }
          } else if (data.type === 'move') {
            let fromLoc = item.stockByLocation.find((l: any) => data.fromLocationId && l.locationId?.toString() === data.fromLocationId?.toString());
            if (!fromLoc && item.stockByLocation.length > 0) fromLoc = item.stockByLocation[0];
            if (fromLoc) fromLoc.quantity = Math.max(0, (Number(fromLoc.quantity) || 0) - qty);

            let toLoc = item.stockByLocation.find((l: any) => data.toLocationId && l.locationId?.toString() === data.toLocationId?.toString());
            if (toLoc) {
              toLoc.quantity = (Number(toLoc.quantity) || 0) + qty;
            } else {
              item.stockByLocation.push({ locationId: data.toLocationId || 'loc_1', locationName: data.toLocationName || 'Default Location', quantity: qty });
            }
          } else if (data.type === 'adjust') {
            let loc = item.stockByLocation.find((l: any) => 
              (data.toLocationId && l.locationId?.toString() === data.toLocationId?.toString()) || 
              (data.fromLocationId && l.locationId?.toString() === data.fromLocationId?.toString())
            );
            if (!loc && item.stockByLocation.length > 0) loc = item.stockByLocation[0];
            if (loc) {
              loc.quantity = qty;
            } else {
              item.stockByLocation.push({ locationId: data.toLocationId || data.fromLocationId || 'loc_1', locationName: 'Default Location', quantity: qty });
            }
          }

          item.totalStock = item.stockByLocation.reduce((acc: number, curr: any) => acc + Number(curr.quantity || 0), 0);
          await item.save();
        }

        // Silent Background Auto-Rotation:
        // When transaction count reaches 400, automatically delete the oldest 100 transactions
        try {
          const totalTxnCount = await StockTransaction.countDocuments({ teamId: data.teamId });
          if (totalTxnCount >= 400) {
            const oldest100 = await StockTransaction.find({ teamId: data.teamId })
              .sort({ createdAt: 1 })
              .limit(100)
              .select('_id')
              .lean();

            if (oldest100 && oldest100.length > 0) {
              const idsToDelete = oldest100.map((doc: any) => doc._id);
              await StockTransaction.deleteMany({ _id: { $in: idsToDelete } });
            }
          }
        } catch (cleanupErr) {
          console.error('Silent auto transaction cleanup error:', cleanupErr);
        }

        return JSON.parse(JSON.stringify(txn));
      } catch (e) {
        console.error('MongoDB recordTransaction error:', e);
      }
    }

    // In-memory fallback stock update
    for (const line of data.items) {
      const item = demoItems.find(i => i._id === line.itemId);
      if (item) {
        const qty = Number(line.quantity) || 0;
        if (!item.stockByLocation || item.stockByLocation.length === 0) {
          item.stockByLocation = [{ locationId: 'loc_1', locationName: 'Default Location', quantity: item.totalStock || 0 }];
        }
        if (data.type === 'stock_in' || data.type === 'purchase') {
          item.stockByLocation[0].quantity += qty;
        } else if (data.type === 'stock_out' || data.type === 'sale') {
          item.stockByLocation[0].quantity = Math.max(0, item.stockByLocation[0].quantity - qty);
        } else if (data.type === 'adjust') {
          item.stockByLocation[0].quantity = qty;
        }
        item.totalStock = item.stockByLocation.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
        item.updatedAt = new Date().toISOString();
      }
    }

    const txn: IStockTransaction = {
      _id: 'txn_' + Math.random().toString(36).substr(2, 7),
      referenceNo,
      ...data,
      totalQuantity: totalQty,
      createdAt: new Date().toISOString()
    };
    demoTransactions.unshift(txn);

    // In-memory fallback auto-cleanup: keep newest 300 if >= 400
    const teamTxns = demoTransactions.filter(t => t.teamId === data.teamId);
    if (teamTxns.length >= 400) {
      let count = 0;
      demoTransactions = demoTransactions.filter(t => {
        if (t.teamId === data.teamId) {
          count++;
          return count <= 300;
        }
        return true;
      });
    }

    return txn;
  }

  static async getTransactions(teamId: string, limit = 50): Promise<IStockTransaction[]> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        let filter: any = {};
        if (teamId && teamId !== 'all') filter.teamId = teamId;
        const txns = await StockTransaction.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
        if (txns && txns.length > 0) return JSON.parse(JSON.stringify(txns));
      } catch (e) {}
    }
    return demoTransactions.filter(t => teamId === 'all' || t.teamId === teamId).slice(0, limit);
  }

  // Categories & Brands
  static async getCategories(): Promise<string[]> {
    return demoCategories;
  }
  static async addCategory(cat: string): Promise<string> {
    if (!demoCategories.includes(cat.toLowerCase())) demoCategories.push(cat.toLowerCase());
    return cat.toLowerCase();
  }
  static async getBrands(): Promise<string[]> {
    return demoBrands;
  }
  static async addBrand(brand: string): Promise<string> {
    if (!demoBrands.includes(brand.toLowerCase())) demoBrands.push(brand.toLowerCase());
    return brand.toLowerCase();
  }

  // Members
  static async getMembers(teamId: string): Promise<ITeamMember[]> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const mems = await TeamMember.find({ teamId }).lean();
        if (mems) return JSON.parse(JSON.stringify(mems));
      } catch (e) {}
    }
    return demoMembers.filter(m => m.teamId === teamId);
  }

  // Metrics
  static async getDashboardMetrics(teamId: string) {
    const items = await this.getItems(teamId);
    const txns = await this.getTransactions(teamId);
    
    const today = new Date().toISOString().split('T')[0];
    const todayTxns = txns.filter(t => t.createdAt && new Date(t.createdAt).toISOString().startsWith(today));
    
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
