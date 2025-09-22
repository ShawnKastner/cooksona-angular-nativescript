import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

// Enforces loading, authentication, and role-based access control
export const protectedRouteGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // 1) Loading state handling (minimal viable): block or redirect if configured
  if (authService.isLoading) {
    const loadingRedirect =
      (route.data?.['loadingRedirect'] as string | undefined) ?? undefined;
    // Prefer returning a UrlTree instead of imperative navigation from guards
    if (loadingRedirect) {
      return router.createUrlTree([loadingRedirect]);
    }
    return false;
  }

  // 2) User must be authenticated
  const user = authService.currentUser;
  if (!user) {
    // Redirect unauthenticated users to landing to avoid self-redirect loops on ''
    return router.createUrlTree(['/landing']);
  }

  // 3) Optional role requirement
  const requiredRole = route.data?.['requiredRole'] as UserRole | undefined;
  if (requiredRole && user.role !== requiredRole) {
    // If user lacks role, send them to a safe public page
    return router.createUrlTree(['/landing']);
  }

  return true;
};
