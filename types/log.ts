export interface IActivityLog {
  _id: string;
  userId: string;
  examId?: string;
  action: string;
  description: string;
  timestamp: Date;
}

export interface ILogResponse {
  success: boolean;
  data?: IActivityLog[];
  message?: string;
}