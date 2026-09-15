import mongoose, { Schema } from 'mongoose';

const TeamMemberSchema = new Schema({
  teamId: { type: Schema.Types.Mixed, required: true, index: true },
  userId: { type: Schema.Types.Mixed, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String },
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'manager', 'sales', 'inventory', 'viewer'], 
    default: 'sales' 
  },
  customPermissions: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['active', 'invited', 'suspended'], default: 'active' },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.TeamMember || mongoose.model('TeamMember', TeamMemberSchema);
