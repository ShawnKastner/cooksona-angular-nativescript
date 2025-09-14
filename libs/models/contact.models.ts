export type ContactRequestType = 'support' | 'feedback' | 'bug' | 'other';

export type ContactRequestStatus =
  | 'open'
  | 'in_progress'
  | 'closed'
  | 'answered';

export interface Message {
  id: string;
  userId?: string;
  email?: string;
  requestType: ContactRequestType;
  message: string;
  status: ContactRequestStatus;
  reply?: string;
  createdAt?: string;
  updatedAt?: string;
}
