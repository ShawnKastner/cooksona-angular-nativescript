import { AuthUser } from '@cooksona/auth';

export type SubscriptionStatus = 'active' | 'canceled' | 'inactive' | 'none';

export type User = AuthUser & {
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  // Subscription data
  lifetimeSubscription?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionEndsAt?: string; // ISO
  paypalSubscriptionId?: string;
  // Quota
  requestCount?: number;
};
