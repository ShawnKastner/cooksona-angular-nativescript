import {
  bootstrapApplication,
  provideNativeScriptHttpClient,
  provideNativeScriptRouter,
  registerElement,
  runNativeScriptAngularApp,
} from '@nativescript/angular';
import { APP_INITIALIZER, provideZonelessChangeDetection } from '@angular/core';
import { withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';
import { AppComponent } from './app.component';
import { provideApiBaseUrl } from '@cooksona/api';
import { environment } from './environments/environment';
import { AuthService } from '@cooksona/auth';

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
        // Provide the API base URL for shared ApiService
        provideApiBaseUrl(environment.apiBaseUrl),
        // Refresh current user before routes/guards run
        {
          provide: APP_INITIALIZER,
          multi: true,
          deps: [AuthService],
          useFactory: (auth: AuthService) => () =>
            auth
              .refreshCurrentUser()
              .catch((e) => console.warn('Auth init refresh failed', e)),
        },
      ],
    }),
});
