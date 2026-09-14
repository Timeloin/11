import React from 'react';
import { ChevronDown, Zap, Bell, X } from 'lucide-react';
import { ITeam, UserSession } from '@/types';

interface HeaderProps {
  currentTeam: ITeam | null;
  session?: UserSession | null;
  onOpenTeamModal: () => void;
  onLogout?: () => void;
  onBackToAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTeam,
  session,
  onOpenTeamModal,
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

      {/* Team Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onOpenTeamModal}
          className="flex items-center space-x-2.5 group active:scale-98 transition-transform text-left"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <Zap className="w-4 h-4 fill-blue-500" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-gray-900 text-lg tracking-tight">
              {currentTeam?.name || 'simran mobile shop'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
          </div>
        </button>

        <div className="flex items-center space-x-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2.5 py-1 text-xs font-bold text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg border border-gray-200 transition-colors"
            >
              Logout
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-semibold">
            {session?.name ? session.name.slice(0, 2).toUpperCase() : currentTeam?.inviteCode?.slice(0, 2) || 'SM'}
          </div>
        </div>
      </div>
    </header>
  );
};
