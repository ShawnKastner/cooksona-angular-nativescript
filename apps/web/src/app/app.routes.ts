import { Routes } from '@angular/router';
import { authRedirectGuard, protectedRouteGuard } from '@cooksona/auth';
import { LoginComponent } from './components/auth/login/login';
import { LandingComponent } from './pages/landing/landing.component';
import { RegisterComponent } from './components/auth/register/register';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password';
import { EmailVerificationComponent } from './components/auth/email-verification/email-verification';

export const routes: Routes = [
  // Landing at /landing (root will be planner for logged-in users)
  {
    path: 'landing',
    canActivate: [authRedirectGuard],
    component: LandingComponent,
    data: {
      title: 'Essensplanung & Rezepte',
      description:
        "CookSona ist die smarte Lösung für Essensplanung, Einkaufsliste, gesunde Rezepte, Nährwert-Analyse und Kochbuch. Spare Zeit, Geld und ernähre dich besser!",
      keywords:
        'Essensplanung, Einkaufsliste, gesunde Rezepte, Kochbuch, Nährwertanalyse, Meal Planner, Ernährung, Food App, Rezepte speichern, Supermarkt, Familienplanung, Diät, Allergene, Kalorien, Makros, Wochenplan, Mahlzeiten, CookSona',
      image: '/favicon.svg',
    },
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
  { path: 'login', canActivate: [authRedirectGuard], component: LoginComponent, data: { title: 'Anmelden' } },
  { path: 'register', canActivate: [authRedirectGuard], component: RegisterComponent, data: { title: 'Registrieren' } },
  {
    path: 'forgot-password',
    canActivate: [authRedirectGuard],
    component: ForgotPasswordComponent,
    data: { title: 'Passwort vergessen' },
  },
  {
    path: 'reset-password',
    canActivate: [authRedirectGuard],
    component: ResetPasswordComponent,
    data: { title: 'Passwort zurücksetzen' },
  },
  {
    path: 'verify-email',
    canActivate: [authRedirectGuard],
    component: EmailVerificationComponent,
    data: { title: 'E-Mail bestätigen' },
  },
  {
    path: 'email-verification',
    canActivate: [authRedirectGuard],
    component: EmailVerificationComponent,
    data: { title: 'E-Mail bestätigen' },
  },

  // Protected pages - planner is the app root for authenticated users
  {
    path: '',
    canActivate: [protectedRouteGuard],
    loadComponent: () =>
      import('./features/planner/planner.page').then((m) => m.PlannerComponent),
    data: {
      title: 'Planer',
      description:
        'Plane deine Mahlzeiten, erstelle Einkaufslisten und speichere Rezepte mit CookSona.',
    },
  },
  {
    path: 'profile',
    canActivate: [protectedRouteGuard],
    loadComponent: () =>
      import('./components/profile/profile.page').then((m) => m.ProfileComponent),
    data: {
      title: 'Profil',
      description:
        'Dein persönliches Profil bei CookSona. Verwalte deine Daten, Einstellungen und Abonnements.',
    },
  },
  {
    path: 'cookbook',
    canActivate: [protectedRouteGuard],
    loadComponent: () =>
      import('./features/cookbook/cookbook.page').then((m) => m.CookbookComponent),
    data: { title: 'Kochbuch' },
  },
  {
    path: 'admin',
    canActivate: [protectedRouteGuard],
    data: {
      requiredRole: 'admin' as const,
      title: 'Admin',
      description: 'Admin-Dashboard für Benutzer, Einladungen und Kontaktanfragen.',
    },
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
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
    data: {
      title: 'Kontakt',
      description: 'Fragen, Vorschläge oder Support? Kontaktiere das CookSona Team.',
    },
  },

  { path: '**', redirectTo: '' },
];
