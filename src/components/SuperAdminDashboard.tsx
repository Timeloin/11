import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Users, 
  Store, 
  Plus, 
  Clock, 
  Infinity as InfinityIcon, 
  ShieldAlert, 
  ShieldCheck, 
  LogOut, 
  ExternalLink, 
  RefreshCw,
  X,
  Lock,
  Mail,
  Calendar,
  Layers
} from 'lucide-react';
import { ISubAdminInfo, UserSession } from '@/types';

interface SuperAdminDashboardProps {
  session: UserSession;
  onLogout: () => void;
  onSwitchToShop: (teamId: string, shopName: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  session,
  onLogout,
  onSwitchToShop,
}) => {
  const [subAdmins, setSubAdmins] = useState<ISubAdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating new Sub-Admin
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [subscriptionType, setSubscriptionType] = useState<'days' | 'lifetime'>('days');
  const [days, setDays] = useState('10');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subadmins');
      const data = await res.json();
      if (data.success) {
        setSubAdmins(data.subAdmins);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch('/api/admin/subadmins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          shopName: shopName.trim(),
          subscriptionType,
          days: parseInt(days, 10) || 10,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create sub-admin');
        return;
      }

      setIsCreateModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setShopName('');
      setDays('10');
      await fetchSubAdmins();
    } catch (err: any) {
      setError(err.message || 'Error creating sub-admin');
    } finally {
      setSaving(false);
    }
  };

  const handleExtendDays = async (teamId: string, addDays: number) => {
    await fetch('/api/admin/subadmins', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, addDays, isAccessRevoked: false }),
    });
    await fetchSubAdmins();
  };

  const handleSetLifetime = async (teamId: string) => {
    await fetch('/api/admin/subadmins', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, subscriptionType: 'lifetime', isAccessRevoked: false }),
    });
    await fetchSubAdmins();
  };

  const handleToggleRevoke = async (teamId: string, currentRevoked: boolean) => {
    await fetch('/api/admin/subadmins', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, isAccessRevoked: !currentRevoked }),
    });
    await fetchSubAdmins();
  };

  const activeCount = subAdmins.filter((s) => s.isValid && !s.isAccessRevoked).length;
  const lifetimeCount = subAdmins.filter((s) => s.subscriptionType === 'lifetime' && !s.isAccessRevoked).length;
  const revokedCount = subAdmins.filter((s) => s.isAccessRevoked || !s.isValid).length;

  return (
    <div className="min-h-screen bg-[#f3f4f8] text-gray-900 pb-16">
      {/* Super Admin Header */}
      <header className="sticky top-0 z-30 bg-gray-900 text-white border-b border-gray-800 px-4 py-3 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center font-bold shadow-xs">
              <Crown className="w-4 h-4 fill-gray-950" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight flex items-center space-x-1.5">
                <span>Super Admin Control Center</span>
              </div>
              <div className="text-[10px] text-gray-400 font-mono">{session.email}</div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="text-2xl font-black text-blue-600">{subAdmins.length}</div>
            <div className="text-[11px] font-semibold text-gray-500 mt-0.5">Total Shops</div>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="text-2xl font-black text-emerald-600">{activeCount}</div>
            <div className="text-[11px] font-semibold text-gray-500 mt-0.5">Active Shops</div>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="text-2xl font-black text-red-500">{revokedCount}</div>
            <div className="text-[11px] font-semibold text-gray-500 mt-0.5">Revoked / Expired</div>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">Sub-Admins & Subscriptions</h2>
            <p className="text-xs text-gray-500">Control access duration (Days / Lifetime) and revocation</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#4965fa] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sub-Admin</span>
          </button>
        </div>

        {/* Sub-Admins List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-400 text-xs flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading Sub-Admins...</span>
            </div>
          ) : subAdmins.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-400 text-xs">
              No Sub-Admins found. Click "+ Add Sub-Admin" to create your first shop admin!
            </div>
          ) : (
            subAdmins.map((sub) => {
              const isRevoked = sub.isAccessRevoked;
              const isExpired = !sub.isValid && !isRevoked;

              return (
                <div
                  key={sub.teamId}
                  className={`bg-white rounded-2xl border shadow-xs p-4 space-y-3 transition-all ${
                    isRevoked || isExpired ? 'border-red-200 bg-red-50/20' : 'border-gray-100'
                  }`}
                >
                  {/* Shop & Sub-Admin Title */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Store className="w-4 h-4 text-blue-600" />
                        <h3 className="font-extrabold text-gray-900 text-base">{sub.shopName}</h3>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Sub-Admin: <strong className="text-gray-800">{sub.name}</strong> ({sub.email})
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isRevoked ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-xs font-bold">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Revoked</span>
                        </span>
                      ) : sub.subscriptionType === 'lifetime' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-xs font-bold">
                          <InfinityIcon className="w-3.5 h-3.5" />
                          <span>Lifetime</span>
                        </span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Expired (0 days)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Active ({sub.daysRemaining} days left)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shop Details Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-gray-400">Staff Members:</span>{' '}
                      <strong className="text-gray-800">{sub.membersCount}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Inventory Items:</span>{' '}
                      <strong className="text-gray-800">{sub.itemsCount}</strong>
                    </div>
                  </div>

                  {/* Super Admin Quick Actions */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleExtendDays(sub.teamId, 10)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 transition-colors"
                      >
                        +10 Days
                      </button>
                      <button
                        onClick={() => handleExtendDays(sub.teamId, 30)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 transition-colors"
                      >
                        +30 Days
                      </button>
                      <button
                        onClick={() => handleSetLifetime(sub.teamId)}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg border border-purple-200 transition-colors"
                      >
                        Lifetime ♾️
                      </button>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleToggleRevoke(sub.teamId, sub.isAccessRevoked)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                          isRevoked
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {isRevoked ? 'Restore Access' : 'Revoke Access'}
                      </button>

                      <button
                        onClick={() => onSwitchToShop(sub.teamId, sub.shopName)}
                        className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center space-x-1 transition-colors"
                      >
                        <span>Open Shop</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Create Sub-Admin Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Store className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Create Sub-Admin & Shop</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{error}</div>
            )}

            <form onSubmit={handleCreateSubAdmin} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Shop / Business Name
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Royal Mobile Plaza"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Sub-Admin Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Gurpreet Singh"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Sub-Admin Login Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. owner@royalplaza.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Sub-Admin Login Password
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. shopPass@123"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Subscription Access Type */}
              <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100 space-y-2">
                <label className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                  Access Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSubscriptionType('days')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      subscriptionType === 'days'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    Specific Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubscriptionType('lifetime')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      subscriptionType === 'lifetime'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    Lifetime Access ♾️
                  </button>
                </div>

                {subscriptionType === 'days' && (
                  <div className="pt-1 flex items-center space-x-2">
                    <span className="text-xs text-gray-600">Days to Grant:</span>
                    <input
                      type="number"
                      min="1"
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                      className="w-20 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 font-bold text-center"
                    />
                    <span className="text-xs text-gray-500">(Default: 10 days)</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-[#4965fa] hover:bg-blue-600 text-white font-bold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Sub-Admin & Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
