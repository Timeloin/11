import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ArrowDown, 
  ArrowUp, 
  ArrowRightLeft, 
  Sliders, 
  Search, 
  Check, 
  Package, 
  ShoppingBag, 
  Receipt
} from 'lucide-react';
import { IItem, ILocation, TransactionType } from '@/types';

interface StockActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType;
  items: IItem[];
  locations: ILocation[];
  preselectedItem?: IItem | null;
  onExecute: (txnData: any) => Promise<void>;
}

export const StockActionModal: React.FC<StockActionModalProps> = ({
  isOpen,
  onClose,
  type,
  items,
  locations,
  preselectedItem,
  onExecute,
}) => {
  const [selectedItemId, setSelectedItemId] = useState(preselectedItem?._id || items[0]?._id || '');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fromLocId, setFromLocId] = useState(locations[0]?._id || '');
  const [toLocId, setToLocId] = useState(locations[1]?._id || locations[0]?._id || '');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync locations
  useEffect(() => {
    if (locations && locations.length > 0) {
      if (!fromLocId || !locations.some((l) => l._id === fromLocId)) {
        setFromLocId(locations[0]._id);
      }
      if (!toLocId || !locations.some((l) => l._id === toLocId)) {
        setToLocId(locations[1]?._id || locations[0]._id);
      }
    }
  }, [locations, fromLocId, toLocId, isOpen]);

  // Sync selected item when preselectedItem or items change
  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemId(preselectedItem._id);
    } else if (items.length > 0 && !items.some((i) => i._id === selectedItemId)) {
      setSelectedItemId(items[0]._id);
    }
  }, [preselectedItem, items, isOpen]);

  // Reset dropdown and search when modal opens
  useEffect(() => {
    if (isOpen) {
      setItemSearchQuery('');
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  const selectedItem = items.find((i) => i._id === selectedItemId) || items[0];

  // Filter items by search query (name, sku, brand, category, barcode)
  const filteredItems = useMemo(() => {
    const q = itemSearchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const nameMatch = it.name?.toLowerCase().includes(q);
      const skuMatch = it.sku?.toLowerCase().includes(q);
      const brandMatch = it.brand?.toLowerCase().includes(q);
      const catMatch = it.category?.toLowerCase().includes(q);
      const barcodeMatch = it.barcodes?.some((b) => b.toLowerCase().includes(q));
      return nameMatch || skuMatch || brandMatch || catMatch || barcodeMatch;
    });
  }, [items, itemSearchQuery]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'stock_in': return 'Stock In';
      case 'stock_out': return 'Stock Out';
      case 'purchase': return 'New Purchase';
      case 'sale': return 'New Sale';
      case 'move': return 'Move Stock';
      case 'adjust': return 'Adjust Stock';
      default: return 'Stock Transaction';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'stock_in': return <ArrowDown className="w-5 h-5 text-blue-600" />;
      case 'purchase': return <ShoppingBag className="w-5 h-5 text-blue-600" />;
      case 'stock_out': return <ArrowUp className="w-5 h-5 text-red-600" />;
      case 'sale': return <Receipt className="w-5 h-5 text-emerald-600" />;
      case 'move': return <ArrowRightLeft className="w-5 h-5 text-amber-600" />;
      case 'adjust': return <Sliders className="w-5 h-5 text-teal-600" />;
      default: return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qtyNum = parseFloat(quantity) || 0;
    const activeFromLoc = locations.find((l) => l._id === fromLocId) || locations[0];
    const activeToLoc = locations.find((l) => l._id === toLocId) || locations[1] || locations[0];

    const payload = {
      type,
      fromLocationId: (type === 'stock_in' || type === 'purchase') ? undefined : (activeFromLoc?._id || fromLocId || 'loc_1'),
      fromLocationName: (type === 'stock_in' || type === 'purchase') ? undefined : (activeFromLoc?.name || 'Default Location'),
      toLocationId: (type === 'stock_out' || type === 'sale') ? undefined : (activeToLoc?._id || toLocId || 'loc_1'),
      toLocationName: (type === 'stock_out' || type === 'sale') ? undefined : (activeToLoc?.name || 'Default Location'),
      items: [
        {
          itemId: selectedItem._id,
          sku: selectedItem.sku,
          name: selectedItem.name,
          quantity: qtyNum,
          unitCost: selectedItem.costPrice,
          unitPrice: selectedItem.sellingPrice,
        },
      ],
      totalQuantity: qtyNum,
      reason: reason || (type === 'adjust' ? 'Physical count correction' : (type === 'purchase' ? 'Purchased stock' : (type === 'sale' ? 'Customer sale' : 'Regular operation'))),
    };

    onClose();
    onExecute(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            {getIcon()}
            <h1 className="font-bold text-gray-900 text-lg">{getTitle()}</h1>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Searchable Item Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Select Item
              </label>
              {items.length > 0 && (
                <span className="text-[11px] text-gray-400 font-medium">
                  {items.length} items
                </span>
              )}
            </div>

            {/* Search Input Box with Live Filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={itemSearchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setItemSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder="Search item by name, brand, SKU..."
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {itemSearchQuery && (
                <button
                  type="button"
                  onClick={() => setItemSearchQuery('')}
                  className="absolute right-2.5 top-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Current Selected Item Card */}
            {selectedItem && (
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl cursor-pointer hover:bg-blue-100/60 transition-colors"
                title="Click to switch or browse items"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-sm truncate">{selectedItem.name}</div>
                    <div className="text-[11px] text-gray-500 flex items-center space-x-1.5">
                      <span className="capitalize">{selectedItem.brand || 'Generic'}</span>
                      <span>•</span>
                      <span className="capitalize">{selectedItem.category}</span>
                      {selectedItem.sku && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-gray-400">{selectedItem.sku}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <div className="text-xs font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                    Stock: {selectedItem.totalStock} {selectedItem.unit}
                  </div>
                </div>
              </div>
            )}

            {/* Filtered Dropdown Item List */}
            {isDropdownOpen && (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg divide-y divide-gray-100 animate-in fade-in zoom-in-95">
                {filteredItems.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    No items found matching "{itemSearchQuery}"
                  </div>
                ) : (
                  filteredItems.map((it) => {
                    const isSelected = it._id === selectedItemId;
                    return (
                      <div
                        key={it._id}
                        onClick={() => {
                          setSelectedItemId(it._id);
                          setIsDropdownOpen(false);
                          setItemSearchQuery('');
                        }}
                        className={`p-2.5 px-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="text-sm font-semibold truncate">{it.name}</div>
                          <div className="text-[11px] text-gray-500 flex items-center space-x-1.5 mt-0.5">
                            <span className="capitalize">{it.brand || 'Generic'}</span>
                            <span>•</span>
                            <span className="capitalize">{it.category}</span>
                            {it.sku && <span className="font-mono text-gray-400">({it.sku})</span>}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                            it.totalStock <= (it.minStock || 5)
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {it.totalStock} {it.unit}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Location Fields based on Type */}
          {(type === 'stock_out' || type === 'move' || type === 'sale') && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                From Location
              </label>
              <select
                value={fromLocId}
                onChange={(e) => setFromLocId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none"
              >
                {locations.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(type === 'stock_in' || type === 'move' || type === 'adjust' || type === 'purchase') && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                {type === 'adjust' ? 'Target Location' : 'To Location'}
              </label>
              <select
                value={toLocId}
                onChange={(e) => setToLocId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none"
              >
                {locations.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              {type === 'adjust' ? 'New Exact Quantity (Physical Count)' : 'Quantity'}
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reason / Memo */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Reason / Memo {type === 'adjust' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              required={type === 'adjust'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                type === 'adjust'
                  ? 'e.g. Month-end audit correction'
                  : type === 'purchase'
                  ? 'e.g. Supplier Invoice #102'
                  : type === 'sale'
                  ? 'e.g. Counter sale'
                  : 'e.g. Received new stock'
              }
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 pb-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#4965fa] hover:bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-md transition-colors"
            >
              {loading ? 'Processing...' : 'Confirm ' + getTitle()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
