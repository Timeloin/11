import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield } from 'lucide-react';
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
  const [role, setRole] = useState<Role>('sales');
  const [customPerms, setCustomPerms] = useState<CustomPermissions>({
    canAdjustStock: false,
    canViewCostPrice: false,
    canExportData: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setEmail(member.email || '');
      setPassword(member.password || '');
      setRole((member.role as Role) || 'sales');
      setCustomPerms(
        member.customPermissions || {
          canAdjustStock: false,
          canViewCostPrice: false,
          canExportData: false,
        }
      );
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setLoading(true);
    try {
      await onUpdate(member._id, {
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || member.password,
        role,
        customPermissions: customPerms,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h1 className="font-bold text-gray-900 text-lg">Edit Staff Member</h1>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Member Full Name
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
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Staff Login Email
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
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Staff Login Password
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep existing password"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Assigned Staff Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none font-medium"
            >
              <option value="manager">Manager (Inventory, Purchases, Sales, Reports)</option>
              <option value="sales">Sales (Stock Out, Orders & Invoices)</option>
              <option value="inventory">Inventory (Stock In/Out/Move/Adjust)</option>
              <option value="viewer">Viewer (Read-Only Access)</option>
            </select>
          </div>

          {/* Custom Permission Overrides */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Custom Member Overrides</span>
            </div>

            <label className="flex items-center justify-between cursor-pointer text-xs font-medium text-gray-700">
              <span>Allow Viewing Cost Price</span>
              <input
                type="checkbox"
                checked={customPerms.canViewCostPrice}
                onChange={(e) => setCustomPerms({ ...customPerms, canViewCostPrice: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-xs font-medium text-gray-700">
              <span>Allow Stock Adjustments</span>
              <input
                type="checkbox"
                checked={customPerms.canAdjustStock}
                onChange={(e) => setCustomPerms({ ...customPerms, canAdjustStock: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-xs font-medium text-gray-700">
              <span>Allow Exporting Data</span>
              <input
                type="checkbox"
                checked={customPerms.canExportData}
                onChange={(e) => setCustomPerms({ ...customPerms, canExportData: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="pt-3 pb-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#4965fa] hover:bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-md transition-colors"
            >
              {loading ? 'Saving Changes...' : 'Update Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
