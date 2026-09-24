import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Shield,
  PlusCircle,
  Edit3,
  Trash2,
  ArrowDown,
  ArrowUp,
  ShoppingBag,
  Receipt,
  Sliders,
  ArrowRightLeft,
  Users,
  Eye,
  Download,
  Lock,
} from 'lucide-react';
import { ITeamMember, Role, CustomPermissions } from '@/types';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: ITeamMember | null;
  onUpdate: (memberId: string, data: Partial<ITeamMember>) => Promise<void>;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [perms, setPerms] = useState<CustomPermissions>({
    canCreateItem: true,
    canEditItem: true,
    canDeleteItem: false,
    canStockIn: true,
    canStockOut: true,
    canCreateSale: true,
    canCreatePurchase: true,
    canAdjustStock: false,
    canMoveStock: true,
    canManageMembers: false,
    canViewCostPrice: false,
    canExportData: false,
    isReadOnly: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setEmail(member.email || '');
      setPassword(member.password || '');
      const existingPerms = member.customPermissions || {};
      setPerms({
        canCreateItem: existingPerms.canCreateItem ?? (member.role !== 'viewer'),
        canEditItem: existingPerms.canEditItem ?? (member.role === 'manager'),
        canDeleteItem: existingPerms.canDeleteItem ?? false,
        canStockIn: existingPerms.canStockIn ?? (member.role !== 'viewer'),
        canStockOut: existingPerms.canStockOut ?? (member.role !== 'viewer'),
        canCreateSale: existingPerms.canCreateSale ?? (member.role === 'sales' || member.role === 'manager'),
        canCreatePurchase: existingPerms.canCreatePurchase ?? (member.role === 'manager'),
        canAdjustStock: existingPerms.canAdjustStock ?? false,
        canMoveStock: existingPerms.canMoveStock ?? (member.role !== 'viewer'),
        canManageMembers: existingPerms.canManageMembers ?? false,
        canViewCostPrice: existingPerms.canViewCostPrice ?? false,
        canExportData: existingPerms.canExportData ?? false,
        isReadOnly: existingPerms.isReadOnly ?? (member.role === 'viewer'),
      });
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const togglePerm = (key: keyof CustomPermissions) => {
    setPerms((prev) => {
      const nextVal = !prev[key];
      if (key !== 'isReadOnly' && key !== 'canViewCostPrice' && key !== 'canExportData' && nextVal) {
        return { ...prev, [key]: nextVal, isReadOnly: false };
      }
      return { ...prev, [key]: nextVal };
    });
  };

  const handleSetReadOnly = () => {
    setPerms({
      canCreateItem: false,
      canEditItem: false,
      canDeleteItem: false,
      canStockIn: false,
      canStockOut: false,
      canCreateSale: false,
      canCreatePurchase: false,
      canAdjustStock: false,
      canMoveStock: false,
      canManageMembers: false,
      canViewCostPrice: false,
      canExportData: false,
      isReadOnly: true,
    });
  };

  const handleSelectAll = () => {
    setPerms({
      canCreateItem: true,
      canEditItem: true,
      canDeleteItem: true,
      canStockIn: true,
      canStockOut: true,
      canCreateSale: true,
      canCreatePurchase: true,
      canAdjustStock: true,
      canMoveStock: true,
      canManageMembers: true,
      canViewCostPrice: true,
      canExportData: true,
      isReadOnly: false,
    });
  };

  const handleClearAll = () => {
    setPerms({
      canCreateItem: false,
      canEditItem: false,
      canDeleteItem: false,
      canStockIn: false,
      canStockOut: false,
      canCreateSale: false,
      canCreatePurchase: false,
      canAdjustStock: false,
      canMoveStock: false,
      canManageMembers: false,
      canViewCostPrice: false,
      canExportData: false,
      isReadOnly: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const assignedRole: Role = perms.isReadOnly
      ? 'viewer'
      : perms.canCreateItem && perms.canEditItem
      ? 'manager'
      : 'sales';

    onClose();
    onUpdate(member._id, {
      name: name.trim(),
      email: email.trim(),
      password: password.trim() || member.password,
      role: assignedRole,
      customPermissions: perms,
    });
  };

  const permissionList: Array<{
    key: keyof CustomPermissions;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'canCreateItem',
      label: 'Add New Items',
      desc: 'Can add new models, items and register barcodes',
      icon: <PlusCircle className="w-4 h-4 text-blue-600" />,
    },
    {
      key: 'canEditItem',
      label: 'Edit Items',
      desc: 'Can edit prices, item names, and details',
      icon: <Edit3 className="w-4 h-4 text-indigo-600" />,
    },
    {
      key: 'canDeleteItem',
      label: 'Delete Items',
      desc: 'Can delete single items from inventory catalog',
      icon: <Trash2 className="w-4 h-4 text-red-600" />,
    },
    {
      key: 'canStockIn',
      label: 'Stock In',
      desc: 'Can receive stock and increase quantities',
      icon: <ArrowDown className="w-4 h-4 text-emerald-600" />,
    },
    {
      key: 'canStockOut',
      label: 'Stock Out',
      desc: 'Can dispatch goods and decrease quantities',
      icon: <ArrowUp className="w-4 h-4 text-orange-600" />,
    },
    {
      key: 'canCreateSale',
      label: 'Sales Orders & Invoices',
      desc: 'Can create sales entries and bill items',
      icon: <ShoppingBag className="w-4 h-4 text-purple-600" />,
    },
    {
      key: 'canCreatePurchase',
      label: 'Purchases',
      desc: 'Can log supplier purchases and incoming stock',
      icon: <Receipt className="w-4 h-4 text-teal-600" />,
    },
    {
      key: 'canAdjustStock',
      label: 'Adjust Stock',
      desc: 'Can adjust inventory count directly',
      icon: <Sliders className="w-4 h-4 text-amber-600" />,
    },
    {
      key: 'canMoveStock',
      label: 'Move Stock',
      desc: 'Can transfer stock between racks or locations',
      icon: <ArrowRightLeft className="w-4 h-4 text-cyan-600" />,
    },
    {
      key: 'canManageMembers',
      label: 'Add Staff Members',
      desc: 'Can invite and add staff members',
      icon: <Users className="w-4 h-4 text-blue-700" />,
    },
    {
      key: 'canViewCostPrice',
      label: 'View Cost Price & Margins',
      desc: 'Can see purchase cost and profit percentages',
      icon: <Eye className="w-4 h-4 text-emerald-700" />,
    },
    {
      key: 'canExportData',
      label: 'Export CSV Data',
      desc: 'Can download Excel / CSV reports of inventory',
      icon: <Download className="w-4 h-4 text-sky-600" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h1 className="font-bold text-gray-900 text-base">Edit Staff Member</h1>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Member Credentials */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Login Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@shop.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Login Password
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep existing password"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Granular Permission Checkboxes Header */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-900">Member Permissions</span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center space-x-1 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition-colors"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={handleSetReadOnly}
                  className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold transition-colors"
                >
                  Read Only
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Read-Only Status Banner if active */}
            {perms.isReadOnly && (
              <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-amber-800 text-xs">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Read-Only Mode active:</strong> This member can view inventory but cannot add, edit, delete, or modify any stock.
                </span>
              </div>
            )}

            {/* Checkboxes List */}
            <div className="space-y-2">
              {permissionList.map((p) => {
                const isChecked = !!perms[p.key];
                return (
                  <label
                    key={p.key}
                    onClick={() => togglePerm(p.key)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-blue-50/50 border-blue-300 shadow-xs'
                        : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <div className="p-1 rounded-lg bg-white shadow-xs shrink-0">{p.icon}</div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900 leading-tight">
                          {p.label}
                        </div>
                        <div className="text-[10px] text-gray-500 leading-tight truncate">
                          {p.desc}
                        </div>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-2 pb-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4965fa] hover:bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-md transition-colors"
            >
              {loading ? 'Saving Changes...' : 'Update Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
