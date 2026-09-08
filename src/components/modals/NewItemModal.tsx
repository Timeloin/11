import React, { useState } from 'react';
import { X, ChevronRight, HelpCircle, Camera } from 'lucide-react';
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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('mobile phone');
  const [brand, setBrand] = useState('vivo');
  const [costPrice, setCostPrice] = useState('1000');
  const [sellingPrice, setSellingPrice] = useState('1500');
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?._id || '');
  const [quantity, setQuantity] = useState('1000');
  const [minStock, setMinStock] = useState('5');
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedLoc = locations.find((l) => l._id === selectedLocationId) || locations[0];
      const parsedQty = parseInt(quantity.replace(/,/g, ''), 10) || 0;

      await onSave({
        name: name.trim() || (brand.toUpperCase() + ' ' + (category || 'Item')),
        description: description.trim(),
        sku: sku.trim() || 'SKU-' + Date.now().toString().slice(-6),
        category: category.trim(),
        brand: brand.trim(),
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        minStock: parseInt(minStock, 10) || 5,
        barcodes: barcode.trim() ? [barcode.trim()] : [],
        stockByLocation: [
          {
            locationId: selectedLoc?._id || 'loc_1',
            locationName: selectedLoc?.name || 'Default Location',
            quantity: parsedQty,
          },
        ],
        totalStock: parsedQty,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedLocName =
    locations.find((l) => l._id === selectedLocationId)?.name || 'Default Location';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header matching Screenshot 1 */}
        <div className="flex items-center px-4 py-4 border-b border-gray-100 relative">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center font-bold text-gray-900 text-lg mr-7">
            New Item
          </h1>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
          {/* Quick Item Name / Barcode Input */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Item / Model Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. vivo V29 5G (128GB)"
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
                placeholder="e.g. 50MP OIS Camera, Velvet Red, 8GB RAM"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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

          {/* Section 1: Attributes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-gray-900 text-base">Attributes</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </div>
              <button type="button" className="text-blue-600 text-sm font-semibold hover:underline">
                Edit
              </button>
            </div>

            {/* Category Row */}
            <div className="flex items-center justify-between pt-1 border-b border-gray-50 pb-3">
              <span className="text-gray-500 text-sm font-medium">Category</span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-right text-gray-900 font-medium text-sm bg-transparent focus:outline-none focus:underline max-w-[150px]"
                />
                {category && (
                  <button type="button" onClick={() => setCategory('')} className="text-gray-400 hover:text-gray-600">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-bold">✕</div>
                  </button>
                )}
              </div>
            </div>

            {/* Brand Row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-500 text-sm font-medium">Brand</span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="text-right text-gray-900 font-medium text-sm bg-transparent focus:outline-none focus:underline max-w-[150px]"
                />
                {brand && (
                  <button type="button" onClick={() => setBrand('')} className="text-gray-400 hover:text-gray-600">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-bold">✕</div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-4">
            <h2 className="font-bold text-gray-900 text-base">Pricing</h2>

            {/* Cost Row */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <span className="text-gray-500 text-sm font-medium">Cost</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 font-medium text-sm">₹</span>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="text-right text-gray-900 font-semibold text-sm bg-transparent focus:outline-none focus:underline w-24"
                />
                {costPrice && (
                  <button type="button" onClick={() => setCostPrice('')} className="text-gray-400 hover:text-gray-600">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-bold">✕</div>
                  </button>
                )}
              </div>
            </div>

            {/* Price Row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-500 text-sm font-medium">Price</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 font-medium text-sm">₹</span>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="text-right text-gray-900 font-semibold text-sm bg-transparent focus:outline-none focus:underline w-24"
                />
                {sellingPrice && (
                  <button type="button" onClick={() => setSellingPrice('')} className="text-gray-400 hover:text-gray-600">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-bold">✕</div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Starting Quantity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-4">
            <h2 className="font-bold text-gray-900 text-base">Starting Quantity</h2>

            {/* Location Selector */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <span className="text-gray-500 text-sm font-medium">Location</span>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="text-right text-gray-900 font-medium text-sm bg-transparent focus:outline-none cursor-pointer pr-1"
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
              <span className="text-gray-500 text-sm font-medium">Quantity</span>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="text-right text-gray-900 font-semibold text-sm bg-transparent focus:outline-none w-24"
                />
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Bottom Save Button Matching Screenshot 1 */}
          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#4965fa] hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-base rounded-2xl shadow-md shadow-blue-500/25 transition-all duration-150 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
