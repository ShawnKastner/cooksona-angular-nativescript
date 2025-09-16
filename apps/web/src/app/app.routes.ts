import { Routes } from '@angular/router';
import { authRedirectGuard, protectedRouteGuard } from '@cooksona/auth';
import { Login } from './components/auth/login/login';
import { LandingComponent } from './pages/landing/landing.component';
import { Register } from './components/auth/register/register';
import { ForgotPassword } from './components/auth/forgot-password/forgot-password';
import { ResetPassword } from './components/auth/reset-password/reset-password';
import { EmailVerification } from './components/auth/email-verification/email-verification';

export const routes: Routes = [
  // Landing at /landing (root will be planner for logged-in users)
  {
    path: 'landing',
    canActivate: [authRedirectGuard],
    component: LandingComponent,
    data: { title: 'Essensplanung & Rezepte' },
  },

  // Invite redeem
  {
    path: 'invite/redeem/:token',
    loadComponent: () =>
      import('./pages/invite-redeem/invite-redeem.page').then(
        (m) => m.InviteRedeemPage
      ),
    data: { title: 'Einladung einlösen' },
  },
  { path: 'invite/redeem', redirectTo: '/login', pathMatch: 'full' },

  // Auth pages: redirect signed-in users to home
  { path: 'login', canActivate: [authRedirectGuard], component: Login, data: { title: 'Anmelden' } },
  { path: 'register', canActivate: [authRedirectGuard], component: Register, data: { title: 'Registrieren' } },
  {
    path: 'forgot-password',
    canActivate: [authRedirectGuard],
    component: ForgotPassword,
    data: { title: 'Passwort vergessen' },
  },
  {
    path: 'reset-password',
    canActivate: [authRedirectGuard],
    component: ResetPassword,
    data: { title: 'Passwort zurücksetzen' },
  },
  {
    path: 'verify-email',
    canActivate: [authRedirectGuard],
    component: EmailVerification,
    data: { title: 'E-Mail bestätigen' },
  },
  {
    path: 'email-verification',
    canActivate: [authRedirectGuard],
    component: EmailVerification,
    data: { title: 'E-Mail bestätigen' },
  },

  // Protected pages - planner is the app root for authenticated users
  {
    path: '',
    canActivate: [protectedRouteGuard],
    loadComponent: () =>
      import('./features/planner/planner.page').then((m) => m.PlannerPage),
    data: { title: 'Planer' },
  },
  {
    path: 'profile',
    canActivate: [protectedRouteGuard],
    loadComponent: () =>
      import('./components/profile/profile.page').then((m) => m.ProfilePage),
    data: { title: 'Profil' },
  },
  {
    path: 'cookbook',
    canActivate: [protectedRouteGuard],
    loadComponent: () =>
      import('./features/cookbook/cookbook.page').then((m) => m.CookbookPage),
    data: { title: 'Kochbuch' },
  },
  {
    path: 'admin',
    canActivate: [protectedRouteGuard],
    data: { requiredRole: 'admin' as const, title: 'Admin' },
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then(
        (m) => m.AdminDashboard
      ),
  },

  // Legal & contact
  {
    path: 'datenschutz',
    loadComponent: () =>
      import('./pages/legal/datenschutz.page').then((m) => m.DatenschutzPage),
    data: { title: 'Datenschutz' },
  },
  {
    path: 'impressum',
    loadComponent: () =>
      import('./pages/legal/impressum.page').then((m) => m.ImpressumPage),
    data: { title: 'Impressum' },
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/legal/contact.page').then((m) => m.ContactPage),
    data: { title: 'Kontakt' },
  },

  { path: '**', redirectTo: '' },
];
