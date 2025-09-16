import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CookieBannerComponent } from './cookie-banner.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, CookieBannerComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  showCookieSettings = false;

  openCookieSettings(): void {
    this.showCookieSettings = true;
  }

  closeCookieSettings(): void {
    this.showCookieSettings = false;
  }
}
