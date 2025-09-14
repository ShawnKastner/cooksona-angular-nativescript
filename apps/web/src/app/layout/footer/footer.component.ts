import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CookieBannerComponent } from './cookie-banner.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, CookieBannerComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
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
