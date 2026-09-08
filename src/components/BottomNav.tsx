import React from 'react';
import { Home, Package, ArrowLeftRight, Settings } from 'lucide-react';

export type TabType = 'home' | 'items' | 'transactions' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 py-1.5 px-4 shadow-lg shadow-black/5">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="flex flex-col items-center justify-center py-1 px-3 transition-colors group relative"
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'text-[#4965fa]' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span
                className={`text-[11px] font-medium tracking-tight ${
                  isActive ? 'text-[#4965fa] font-bold' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
