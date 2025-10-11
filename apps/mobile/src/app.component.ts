import { Component, NO_ERRORS_SCHEMA, inject } from '@angular/core';
import { PageRouterOutlet } from '@nativescript/angular';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'ns-app',
  templateUrl: './app.component.html',
  imports: [PageRouterOutlet],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppComponent {
  // Ensure ThemeService is initialized at app bootstrap
  private readonly themeService = inject(ThemeService);
}
