
export interface Question {
  subject: string;
  No: number;
  Question: string;
  Answer: string;
}

export interface UserAnswers {
  [questionNo: number]: string;
}

export enum ExamStatus {
  Idle = 'idle',
  Active = 'active',
  Finished = 'finished',
}
