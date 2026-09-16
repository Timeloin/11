import mongoose, { Schema } from 'mongoose';

const AppConfigSchema = new Schema({
  key: { type: String, required: true, unique: true, default: 'main_app_config' },
  appName: { type: String, default: 'Simran Mobile' },
  appIcon: { type: String },
}, { timestamps: true });

export default mongoose.models.AppConfig || mongoose.model('AppConfig', AppConfigSchema);
