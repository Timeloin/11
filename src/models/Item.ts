import mongoose, { Schema } from 'mongoose';

const StockByLocationSchema = new Schema({
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  locationName: { type: String, required: true },
  quantity: { type: Number, default: 0 }
}, { _id: false });

const ItemSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  sku: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, index: 'text' },
  description: { type: String },
  category: { type: String, default: 'General' },
  brand: { type: String, default: 'Generic' },
  unit: { type: String, default: 'pcs' },
  costPrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  minStock: { type: Number, default: 5 },
  barcodes: [{ type: String }],
  images: [{ type: String }],
  stockByLocation: [StockByLocationSchema],
  totalStock: { type: Number, default: 0, index: true },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Item || mongoose.model('Item', ItemSchema);
