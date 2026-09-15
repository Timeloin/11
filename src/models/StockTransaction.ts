import mongoose, { Schema } from 'mongoose';

const TransactionItemSchema = new Schema({
  itemId: { type: Schema.Types.Mixed, required: true },
  sku: { type: String, required: false },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitCost: { type: Number },
  unitPrice: { type: Number },
}, { _id: false });

const StockTransactionSchema = new Schema({
  teamId: { type: Schema.Types.Mixed, required: true, index: true },
  type: { 
    type: String, 
    enum: ['stock_in', 'stock_out', 'move', 'adjust', 'purchase', 'sale', 'return', 'count_reconciliation'], 
    required: true 
  },
  referenceNo: { type: String, required: true },
  fromLocationId: { type: Schema.Types.Mixed },
  fromLocationName: { type: String },
  toLocationId: { type: Schema.Types.Mixed },
  toLocationName: { type: String },
  items: [TransactionItemSchema],
  totalQuantity: { type: Number, required: true },
  reason: { type: String },
  contactName: { type: String },
  invoiceNo: { type: String },
  userId: { type: Schema.Types.Mixed, required: false },
  userName: { type: String, required: false, default: 'Admin User' },
}, { timestamps: true });

export default mongoose.models.StockTransaction || mongoose.model('StockTransaction', StockTransactionSchema);
