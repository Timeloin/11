import mongoose, { Schema } from 'mongoose';

const TeamSchema = new Schema({
  name: { type: String, required: true, trim: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  inviteCode: { type: String, required: true, unique: true },
  currency: { type: String, default: '₹' },
  lowStockThresholdDefault: { type: Number, default: 5 },
}, { timestamps: true });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
