import React, { useState } from 'react';
import { Shield, Users, MapPin, Download, LogOut, Database, Plus, Check } from 'lucide-react';
import { ITeam, ITeamMember, ILocation } from '@/types';

interface SettingsScreenProps {
  team: ITeam | null;
  members: ITeamMember[];
  locations: ILocation[];
  onOpenInvite: () => void;
  onAddLocation: (name: string) => Promise<void>;
  onExportData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  team,
  members,
  locations,
  onOpenInvite,
  onAddLocation,
  onExportData,
}) => {
  const [newLocName, setNewLocName] = useState('');
  const [addingLoc, setAddingLoc] = useState(false);

  const handleAddLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;
    await onAddLocation(newLocName.trim());
    setNewLocName('');
    setAddingLoc(false);
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-24 max-w-md mx-auto">
      {/* Shop Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Shop Details</h2>
        <div className="text-lg font-bold text-gray-900">{team?.name || 'simran mobile shop'}</div>
        <div className="flex items-center justify-between pt-2 text-xs text-gray-600">
          <span>Invite Code: <strong className="font-mono text-blue-600 font-bold">{team?.inviteCode}</strong></span>
          <span>Currency: <strong className="font-bold">{team?.currency || '₹'}</strong></span>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm">Staff & Roles ({members.length}/20)</h3>
          </div>
          <button
            onClick={onOpenInvite}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Invite</span>
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
          Running with reactive local-first caching. To connect your live MongoDB Atlas cluster, set <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-emerald-300">MONGODB_URI</code> in your Vercel Environment Variables.
        </p>
      </div>
    </div>
  );
};
