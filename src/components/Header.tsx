import React from 'react';
import { ChevronDown, Zap, Bell, X } from 'lucide-react';
import { ITeam } from '@/types';

interface HeaderProps {
  currentTeam: ITeam | null;
  onOpenTeamModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTeam,
  onOpenTeamModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
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
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-semibold">
            {currentTeam?.inviteCode?.slice(0, 2) || 'SM'}
          </div>
        </div>
      </div>
    </header>
  );
};
