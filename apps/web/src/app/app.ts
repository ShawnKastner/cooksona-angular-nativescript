import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { CookieBannerComponent } from './layout/footer/cookie-banner/cookie-banner.component';
import { SnackbarComponent } from './shared/ui/snackbar/snackbar.component';
import { LiveAnnouncerComponent } from './shared/ui/live-announcer/live-announcer.component';
import { SkipLinkDirective } from './shared/directives/skip-link.directive';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    CookieBannerComponent,
    SnackbarComponent,
    LiveAnnouncerComponent,
    SkipLinkDirective,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('cooksona-angular');
}
