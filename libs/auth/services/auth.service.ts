// libs/core/auth/src/lib/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthUser, UserRole } from '../models/auth.models';

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
    this.setCurrentUser(null);
  }
}
