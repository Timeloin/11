import React, { useState, useMemo } from 'react';
import { 
  X, 
  AlertTriangle, 
  Calendar, 
  ArrowDown, 
  Search, 
  CheckCircle2, 
  PackageX, 
  ShieldAlert, 
  History,
  TrendingDown,
  Filter
} from 'lucide-react';
import { IItem, IStockTransaction } from '@/types';

interface ShortagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: IItem[];
  transactions: IStockTransaction[];
  onStockInItem: (item: IItem) => void;
  initialMode?: 'current' | 'by_date';
}

export const ShortagesModal: React.FC<ShortagesModalProps> = ({
  isOpen,
  onClose,
  items,
  transactions,
  onStockInItem,
  initialMode = 'current',
}) => {
  const [mode, setMode] = useState<'current' | 'by_date'>(initialMode);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'out_of_stock' | 'low_stock'>('all');

  // Compute stock levels by date from transaction history
  const stockByDateMap = useMemo(() => {
    if (mode !== 'by_date' || !selectedDate) return new Map<string, number>();

    // End of the selected date (23:59:59.999 local)
    const targetDateTime = new Date(selectedDate + 'T23:59:59.999').getTime();
    
    // Build item stock as of target date by rewinding transactions after targetDateTime
    const stockMap = new Map<string, number>();
    for (const item of items) {
      stockMap.set(item._id, item.totalStock);
    }

    // Sort transactions from newest to oldest
    const sortedTxns = [...transactions].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const txn of sortedTxns) {
      const txnTime = new Date(txn.createdAt).getTime();
      if (txnTime > targetDateTime) {
        // This transaction happened AFTER the target date, rewind its impact
        for (const line of txn.items || []) {
          const currentComputed = stockMap.get(line.itemId) ?? 0;
          const qty = line.quantity || 0;

          if (txn.type === 'stock_in' || txn.type === 'purchase') {
            // Revert stock in
            stockMap.set(line.itemId, currentComputed - qty);
          } else if (txn.type === 'stock_out' || txn.type === 'sale') {
            // Revert stock out
            stockMap.set(line.itemId, currentComputed + qty);
          }
        }
      }
    }

    return stockMap;
  }, [mode, selectedDate, items, transactions]);

  if (!isOpen) return null;

  // Filter shortages
  const shortageItems = items.map((item) => {
    const effectiveStock = mode === 'by_date' 
      ? (stockByDateMap.get(item._id) ?? item.totalStock)
      : item.totalStock;
    const safetyStock = item.minStock || 0;
    const isShortage = effectiveStock <= safetyStock;
    const deficit = Math.max(0, safetyStock - effectiveStock);
    const isOutOfStock = effectiveStock <= 0;

    return {
      item,
      effectiveStock,
      safetyStock,
      isShortage,
      deficit,
      isOutOfStock,
    };
  }).filter(({ item, isShortage, isOutOfStock }) => {
    if (!isShortage) return false;

    // Filter by type
    if (filterType === 'out_of_stock' && !isOutOfStock) return false;
    if (filterType === 'low_stock' && isOutOfStock) return false;

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchSku = item.sku.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      return matchName || matchSku || matchBrand || matchCat;
    }

    return true;
  });

  const totalShortages = items.filter((item) => {
    const effectiveStock = mode === 'by_date' 
      ? (stockByDateMap.get(item._id) ?? item.totalStock)
      : item.totalStock;
    return effectiveStock <= (item.minStock || 0);
  }).length;

  const totalOutOfStock = items.filter((item) => {
    const effectiveStock = mode === 'by_date' 
      ? (stockByDateMap.get(item._id) ?? item.totalStock)
      : item.totalStock;
    return effectiveStock <= 0;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-extrabold text-gray-900 text-base">Shortage & Low Stock Alerts</h1>
              <div className="text-[11px] text-gray-400">
                {mode === 'current' ? 'Items at or below Safety Stock' : `Historical Shortage as of ${selectedDate}`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Tabs (Current vs By Date) */}
        <div className="p-3 bg-gray-50 border-b border-gray-100 space-y-2.5">
          <div className="grid grid-cols-2 gap-1.5 bg-gray-200/70 p-1 rounded-xl">
            <button
              onClick={() => setMode('current')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'current'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Current Shortages</span>
            </button>
            <button
              onClick={() => setMode('by_date')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'by_date'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Shortages by Date</span>
            </button>
          </div>

          {/* Date Picker row when in "by_date" mode */}
          {mode === 'by_date' && (
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs">
              <span className="font-semibold text-gray-600 shrink-0">Select Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 text-gray-900 font-bold bg-transparent focus:outline-none"
              />
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="bg-white px-3 py-2 rounded-xl border border-gray-200/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500">Total Shortages</span>
              <span className="text-sm font-black text-amber-600">{totalShortages} items</span>
            </div>
            <div className="bg-white px-3 py-2 rounded-xl border border-gray-200/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500">Out of Stock (0)</span>
              <span className="text-sm font-black text-red-600">{totalOutOfStock} items</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-4 pt-3 pb-1 flex items-center space-x-2">
          <div className="relative flex-1 flex items-center bg-gray-50 rounded-xl border border-gray-200 px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortage items..."
              className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                filterType === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('out_of_stock')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                filterType === 'out_of_stock'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              0 pcs
            </button>
          </div>
        </div>

        {/* Shortages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {shortageItems.length === 0 ? (
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">No Shortages Found</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                All inventory items are safely stocked above their minimum Safety Stock thresholds.
              </p>
            </div>
          ) : (
            shortageItems.map(({ item, effectiveStock, safetyStock, deficit, isOutOfStock }) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs p-3.5 space-y-2.5 hover:border-amber-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {item.brand || 'Generic'}
                      </span>
                      <span className="text-[11px] font-mono text-gray-400">
                        {item.sku}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mt-1">{item.name}</h3>
                  </div>

                  {isOutOfStock ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-xs font-black shrink-0">
                      <PackageX className="w-3.5 h-3.5" />
                      <span>Out of Stock</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold shrink-0">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Low Stock</span>
                    </span>
                  )}
                </div>

                {/* Stock Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                      {mode === 'by_date' ? 'Stock on Date' : 'Current Stock'}
                    </span>
                    <strong className={`text-sm font-black ${isOutOfStock ? 'text-red-600' : 'text-amber-600'}`}>
                      {effectiveStock} {item.unit || 'pcs'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                      Safety Stock
                    </span>
                    <strong className="text-sm font-black text-gray-800">
                      {safetyStock} {item.unit || 'pcs'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                      Deficit / Short
                    </span>
                    <strong className="text-sm font-black text-red-500">
                      -{deficit} {item.unit || 'pcs'}
                    </strong>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-gray-400">
                    Category: <strong className="text-gray-600">{item.category}</strong>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onStockInItem(item);
                    }}
                    className="px-3 py-1.5 bg-[#4965fa] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1 transition-all"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Stock In Item</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Showing <strong className="text-gray-800">{shortageItems.length}</strong> shortage items
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
