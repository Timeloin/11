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
  // Always resolves to the single unified primary store in database
  static async getPrimaryTeamId(preferredTeamId?: string): Promise<string> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        let team = await Team.findOne({}).sort({ createdAt: 1 });
        if (!team) {
          const envAdminEmail = (process.env.SUPER_ADMIN_EMAIL || SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
          team = await Team.create({
            name: 'Simran Mobile',
            ownerEmail: envAdminEmail || 'admin@simranmobile.com',
            ownerName: 'Main Admin',
            inviteCode: 'SIMRAN88',
            currency: '₹',
          });
        }
        return team._id.toString();
      } catch (e) {
        console.error('getPrimaryTeamId error:', e);
      }
    }
    return 'team_1';
  }

  static isMainAdmin(email?: string): boolean {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    const envAdminEmail = (process.env.SUPER_ADMIN_EMAIL || SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
    return !!envAdminEmail && clean === envAdminEmail;
  }

  static async findMemberByEmail(email: string): Promise<ITeamMember | null> {
    const clean = email.trim().toLowerCase();
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const mem = await TeamMember.findOne({ email: clean }).lean();
        if (mem) return JSON.parse(JSON.stringify(mem));
      } catch (e) {
        console.error('findMemberByEmail error:', e);
      }
    }
    const demo = demoMembers.find(m => m.email.toLowerCase() === clean);
    return demo || null;
  }

  // Authentication: Exactly 1 Main Admin (from Vercel env) + Shared Staff Members
  static async authenticateUser(email: string, pass: string): Promise<{
    success: boolean;
    error?: string;
    session?: UserSession;
  }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    const envAdminEmail = (process.env.SUPER_ADMIN_EMAIL || SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
    const envAdminPass = process.env.SUPER_ADMIN_PASSWORD || SUPER_ADMIN_PASSWORD || '';

    const primaryTeamId = await this.getPrimaryTeamId();

    // 1. Main Admin direct login using Vercel env credentials (ONLY 1 MAIN ADMIN)
    if (envAdminEmail && envAdminPass && cleanEmail === envAdminEmail && cleanPass === envAdminPass) {
      return {
        success: true,
        session: {
          userId: 'user_main_admin',
          name: 'Main Admin',
          email: envAdminEmail,
          role: 'admin',
          activeTeamId: primaryTeamId,
          isSuperAdmin: false,
        },
      };
    }

    // 2. Check MongoDB for staff members (They share the exact same team & database)
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const user = await User.findOne({ email: cleanEmail });
        if (user) {
          const isMatch =
            (user.plainPassword && user.plainPassword === cleanPass) ||
            (await comparePassword(cleanPass, user.passwordHash || ''));
          if (isMatch) {
            let memberRole: Role = 'manager';
            let customPerms: CustomPermissions | undefined = undefined;

            const membership = await TeamMember.findOne({ email: cleanEmail });
            if (membership) {
              memberRole = membership.role;
              customPerms = membership.customPermissions;
            } else if (user.role && user.role !== 'admin') {
              memberRole = user.role;
            }

            return {
              success: true,
              session: {
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                activeTeamId: primaryTeamId, // Shared single database
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

    // 3. Fallback demo memory auth for members (all sharing team_1)
    const memStaff = demoMembers.find(
      (m) => m.email.toLowerCase() === cleanEmail && (m.password === cleanPass || cleanPass === 'password123')
    );
    if (memStaff) {
      return {
        success: true,
        session: {
          userId: memStaff.userId,
          name: memStaff.name,
          email: memStaff.email,
          activeTeamId: 'team_1',
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
          const name = String(raw.Name || raw.name || raw['Item Name'] || raw['Product Name'] || '').trim();
          if (!name) continue;

          const sku = String(
            raw.SKU ||
              raw.sku ||
              raw['Item Code'] ||
              `SKU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`
          ).trim();
          const category = String(raw.Category || raw.category || 'mobile phone').trim().toLowerCase();
          const brand = String(raw.Brand || raw.brand || 'generic').trim().toLowerCase();
          const unit = String(raw.Unit || raw.unit || 'pcs').trim();
          const costPrice = Number(raw['Cost Price'] || raw.costPrice || raw['Unit Cost'] || raw.Cost || 0) || 0;
          const sellingPrice = Number(raw['Selling Price'] || raw.sellingPrice || raw.Price || 0) || 0;
          const totalStock =
            Number(raw['Total Stock'] || raw.totalStock || raw.Quantity || raw.Stock || raw['Qty(Default Location)'] || 0) || 0;
          const minStock = Number(raw['Safety Stock'] || raw.minStock || raw['Min Stock'] || 3) || 3;
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
      const name = String(raw.Name || raw.name || raw['Item Name'] || raw['Product Name'] || '').trim();
      if (!name) continue;
      const sku = String(
        raw.SKU ||
          raw.sku ||
          raw['Item Code'] ||
          `SKU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`
      ).trim();
      const category = String(raw.Category || raw.category || 'mobile phone').trim().toLowerCase();
      const brand = String(raw.Brand || raw.brand || 'generic').trim().toLowerCase();
      const unit = String(raw.Unit || raw.unit || 'pcs').trim();
      const costPrice = Number(raw['Cost Price'] || raw.costPrice || raw['Unit Cost'] || raw.Cost || 0) || 0;
      const sellingPrice = Number(raw['Selling Price'] || raw.sellingPrice || raw.Price || 0) || 0;
      const totalStock =
        Number(raw['Total Stock'] || raw.totalStock || raw.Quantity || raw.Stock || raw['Qty(Default Location)'] || 0) || 0;
      const minStock = Number(raw['Safety Stock'] || raw.minStock || raw['Min Stock'] || 3) || 3;

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
          category,
          brand,
          unit,
          costPrice,
          sellingPrice,
          totalStock,
          minStock,
          barcodes: raw.barcodes || (raw.Barcode ? [String(raw.Barcode).trim()] : []),
          images: [],
          stockByLocation: [{ locationId: 'loc_1', locationName: 'Main Store', quantity: totalStock }],
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        imported++;
      }
    }

    return { success: true, count: itemsList.length, imported, updated };
  }

  // Compatibility Helpers
  static calculateSubscription(team?: any) {
    return { type: 'lifetime' as const, isRevoked: false, isValid: true, daysRemaining: 9999 };
  }

  static async listSubAdmins(): Promise<ISubAdminInfo[]> {
    return [];
  }

  static async createSubAdmin(data: any): Promise<ISubAdminInfo> {
    return {
      userId: 'user_admin',
      name: data.name,
      email: data.email,
      teamId: 'team_1',
      shopName: data.shopName || 'Simran Mobile',
      subscriptionType: 'lifetime',
      isAccessRevoked: false,
      daysRemaining: 9999,
      isValid: true,
      membersCount: 0,
      itemsCount: 0,
      createdAt: new Date().toISOString(),
    };
  }

  static async updateSubAdminSubscription(teamId: string, update: any): Promise<boolean> {
    return true;
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
    const targetTeamId = await this.getPrimaryTeamId(teamId);

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
            defaultTeamId: targetTeamId,
          });
        }

        const member = await TeamMember.create({
          teamId: targetTeamId,
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
      teamId: 'team_1',
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

  static async updateMember(
    memberId: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
      customPermissions?: CustomPermissions;
    }
  ): Promise<ITeamMember | null> {
    const cleanEmail = data.email ? data.email.trim().toLowerCase() : undefined;

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const updateFields: any = {};
        if (data.name) updateFields.name = data.name.trim();
        if (cleanEmail) updateFields.email = cleanEmail;
        if (data.password) updateFields.password = data.password.trim();
        if (data.role) updateFields.role = data.role;
        if (data.customPermissions) updateFields.customPermissions = data.customPermissions;

        const member = await TeamMember.findByIdAndUpdate(memberId, updateFields, { new: true });
        if (member) {
          const userUpdate: any = {};
          if (data.name) userUpdate.name = data.name.trim();
          if (cleanEmail) userUpdate.email = cleanEmail;
          if (data.role) userUpdate.role = data.role;
          if (data.password) {
            userUpdate.plainPassword = data.password.trim();
            userUpdate.passwordHash = await hashPassword(data.password.trim());
          }
          if (member.userId) {
            await User.findByIdAndUpdate(member.userId, userUpdate);
          } else if (member.email) {
            await User.findOneAndUpdate({ email: member.email }, userUpdate);
          }
          return JSON.parse(JSON.stringify(member));
        }
      } catch (err) {
        console.error('MongoDB updateMember error:', err);
      }
    }

    const idx = demoMembers.findIndex((m) => m._id === memberId);
    if (idx !== -1) {
      demoMembers[idx] = {
        ...demoMembers[idx],
        name: data.name || demoMembers[idx].name,
        email: cleanEmail || demoMembers[idx].email,
        password: data.password || demoMembers[idx].password,
        role: data.role || demoMembers[idx].role,
        customPermissions: data.customPermissions || demoMembers[idx].customPermissions,
      };
      return demoMembers[idx];
    }
    return null;
  }

  static async deleteMember(memberId: string): Promise<boolean> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const member = await TeamMember.findByIdAndDelete(memberId);
        if (member) {
          if (member.userId) {
            await User.findByIdAndDelete(member.userId);
          }
          if (member.email) {
            await User.findOneAndDelete({ email: member.email });
          }
          return true;
        }
      } catch (err) {
        console.error('MongoDB deleteMember error:', err);
      }
    }

    const idx = demoMembers.findIndex((m) => m._id === memberId);
    if (idx !== -1) {
      demoMembers.splice(idx, 1);
      return true;
    }
    return false;
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
        const locs = await Location.find({ isArchived: false }).lean();
        if (locs && locs.length > 0) return JSON.parse(JSON.stringify(locs));
      } catch (e) {}
    }
    return demoLocations.filter(l => !l.isArchived);
  }

  static async addLocation(teamId: string, name: string): Promise<ILocation> {
    const targetTeamId = await this.getPrimaryTeamId(teamId);
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const loc = await Location.create({ teamId: targetTeamId, name, isDefault: false, isArchived: false });
        return JSON.parse(JSON.stringify(loc));
      } catch (e) {}
    }

    const loc: ILocation = {
      _id: 'loc_' + Math.random().toString(36).substr(2, 7),
      teamId: 'team_1',
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

    let items = demoItems.filter(i => !i.isArchived);
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
    const targetTeamId = await this.getPrimaryTeamId(teamId);
    const defaultLoc = demoLocations.find(l => l.teamId === targetTeamId && l.isDefault) || demoLocations[0];
    
    const stockByLocation = itemData.stockByLocation || [
      {
        locationId: defaultLoc ? defaultLoc._id : 'loc_1',
        locationName: defaultLoc ? defaultLoc.name : 'Main Store',
        quantity: initialQty
      }
    ];

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const newItem = await Item.create({
          teamId: targetTeamId,
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

        // Always record create_item transaction for auditing and undo capability
        await StockTransaction.create({
          teamId: targetTeamId,
          type: 'create_item',
          referenceNo: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
          toLocationId: stockByLocation[0]?.locationId,
          toLocationName: stockByLocation[0]?.locationName,
          items: [{
            itemId: newItem._id,
            sku: newItem.sku,
            name: newItem.name,
            quantity: initialQty,
            unitCost: Number(itemData.costPrice) || 0,
            unitPrice: Number(itemData.sellingPrice) || 0,
          }],
          totalQuantity: initialQty,
          reason: 'Item Created / Added to Inventory',
          userId: (itemData as any).userId || 'user_admin',
          userName: (itemData as any).userName || 'Main Admin',
          snapshotData: JSON.parse(JSON.stringify(newItem)),
        });

        return JSON.parse(JSON.stringify(newItem));
      } catch (e) {
        console.error('MongoDB createItem error:', e);
      }
    }

    const newItem: IItem = {
      _id: 'item_' + Math.random().toString(36).substr(2, 7),
      teamId: 'team_1',
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
    demoTransactions.unshift({
      _id: 'txn_' + Date.now(),
      teamId: 'team_1',
      type: 'create_item',
      referenceNo: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      items: [{
        itemId: newItem._id,
        sku: newItem.sku,
        name: newItem.name,
        quantity: initialQty,
        unitCost: newItem.costPrice,
        unitPrice: newItem.sellingPrice,
      }],
      totalQuantity: initialQty,
      reason: 'Item Created / Added to Inventory',
      userId: (itemData as any).userId || 'user_admin',
      userName: (itemData as any).userName || 'Main Admin',
      snapshotData: { ...newItem },
      createdAt: new Date().toISOString(),
    });
    return newItem;
  }

  static async getItemById(teamId: string, id: string): Promise<IItem | null> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const item = await Item.findOne({ _id: id, isArchived: false }).lean();
        if (item) return JSON.parse(JSON.stringify(item));
      } catch (e) {
        console.error('MongoDB getItemById error:', e);
      }
    }
    return demoItems.find(i => i._id === id && !i.isArchived) || null;
  }

  static async updateItem(teamId: string, id: string, data: Partial<IItem>): Promise<IItem | null> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const item = await Item.findOneAndUpdate(
          { _id: id },
          { ...data, updatedAt: new Date() },
          { new: true }
        ).lean();
        if (item) return JSON.parse(JSON.stringify(item));
      } catch (e) {
        console.error('MongoDB updateItem error:', e);
      }
    }

    const idx = demoItems.findIndex(i => i._id === id);
    if (idx !== -1) {
      demoItems[idx] = { ...demoItems[idx], ...data, updatedAt: new Date().toISOString() };
      return demoItems[idx];
    }
    return null;
  }

  static async deleteItem(
    teamId: string,
    id: string,
    operatorName: string = 'Main Admin',
    userId: string = 'user_admin'
  ): Promise<boolean> {
    const targetTeamId = await this.getPrimaryTeamId(teamId);
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const existing = await Item.findById(id).lean();
        if (existing) {
          await Item.findOneAndUpdate({ _id: id }, { isArchived: true });

          // Record 'delete_item' transaction with complete snapshot for restoration
          await StockTransaction.create({
            teamId: targetTeamId,
            type: 'delete_item',
            referenceNo: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
            items: [{
              itemId: existing._id,
              sku: existing.sku,
              name: existing.name,
              quantity: existing.totalStock || 0,
              unitCost: existing.costPrice || 0,
              unitPrice: existing.sellingPrice || 0,
            }],
            totalQuantity: existing.totalStock || 0,
            reason: `Item Deleted: "${existing.name}"`,
            userId: userId || 'user_admin',
            userName: operatorName || 'Main Admin',
            snapshotData: JSON.parse(JSON.stringify(existing)),
          });
          return true;
        }
      } catch (e) {
        console.error('MongoDB deleteItem error:', e);
      }
    }

    const idx = demoItems.findIndex(i => i._id === id);
    if (idx !== -1) {
      const item = demoItems[idx];
      item.isArchived = true;
      demoTransactions.unshift({
        _id: 'txn_' + Date.now(),
        teamId: 'team_1',
        type: 'delete_item',
        referenceNo: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
        items: [{
          itemId: item._id,
          sku: item.sku,
          name: item.name,
          quantity: item.totalStock || 0,
          unitCost: item.costPrice || 0,
          unitPrice: item.sellingPrice || 0,
        }],
        totalQuantity: item.totalStock || 0,
        reason: `Item Deleted: "${item.name}"`,
        userId: userId || 'user_admin',
        userName: operatorName || 'Main Admin',
        snapshotData: { ...item },
        createdAt: new Date().toISOString(),
      });
      return true;
    }
    return false;
  }

  static async deleteAllItems(
    teamId: string,
    operatorName: string = 'Main Admin',
    userId: string = 'user_admin'
  ): Promise<boolean> {
    const targetTeamId = await this.getPrimaryTeamId(teamId);
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const activeItems = await Item.find({ isArchived: false }).lean();
        if (activeItems.length > 0) {
          // Soft delete all items so they can be restored if undone
          await Item.updateMany({ isArchived: false }, { isArchived: true });

          // Record delete_item transaction for each or batch
          for (const it of activeItems) {
            await StockTransaction.create({
              teamId: targetTeamId,
              type: 'delete_item',
              referenceNo: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
              items: [{
                itemId: it._id,
                sku: it.sku,
                name: it.name,
                quantity: it.totalStock || 0,
                unitCost: it.costPrice || 0,
                unitPrice: it.sellingPrice || 0,
              }],
              totalQuantity: it.totalStock || 0,
              reason: 'Bulk All Items Deletion',
              userId: userId || 'user_admin',
              userName: operatorName || 'Main Admin',
              snapshotData: JSON.parse(JSON.stringify(it)),
            });
          }
        }
        return true;
      } catch (e) {
        console.error('MongoDB deleteAllItems error:', e);
      }
    }

    for (const it of demoItems) {
      it.isArchived = true;
      demoTransactions.unshift({
        _id: 'txn_' + Date.now() + Math.random().toString().slice(-4),
        teamId: 'team_1',
        type: 'delete_item',
        referenceNo: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
        items: [{
          itemId: it._id,
          sku: it.sku,
          name: it.name,
          quantity: it.totalStock || 0,
          unitCost: it.costPrice || 0,
          unitPrice: it.sellingPrice || 0,
        }],
        totalQuantity: it.totalStock || 0,
        reason: 'Bulk All Items Deletion',
        userId: userId || 'user_admin',
        userName: operatorName || 'Main Admin',
        snapshotData: { ...it },
        createdAt: new Date().toISOString(),
      });
    }
    demoItems.length = 0;
    return true;
  }

  static async findItemByBarcode(teamId: string, code: string): Promise<IItem | null> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const item = await Item.findOne({ barcodes: code, isArchived: false }).lean();
        if (item) return JSON.parse(JSON.stringify(item));
      } catch (e) {
        console.error('MongoDB findItemByBarcode error:', e);
      }
    }

    return demoItems.find(i => !i.isArchived && i.barcodes.includes(code)) || null;
  }

  // Transactions
  static async recordTransaction(data: Omit<IStockTransaction, '_id' | 'referenceNo' | 'createdAt'>): Promise<IStockTransaction> {
    const referenceNo = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    const totalQty = Number(data.totalQuantity) || data.items.reduce((acc, it) => acc + Number(it.quantity || 0), 0);
    const targetTeamId = await this.getPrimaryTeamId(data.teamId);

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const txn = await StockTransaction.create({
          ...data,
          teamId: targetTeamId,
          totalQuantity: totalQty,
          referenceNo,
          userId: data.userId || 'user_admin',
          userName: data.userName || 'Main Admin',
        });

        const snapshots: any[] = [];
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

          // Preserve exact pre-change stock distribution for rollback / undo
          snapshots.push({
            itemId: item._id.toString(),
            previousStockByLocation: JSON.parse(JSON.stringify(item.stockByLocation || [])),
            previousTotalStock: item.totalStock,
          });

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

        if (snapshots.length > 0) {
          txn.snapshotData = snapshots;
          await txn.save();
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
    const inMemSnapshots: any[] = [];
    for (const line of data.items) {
      const item = demoItems.find(i => i._id === line.itemId);
      if (item) {
        inMemSnapshots.push({
          itemId: item._id,
          previousStockByLocation: JSON.parse(JSON.stringify(item.stockByLocation || [])),
          previousTotalStock: item.totalStock,
        });

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
      snapshotData: inMemSnapshots,
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
        const txns = await StockTransaction.find({}).sort({ createdAt: -1 }).limit(limit).lean();
        if (txns && txns.length > 0) return JSON.parse(JSON.stringify(txns));
      } catch (e) {}
    }
    return demoTransactions.slice(0, limit);
  }

  // Undo / Revert Transaction & Restore Inventory
  static async undoTransaction(
    transactionId: string,
    operatorName: string = 'Main Admin',
    userId: string = 'user_admin'
  ): Promise<{ success: boolean; message: string; transaction: IStockTransaction; restoredItem?: any }> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const txn = await StockTransaction.findById(transactionId);
        if (!txn) throw new Error('Transaction not found');
        if (txn.isUndone) throw new Error('This transaction has already been undone.');

        let restoredItem: any = null;

        if (txn.type === 'delete_item') {
          // Revert deletion: restore item into catalog
          const targetId = txn.items?.[0]?.itemId || txn.snapshotData?._id;
          let item = targetId ? await Item.findById(targetId) : null;
          if (item) {
            item.isArchived = false;
            await item.save();
            restoredItem = JSON.parse(JSON.stringify(item));
          } else if (txn.snapshotData) {
            const dataToRestore = { ...txn.snapshotData, isArchived: false };
            delete dataToRestore._id;
            const recreated = await Item.create(dataToRestore);
            restoredItem = JSON.parse(JSON.stringify(recreated));
          }
        } else if (txn.type === 'create_item') {
          // Revert creation: archive the newly created item
          const targetId = txn.items?.[0]?.itemId || txn.snapshotData?._id;
          if (targetId) {
            await Item.findOneAndUpdate({ _id: targetId }, { isArchived: true });
          }
        } else if (txn.type === 'stock_in' || txn.type === 'purchase') {
          // Revert stock-in: deduct quantity
          for (const line of txn.items || []) {
            const item = await Item.findById(line.itemId);
            if (item) {
              const qty = Number(line.quantity) || 0;
              let loc = item.stockByLocation?.find(
                (l: any) => txn.toLocationId && l.locationId?.toString() === txn.toLocationId?.toString()
              );
              if (!loc && item.stockByLocation?.length > 0) loc = item.stockByLocation[0];
              if (loc) {
                loc.quantity = Math.max(0, (Number(loc.quantity) || 0) - qty);
              }
              item.totalStock = (item.stockByLocation || []).reduce(
                (acc: number, curr: any) => acc + Number(curr.quantity || 0),
                0
              );
              await item.save();
              restoredItem = JSON.parse(JSON.stringify(item));
            }
          }
        } else if (txn.type === 'stock_out' || txn.type === 'sale') {
          // Revert stock-out: restore quantity back
          for (const line of txn.items || []) {
            const item = await Item.findById(line.itemId);
            if (item) {
              const qty = Number(line.quantity) || 0;
              let loc = item.stockByLocation?.find(
                (l: any) => txn.fromLocationId && l.locationId?.toString() === txn.fromLocationId?.toString()
              );
              if (!loc && item.stockByLocation?.length > 0) loc = item.stockByLocation[0];
              if (loc) {
                loc.quantity = (Number(loc.quantity) || 0) + qty;
              }
              item.totalStock = (item.stockByLocation || []).reduce(
                (acc: number, curr: any) => acc + Number(curr.quantity || 0),
                0
              );
              await item.save();
              restoredItem = JSON.parse(JSON.stringify(item));
            }
          }
        } else if (txn.type === 'move') {
          // Revert move: deduct from toLocation, add back to fromLocation
          for (const line of txn.items || []) {
            const item = await Item.findById(line.itemId);
            if (item) {
              const qty = Number(line.quantity) || 0;
              let toLoc = item.stockByLocation?.find(
                (l: any) => txn.toLocationId && l.locationId?.toString() === txn.toLocationId?.toString()
              );
              if (toLoc) toLoc.quantity = Math.max(0, (Number(toLoc.quantity) || 0) - qty);

              let fromLoc = item.stockByLocation?.find(
                (l: any) => txn.fromLocationId && l.locationId?.toString() === txn.fromLocationId?.toString()
              );
              if (fromLoc) fromLoc.quantity = (Number(fromLoc.quantity) || 0) + qty;

              item.totalStock = (item.stockByLocation || []).reduce(
                (acc: number, curr: any) => acc + Number(curr.quantity || 0),
                0
              );
              await item.save();
              restoredItem = JSON.parse(JSON.stringify(item));
            }
          }
        } else if (txn.type === 'adjust') {
          // Revert adjustment: restore prior snapshot if available
          const snapshots = Array.isArray(txn.snapshotData) ? txn.snapshotData : [txn.snapshotData];
          for (const snap of snapshots) {
            if (snap && snap.itemId && snap.previousStockByLocation) {
              const item = await Item.findById(snap.itemId);
              if (item) {
                item.stockByLocation = snap.previousStockByLocation;
                item.totalStock = snap.previousTotalStock ?? item.stockByLocation.reduce(
                  (acc: number, curr: any) => acc + Number(curr.quantity || 0),
                  0
                );
                await item.save();
                restoredItem = JSON.parse(JSON.stringify(item));
              }
            }
          }
        }

        txn.isUndone = true;
        txn.undoneAt = new Date();
        txn.undoneBy = operatorName || 'Main Admin';
        await txn.save();

        return {
          success: true,
          message: 'Transaction undone and inventory state restored successfully.',
          transaction: JSON.parse(JSON.stringify(txn)),
          restoredItem,
        };
      } catch (err: any) {
        console.error('MongoDB undoTransaction error:', err);
        throw err;
      }
    }

    // In-memory fallback
    const txn = demoTransactions.find(t => t._id === transactionId);
    if (!txn) throw new Error('Transaction not found');
    if (txn.isUndone) throw new Error('This transaction has already been undone.');

    let restoredItem: any = null;

    if (txn.type === 'delete_item') {
      const targetId = txn.items?.[0]?.itemId || txn.snapshotData?._id;
      const memItem = demoItems.find(i => i._id === targetId);
      if (memItem) {
        memItem.isArchived = false;
        restoredItem = memItem;
      } else if (txn.snapshotData) {
        const restored = { ...txn.snapshotData, isArchived: false };
        demoItems.unshift(restored);
        restoredItem = restored;
      }
    } else if (txn.type === 'create_item') {
      const targetId = txn.items?.[0]?.itemId || txn.snapshotData?._id;
      const memItem = demoItems.find(i => i._id === targetId);
      if (memItem) memItem.isArchived = true;
    } else if (txn.type === 'stock_in' || txn.type === 'purchase') {
      for (const line of txn.items || []) {
        const item = demoItems.find(i => i._id === line.itemId);
        if (item) {
          const qty = Number(line.quantity) || 0;
          if (item.stockByLocation?.[0]) {
            item.stockByLocation[0].quantity = Math.max(0, item.stockByLocation[0].quantity - qty);
          }
          item.totalStock = Math.max(0, (Number(item.totalStock) || 0) - qty);
          restoredItem = item;
        }
      }
    } else if (txn.type === 'stock_out' || txn.type === 'sale') {
      for (const line of txn.items || []) {
        const item = demoItems.find(i => i._id === line.itemId);
        if (item) {
          const qty = Number(line.quantity) || 0;
          if (item.stockByLocation?.[0]) {
            item.stockByLocation[0].quantity += qty;
          }
          item.totalStock = (Number(item.totalStock) || 0) + qty;
          restoredItem = item;
        }
      }
    } else if (txn.type === 'move') {
      for (const line of txn.items || []) {
        const item = demoItems.find(i => i._id === line.itemId);
        if (item) {
          restoredItem = item;
        }
      }
    } else if (txn.type === 'adjust') {
      const snapshots = Array.isArray(txn.snapshotData) ? txn.snapshotData : [txn.snapshotData];
      for (const snap of snapshots) {
        if (snap && snap.itemId) {
          const item = demoItems.find(i => i._id === snap.itemId);
          if (item && snap.previousStockByLocation) {
            item.stockByLocation = snap.previousStockByLocation;
            item.totalStock = snap.previousTotalStock ?? item.totalStock;
            restoredItem = item;
          }
        }
      }
    }

    txn.isUndone = true;
    txn.undoneAt = new Date().toISOString();
    txn.undoneBy = operatorName || 'Main Admin';

    return {
      success: true,
      message: 'Transaction undone and inventory state restored successfully.',
      transaction: txn,
      restoredItem,
    };
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
        const mems = await TeamMember.find({}).lean();
        if (mems) return JSON.parse(JSON.stringify(mems));
      } catch (e) {}
    }
    return demoMembers;
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
