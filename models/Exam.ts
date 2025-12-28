import mongoose, { Schema, Document, models, Model } from "mongoose";
export interface IQuestionAnswered {
  questionId: string;
  questionText: string;
  userAnswer: string;  // Changed: No longer required in schema
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface IExamDocument extends Document {
  userId: string;
  certificateId: string;
  certificateName: string;
  examDate: Date;
  status: 'in-progress' | 'completed' | 'abandoned';
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  timeSpent?: number;
  questionsAnswered: IQuestionAnswered[];
  result?: 'pass' | 'fail' | 'under-review';
  completedAt?: Date;
  cheatingPenalty?: number;
  finalGrade?: string;
}

const QuestionAnsweredSchema = new Schema<IQuestionAnswered>({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  userAnswer: { type: String, required: false, default: 'No answer' }, // FIXED: Made optional
  correctAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  timeSpent: { type: Number, default: 0 }
}, { _id: false });

const ExamSchema = new Schema<IExamDocument>({
  userId: { type: String, required: true, index: true },
  certificateId: { type: String, required: true },
  certificateName: { type: String },
  examDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  },
  score: { type: Number, min: 0, max: 100 },
  totalQuestions: { type: Number },
  correctAnswers: { type: Number },
  timeSpent: { type: Number },
  questionsAnswered: [QuestionAnsweredSchema],
  result: {
    type: String,
    enum: ['pass', 'fail', 'under-review']
  },
  completedAt: { type: Date },
  cheatingPenalty: { type: Number, default: 0 },
  finalGrade: { type: String },
}, { timestamps: true });

ExamSchema.index({ userId: 1, examDate: -1 });

const Exam: Model<IExamDocument> = 
  models.Exam || mongoose.model<IExamDocument>("Exam", ExamSchema);

export default Exam;