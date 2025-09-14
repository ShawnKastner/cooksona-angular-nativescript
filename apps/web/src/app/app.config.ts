import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideApiBaseUrl } from '@cooksona/api';
import { environment } from '../environments/environment';
import { AuthService } from '@cooksona/auth';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideApiBaseUrl(environment.apiBaseUrl),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (auth: AuthService) => () => auth.refreshCurrentUser().catch(() => {}),
      deps: [AuthService],
    },
  ],
};
