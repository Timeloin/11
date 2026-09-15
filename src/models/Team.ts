import mongoose, { Schema } from 'mongoose';

const TeamSchema = new Schema({
  name: { type: String, required: true, trim: true },
  ownerId: { type: Schema.Types.Mixed, required: false },
  ownerEmail: { type: String },
  ownerName: { type: String },
  inviteCode: { type: String, required: true, unique: true },
  currency: { type: String, default: '₹' },
  lowStockThresholdDefault: { type: Number, default: 5 },
  subscriptionType: { type: String, enum: ['days', 'lifetime'], default: 'days' },
  subscriptionDays: { type: Number, default: 10 },
  subscriptionExpiresAt: { type: Date },
  isAccessRevoked: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
