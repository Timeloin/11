import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  avatarUrl: { type: String },
  defaultTeamId: { type: Schema.Types.ObjectId, ref: 'Team' },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
