import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Mobile-specific: if already authenticated, redirect away from auth pages to '/home'
export const mobileAuthRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (auth.currentUser) {
    return router.createUrlTree(['/home']);
  }
  return true;
};
