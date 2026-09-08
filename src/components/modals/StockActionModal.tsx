import React, { useState } from 'react';
import { X, ArrowDown, ArrowUp, ArrowRightLeft, Sliders } from 'lucide-react';
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
  const [fromLocId, setFromLocId] = useState(locations[0]?._id || '');
  const [toLocId, setToLocId] = useState(locations[1]?._id || locations[0]?._id || '');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'stock_in': return 'Stock In';
      case 'stock_out': return 'Stock Out';
      case 'move': return 'Move Stock';
      case 'adjust': return 'Adjust Stock';
      default: return 'Stock Transaction';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'stock_in': return <ArrowDown className="w-5 h-5 text-blue-600" />;
      case 'stock_out': return <ArrowUp className="w-5 h-5 text-red-600" />;
      case 'move': return <ArrowRightLeft className="w-5 h-5 text-amber-600" />;
      case 'adjust': return <Sliders className="w-5 h-5 text-teal-600" />;
      default: return null;
    }
  };

  const selectedItem = items.find((i) => i._id === selectedItemId) || items[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setLoading(true);
    try {
      const qtyNum = parseFloat(quantity) || 0;
      const fromLoc = locations.find((l) => l._id === fromLocId);
      const toLoc = locations.find((l) => l._id === toLocId);

      await onExecute({
        type,
        fromLocationId: type === 'stock_in' ? undefined : fromLocId,
        fromLocationName: type === 'stock_in' ? undefined : fromLoc?.name,
        toLocationId: type === 'stock_out' ? undefined : toLocId,
        toLocationName: type === 'stock_out' ? undefined : toLoc?.name,
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
        reason: reason || (type === 'adjust' ? 'Physical count correction' : 'Regular operation'),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
          {/* Select Item */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Select Item
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {items.map((it) => (
                <option key={it._id} value={it._id}>
                  {it.name} (Stock: {it.totalStock} {it.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Banner */}
          {selectedItem && (
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 flex justify-between items-center">
              <span>Current Total Stock:</span>
              <span className="font-bold text-sm">{selectedItem.totalStock} {selectedItem.unit}</span>
            </div>
          )}

          {/* Location Fields based on Type */}
          {(type === 'stock_out' || type === 'move') && (
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

          {(type === 'stock_in' || type === 'move' || type === 'adjust') && (
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
              placeholder={type === 'adjust' ? 'e.g. Month-end audit correction' : 'e.g. Received new stock'}
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
