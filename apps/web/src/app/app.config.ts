import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import {
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withViewTransitions,
  withInMemoryScrolling,
} from '@angular/router';
import { provideApiBaseUrl } from '@cooksona/api';
import { environment } from '../environments/environment';
import { AuthService } from '@cooksona/auth';

import { routes } from './app.routes';
import { TitleStrategy } from '@angular/router';
import { SeoTitleStrategy } from './shared/seo/seo-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withViewTransitions(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      })
    ),
    provideApiBaseUrl(environment.apiBaseUrl),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (auth: AuthService) => () =>
        auth.refreshCurrentUser().catch(() => {}),
      deps: [AuthService],
    },
  ],
};
