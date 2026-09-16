import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  plainPassword: { type: String }, // For convenience display in admin if needed
  phone: { type: String },
  role: { type: String, default: 'admin' },
  isSuperAdmin: { type: Boolean, default: false },
  defaultTeamId: { type: Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
