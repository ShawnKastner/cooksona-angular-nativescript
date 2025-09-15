import { AuthUser } from '@cooksona/auth';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'inactive'
  | 'suspended'
  | 'past_due'
  | 'none';
export type SubscriptionType = 'monthly' | 'yearly';
export type Subscription = 'FREE' | 'MONTHLY' | 'YEARLY' | 'LIFETIME';

export type User = AuthUser & {
  name?: string;
  email?: string;
  password?: string; // only for temporary flows
  createdAt?: string;
  updatedAt?: string;
  // Subscription data
  lifetimeSubscription?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionType?: SubscriptionType;
  subscriptionEndsAt?: string | null;
  paypalSubscriptionId?: string | null;
  // Quota
  requestCount?: number;
  requestCountResetAt?: string;
};

export interface LoginCredentials {
  email: string;
  password: string;
}
export interface RegisterCredentials extends LoginCredentials {
  name: string;
}
export interface ProfileUpdate {
  name: string;
  email: string;
}
