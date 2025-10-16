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
          import('./features/health-page/health-page.component').then(
            (m) => m.HealthPageComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile-page/profile-page.component').then(
            (m) => m.ProfilePageComponent,
          ),
      },
      {
        path: 'health-onboarding',
        loadComponent: () =>
          import(
            './features/health-page/health-onboarding/health-onboarding.component'
          ).then((m) => m.HealthOnboardingComponent),
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
  {
    path: 'health-onboarding',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/health-page/health-onboarding/health-onboarding.component'
      ).then((m) => m.HealthOnboardingComponent),
  },
  {
    path: 'settings',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import('./features/settings-page/settings-page.component').then(
        (m) => m.SettingsPageComponent,
      ),
  },
  {
    path: 'notifications-settings',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/settings-page/notifications-settings/notifications-settings.component'
      ).then((m) => m.NotificationsSettingsComponent),
  },
  {
    path: 'edit-water-reminder',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/settings-page/notifications-settings/edit-water-reminder/edit-water-reminder.component'
      ).then((m) => m.EditWaterReminderComponent),
  },
  {
    path: 'nutrition-settings',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/settings-page/nutrition-settings/nutrition-settings.component'
      ).then((m) => m.NutritionSettingsComponent),
  },
  {
    path: 'edit-number-of-people',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/settings-page/nutrition-settings/edit-number-of-people/edit-number-of-people.component'
      ).then((m) => m.EditNumberOfPeopleComponent),
  },
  {
    path: 'edit-preferred-meals',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/settings-page/nutrition-settings/edit-preferred-meals/edit-preferred-meals.component'
      ).then((m) => m.EditPreferredMealsComponent),
  },
  {
    path: 'edit-diet-wishes',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/settings-page/nutrition-settings/edit-diet-wishes/edit-diet-wishes.component'
      ).then((m) => m.EditDietWishesComponent),
  },
  {
    path: 'edit-allergies',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/settings-page/nutrition-settings/edit-allergies/edit-allergies.component'
      ).then((m) => m.EditAllergiesComponent),
  },
  {
    path: 'plan-personalization',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/settings-page/plan-personalization/plan-personalization.component'
      ).then((m) => m.PlanPersonalizationComponent),
  },
  {
    path: 'edit-favorite-ingredients',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/settings-page/plan-personalization/edit-favorite-ingredients/edit-favorite-ingredients.component'
      ).then((m) => m.EditFavoriteIngredientsComponent),
  },
  {
    path: 'edit-excluded-ingredients',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/settings-page/plan-personalization/edit-excluded-ingredients/edit-excluded-ingredients.component'
      ).then((m) => m.EditExcludedIngredientsComponent),
  },
  {
    path: 'edit-kitchen-equipment',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/settings-page/plan-personalization/edit-kitchen-equipment/edit-kitchen-equipment.component'
      ).then((m) => m.EditKitchenEquipmentComponent),
  },
  {
    path: 'track-activity',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/health-page/track-activity/track-activity.component'
      ).then((m) => m.TrackActivityComponent),
  },
  {
    path: 'edit-activity',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/health-page/activity-section/edit-activity/edit-activity.component'
      ).then((m) => m.EditActivityComponent),
  },
  {
    path: 'track-meal',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import('./features/health-page/track-meal/track-meal.component').then(
        (m) => m.TrackMealComponent,
      ),
  },
  {
    path: 'tracking-recipe/:id',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/planner-page/recipe-tracking-view/recipe-tracking-view'
      ).then((m) => m.RecipeTrackingView),
  },
  {
    path: 'food-detail/:id',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/health-page/track-meal/food-detail/food-detail.component'
      ).then((m) => m.FoodDetailComponent),
  },
  {
    path: 'manual-food-entry',
    canActivate: [mobileProtectedRouteGuard],
    loadComponent: () =>
      import(
        './features/health-page/track-meal/manual-food-entry/manual-food-entry.component'
      ).then((m) => m.ManualFoodEntryComponent),
  },
];
