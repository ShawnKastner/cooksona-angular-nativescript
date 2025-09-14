import { Routes } from '@angular/router';
import { authRedirectGuard, protectedRouteGuard } from '@cooksona/auth';
import { Login } from './components/auth/login/login';
import { LandingComponent } from './pages/landing/landing.component';
import { Register } from './components/auth/register/register';
import { ForgotPassword } from './components/auth/forgot-password/forgot-password';
import { ResetPassword } from './components/auth/reset-password/reset-password';
import { EmailVerification } from './components/auth/email-verification/email-verification';

export const routes: Routes = [
  // Public landing route
  { path: 'landing', component: LandingComponent },

  // Invite redeem
  { path: 'invite/redeem/:token', loadComponent: () => import('./pages/invite-redeem/invite-redeem.page').then(m => m.InviteRedeemPage) },
  { path: 'invite/redeem', redirectTo: '/login', pathMatch: 'full' },

  // Auth pages: redirect signed-in users to home
  { path: 'login', canActivate: [authRedirectGuard], component: Login },
  { path: 'register', canActivate: [authRedirectGuard], component: Register },
  { path: 'forgot-password', canActivate: [authRedirectGuard], component: ForgotPassword },
  { path: 'reset-password', canActivate: [authRedirectGuard], component: ResetPassword },
  { path: 'verify-email', canActivate: [authRedirectGuard], component: EmailVerification },
  { path: 'email-verification', canActivate: [authRedirectGuard], component: EmailVerification },

  // Protected pages
  { path: '', canActivate: [protectedRouteGuard], loadComponent: () => import('./features/planner/planner.page').then(m => m.PlannerPage) },
  { path: 'profile', canActivate: [protectedRouteGuard], loadComponent: () => import('./components/profile/profile.page').then(m => m.ProfilePage) },
  { path: 'cookbook', canActivate: [protectedRouteGuard], loadComponent: () => import('./features/cookbook/cookbook.page').then(m => m.CookbookPage) },
  { path: 'admin', canActivate: [protectedRouteGuard], data: { requiredRole: 'admin' as const }, loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboard) },

  // Legal & contact
  { path: 'datenschutz', loadComponent: () => import('./pages/legal/datenschutz.page').then(m => m.DatenschutzPage) },
  { path: 'impressum', loadComponent: () => import('./pages/legal/impressum.page').then(m => m.ImpressumPage) },
  { path: 'contact', loadComponent: () => import('./pages/legal/contact.page').then(m => m.ContactPage) },

  { path: '**', redirectTo: '' },
];
