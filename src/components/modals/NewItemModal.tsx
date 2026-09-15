import React, { useState } from 'react';
import { X, ChevronRight, HelpCircle, ShieldAlert } from 'lucide-react';
import { ILocation } from '@/types';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: ILocation[];
  categories: string[];
  brands: string[];
  initialBarcode?: string;
  onSave: (itemData: any) => Promise<void>;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  locations,
  categories,
  brands,
  initialBarcode,
  onSave,
}) => {
  // All initial states are clean and EMPTY (no default pre-filled dummy values!)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?._id || '');
  const [quantity, setQuantity] = useState('');
  const [minStock, setMinStock] = useState(''); // Safety stock
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedLoc = locations.find((l) => l._id === selectedLocationId) || locations[0];
    const parsedQty = parseInt(quantity.replace(/,/g, ''), 10) || 0;
    const parsedSafetyStock = parseInt(minStock.replace(/,/g, ''), 10) || 0;

    const finalBrand = brand.trim() || 'Generic';
    const finalCategory = category.trim() || 'General';
    const finalName = name.trim() || `${finalBrand} ${finalCategory} Item`;

    const payload = {
      name: finalName,
      description: description.trim(),
      sku: sku.trim() || 'SKU-' + Date.now().toString().slice(-6),
      category: finalCategory,
      brand: finalBrand,
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      minStock: parsedSafetyStock,
      barcodes: barcode.trim() ? [barcode.trim()] : [],
      stockByLocation: [
        {
          locationId: selectedLoc?._id || 'loc_1',
          locationName: selectedLoc?.name || 'Default Location',
          quantity: parsedQty,
        },
      ],
      totalStock: parsedQty,
    };

    onClose();
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center px-4 py-4 border-b border-gray-100 relative">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center font-bold text-gray-900 text-lg mr-7">
            Add New Item
          </h1>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Item Name & Barcode */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Item / Model Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. iPhone 15 Pro Max / Vivo V29"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Description / Notes (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 256GB, Black Titanium, 8GB RAM"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Custom SKU / Code (Optional)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. VIVO-V29-128 (leave blank to auto-generate)"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {barcode && (
              <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-800">
                <span>Barcode: <span className="font-mono font-bold">{barcode}</span></span>
                <button type="button" onClick={() => setBarcode('')} className="text-blue-500 hover:text-blue-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Section 1: Attributes (Category & Brand) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-gray-900 text-base">Category & Brand</span>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </div>

            {/* Category Row */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Category</span>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Mobile Phones"
                className="text-right text-gray-900 font-medium text-sm bg-transparent focus:outline-none placeholder-gray-400 w-48"
              />
            </div>

            {/* Brand Row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Brand</span>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apple / Samsung"
                className="text-right text-gray-900 font-medium text-sm bg-transparent focus:outline-none placeholder-gray-400 w-48"
              />
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
            <h2 className="font-bold text-gray-900 text-base">Pricing</h2>

            {/* Cost Row */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Cost Price</span>
              <div className="flex items-center space-x-1">
                <span className="text-gray-900 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0"
                  className="text-right text-gray-900 font-semibold text-sm bg-transparent focus:outline-none w-28 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Price Row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Selling Price</span>
              <div className="flex items-center space-x-1">
                <span className="text-gray-900 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="0"
                  className="text-right text-gray-900 font-semibold text-sm bg-transparent focus:outline-none w-28 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Starting Quantity & Location */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
            <h2 className="font-bold text-gray-900 text-base">Initial Stock Quantity</h2>

            {/* Location Selector */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Location</span>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="text-right text-gray-900 font-semibold text-sm bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Input */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Starting Stock</span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="text-right text-gray-900 font-black text-sm bg-transparent focus:outline-none w-28 placeholder-gray-400"
                />
                <span className="text-gray-500 text-xs">pcs</span>
              </div>
            </div>
          </div>

          {/* Section 4: Safety Stock / Shortage Threshold */}
          <div className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h2 className="font-bold text-amber-900 text-sm">Safety Stock (Shortage Level)</h2>
              </div>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="e.g. 5"
                  className="text-right text-gray-900 font-black text-sm bg-white px-2 py-1 rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 w-20"
                />
                <span className="text-amber-800 text-xs font-semibold">pcs</span>
              </div>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              When total stock falls <strong>below or equal to</strong> this quantity, this item will automatically show in <strong>View Shortages</strong> and <strong>Shortages by Date</strong>.
            </p>
          </div>

          {/* Bottom Save Button */}
          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#4965fa] hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-base rounded-2xl shadow-md shadow-blue-500/25 transition-all duration-150 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
