import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IProctoringEventDocument extends Document {
  examId: string;
  userId: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high';
  frameSnapshot?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ProctoringEventSchema = new Schema<IProctoringEventDocument>({
  examId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  eventType: {
    type: String,
    required: true,
    enum: ['face_not_detected', 'multiple_faces', 'tab_switch', 'window_blur', 'sound_detected', 'unauthorized_device']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  frameSnapshot: { type: String },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

ProctoringEventSchema.index({ examId: 1, createdAt: -1 });

const ProctoringEvent: Model<IProctoringEventDocument> = 
  models.ProctoringEvent || mongoose.model<IProctoringEventDocument>("ProctoringEvent", ProctoringEventSchema);

export default ProctoringEvent;