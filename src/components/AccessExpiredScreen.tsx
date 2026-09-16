import React from 'react';
import { ShieldAlert, LogOut, Clock, HelpCircle } from 'lucide-react';

interface AccessExpiredScreenProps {
  reason?: string;
  onLogout: () => void;
}

export const AccessExpiredScreen: React.FC<AccessExpiredScreenProps> = ({ reason, onLogout }) => {
  return (
    <div className="min-h-screen bg-[#f3f4f8] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-red-100 p-6 text-center space-y-5 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl mx-auto flex items-center justify-center border border-red-100 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-extrabold text-gray-900">
            Access Suspended / Expired
          </h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            {reason || 'The subscription for this shop has expired or access was revoked by Super Admin.'}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-left text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Need to Renew Access?</span>
          </div>
          <p className="text-[11px] text-amber-700">
            Please contact your <strong>Super Admin</strong> to extend or restore your shop subscription.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Switch Account</span>
        </button>
      </div>
    </div>
  );
};
