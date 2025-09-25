import { Routes } from '@angular/router';
import {
  mobileAuthRedirectGuard,
  mobileProtectedRouteGuard,
} from '@cooksona/auth';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [mobileAuthRedirectGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'register',
    canActivate: [mobileAuthRedirectGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: 'forgot-password',
    canActivate: [mobileAuthRedirectGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'home',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import('./layout/ui/tabs/tabs.component').then((m) => m.TabsComponent),
  },
];
