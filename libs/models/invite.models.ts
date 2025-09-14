export type InviteRole = 'admin' | 'user';

export interface Invite {
  id: string;
  code: string;
  email?: string;
  role?: InviteRole;
  maxUses?: number;
  uses?: number;
  createdBy?: string;
  createdAt?: string;
  expiresAt?: string | null;
}

export interface CreateInviteRequest {
  email?: string;
  role?: InviteRole;
  maxUses?: number;
  expiresAt?: string | null; // ISO string
}
