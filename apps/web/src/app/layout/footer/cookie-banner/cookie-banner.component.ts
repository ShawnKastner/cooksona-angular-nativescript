import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cookie-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieBannerComponent implements OnInit, OnChanges {
  @Input() forceShow = false;
  @Output() closed = new EventEmitter<void>();

  showBanner = signal(false);
  showDetails = signal(false);
  preferences = signal<CookiePreferences>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  ngOnInit(): void {
    this.evaluateVisibilityAndLoad();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['forceShow']) {
      this.evaluateVisibilityAndLoad();
    }
  }

  toggleDetails(): void {
    this.showDetails.set(!this.showDetails());
  }

  handleAccept(all: boolean): void {
    const newPreferences: CookiePreferences = all
      ? { necessary: true, functional: true, analytics: true, marketing: true }
      : this.preferences();
    this.saveConsent(newPreferences);
    this.preferences.set(newPreferences);
    this.handleClose();
  }

  handleDecline(): void {
    const minimal: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    this.saveConsent(minimal);
    this.preferences.set(minimal);
    this.handleClose();
  }

  handlePreferenceChange(key: keyof CookiePreferences): void {
    if (key === 'necessary') return;
    this.preferences.set({
      ...this.preferences(),
      [key]: !this.preferences()[key],
    });
  }

  handleClose(): void {
    this.showBanner.set(false);
    this.closed.emit();
  }

  private evaluateVisibilityAndLoad(): void {
    if (this.forceShow) {
      this.showBanner.set(true);
      const saved = this.getConsent();
      if (saved) this.preferences.set(saved);
      return;
    }
    const saved = this.getConsent();
    if (!saved) {
      this.showBanner.set(true);
    } else {
      this.preferences.set(saved);
      this.showBanner.set(false);
    }
  }

  private getConsent(): CookiePreferences | null {
    const raw = this.getCookie('cookieConsent');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CookiePreferences;
    } catch {
      return null;
    }
  }

  private saveConsent(prefs: CookiePreferences): void {
    const expires = new Date();
    expires.setDate(expires.getDate() + 180); // 6 Monate
    const isHttps =
      typeof window !== 'undefined' && window.location?.protocol === 'https:';
    const cookie = [
      `cookieConsent=${encodeURIComponent(JSON.stringify(prefs))}`,
      `Expires=${expires.toUTCString()}`,
      'Path=/',
      'SameSite=Strict',
      isHttps ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ');
    document.cookie = cookie;
  }

  private getCookie(name: string): string | null {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${escapedName}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : null;
  }
}
