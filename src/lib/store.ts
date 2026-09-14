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

let demoUsers: any[] = [
  {
    _id: 'user_superadmin',
    name: 'Harpreet Singh (Super Admin)',
    email: SUPER_ADMIN_EMAIL.toLowerCase(),
    passwordHash: 'SUPER_ADMIN_PASSWORD_HASH',
    plainPassword: SUPER_ADMIN_PASSWORD,
    role: 'superadmin',
    isSuperAdmin: true,
  },
  {
    _id: 'user_subadmin_1',
    name: 'Simran Sub-Admin',
    email: 'subadmin@simranmobile.com',
    passwordHash: 'SUBADMIN_HASH',
    plainPassword: 'password123',
    role: 'admin',
    isSuperAdmin: false,
    defaultTeamId: 'team_1',
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
  // Authentication & Access Verification
  static async authenticateUser(email: string, pass: string): Promise<{
    success: boolean;
    error?: string;
    session?: UserSession;
    accessDenied?: boolean;
    accessReason?: string;
  }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Super Admin direct login
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase() && cleanPass === SUPER_ADMIN_PASSWORD) {
      return {
        success: true,
        session: {
          userId: 'user_superadmin',
          name: 'Harpreet Singh (Super Admin)',
          email: SUPER_ADMIN_EMAIL,
          role: 'superadmin',
          isSuperAdmin: true,
          subscription: {
            type: 'lifetime',
            isRevoked: false,
            isValid: true,
          }
        }
      };
    }

    // 2. Check MongoDB
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const user = await User.findOne({ email: cleanEmail });
        if (user) {
          const isMatch = (user.plainPassword && user.plainPassword === cleanPass) || (await comparePassword(cleanPass, user.passwordHash || ''));
          if (isMatch) {
            // Find user's team
            let team = await Team.findOne({ ownerId: user._id });
            let memberRole: Role = user.role || 'admin';
            let customPerms: CustomPermissions | undefined = undefined;

            if (!team) {
              // Check if team member
              const membership = await TeamMember.findOne({ userId: user._id });
              if (membership) {
                team = await Team.findById(membership.teamId);
                memberRole = membership.role;
                customPerms = membership.customPermissions;
              }
            }

            if (team) {
              const subCheck = this.calculateSubscription(team);
              if (!subCheck.isValid) {
                return {
                  success: false,
                  accessDenied: true,
                  accessReason: subCheck.isRevoked 
                    ? 'Access to this shop has been revoked by Super Admin.' 
                    : 'Your shop subscription has expired. Please contact Super Admin to extend access.',
                  session: {
                    userId: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    activeTeamId: team._id.toString(),
                    role: memberRole,
                    isSuperAdmin: false,
                    subscription: subCheck,
                  }
                };
              }

              return {
                success: true,
                session: {
                  userId: user._id.toString(),
                  name: user.name,
                  email: user.email,
                  activeTeamId: team._id.toString(),
                  role: memberRole,
                  isSuperAdmin: false,
                  permissions: customPerms,
                  subscription: subCheck,
                }
              };
            }
          }
        }
      } catch (err) {
        console.error('MongoDB Auth Error:', err);
      }
    }

    // 3. Fallback demo memory auth
    const memUser = demoUsers.find(u => u.email === cleanEmail && (u.plainPassword === cleanPass || cleanPass === 'password123'));
    if (memUser) {
      const team = demoTeams.find(t => t.ownerId === memUser._id || t._id === memUser.defaultTeamId) || demoTeams[0];
      const subCheck = this.calculateSubscription(team);
      if (!subCheck.isValid) {
        return {
          success: false,
          accessDenied: true,
          accessReason: subCheck.isRevoked ? 'Access Revoked by Super Admin' : 'Subscription Expired',
          session: {
            userId: memUser._id,
            name: memUser.name,
            email: memUser.email,
            activeTeamId: team?._id,
            role: memUser.role,
            isSuperAdmin: memUser.isSuperAdmin,
            subscription: subCheck,
          }
        };
      }

      return {
        success: true,
        session: {
          userId: memUser._id,
          name: memUser.name,
          email: memUser.email,
          activeTeamId: team?._id,
          role: memUser.role,
          isSuperAdmin: memUser.isSuperAdmin,
          subscription: subCheck,
        }
      };
    }

    // Also check demo members
    const memStaff = demoMembers.find(m => m.email.toLowerCase() === cleanEmail && (m.password === cleanPass || cleanPass === 'password123'));
    if (memStaff) {
      const team = demoTeams.find(t => t._id === memStaff.teamId) || demoTeams[0];
      const subCheck = this.calculateSubscription(team);
      if (!subCheck.isValid) {
        return {
          success: false,
          accessDenied: true,
          accessReason: 'Shop access is suspended or expired.',
        };
      }
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
          subscription: subCheck,
        }
      };
    }

    return { success: false, error: 'Invalid email or password' };
  }

  // Calculate remaining days & active status
  static calculateSubscription(team: any) {
    if (!team) return { type: 'days' as const, isRevoked: true, isValid: false, daysRemaining: 0 };
    if (team.isAccessRevoked) {
      return { type: team.subscriptionType || 'days', isRevoked: true, isValid: false, daysRemaining: 0 };
    }
    if (team.subscriptionType === 'lifetime') {
      return { type: 'lifetime' as const, isRevoked: false, isValid: true, daysRemaining: 9999 };
    }

    const expiryTime = team.subscriptionExpiresAt ? new Date(team.subscriptionExpiresAt).getTime() : 0;
    const now = Date.now();
    const diffDays = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));
    const isValid = diffDays > 0;

    return {
      type: 'days' as const,
      expiresAt: team.subscriptionExpiresAt ? new Date(team.subscriptionExpiresAt).toISOString() : undefined,
      isRevoked: false,
      daysRemaining: Math.max(0, diffDays),
      isValid,
    };
  }

  // Super Admin: List All Sub-Admins & Shops
  static async listSubAdmins(): Promise<ISubAdminInfo[]> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const teams = await Team.find({}).sort({ createdAt: -1 }).lean();
        const result: ISubAdminInfo[] = [];

        for (const t of teams) {
          const user = await User.findById(t.ownerId).lean();
          const sub = this.calculateSubscription(t);
          const membersCount = await TeamMember.countDocuments({ teamId: t._id });
          const itemsCount = await Item.countDocuments({ teamId: t._id, isArchived: false });

          result.push({
            userId: t.ownerId?.toString() || '',
            name: t.ownerName || user?.name || 'Sub-Admin',
            email: t.ownerEmail || user?.email || '',
            teamId: t._id.toString(),
            shopName: t.name,
            subscriptionType: t.subscriptionType || 'days',
            subscriptionExpiresAt: t.subscriptionExpiresAt ? new Date(t.subscriptionExpiresAt).toISOString() : undefined,
            isAccessRevoked: !!t.isAccessRevoked,
            daysRemaining: sub.daysRemaining,
            isValid: sub.isValid,
            membersCount,
            itemsCount,
            createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
          });
        }
        return result;
      } catch (err) {
        console.error('MongoDB listSubAdmins error:', err);
      }
    }

    return demoTeams.map(t => {
      const sub = this.calculateSubscription(t);
      return {
        userId: t.ownerId,
        name: t.ownerName || 'Simran Sub-Admin',
        email: t.ownerEmail || 'subadmin@simranmobile.com',
        teamId: t._id,
        shopName: t.name,
        subscriptionType: t.subscriptionType || 'days',
        subscriptionExpiresAt: t.subscriptionExpiresAt,
        isAccessRevoked: t.isAccessRevoked,
        daysRemaining: sub.daysRemaining,
        isValid: sub.isValid,
        membersCount: demoMembers.filter(m => m.teamId === t._id).length,
        itemsCount: demoItems.filter(i => i.teamId === t._id && !i.isArchived).length,
        createdAt: t.createdAt,
      };
    });
  }

  // Super Admin: Create Sub-Admin
  static async createSubAdmin(data: {
    name: string;
    email: string;
    password: string;
    shopName: string;
    subscriptionType: 'days' | 'lifetime';
    days?: number;
  }): Promise<ISubAdminInfo> {
    const cleanEmail = data.email.trim().toLowerCase();
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const days = data.days || 10;
    const expiresAt = data.subscriptionType === 'lifetime' 
      ? undefined 
      : new Date(Date.now() + days * 86400000);

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const pHash = await hashPassword(data.password);
        
        let user = await User.findOne({ email: cleanEmail });
        if (!user) {
          user = await User.create({
            name: data.name,
            email: cleanEmail,
            passwordHash: pHash,
            plainPassword: data.password,
            role: 'admin',
            isSuperAdmin: false,
          });
        } else {
          user.plainPassword = data.password;
          user.passwordHash = pHash;
          await user.save();
        }

        const team = await Team.create({
          name: data.shopName,
          ownerId: user._id,
          ownerEmail: cleanEmail,
          ownerName: data.name,
          inviteCode,
          currency: '₹',
          subscriptionType: data.subscriptionType,
          subscriptionDays: days,
          subscriptionExpiresAt: expiresAt,
          isAccessRevoked: false,
        });

        await Location.create({
          teamId: team._id,
          name: 'Default Location',
          isDefault: true,
          isArchived: false,
        });

        user.defaultTeamId = team._id;
        await user.save();

        const sub = this.calculateSubscription(team);
        return {
          userId: user._id.toString(),
          name: user.name,
          email: user.email,
          teamId: team._id.toString(),
          shopName: team.name,
          subscriptionType: team.subscriptionType,
          subscriptionExpiresAt: expiresAt ? expiresAt.toISOString() : undefined,
          isAccessRevoked: false,
          daysRemaining: sub.daysRemaining,
          isValid: sub.isValid,
          membersCount: 0,
          itemsCount: 0,
          createdAt: new Date().toISOString(),
        };
      } catch (err) {
        console.error('MongoDB createSubAdmin error:', err);
      }
    }

    const userId = 'user_' + Math.random().toString(36).substr(2, 7);
    const teamId = 'team_' + Math.random().toString(36).substr(2, 7);

    demoUsers.push({
      _id: userId,
      name: data.name,
      email: cleanEmail,
      plainPassword: data.password,
      role: 'admin',
      isSuperAdmin: false,
      defaultTeamId: teamId,
    });

    const newTeam: ITeam = {
      _id: teamId,
      name: data.shopName,
      ownerId: userId,
      ownerEmail: cleanEmail,
      ownerName: data.name,
      inviteCode,
      currency: '₹',
      lowStockThresholdDefault: 5,
      subscriptionType: data.subscriptionType,
      subscriptionDays: days,
      subscriptionExpiresAt: expiresAt ? expiresAt.toISOString() : undefined,
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

    const sub = this.calculateSubscription(newTeam);
    return {
      userId,
      name: data.name,
      email: cleanEmail,
      teamId,
      shopName: data.shopName,
      subscriptionType: data.subscriptionType,
      subscriptionExpiresAt: expiresAt ? expiresAt.toISOString() : undefined,
      isAccessRevoked: false,
      daysRemaining: sub.daysRemaining,
      isValid: sub.isValid,
      membersCount: 0,
      itemsCount: 0,
      createdAt: new Date().toISOString(),
    };
  }

  // Super Admin: Update Subscription Days / Lifetime / Revoke
  static async updateSubAdminSubscription(teamId: string, update: {
    subscriptionType?: 'days' | 'lifetime';
    addDays?: number;
    setDays?: number;
    isAccessRevoked?: boolean;
  }): Promise<boolean> {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const team = await Team.findById(teamId);
        if (!team) return false;

        if (update.subscriptionType) team.subscriptionType = update.subscriptionType;
        if (typeof update.isAccessRevoked === 'boolean') team.isAccessRevoked = update.isAccessRevoked;

        if (update.subscriptionType === 'lifetime') {
          team.subscriptionExpiresAt = undefined;
        } else if (update.addDays) {
          const currentExpiry = team.subscriptionExpiresAt ? new Date(team.subscriptionExpiresAt).getTime() : Date.now();
          const base = Math.max(Date.now(), currentExpiry);
          team.subscriptionExpiresAt = new Date(base + update.addDays * 86400000);
        } else if (update.setDays) {
          team.subscriptionExpiresAt = new Date(Date.now() + update.setDays * 86400000);
        }

        await team.save();
        return true;
      } catch (err) {
        console.error('MongoDB updateSubAdmin error:', err);
      }
    }

    const t = demoTeams.find(team => team._id === teamId);
    if (!t) return false;

    if (update.subscriptionType) t.subscriptionType = update.subscriptionType;
    if (typeof update.isAccessRevoked === 'boolean') t.isAccessRevoked = update.isAccessRevoked;

    if (update.subscriptionType === 'lifetime') {
      t.subscriptionExpiresAt = undefined;
    } else if (update.addDays) {
      const currentExpiry = t.subscriptionExpiresAt ? new Date(t.subscriptionExpiresAt).getTime() : Date.now();
      const base = Math.max(Date.now(), currentExpiry);
      t.subscriptionExpiresAt = new Date(base + update.addDays * 86400000).toISOString();
    } else if (update.setDays) {
      t.subscriptionExpiresAt = new Date(Date.now() + update.setDays * 86400000).toISOString();
    }
    return true;
  }

  // Sub-Admin: Add Staff Member with Email & Password
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
      _id: 'txn_' + Math.random().toString(36).substr(2, 7),
      referenceNo,
      ...data,
      totalQuantity: totalQty,
      createdAt: new Date().toISOString()
    };
    demoTransactions.unshift(txn);
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
