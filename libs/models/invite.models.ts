export type InviteRole = 'admin' | 'user';

export interface Invite {
  id: string;
  token: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  presetRole: InviteRole;
  presetLifetimeSubscription?: boolean;
  presetSubscriptionEndsAt?: string | null;
  expiresAt: string;
  createdAt: string;
  description?: string;
}

export interface CreateInviteRequest {
  email?: string;
  role?: InviteRole;
  maxUses?: number;
  expiresAt?: string | null; // ISO string
  description?: string;
}
