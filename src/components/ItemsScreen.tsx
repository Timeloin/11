import React, { useState } from 'react';
import { Search, Plus, AlertTriangle, ArrowDown, ArrowUp, Barcode, ChevronRight, PackageCheck } from 'lucide-react';
import { IItem } from '@/types';

interface ItemsScreenProps {
  items: IItem[];
  categories: string[];
  brands: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNewItem: () => void;
  onSelectItem: (item: IItem) => void;
  onStockInItem: (item: IItem) => void;
  onStockOutItem: (item: IItem) => void;
}

export const ItemsScreen: React.FC<ItemsScreenProps> = ({
  items,
  categories,
  brands,
  searchQuery,
  onSearchChange,
  onOpenNewItem,
  onSelectItem,
  onStockInItem,
  onStockOutItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcodes.some((b) => b.includes(searchQuery));
    const matchesCat = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="px-4 py-4 space-y-4 pb-24 max-w-md mx-auto">
      {/* Top Search & Add Item Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 flex items-center bg-white rounded-2xl border border-gray-100 shadow-xs px-3.5 py-2.5">
          <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items, SKU, barcode..."
            className="w-full text-xs sm:text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
          />
        </div>
        <button
          onClick={onOpenNewItem}
          className="p-3 bg-[#4965fa] hover:bg-blue-600 text-white rounded-2xl shadow-sm transition-transform active:scale-95 shrink-0 flex items-center justify-center"
          title="Add New Item"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#4965fa] text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Items ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-[#4965fa] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Clean Text-Driven Product Cards (No Images) */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            <Barcode className="w-10 h-10 mx-auto mb-2 opacity-40 text-gray-400" />
            <p className="text-sm font-medium">No items found</p>
            <p className="text-xs text-gray-400 mt-1">Try a different search or add a new item.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isLowStock = item.totalStock <= item.minStock;
            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3 transition-all hover:border-blue-200 hover:shadow-sm"
              >
                {/* Clickable Header & Info to view full details */}
                <div
                  onClick={() => onSelectItem(item)}
                  className="cursor-pointer group select-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {item.brand}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {item.sku}
                      </span>
                    </div>
                    {isLowStock ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Low Stock</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold">In Stock</span>
                    )}
                  </div>

                  <div className="flex items-start justify-between mt-2">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug pr-2">
                      {item.name}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600 font-extrabold text-sm">₹{item.sellingPrice}</span>
                      <span className="text-gray-400 text-[11px]">Cost: ₹{item.costPrice}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-gray-900">
                        {item.totalStock} <span className="text-[10px] font-normal text-gray-500">{item.unit}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Stock Action Controls */}
                <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                  <div className="text-[11px] text-gray-500 truncate max-w-[170px]">
                    {item.stockByLocation.map((loc) => loc.locationName + ': ' + loc.quantity).join(', ')}
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStockInItem(item);
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors active:scale-95"
                    >
                      <ArrowDown className="w-3 h-3" />
                      <span>In</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStockOutItem(item);
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors active:scale-95"
                    >
                      <ArrowUp className="w-3 h-3" />
                      <span>Out</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
