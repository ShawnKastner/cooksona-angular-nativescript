// libs/core/auth/src/lib/guards/auth-redirect.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// If the user is logged in, redirect to '/'; otherwise allow access
export const authRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const user = authService.currentUser;
  if (user) {
    // send logged-in users to the planner at root
    router.navigateByUrl('/');
    return false;
  }
  return true;
};
