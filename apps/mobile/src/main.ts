import {
  bootstrapApplication,
  provideNativeScriptHttpClient,
  provideNativeScriptRouter,
  registerElement,
  runNativeScriptAngularApp,
} from '@nativescript/angular';
import {
  APP_INITIALIZER,
  importProvidersFrom,
  provideZonelessChangeDetection,
} from '@angular/core';
import { withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';
import { AppComponent } from './app.component';
import { provideApiBaseUrl } from '@cooksona/api';
import { environment } from './environments/environment';
import { HealthModule } from './healthkit/health.module';
import { AuthService } from '@cooksona/auth';
import { MobileTokenService } from './core/mobile-token.service';

registerElement(
  'SVGImage',
  () => require('@sergeymell/nativescript-svg').SVGImage,
);
registerElement(
  'GoogleSignInButton',
  () => require('@nativescript/google-signin').GoogleSignInButton,
);

runNativeScriptAngularApp({
  appModuleBootstrap: () =>
    bootstrapApplication(AppComponent, {
      providers: [
        provideNativeScriptHttpClient(withInterceptorsFromDi()),
        provideNativeScriptRouter(routes),
        provideZonelessChangeDetection(),
        importProvidersFrom(HealthModule),
        // Provide the API base URL for shared ApiService
        provideApiBaseUrl(environment.apiBaseUrl),
        // Refresh current user before routes/guards run
        {
          provide: APP_INITIALIZER,
          multi: true,
          deps: [AuthService, MobileTokenService],
          useFactory: (auth: AuthService, tokens: MobileTokenService) => () => {
            // Bridge: allow AuthService.logout() to clear mobile tokens without direct import
            AuthService.registerMobileTokenClear(() => tokens.clear());
            // 1) hydrate tokens from device storage
            tokens.hydrate();
            // 2) try to refresh user silently; on hard failure, clear tokens once
            return auth.refreshCurrentUser().catch((e) => {
              console.warn('Auth init refresh failed', e);
              tokens.clear();
            });
          },
        },
      ],
    }),
});
