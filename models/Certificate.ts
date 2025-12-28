import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface ICertificateDocument extends Document {
  clerkUserId: string;
  username: string;
  email: string;
  courseName: string;
  filePath: string;
  questions: IQuestion[];
  uploadedAt: Date;
  status: 'pending' | 'verified' | 'rejected';
  verificationDate?: Date;
}

const QuestionSchema = new Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  answer: { type: String, required: true }
}, { _id: false });

const CertificateSchema = new Schema({
  clerkUserId: { type: String, required: true, index: true },
  username: { type: String },
  email: { type: String },
  courseName: { type: String, required: true },
  filePath: { type: String, required: true },
  questions: { type: [QuestionSchema], default: [] },
  uploadedAt: { type: Date, default: Date.now, index: true },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  verificationDate: { type: Date },
});

CertificateSchema.index({ clerkUserId: 1, uploadedAt: -1 });

const Certificate: Model<ICertificateDocument> = 
  models.Certificate || mongoose.model<ICertificateDocument>("Certificate", CertificateSchema);

export default Certificate;