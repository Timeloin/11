import React from 'react';
import { Zap } from 'lucide-react';
import { ITeam, UserSession } from '@/types';

interface HeaderProps {
  currentTeam: ITeam | null;
  session?: UserSession | null;
  onLogout?: () => void;
  onBackToAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTeam,
  session,
  onLogout,
  onBackToAdmin,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      {/* Super Admin Return Bar if currently viewing a sub shop */}
      {session?.isSuperAdmin && onBackToAdmin && (
        <div className="bg-gray-900 text-white px-4 py-1.5 flex items-center justify-between text-xs">
          <span className="font-bold text-amber-300">👑 Super Admin View</span>
          <button
            onClick={onBackToAdmin}
            className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-0.5 rounded font-bold transition-colors"
          >
            Back to Super Admin Panel ➔
          </button>
        </div>
      )}

      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <Zap className="w-4 h-4 fill-blue-500" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">
            {currentTeam?.name || 'simran mobile shop'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold shadow-2xs">
            {session?.name ? session.name.slice(0, 2).toUpperCase() : 'SM'}
          </div>
        </div>
      </div>
    </header>
  );
};

