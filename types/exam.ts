export interface IQuestionAnswered {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface IExam {
  _id: string;
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

export interface IExamResponse {
  success: boolean;
  data?: IExam | IExam[];
  message?: string;
}