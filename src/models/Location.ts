import mongoose, { Schema } from 'mongoose';

const LocationSchema = new Schema({
  teamId: { type: Schema.Types.Mixed, required: true, index: true },
  name: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Location || mongoose.model('Location', LocationSchema);
