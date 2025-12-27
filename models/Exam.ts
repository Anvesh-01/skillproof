import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IQuestionAnswered {
  questionId: string;
  questionText: string;
  userAnswer: string;
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
}

const QuestionAnsweredSchema = new Schema({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  userAnswer: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  timeSpent: { type: Number, default: 0 }
}, { _id: false });

const ExamSchema = new Schema({
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
}, { timestamps: true });

ExamSchema.index({ userId: 1, examDate: -1 });

const Exam: Model = 
  models.Exam || mongoose.model("Exam", ExamSchema);

export default Exam;