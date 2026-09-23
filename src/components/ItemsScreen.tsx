import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Scan, 
  ChevronDown, 
  ArrowUpDown, 
  Check, 
  Package, 
  ChevronRight,
  ChevronUp
} from 'lucide-react';
import { IItem, UserSession } from '@/types';
import { hasPermission } from '@/lib/permissions';

type GroupByOption = 'none' | 'name' | 'cost' | 'price' | 'brand';

interface ItemsScreenProps {
  session?: UserSession | null;
  items: IItem[];
  categories?: string[];
  brands?: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNewItem: () => void;
  onSelectItem: (item: IItem) => void;
  onStockInItem?: (item: IItem) => void;
  onStockOutItem?: (item: IItem) => void;
  onOpenScanner?: () => void;
}

const BADGE_COLORS = [
  'bg-rose-100 text-rose-600',
  'bg-purple-100 text-purple-600',
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-indigo-100 text-indigo-600',
  'bg-cyan-100 text-cyan-600',
];

export const ItemsScreen: React.FC<ItemsScreenProps> = ({
  session,
  items,
  searchQuery,
  onSearchChange,
  onOpenNewItem,
  onSelectItem,
  onOpenScanner,
}) => {
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [isGroupByModalOpen, setIsGroupByModalOpen] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // 1. Filter items by search query and "In stock" toggle
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.name || '').toLowerCase().includes(q) ||
        (item.sku || '').toLowerCase().includes(q) ||
        (item.brand || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.barcodes || []).some((b) => b.includes(q));

      const matchesStock = inStockOnly ? (Number(item.totalStock) || 0) > 0 : true;

      return matchesSearch && matchesStock;
    });

    // Sort order
    result.sort((a, b) => {
      if (sortOrder === 'asc') {
        return (a.name || '').localeCompare(b.name || '');
      } else {
        return (b.name || '').localeCompare(a.name || '');
      }
    });

    return result;
  }, [items, searchQuery, inStockOnly, sortOrder]);

  // Total stock across filtered items for percentage calculation
  const totalStockCount = useMemo(() => {
    return filteredItems.reduce((acc, i) => acc + (Number(i.totalStock) || 0), 0) || 1;
  }, [filteredItems]);

  // 2. Compute Bundled / Grouped items when groupBy !== 'none'
  const groupedBundles = useMemo(() => {
    if (groupBy === 'none') return [];

    const map = new Map<string, IItem[]>();

    for (const item of filteredItems) {
      let groupKey = 'Other';
      if (groupBy === 'brand') {
        groupKey = (item.brand || 'Generic').trim();
      } else if (groupBy === 'name') {
        const firstWord = (item.name || 'Untitled').trim().split(/\s+/)[0];
        groupKey = firstWord || 'Untitled';
      } else if (groupBy === 'cost') {
        groupKey = `Cost: ₹${(item.costPrice || 0).toLocaleString()}`;
      } else if (groupBy === 'price') {
        groupKey = `Price: ₹${(item.sellingPrice || 0).toLocaleString()}`;
      }

      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(item);
    }

    const bundles = Array.from(map.entries()).map(([title, groupItems], idx) => {
      const totalStock = groupItems.reduce((acc, i) => acc + (Number(i.totalStock) || 0), 0);
      const percent = Math.max(1, Math.round((totalStock / totalStockCount) * 100));
      return {
        id: title,
        title,
        items: groupItems,
        totalStock,
        percent: percent > 100 ? 100 : percent,
        colorClass: BADGE_COLORS[idx % BADGE_COLORS.length],
      };
    });

    // Sort bundles alphabetically or by quantity
    bundles.sort((a, b) => a.title.localeCompare(b.title));
    return bundles;
  }, [filteredItems, groupBy, totalStockCount]);

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const getGroupByButtonText = () => {
    switch (groupBy) {
      case 'brand':
        return 'Brand';
      case 'name':
        return 'Name';
      case 'cost':
        return 'Cost';
      case 'price':
        return 'Price';
      default:
        return 'Group by';
    }
  };

  return (
    <div className="px-4 py-3 space-y-3 pb-24 max-w-md mx-auto">
      {/* Header: Item List + Add Button */}
      <div className="flex items-center justify-between pt-1">
        <div className="w-8" />
        <h1 className="text-lg font-bold text-gray-900 tracking-tight text-center">Item List</h1>
        {hasPermission(session, 'canCreateItem') ? (
          <button
            onClick={onOpenNewItem}
            className="p-1 text-gray-900 hover:text-blue-600 transition-colors"
            title="Add Item"
          >
            <Plus className="w-6 h-6 stroke-[2]" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Search Bar with integrated Barcode Scan Icon */}
      <div className="relative flex items-center bg-white rounded-2xl px-3.5 py-2.5 transition-all border-2 border-blue-500 shadow-xs focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20">
        <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={groupBy !== 'none' ? 'Search item attribute' : 'Search by name, barcode, or attribute'}
          className="w-full text-xs sm:text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
        />
        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="text-gray-500 hover:text-gray-800 ml-2 shrink-0 p-0.5"
            title="Scan Barcode"
          >
            <Scan className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Top Filter Buttons: Group by ˅ | In stock | ⇅ Sort */}
      <div className="flex items-center justify-between pt-0.5 pb-1">
        <div className="flex items-center space-x-2">
          {/* Group by Dropdown Button */}
          <button
            onClick={() => setIsGroupByModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border shadow-2xs ${
              groupBy !== 'none'
                ? 'border-blue-500 text-blue-600 bg-blue-50/70 font-bold'
                : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <span>{getGroupByButtonText()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {/* In stock Filter Toggle */}
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors border shadow-2xs ${
              inStockOnly
                ? 'border-blue-500 text-blue-600 bg-blue-50/70 font-bold'
                : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            In stock
          </button>
        </div>

        {/* Sort Toggle Button */}
        <button
          onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
          title={`Sort order: ${sortOrder === 'asc' ? 'A-Z' : 'Z-A'}`}
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content: Grouped Bundles or Clean Flat List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 mt-2">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-gray-400" />
          <p className="text-sm font-semibold text-gray-700">No items found</p>
          <p className="text-xs text-gray-400 mt-1">
            {inStockOnly ? 'No in-stock items match your filter.' : 'Try a different search or add a new item.'}
          </p>
        </div>
      ) : groupBy !== 'none' ? (
        /* ---------------- GROUPED BUNDLE CARDS (Image 3) ---------------- */
        <div className="space-y-3 pt-1">
          {groupedBundles.map((bundle) => {
            const isExpanded = !!expandedGroups[bundle.id];

            return (
              <div
                key={bundle.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden transition-all hover:border-gray-200"
              >
                {/* Bundle Card Header */}
                <div
                  onClick={() => toggleGroupExpand(bundle.id)}
                  className="p-4 cursor-pointer select-none space-y-3.5"
                >
                  {/* Title & % Tag */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900 capitalize tracking-tight">
                      {bundle.title}
                    </h2>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${bundle.colorClass}`}
                    >
                      {bundle.percent}%
                    </span>
                  </div>

                  {/* Stats: Item count & Total Quantity */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-gray-400 font-medium">
                      Tap to view items
                    </div>

                    <div className="flex items-center space-x-6 pr-1">
                      <div className="text-center">
                        <div className="text-base font-black text-gray-900 leading-tight">
                          {bundle.items.length}
                        </div>
                        <div className="text-[11px] text-gray-400 font-medium">Item</div>
                      </div>

                      <div className="text-center">
                        <div className="text-base font-black text-gray-900 leading-tight">
                          {bundle.totalStock}
                        </div>
                        <div className="text-[11px] text-gray-400 font-medium">Quantity</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Items List inside the bundle */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 divide-y divide-gray-100 animate-in fade-in duration-150">
                    {bundle.items.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => onSelectItem(item)}
                        className="p-3 pl-4 flex items-center justify-between hover:bg-white cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="text-xs font-bold text-gray-900 truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                            ₹{item.costPrice?.toFixed(2) || '0.00'} | ₹{item.sellingPrice?.toLocaleString() || '0.00'} | {item.brand || 'Generic'}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-xs font-bold text-blue-600">
                            {item.totalStock}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ---------------- FLAT LIST VIEW (Image 1) ---------------- */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              onClick={() => onSelectItem(item)}
              className="flex items-center justify-between p-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors active:bg-gray-100/60"
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {item.name}
                </div>
                <div className="text-xs text-gray-400 flex items-center space-x-1.5 truncate mt-0.5">
                  <span>₹{item.costPrice?.toFixed(2) || '0.00'}</span>
                  <span className="text-gray-300">|</span>
                  <span>₹{item.sellingPrice?.toLocaleString() || '0.00'}</span>
                  <span className="text-gray-300">|</span>
                  <span className="capitalize">{item.brand || 'Generic'}</span>
                </div>
              </div>

              {/* Bold Blue Quantity Number on Far Right */}
              <div className="text-right pl-3 shrink-0">
                <span className="text-base font-bold text-blue-600">
                  {item.totalStock}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- "GROUP BY" BOTTOM SHEET MODAL (Image 2) ---------------- */}
      {isGroupByModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-2xs animate-in fade-in duration-200">
          {/* Backdrop click to dismiss */}
          <div
            className="absolute inset-0"
            onClick={() => setIsGroupByModalOpen(false)}
          />

          {/* Bottom Sheet */}
          <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 space-y-4 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            {/* Drag Handle Bar */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />

            {/* Modal Title */}
            <h2 className="text-lg font-bold text-gray-900">Group by</h2>

            {/* Options List */}
            <div className="space-y-1 pt-1">
              {[
                { key: 'none', label: 'None' },
                { key: 'name', label: 'Name' },
                { key: 'cost', label: 'Cost' },
                { key: 'price', label: 'Price' },
                { key: 'brand', label: 'Brand' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setGroupBy(opt.key as GroupByOption);
                    setIsGroupByModalOpen(false);
                  }}
                  className="w-full flex items-center justify-between py-3 px-2 text-left hover:bg-gray-50 rounded-xl transition-colors group"
                >
                  <span
                    className={`text-sm ${
                      groupBy === opt.key ? 'font-bold text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </span>
                  {groupBy === opt.key && (
                    <Check className="w-5 h-5 text-blue-600 stroke-[2.5]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
