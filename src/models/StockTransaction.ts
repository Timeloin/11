import mongoose, { Schema } from 'mongoose';

const TransactionItemSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitCost: { type: Number },
  unitPrice: { type: Number },
}, { _id: false });

const StockTransactionSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  type: { 
    type: String, 
    enum: ['stock_in', 'stock_out', 'move', 'adjust', 'purchase', 'sale', 'return', 'count_reconciliation'], 
    required: true 
  },
  referenceNo: { type: String, required: true },
  fromLocationId: { type: Schema.Types.ObjectId, ref: 'Location' },
  fromLocationName: { type: String },
  toLocationId: { type: Schema.Types.ObjectId, ref: 'Location' },
  toLocationName: { type: String },
  items: [TransactionItemSchema],
  totalQuantity: { type: Number, required: true },
  reason: { type: String },
  contactName: { type: String },
  invoiceNo: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.StockTransaction || mongoose.model('StockTransaction', StockTransactionSchema);
