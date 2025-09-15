export type ContactRequestType = 'feature' | 'support' | 'feedback' | 'other';

export type ContactRequestStatus = 'unread' | 'read' | 'answered';

export interface Message {
  id: string;
  userId: string;
  requestType: ContactRequestType;
  message: string;
  createdAt: string; // ISO String
  status: ContactRequestStatus;
  reply?: string;
}
