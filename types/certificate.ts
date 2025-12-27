export interface IQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface ICertificate {
  _id: string;
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

export interface IUploadResponse {
  success: boolean;
  message: string;
  courseName?: string;
  questions?: number;
  certificateId?: string;
  error?: string;
  details?: string;
}

export interface ICertificateResponse {
  success: boolean;
  data?: ICertificate | ICertificate[];
  message?: string;
}