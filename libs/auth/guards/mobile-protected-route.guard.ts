import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

// Mobile-specific protected route guard: requires auth and optional role; redirects to '/login'
export const mobileProtectedRouteGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (auth.isLoading) {
    return false;
  }

  const user = auth.currentUser;
  if (!user) {
    return router.createUrlTree(['/login']);
  }

  const requiredRole = route.data?.['requiredRole'] as UserRole | undefined;
  if (requiredRole && user.role !== requiredRole) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
