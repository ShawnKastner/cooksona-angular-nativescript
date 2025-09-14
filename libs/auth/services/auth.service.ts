// libs/core/auth/src/lib/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthUser, UserRole } from '../models/auth.models';
import { User } from '@cooksona/models/user.models';
import { ApiService } from '@cooksona/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(
    null
  );
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);

  readonly currentUser$: Observable<AuthUser | null> =
    this.currentUserSubject.asObservable();
  readonly isLoading$: Observable<boolean> =
    this.isLoadingSubject.asObservable();

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.getValue();
  }

  get isLoading(): boolean {
    return this.isLoadingSubject.getValue();
  }

  hasRole(role: UserRole): boolean {
    const user = this.currentUser;
    return !!user && user.role === role;
  }

  // Stub methods to simulate auth state during development.
  // Replace with real integration (e.g., Firebase, API) later.
  setCurrentUser(user: AuthUser | null): void {
    this.currentUserSubject.next(user);
  }

  setLoading(loading: boolean): void {
    this.isLoadingSubject.next(loading);
  }

  // Simple logout stub to be called from web header
  logout(): void {
    // best-effort server logout, then clear local state
    try {
      void this.api.post('/auth/logout', {});
    } catch {}
    this.setCurrentUser(null);
  }

  constructor(private readonly api: ApiService) {}

  async login(credentials: { email: string; password: string }): Promise<AuthUser> {
    this.setLoading(true);
    try {
      const resp = await this.api.post<User | { user: User }>(
        '/auth/login',
        credentials
      );
      const user: User | undefined = (resp as any)?.user ?? (resp as any);
      if (!user) {
        throw { message: 'Login fehlgeschlagen. Bitte erneut versuchen.' } as const;
      }
      this.setCurrentUser(user);
      return user;
    } finally {
      this.setLoading(false);
    }
  }

  async register(payload: { name: string; email: string; password: string }): Promise<void> {
    this.setLoading(true);
    try {
      // Convention: backend returns created user or message; we don't auto-login
      await this.api.post('/auth/register', payload);
    } finally {
      this.setLoading(false);
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    this.setLoading(true);
    try {
      await this.api.post('/auth/reset-password', { token, password });
    } finally {
      this.setLoading(false);
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    this.setLoading(true);
    try {
      // Align with React service path
      await this.api.post('/auth/request-password-reset', { email });
    } finally {
      this.setLoading(false);
    }
  }

  async refreshCurrentUser(): Promise<User | null> {
    this.setLoading(true);
    try {
      const user = await this.api.get<User>('/users/me');
      if (user) this.setCurrentUser(user);
      return user ?? null;
    } catch {
      this.setCurrentUser(null);
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async updateProfile(data: { name?: string; email?: string }): Promise<void> {
    const updated = await this.api.put<User>('/users/me', data);
    if (updated) this.setCurrentUser(updated);
  }

  async deleteAccount(): Promise<void> {
    await this.api.delete<void>('/users/me');
    this.logout();
  }

  async upgradeToPro(planType: string): Promise<void> {
    const updated = await this.api.post<User>('/subscription/upgrade', { planType });
    if (updated) this.setCurrentUser(updated);
  }

  async cancelSubscription(): Promise<void> {
    const u = this.currentUser as User | null;
    const subId = (u as any)?.paypalSubscriptionId as string | undefined;
    if (!subId) return;
    await this.api.post('/paypal/cancel-subscription', { subscriptionId: subId });
    // Best-effort refresh
    await this.refreshCurrentUser();
  }

  async reactivateSubscription(): Promise<void> {
    const u = this.currentUser as User | null;
    const subId = (u as any)?.paypalSubscriptionId as string | undefined;
    if (!subId) return;
    await this.api.post('/paypal/reactivate-subscription', { subscriptionId: subId });
    await this.refreshCurrentUser();
  }

  async consumeRequest(): Promise<void> {
    const updated = await this.api.post<User>('/users/me/consume-request', {});
    if (updated) this.setCurrentUser(updated);
  }

  isProUser(): boolean {
    const u = this.currentUser as (User & {
      lifetimeSubscription?: boolean;
      subscriptionStatus?: 'active' | 'canceled' | 'inactive' | 'none';
      subscriptionEndsAt?: string;
    }) | null;
    if (!u) return false;
    if (u.lifetimeSubscription) return true;
    const endsAt = u.subscriptionEndsAt ? new Date(u.subscriptionEndsAt) : null;
    const now = new Date();
    if (u.subscriptionStatus === 'active') return true;
    if (u.subscriptionStatus === 'canceled' && endsAt && endsAt > now) return true;
    if (u.subscriptionStatus === 'inactive' && endsAt && endsAt > now) return true;
    return false;
  }

  getRemainingRequests(freeLimit = 5): number {
    const u = this.currentUser as (User & { lifetimeSubscription?: boolean; requestCount?: number }) | null;
    if (!u) return freeLimit;
    if (this.isProUser() || (u as any).lifetimeSubscription) return Number.POSITIVE_INFINITY;
    const used = Number((u as any).requestCount ?? 0);
    return Math.max(0, freeLimit - used);
  }
}
