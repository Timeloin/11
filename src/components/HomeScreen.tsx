import React from 'react';
import { 
  Search, 
  Scan, 
  Plus, 
  ArrowDown, 
  ArrowUp, 
  ArrowRightLeft, 
  Sliders, 
  Gauge, 
  Binary, 
  UserPlus, 
  History, 
  Printer, 
  ShoppingBag, 
  Receipt,
  ChevronRight,
  Barcode
} from 'lucide-react';
import { IItem, IStockTransaction } from '@/types';

interface HomeScreenProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenScanner: () => void;
  onOpenNewItem: () => void;
  onOpenStockIn: () => void;
  onOpenStockOut: () => void;
  onOpenMoveStock: () => void;
  onOpenAdjustStock: () => void;
  onOpenShortages: () => void;
  onOpenInventoryCount: () => void;
  onOpenInviteMembers: () => void;
  onOpenPastQuantity: () => void;
  onOpenBarcodeLabels: () => void;
  onOpenPurchases: () => void;
  onOpenSales: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  searchQuery,
  onSearchChange,
  onOpenScanner,
  onOpenNewItem,
  onOpenStockIn,
  onOpenStockOut,
  onOpenMoveStock,
  onOpenAdjustStock,
  onOpenShortages,
  onOpenInventoryCount,
  onOpenInviteMembers,
  onOpenPastQuantity,
  onOpenBarcodeLabels,
  onOpenPurchases,
  onOpenSales,
}) => {
  return (
    <div className="px-4 py-4 space-y-4 pb-24 max-w-md mx-auto">
      {/* Search Bar with Barcode Scanner Icon matching Screenshot 2 */}
      <div className="relative flex items-center bg-white rounded-2xl border border-gray-100 shadow-xs px-3.5 py-3">
        <Search className="w-5 h-5 text-gray-400 mr-2.5 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for an item"
          className="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
        />
        <div className="h-5 w-px bg-gray-200 mx-2"></div>
        <button
          onClick={onOpenScanner}
          className="p-1 text-gray-700 hover:text-blue-600 transition-colors shrink-0"
          title="Scan Barcode"
        >
          <Scan className="w-5 h-5" />
        </button>
      </div>

      {/* Group: Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <h2 className="text-base font-bold text-gray-900">Items</h2>
        <button
          onClick={onOpenNewItem}
          className="w-full flex items-center justify-between py-2 text-left group active:scale-99 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Barcode className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Add Item</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* Group: Transactions matching Screenshots 2 & 3 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-1">
        <h2 className="text-base font-bold text-gray-900 mb-2">Transactions</h2>

        {/* Stock In */}
        <button
          onClick={onOpenStockIn}
          className="w-full flex items-center justify-between py-2.5 text-left border-b border-gray-50 group active:scale-99 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
              <ArrowDown className="w-4 h-4 text-blue-600 stroke-[2.5]" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Stock In</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
        </button>

        {/* Stock Out */}
        <button
          onClick={onOpenStockOut}
          className="w-full flex items-center justify-between py-2.5 text-left border-b border-gray-50 group active:scale-99 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center text-red-500">
              <ArrowUp className="w-4 h-4 text-red-500 stroke-[2.5]" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Stock Out</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
        </button>

        {/* Move Stock */}
        <button
          onClick={onOpenMoveStock}
          className="w-full flex items-center justify-between py-2.5 text-left border-b border-gray-50 group active:scale-99 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center text-amber-500">
              <ArrowRightLeft className="w-4 h-4 text-amber-500 stroke-[2.5]" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Move Stock</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
        </button>

        {/* Adjust Stock */}
        <button
          onClick={onOpenAdjustStock}
          className="w-full flex items-center justify-between py-2.5 text-left group active:scale-99 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-md bg-teal-50 flex items-center justify-center text-teal-600">
              <Sliders className="w-4 h-4 text-teal-600 stroke-[2.5]" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Adjust Stock</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
        </button>
      </div>

      {/* Group: Low Stock Alerts */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <h2 className="text-base font-bold text-gray-900">Low Stock Alerts</h2>
        <button
          onClick={onOpenShortages}
          className="w-full flex items-center justify-between py-2 text-left group active:scale-99 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <Gauge className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-gray-900">View Shortages</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
        </button>
      </div>

      {/* Group: Inventory Count */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <h2 className="text-base font-bold text-gray-900">Inventory Count</h2>
        <button
          onClick={onOpenInventoryCount}
          className="w-full flex items-center justify-between py-2 text-left group active:scale-99 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Binary className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Start Inventory Count</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
        </button>
      </div>

      {/* Group: Team Members */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <h2 className="text-base font-bold text-gray-900">Team Members</h2>
        <button
          onClick={onOpenInviteMembers}
          className="w-full flex items-center justify-between py-2 text-left group active:scale-99 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Invite Members</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
        </button>
      </div>

      {/* Group: Past Quantity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <h2 className="text-base font-bold text-gray-900">Past Quantity</h2>
        <button
          onClick={onOpenPastQuantity}
          className="w-full flex items-center justify-between py-2 text-left group active:scale-99 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <History className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-gray-900">View Stock by Date</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
        </button>
      </div>

      {/* Group: Barcode Labels */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <h2 className="text-base font-bold text-gray-900">Barcode Labels</h2>
        <button
          onClick={onOpenBarcodeLabels}
          className="w-full flex items-center justify-between py-2 text-left group active:scale-99 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Printer className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Print Item Label</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
        </button>
      </div>

      {/* Group: Purchases & Sales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-1">
        <h2 className="text-base font-bold text-gray-900 mb-2">Purchases & Sales</h2>
        <button
          onClick={onOpenPurchases}
          className="w-full flex items-center justify-between py-2.5 text-left border-b border-gray-50 group active:scale-99 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
              <ShoppingBag className="w-4 h-4 text-blue-600 stroke-[2.2]" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Purchases</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
        </button>

        <button
          onClick={onOpenSales}
          className="w-full flex items-center justify-between py-2.5 text-left group active:scale-99 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Receipt className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Sales</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
        </button>
      </div>
    </div>
  );
};
