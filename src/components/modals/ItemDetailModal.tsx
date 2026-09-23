import React, { useState, useEffect } from 'react';
import { X, Tag, Barcode, MapPin, ArrowDown, ArrowUp, ArrowRightLeft, Sliders, AlertTriangle, CheckCircle2, FileText, Trash2, Edit3, Check, Save } from 'lucide-react';
import { IItem, ILocation, UserSession } from '@/types';
import { hasPermission } from '@/lib/permissions';

interface ItemDetailModalProps {
  session?: UserSession | null;
  isOpen: boolean;
  item: IItem | null;
  locations: ILocation[];
  onClose: () => void;
  onStockIn: (item: IItem) => void;
  onStockOut: (item: IItem) => void;
  onMoveStock: (item: IItem) => void;
  onAdjustStock: (item: IItem) => void;
  onDeleteItem?: (item: IItem) => void;
  onUpdateItem?: (itemId: string, data: Partial<IItem>) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  session,
  isOpen,
  item,
  locations,
  onClose,
  onStockIn,
  onStockOut,
  onMoveStock,
  onAdjustStock,
  onDeleteItem,
  onUpdateItem,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form edit states
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (item) {
      setEditName(item.name || '');
      setEditBrand(item.brand || '');
      setEditCategory(item.category || '');
      setEditSku(item.sku || '');
      setEditSellingPrice(item.sellingPrice !== undefined ? String(item.sellingPrice) : '');
      setEditCostPrice(item.costPrice !== undefined ? String(item.costPrice) : '');
      setEditMinStock(item.minStock !== undefined ? String(item.minStock) : '3');
      setEditBarcode(item.barcodes && item.barcodes.length > 0 ? item.barcodes[0] : '');
      setEditDescription(item.description || '');
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const isLowStock = item.totalStock <= item.minStock;
  const margin = item.sellingPrice > 0 
    ? (((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100).toFixed(1)
    : '0';

  const handleClose = () => {
    setShowDeleteConfirm(false);
    setIsEditing(false);
    onClose();
  };

  const handleConfirmDelete = () => {
    if (onDeleteItem) {
      onDeleteItem(item);
    }
    setShowDeleteConfirm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const updatedData: Partial<IItem> = {
      name: editName.trim(),
      brand: editBrand.trim() || 'Generic',
      category: editCategory.trim() || 'General',
      sku: editSku.trim() || item.sku,
      sellingPrice: parseFloat(editSellingPrice) || 0,
      costPrice: parseFloat(editCostPrice) || 0,
      minStock: parseInt(editMinStock, 10) || 0,
      description: editDescription.trim(),
      barcodes: editBarcode.trim() ? [editBarcode.trim()] : item.barcodes,
    };

    if (onUpdateItem) {
      onUpdateItem(item._id, updatedData);
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <span className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Edit Item</span>
              </span>
            ) : (
              <>
                <span className="text-[11px] font-mono uppercase bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                  {item.sku}
                </span>
                {item.totalStock > 0 ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>In Stock</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[11px] font-bold">
                    <span>Out of Stock</span>
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {!isEditing && onUpdateItem && hasPermission(session, 'canEditItem') && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Edit item"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {!isEditing && onDeleteItem && hasPermission(session, 'canDeleteItem') && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        {isEditing ? (
          /* EDIT FORM */
          <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Item / Model Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. iPhone 15 Pro 128GB"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  placeholder="e.g. Apple, Vivo, Samsung"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all capitalize"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="e.g. mobile phone"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all capitalize"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  SKU Code
                </label>
                <input
                  type="text"
                  value={editSku}
                  onChange={(e) => setEditSku(e.target.value)}
                  placeholder="SKU-..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all uppercase"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Safety Stock Alert
                </label>
                <input
                  type="number"
                  min="0"
                  value={editMinStock}
                  onChange={(e) => setEditMinStock(e.target.value)}
                  placeholder="3"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={editSellingPrice}
                  onChange={(e) => setEditSellingPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-blue-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Cost Price (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={editCostPrice}
                  onChange={(e) => setEditCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Barcode / Serial Code
              </label>
              <input
                type="text"
                value={editBarcode}
                onChange={(e) => setEditBarcode(e.target.value)}
                placeholder="Scan or enter barcode"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Description / Notes
              </label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional details or specifications..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Save / Cancel Controls */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl active:scale-98 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#4965fa] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs active:scale-98 transition-all flex items-center justify-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        ) : (
          /* DETAILS VIEW */
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
            {/* Delete Confirmation Alert Banner */}
            {showDeleteConfirm && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="text-xs font-bold">Delete this item permanently?</span>
                </div>
                <p className="text-[11px] text-red-600 leading-relaxed">
                  This will remove <strong>{item.name}</strong> from your active stock list.
                </p>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 active:scale-98 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="flex-1 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 active:scale-98 transition-all shadow-xs flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </button>
                </div>
              </div>
            )}

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
              <div className={`grid ${hasPermission(session, 'canViewCostPrice') ? 'grid-cols-3' : 'grid-cols-1'} gap-2`}>
                <div className="bg-gray-50 p-2.5 rounded-xl">
                  <div className="text-[11px] text-gray-500 font-medium">Selling Price</div>
                  <div className="text-base font-black text-blue-600 mt-0.5">₹{item.sellingPrice}</div>
                </div>
                {hasPermission(session, 'canViewCostPrice') && (
                  <>
                    <div className="bg-gray-50 p-2.5 rounded-xl">
                      <div className="text-[11px] text-gray-500 font-medium">Cost Price</div>
                      <div className="text-base font-bold text-gray-800 mt-0.5">₹{item.costPrice}</div>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-xl">
                      <div className="text-[11px] text-gray-500 font-medium">Profit Margin</div>
                      <div className="text-base font-bold text-emerald-600 mt-0.5">+{margin}%</div>
                    </div>
                  </>
                )}
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
              {(hasPermission(session, 'canStockIn') || hasPermission(session, 'canStockOut')) && (
                <div className="grid grid-cols-2 gap-2">
                  {hasPermission(session, 'canStockIn') && (
                    <button
                      onClick={() => {
                        onStockIn(item);
                        handleClose();
                      }}
                      className="flex items-center justify-center space-x-1.5 py-3 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 active:scale-98 transition-all"
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span>Stock In</span>
                    </button>
                  )}
                  {hasPermission(session, 'canStockOut') && (
                    <button
                      onClick={() => {
                        onStockOut(item);
                        handleClose();
                      }}
                      className="flex items-center justify-center space-x-1.5 py-3 bg-red-50 text-red-700 font-bold text-xs rounded-xl hover:bg-red-100 active:scale-98 transition-all"
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span>Stock Out</span>
                    </button>
                  )}
                </div>
              )}

              {(hasPermission(session, 'canMoveStock') || hasPermission(session, 'canAdjustStock')) && (
                <div className="grid grid-cols-2 gap-2">
                  {hasPermission(session, 'canMoveStock') && (
                    <button
                      onClick={() => {
                        onMoveStock(item);
                        handleClose();
                      }}
                      className="flex items-center justify-center space-x-1.5 py-2.5 bg-amber-50 text-amber-800 font-semibold text-xs rounded-xl hover:bg-amber-100 active:scale-98 transition-all"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Move Stock</span>
                    </button>
                  )}
                  {hasPermission(session, 'canAdjustStock') && (
                    <button
                      onClick={() => {
                        onAdjustStock(item);
                        handleClose();
                      }}
                      className="flex items-center justify-center space-x-1.5 py-2.5 bg-teal-50 text-teal-800 font-semibold text-xs rounded-xl hover:bg-teal-100 active:scale-98 transition-all"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Adjust Stock</span>
                    </button>
                  )}
                </div>
              )}

              {/* Edit & Delete Actions */}
              {(hasPermission(session, 'canEditItem') || hasPermission(session, 'canDeleteItem')) && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {onUpdateItem && hasPermission(session, 'canEditItem') && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center space-x-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl active:scale-98 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Item</span>
                    </button>
                  )}
                  {onDeleteItem && !showDeleteConfirm && hasPermission(session, 'canDeleteItem') && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center justify-center space-x-1.5 py-2.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 font-medium text-xs rounded-xl border border-gray-100 hover:border-red-200 active:scale-98 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
