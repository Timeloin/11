import React from 'react';
import { Smartphone } from 'lucide-react';
import { ITeam, UserSession } from '@/types';

interface HeaderProps {
  currentTeam: ITeam | null;
  session?: UserSession | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTeam,
  session,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Smartphone className="w-4 h-4" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">
            {currentTeam?.name || 'Simran Mobile'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-bold shadow-2xs flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{session?.userName || session?.name || 'Admin'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

