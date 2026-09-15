import React, { useState, useEffect } from 'react';
import { Shield, Users, MapPin, Download, LogOut, Database, Plus, Check, User, AlertTriangle } from 'lucide-react';
import { ITeam, ITeamMember, ILocation, UserSession } from '@/types';

interface SettingsScreenProps {
  team: ITeam | null;
  members: ITeamMember[];
  locations: ILocation[];
  session?: UserSession | null;
  onUpdateProfileName?: (name: string) => Promise<void>;
  onLogout?: () => void;
  onOpenInvite: () => void;
  onAddLocation: (name: string) => Promise<void>;
  onExportData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  team,
  members,
  locations,
  session,
  onUpdateProfileName,
  onLogout,
  onOpenInvite,
  onAddLocation,
  onExportData,
}) => {
  const [newLocName, setNewLocName] = useState('');
  const [addingLoc, setAddingLoc] = useState(false);

  // Profile Name Editing state
  const [profileName, setProfileName] = useState(session?.userName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSavedSuccess, setNameSavedSuccess] = useState(false);

  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (session?.userName) {
      setProfileName(session.userName);
    }
  }, [session?.userName]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !onUpdateProfileName) return;
    setIsSavingName(true);
    try {
      await onUpdateProfileName(profileName.trim());
      setNameSavedSuccess(true);
      setTimeout(() => setNameSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAddLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;
    await onAddLocation(newLocName.trim());
    setNewLocName('');
    setAddingLoc(false);
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-28 max-w-md mx-auto">
      {/* Profile & Name Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900">User Profile</h2>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between items-center py-1 border-b border-gray-50">
            <span className="text-gray-400">Account Email:</span>
            <span className="font-semibold text-gray-800">{session?.email || 'harpreetsinghhappy7080@gmail.com'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-gray-50">
            <span className="text-gray-400">Role:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
              {session?.role || 'Admin'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveName} className="space-y-2 pt-1">
          <label className="text-xs font-semibold text-gray-700 block">
            Display Name / Operator Name
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter your name (e.g. Harpreet Singh)"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSavingName || !profileName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1"
            >
              {nameSavedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : isSavingName ? (
                <span>Saving...</span>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            This name will be stamped on all inventory transactions, stock ins/outs, and history logs you record.
          </p>
        </form>
      </div>

      {/* Shop Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Shop Details</h2>
        <div className="text-lg font-bold text-gray-900">{team?.name || 'simran mobile shop'}</div>
        <div className="flex items-center justify-between pt-2 text-xs text-gray-600">
          <span>Store: <strong className="font-semibold text-gray-800">{team?.name || 'simran mobile shop'}</strong></span>
          <span>Currency: <strong className="font-bold">{team?.currency || '₹'}</strong></span>
        </div>
      </div>

      {/* Staff & Members Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm">Staff & Members ({members.length})</h3>
          </div>
          <button
            onClick={onOpenInvite}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>

        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m._id}
              className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs"
            >
              <div>
                <div className="font-bold text-gray-900">{m.name}</div>
                <div className="text-gray-400">{m.email}</div>
              </div>
              <span className="px-2 py-0.5 rounded uppercase font-bold text-[10px] bg-blue-100 text-blue-800">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Locations Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-gray-900 text-sm">Inventory Locations</h3>
          </div>
          <button
            onClick={() => setAddingLoc(!addingLoc)}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            {addingLoc ? 'Cancel' : '+ Add Location'}
          </button>
        </div>

        {addingLoc && (
          <form onSubmit={handleAddLoc} className="flex space-x-2 pt-1">
            <input
              type="text"
              placeholder="Location name (e.g. Rack B)"
              value={newLocName}
              onChange={(e) => setNewLocName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold"
            >
              Save
            </button>
          </form>
        )}

        <div className="space-y-1.5">
          {locations.map((loc) => (
            <div
              key={loc._id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-xl text-xs"
            >
              <span className="font-medium text-gray-800">{loc.name}</span>
              {loc.isDefault && (
                <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-semibold">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Export & Backup */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Download className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-gray-900 text-sm">Backup & Export</h3>
        </div>
        <p className="text-xs text-gray-500">
          Export your entire inventory catalog and transaction records to CSV / Excel spreadsheet.
        </p>
        <button
          onClick={onExportData}
          className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center justify-center space-x-1.5"
        >
          <Download className="w-4 h-4" />
          <span>Export Stock Sheet (.CSV)</span>
        </button>
      </div>

      {/* Database Connection Notice */}
      <div className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-2xl p-4 text-white space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
          <Database className="w-4 h-4" />
          <span>MongoDB & Vercel Ready</span>
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed">
          Running with reactive local-first caching. All changes and transaction operator names are saved to MongoDB Atlas.
        </p>
      </div>

      {/* Sign Out Button */}
      {onLogout && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 border border-red-200 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Sign Out Confirmation</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to sign out from <strong className="text-gray-700">{session?.email || 'your account'}</strong>?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 transition-colors"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
