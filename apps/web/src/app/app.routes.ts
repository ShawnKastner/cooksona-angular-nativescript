import { Routes } from '@angular/router';
import { authRedirectGuard, protectedRouteGuard } from '@cooksona/auth';
import { LoginComponent } from './features/auth/login/login';
import { LandingComponent } from './pages/landing/landing.component';
import { RegisterComponent } from './features/auth/register/register';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password';
import { EmailVerificationComponent } from './features/auth/email-verification/email-verification';

export const routes: Routes = [
  // Landing at /landing (root will be planner for logged-in users)
  {
    path: 'landing',
    canActivate: [authRedirectGuard],
    component: LandingComponent,
    title: 'Essensplanung & Rezepte',
    data: {
      description:
        'CookSona ist die smarte Lösung für Essensplanung, Einkaufsliste, gesunde Rezepte, Nährwert-Analyse und Kochbuch. Spare Zeit, Geld und ernähre dich besser!',
      keywords:
        'Essensplanung, Einkaufsliste, gesunde Rezepte, Kochbuch, Nährwertanalyse, Meal Planner, Ernährung, Food App, Rezepte speichern, Supermarkt, Familienplanung, Diät, Allergene, Kalorien, Makros, Wochenplan, Mahlzeiten, CookSona',
      image: '/favicon.svg',
    },
  },

  // Invite redeem
  {
    path: 'invite/redeem/:token',
    loadComponent: () =>
      import('./pages/invite-redeem/invite-redeem.component').then(
        (m) => m.InviteRedeemPage,
      ),
    title: 'Einladung einlösen',
  },
  { path: 'invite/redeem', redirectTo: '/login', pathMatch: 'full' },

  // Auth pages: redirect signed-in users to home
  {
    path: 'login',
    canActivate: [authRedirectGuard],
    component: LoginComponent,
    title: 'Anmelden',
  },
  {
    path: 'register',
    canActivate: [authRedirectGuard],
    component: RegisterComponent,
    title: 'Registrieren',
  },
  {
    path: 'forgot-password',
    canActivate: [authRedirectGuard],
    component: ForgotPasswordComponent,
    title: 'Passwort vergessen',
  },
  {
    path: 'reset-password',
    canActivate: [authRedirectGuard],
    component: ResetPasswordComponent,
    title: 'Passwort zurücksetzen',
  },
  {
    path: 'verify-email',
    canActivate: [authRedirectGuard],
    component: EmailVerificationComponent,
    title: 'E-Mail bestätigen',
  },
  {
    path: 'email-verification',
    canActivate: [authRedirectGuard],
    component: EmailVerificationComponent,
    title: 'E-Mail bestätigen',
  },

  // Protected pages - planner is the app root for authenticated users
  {
    path: '',
    canActivate: [protectedRouteGuard],
    loadComponent: () =>
      import('./features/meal-planner/planner/planner.component').then(
        (m) => m.PlannerComponent,
      ),
    title: 'CookSona – Dein digitaler Essensplaner und Kochbuch',
    data: {
      description:
        'Plane deine Mahlzeiten, erstelle Einkaufslisten und speichere Rezepte mit CookSona.',
    },
  },
  {
    path: 'profile',
    canActivate: [protectedRouteGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent,
      ),
    title: 'Profil',
    data: {
      description:
        'Dein persönliches Profil bei CookSona. Verwalte deine Daten, Einstellungen und Abonnements.',
    },
  },
  {
    path: 'cookbook',
    canActivate: [protectedRouteGuard],
    loadComponent: () =>
      import('./features/cookbook/cookbook.component').then(
        (m) => m.CookbookComponent,
      ),
    title: 'Kochbuch',
  },
  {
    path: 'health',
    canActivate: [protectedRouteGuard],
    loadComponent: () =>
      import('./features/health/health.component').then(
        (m) => m.HealthComponent,
      ),
    title: 'Health Hub',
  },
  {
    path: 'admin',
    canActivate: [protectedRouteGuard],
    title: 'Admin',
    data: {
      requiredRole: 'admin' as const,
      description:
        'Admin-Dashboard für Benutzer, Einladungen und Kontaktanfragen.',
    },
    loadComponent: () =>
      import('./features/admin/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },

  // Legal & contact
  {
    path: 'datenschutz',
    loadComponent: () =>
      import('./pages/legal/privacy-policy.component').then(
        (m) => m.DatenschutzPage,
      ),
    title: 'Datenschutz',
  },
  {
    path: 'impressum',
    loadComponent: () =>
      import('./pages/legal/imprint.component').then((m) => m.ImpressumPage),
    title: 'Impressum',
  },
  {
    path: 'barrierefreiheit',
    loadComponent: () =>
      import('./pages/legal/accessibility-statement.component').then(
        (m) => m.AccessibilityStatementComponent,
      ),
    title: 'Erklärung zur Barrierefreiheit',
    data: {
      description:
        'Informationen zur Barrierefreiheit von CookSona gemäß WCAG 2.1 AA und BFSG.',
    },
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/legal//contact/contact.component').then(
        (m) => m.ContactComponent,
      ),
    title: 'Kontakt',
    data: {
      description:
        'Fragen, Vorschläge oder Support? Kontaktiere das CookSona Team.',
    },
  },

  { path: '**', redirectTo: '' },
];
