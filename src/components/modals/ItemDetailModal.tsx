import React from 'react';
import { X, Tag, Barcode, MapPin, ArrowDown, ArrowUp, ArrowRightLeft, Sliders, AlertTriangle, CheckCircle2, Calendar, FileText } from 'lucide-react';
import { IItem, ILocation } from '@/types';

interface ItemDetailModalProps {
  isOpen: boolean;
  item: IItem | null;
  locations: ILocation[];
  onClose: () => void;
  onStockIn: (item: IItem) => void;
  onStockOut: (item: IItem) => void;
  onMoveStock: (item: IItem) => void;
  onAdjustStock: (item: IItem) => void;
  onDeleteItem?: (item: IItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  item,
  locations,
  onClose,
  onStockIn,
  onStockOut,
  onMoveStock,
  onAdjustStock,
  onDeleteItem,
}) => {
  if (!isOpen || !item) return null;

  const isLowStock = item.totalStock <= item.minStock;
  const margin = item.sellingPrice > 0 
    ? (((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100).toFixed(1)
    : '0';

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(item.createdAt));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono uppercase bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
              {item.sku}
            </span>
            {isLowStock ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold">
                <AlertTriangle className="w-3 h-3" />
                <span>Low Stock</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>In Stock</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
          {/* Main Title & Brand Heading */}
          <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/30 p-4 rounded-2xl border border-blue-100/60 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5" />
              <span>{item.brand} • {item.category}</span>
            </div>
            <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-snug">
              {item.name}
            </h1>
            {item.description && (
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed flex items-start space-x-1">
                <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                <span>{item.description}</span>
              </p>
            )}
          </div>

          {/* Pricing & Margins Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Pricing & Margin
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 p-2.5 rounded-xl">
                <div className="text-[11px] text-gray-500 font-medium">Selling Price</div>
                <div className="text-base font-black text-blue-600 mt-0.5">₹{item.sellingPrice}</div>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl">
                <div className="text-[11px] text-gray-500 font-medium">Cost Price</div>
                <div className="text-base font-bold text-gray-800 mt-0.5">₹{item.costPrice}</div>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl">
                <div className="text-[11px] text-gray-500 font-medium">Profit Margin</div>
                <div className="text-base font-bold text-emerald-600 mt-0.5">+{margin}%</div>
              </div>
            </div>
          </div>

          {/* Stock by Location */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Current Stock by Location
              </h2>
              <span className="text-xs font-black text-gray-900">
                Total: {item.totalStock} {item.unit}
              </span>
            </div>

            <div className="space-y-1.5">
              {item.stockByLocation.map((loc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs"
                >
                  <div className="flex items-center space-x-2 text-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-semibold">{loc.locationName}</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900 text-sm">
                    {loc.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-gray-500 pt-1 flex justify-between">
              <span>Minimum Alert Threshold:</span>
              <span className="font-bold text-gray-800">{item.minStock} {item.unit}</span>
            </div>
          </div>

          {/* Barcode & Identifiers */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Barcode className="w-3.5 h-3.5" />
              <span>Assigned Barcodes</span>
            </h2>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.barcodes && item.barcodes.length > 0 ? (
                item.barcodes.map((bc, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-xs bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg border border-gray-200"
                  >
                    {bc}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">No barcodes assigned</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onStockIn(item);
                  onClose();
                }}
                className="flex items-center justify-center space-x-1.5 py-3 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 active:scale-98 transition-all"
              >
                <ArrowDown className="w-4 h-4" />
                <span>Stock In</span>
              </button>
              <button
                onClick={() => {
                  onStockOut(item);
                  onClose();
                }}
                className="flex items-center justify-center space-x-1.5 py-3 bg-red-50 text-red-700 font-bold text-xs rounded-xl hover:bg-red-100 active:scale-98 transition-all"
              >
                <ArrowUp className="w-4 h-4" />
                <span>Stock Out</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onMoveStock(item);
                  onClose();
                }}
                className="flex items-center justify-center space-x-1.5 py-2.5 bg-amber-50 text-amber-800 font-semibold text-xs rounded-xl hover:bg-amber-100 active:scale-98 transition-all"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Move Stock</span>
              </button>
              <button
                onClick={() => {
                  onAdjustStock(item);
                  onClose();
                }}
                className="flex items-center justify-center space-x-1.5 py-2.5 bg-teal-50 text-teal-800 font-semibold text-xs rounded-xl hover:bg-teal-100 active:scale-98 transition-all"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Stock</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
