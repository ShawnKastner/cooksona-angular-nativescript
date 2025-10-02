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
    children: [
      { path: '', redirectTo: 'plan', pathMatch: 'full' },
      {
        path: 'plan',
        loadComponent: () =>
          import('./features/planner-page/planner-page.component').then(
            (m) => m.PlannerPageComponent,
          ),
      },
      {
        path: 'cookbook',
        loadComponent: () =>
          import('./features/cookbook-page/cookbook-page.component').then(
            (m) => m.CookbookPageComponent,
          ),
      },
      {
        path: 'health',
        loadComponent: () =>
          import('./features/placeholder/health.component').then(
            (m) => m.HealthComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/placeholder/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
    ],
  },
  {
    path: 'recipe/:id',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/planner-page/recipe-detail-view/recipe-detail-view.component'
      ).then((m) => m.RecipeDetailViewComponent),
  },
  {
    path: 'transform-recipe/:id',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/planner-page/transform-recipe/transform-recipe.component'
      ).then((m) => m.TransformRecipeComponent),
  },
];
