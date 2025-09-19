import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CookieBannerComponent } from './cookie-banner/cookie-banner.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, CookieBannerComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  showCookieSettings = signal(false);

  openCookieSettings(): void {
    this.showCookieSettings.set(true);
  }

  closeCookieSettings(): void {
    this.showCookieSettings.set(false);
  }
}
