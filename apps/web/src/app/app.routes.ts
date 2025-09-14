import { Routes } from '@angular/router';
import { authRedirectGuard, protectedRouteGuard } from '@cooksona/auth';
import { Login } from './components/auth/login/login';
import { LandingComponent } from './pages/landing/landing.component';
import { Register } from './components/auth/register/register';
import { ForgotPassword } from './components/auth/forgot-password/forgot-password';
import { ResetPassword } from './components/auth/reset-password/reset-password';
import { EmailVerification } from './components/auth/email-verification/email-verification';

export const routes: Routes = [
  // Public landing route (placeholder uses Login component)
  { path: 'landing', component: LandingComponent },

  // Auth pages: redirect signed-in users to home
  {
    path: 'login',
    canActivate: [authRedirectGuard],
    component: Login,
  },
  {
    path: 'register',
    canActivate: [authRedirectGuard],
    component: Register,
  },
  {
    path: 'forgot-password',
    canActivate: [authRedirectGuard],
    component: ForgotPassword,
  },
  {
    path: 'reset-password',
    canActivate: [authRedirectGuard],
    component: ResetPassword,
  },
  {
    path: 'email-verification',
    canActivate: [authRedirectGuard],
    component: EmailVerification,
  },
  // Protected home (placeholder uses EmailVerification until real home exists)
  {
    path: '',
    canActivate: [protectedRouteGuard],
    component: EmailVerification,
  },
  // Example admin area with role requirement (uncomment when available)
  // {
  //   path: 'admin',
  //   canActivate: [protectedRouteGuard],
  //   data: { requiredRole: 'admin' as const },
  //   loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  // },
];
