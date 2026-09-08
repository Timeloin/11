import mongoose, { Schema } from 'mongoose';

const TeamMemberSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { 
    type: String, 
    enum: ['admin', 'manager', 'sales', 'inventory', 'viewer'], 
    default: 'viewer' 
  },
  customPermissions: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['active', 'invited', 'suspended'], default: 'active' },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.TeamMember || mongoose.model('TeamMember', TeamMemberSchema);
