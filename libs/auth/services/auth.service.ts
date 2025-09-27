import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthUser, UserRole } from '../models/auth.models';
import { User } from '@cooksona/models/user.models';
import { ApiService } from '@cooksona/api';
let mobileClearPersistedTokens: (() => void) | null = null;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(
    null,
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

  // Normalize backend or network errors into a predictable shape and rethrow
  private fail(context: string, err: any, fallback: string): never {
    // Extract message from common shapes
    const fromArray = (arr: any): string | null =>
      Array.isArray(arr) && arr.length ? String(arr[0]) : null;
    const fromMessages = (m: any): string | null => {
      if (!m) return null;
      if (typeof m === 'string') return m;
      if (Array.isArray(m)) return fromArray(m);
      if (typeof m === 'object') {
        // often { field: [msg] } or { message: '...' }
        if (m.message && typeof m.message === 'string') return m.message;
        const values = Object.values(m);
        const first = values.find((v) => typeof v === 'string') ?? values[0];
        return fromArray(first) ?? (typeof first === 'string' ? first : null);
      }
      return null;
    };

    const message =
      (err?.message && String(err.message)) ||
      fromMessages(err?.messages) ||
      fromMessages(err?.error) ||
      fromMessages(err?.body) ||
      fallback;

    // Log technical details for diagnostics without leaking to UI
    console.warn(`[AuthService] ${context} failed`, err);
    throw { message, context, cause: err } as const;
  }

  // Simple logout stub to be called from web header
  logout(): void {
    // best-effort server logout, then clear local state
    try {
      void this.api.post('/auth/logout', {});
    } catch (e) {
      console.warn('[AuthService] logout server call failed', e);
    }
    this.setCurrentUser(null);
    try {
      mobileClearPersistedTokens?.();
    } catch (e) {
      console.warn('[AuthService] mobile token clear failed', e);
    }
  }

  constructor(private readonly api: ApiService) {}
  // Lazy bridge to avoid hard dependency on mobile layer
  static registerMobileTokenClear(fn: () => void) {
    mobileClearPersistedTokens = fn;
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthUser> {
    this.setLoading(true);
    try {
      const resp = await this.api.post<User | { user: User }>(
        '/auth/login',
        credentials,
      );
      const user: User | undefined = (resp as any)?.user ?? (resp as any);
      if (!user) {
        return this.fail(
          'login',
          resp,
          'Login fehlgeschlagen. Bitte erneut versuchen.',
        );
      }
      this.setCurrentUser(user);
      return user;
    } catch (e) {
      return this.fail(
        'login',
        e,
        'Login fehlgeschlagen. Bitte erneut versuchen.',
      );
    } finally {
      this.setLoading(false);
    }
  }

  // Mobile-specific login that returns tokens in response
  async loginNative(credentials: {
    email: string;
    password: string;
  }): Promise<AuthUser> {
    this.setLoading(true);
    try {
      const resp = await this.api.post<
        | {
            user: User;
            accessToken?: string;
            refreshToken?: string;
            csrfToken?: string;
          }
        | undefined
      >('/auth/login-native', credentials);

      const user = (resp as any)?.user as User | undefined;
      if (!user) {
        return this.fail(
          'loginNative',
          resp,
          'Login fehlgeschlagen. Bitte erneut versuchen.',
        );
      }

      // Persist tokens in ApiService for mobile Authorization + refresh-native
      try {
        const accessToken = (resp as any)?.accessToken as string | undefined;
        const refreshToken = (resp as any)?.refreshToken as string | undefined;
        const csrfToken = (resp as any)?.csrfToken as string | undefined;
        (this.api as any).setTokens?.({ accessToken, refreshToken, csrfToken });
        if (!refreshToken && !accessToken) {
          console.warn(
            '[AuthService] loginNative response missing tokens; relying on cookies if available',
          );
        }
      } catch (e) {
        return this.fail(
          'loginNative.setTokens',
          e,
          'Sichere Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
        );
      }

      // Optionally store tokens for native-only flows (if you later add Authorization header usage)
      // For now we primarily set current user for app state
      this.setCurrentUser(user);
      return user;
    } catch (e) {
      return this.fail(
        'loginNative',
        e,
        'Login fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.',
      );
    } finally {
      this.setLoading(false);
    }
  }

  async register(payload: {
    name: string;
    email: string;
    password: string;
  }): Promise<void> {
    this.setLoading(true);
    try {
      // Convention: backend returns created user or message; we don't auto-login
      await this.api.post('/auth/register', payload);
    } catch (e) {
      return this.fail(
        'register',
        e,
        'Registrierung fehlgeschlagen. Bitte Eingaben prüfen und erneut versuchen.',
      );
    } finally {
      this.setLoading(false);
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    this.setLoading(true);
    try {
      await this.api.post('/auth/reset-password', { token, password });
    } catch (e) {
      return this.fail(
        'resetPassword',
        e,
        'Passwort-Zurücksetzung fehlgeschlagen. Bitte Link und Eingaben prüfen.',
      );
    } finally {
      this.setLoading(false);
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    this.setLoading(true);
    try {
      // Align with React service path
      await this.api.post('/auth/request-password-reset', { email });
    } catch (e) {
      return this.fail(
        'requestPasswordReset',
        e,
        'Anfrage zur Passwort-Zurücksetzung fehlgeschlagen.',
      );
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
    } catch (e) {
      // On refresh failure, consider user unauthenticated; log for diagnostics
      console.warn('[AuthService] refreshCurrentUser failed', e);
      this.setCurrentUser(null);
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async updateProfile(data: { name?: string; email?: string }): Promise<void> {
    try {
      const updated = await this.api.put<User>('/users/me', data);
      if (updated) this.setCurrentUser(updated);
    } catch (e) {
      return this.fail(
        'updateProfile',
        e,
        'Profilaktualisierung fehlgeschlagen. Bitte Eingaben prüfen.',
      );
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      await this.api.delete<void>('/users/me');
      this.logout();
    } catch (e) {
      return this.fail(
        'deleteAccount',
        e,
        'Löschen des Kontos fehlgeschlagen. Bitte später erneut versuchen.',
      );
    }
  }

  async upgradeToPro(planType: string): Promise<void> {
    try {
      const updated = await this.api.post<User>('/subscription/upgrade', {
        planType,
      });
      if (updated) this.setCurrentUser(updated);
    } catch (e) {
      return this.fail(
        'upgradeToPro',
        e,
        'Upgrade fehlgeschlagen. Bitte Zahlungsmethode prüfen oder später erneut versuchen.',
      );
    }
  }

  async cancelSubscription(): Promise<void> {
    const u = this.currentUser as User | null;
    const subId = (u as any)?.paypalSubscriptionId as string | undefined;
    if (!subId) return;
    try {
      await this.api.post('/paypal/cancel-subscription', {
        subscriptionId: subId,
      });
      // Best-effort refresh
      await this.refreshCurrentUser();
    } catch (e) {
      return this.fail(
        'cancelSubscription',
        e,
        'Kündigung fehlgeschlagen. Bitte später erneut versuchen.',
      );
    }
  }

  async reactivateSubscription(): Promise<void> {
    const u = this.currentUser as User | null;
    const subId = (u as any)?.paypalSubscriptionId as string | undefined;
    if (!subId) return;
    try {
      await this.api.post('/paypal/reactivate-subscription', {
        subscriptionId: subId,
      });
      await this.refreshCurrentUser();
    } catch (e) {
      return this.fail(
        'reactivateSubscription',
        e,
        'Reaktivierung fehlgeschlagen. Bitte später erneut versuchen.',
      );
    }
  }

  async consumeRequest(): Promise<void> {
    try {
      const updated = await this.api.post<User>(
        '/users/me/consume-request',
        {},
      );
      if (updated) this.setCurrentUser(updated);
    } catch (e) {
      return this.fail(
        'consumeRequest',
        e,
        'Aktion fehlgeschlagen. Bitte später erneut versuchen.',
      );
    }
  }

  isProUser(): boolean {
    const u = this.currentUser as
      | (User & {
          lifetimeSubscription?: boolean;
          subscriptionStatus?: 'active' | 'canceled' | 'inactive' | 'none';
          subscriptionEndsAt?: string;
        })
      | null;
    if (!u) return false;
    if (u.lifetimeSubscription) return true;
    const endsAt = u.subscriptionEndsAt ? new Date(u.subscriptionEndsAt) : null;
    const now = new Date();
    if (u.subscriptionStatus === 'active' && endsAt && endsAt > now)
      return true;
    if (u.subscriptionStatus === 'canceled' && endsAt && endsAt > now)
      return true;
    if (u.subscriptionStatus === 'inactive' && endsAt && endsAt > now)
      return true;
    return false;
  }

  getRemainingRequests(freeLimit = 5): number {
    const u = this.currentUser as
      | (User & { lifetimeSubscription?: boolean; requestCount?: number })
      | null;
    if (!u) return freeLimit;
    if (this.isProUser() || (u as any).lifetimeSubscription)
      return Number.POSITIVE_INFINITY;
    const used = Number((u as any).requestCount ?? 0);
    return Math.max(0, freeLimit - used);
  }
}
