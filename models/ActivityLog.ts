import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IActivityLogDocument extends Document {
  userId: string;
  examId?: string;
  action: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const ActivityLogSchema = new Schema({
  userId: { type: String, required: true, index: true },
  examId: { type: String },
  action: { type: String, required: true },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: { type: Schema.Types.Mixed },
});

ActivityLogSchema.index({ userId: 1, timestamp: -1 });

const ActivityLog: Model<IActivityLogDocument> = 
  models.ActivityLog || mongoose.model<IActivityLogDocument>("ActivityLog", ActivityLogSchema);

export default ActivityLog;