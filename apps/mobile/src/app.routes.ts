import { Routes } from '@angular/router';
import { authRedirectGuard, protectedRouteGuard } from '@cooksona/auth';
import { HomeComponent } from './features/home/home.component';
import { DetailComponent } from './features/detail/detail.component';

export const routes: Routes = [
  // Public landing route (placeholder uses HomeComponent for now)
  { path: 'landing', component: HomeComponent },

  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    canActivate: [protectedRouteGuard],
    component: HomeComponent,
  },
  {
    path: 'item/:id',
    canActivate: [protectedRouteGuard],
    component: DetailComponent,
  },
];
