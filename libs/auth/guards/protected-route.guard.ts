// libs/core/auth/src/lib/guards/protected-route.guard.ts
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

// Enforces loading, authentication, and role-based access control
export const protectedRouteGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // 1) Loading state handling (minimal viable): block or redirect if configured
  if (authService.isLoading) {
    const loadingRedirect =
      (route.data?.['loadingRedirect'] as string | undefined) ?? undefined;
    if (loadingRedirect) {
      router.navigateByUrl(loadingRedirect);
    }
    return false;
  }

  // 2) User must be authenticated
  const user = authService.currentUser;
  if (!user) {
    router.navigateByUrl('/');
    return false;
  }

  // 3) Optional role requirement
  const requiredRole = route.data?.['requiredRole'] as UserRole | undefined;
  if (requiredRole && user.role !== requiredRole) {
    router.navigateByUrl('/');
    return false;
  }

  return true;
};
