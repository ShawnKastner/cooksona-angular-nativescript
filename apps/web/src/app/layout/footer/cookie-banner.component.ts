import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
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
  template: `
    @if(showBanner) {
    <div class="fixed bottom-0 left-0 right-0 bg-base-200 p-4 shadow-lg z-50">
      <div class="container mx-auto max-w-4xl">
        <div class="flex flex-col gap-4">
          <div class="prose text-center mx-auto">
            <h3 class="text-lg font-semibold mb-2">Datenschutzeinstellungen</h3>
            <p class="text-sm">
              Wir verwenden Cookies und ähnliche Technologien, um Ihnen die
              bestmögliche Erfahrung auf unserer Website zu bieten. Weitere
              Informationen finden Sie in unserer
              <a routerLink="/datenschutz" class="link link-primary"
                >Datenschutzerklärung</a
              >.
            </p>
          </div>
          <div class="flex justify-center gap-3 mt-2">
            <button
              class="btn btn-sm btn-outline hover:bg-base-200"
              (click)="toggleDetails()"
            >
              {{ showDetails ? 'Schließen' : 'Einstellungen' }}
            </button>
            <button
              class="btn btn-sm btn-primary hover:btn-primary-focus"
              (click)="handleAccept(true)"
            >
              Alle akzeptieren
            </button>
            <button
              class="btn btn-sm btn-ghost hover:bg-base-200"
              (click)="handleDecline()"
            >
              Nur notwendige
            </button>
          </div>

          @if(showDetails) {
          <div class="bg-base-100 p-4 rounded-lg">
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-semibold">Notwendige Cookies</h4>
                  <p class="text-sm">
                    Diese Cookies sind für die Grundfunktionen der Website
                    erforderlich und können nicht deaktiviert werden.
                  </p>
                </div>
                <input
                  type="checkbox"
                  [checked]="preferences.necessary"
                  disabled
                  class="toggle toggle-primary"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-semibold">Funktionale Cookies</h4>
                  <p class="text-sm">
                    Ermöglichen erweiterte Funktionen und Personalisierung, wie
                    z.B. Ihre Einstellungen zu speichern.
                  </p>
                </div>
                <input
                  type="checkbox"
                  [checked]="preferences.functional"
                  (change)="handlePreferenceChange('functional')"
                  class="toggle toggle-primary"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-semibold">Analyse Cookies</h4>
                  <p class="text-sm">
                    Helfen uns zu verstehen, wie Besucher mit der Website
                    interagieren, um unsere Dienste zu verbessern.
                  </p>
                </div>
                <input
                  type="checkbox"
                  [checked]="preferences.analytics"
                  (change)="handlePreferenceChange('analytics')"
                  class="toggle toggle-primary"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-semibold">Marketing Cookies</h4>
                  <p class="text-sm">
                    Werden verwendet, um Werbung besser auf Ihre Interessen
                    abzustimmen.
                  </p>
                </div>
                <input
                  type="checkbox"
                  [checked]="preferences.marketing"
                  (change)="handlePreferenceChange('marketing')"
                  class="toggle toggle-primary"
                />
              </div>

              <div class="mt-4 p-4 bg-base-200 rounded-lg text-sm">
                <p>
                  Ihre Einwilligung können Sie jederzeit in den Einstellungen
                  widerrufen oder ändern. Die Cookie-Einstellungen bleiben für 6
                  Monate gültig und müssen danach erneuert werden.
                </p>
              </div>

              <div class="flex justify-end gap-3 mt-6">
                @if(forceShow) {
                <button
                  class="btn btn-outline hover:bg-base-200"
                  (click)="handleClose()"
                >
                  Schließen
                </button>
                <button
                  class="btn btn-primary hover:btn-primary-focus"
                  (click)="handleAccept(false)"
                >
                  Auswahl speichern
                </button>
                } @else {
                <button
                  class="btn btn-outline hover:bg-base-200"
                  (click)="showDetails = false"
                >
                  Abbrechen
                </button>
                }
              </div>
            </div>
          </div>
          }
        </div>
      </div>
    </div>
    }
  `,
})
export class CookieBannerComponent implements OnInit, OnChanges {
  @Input() forceShow = false;
  @Output() closed = new EventEmitter<void>();

  showBanner = false;
  showDetails = false;
  preferences: CookiePreferences = {
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  };

  ngOnInit(): void {
    this.evaluateVisibilityAndLoad();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['forceShow']) {
      this.evaluateVisibilityAndLoad();
    }
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  handleAccept(all: boolean): void {
    const newPreferences: CookiePreferences = all
      ? { necessary: true, functional: true, analytics: true, marketing: true }
      : this.preferences;
    this.saveConsent(newPreferences);
    this.preferences = newPreferences;
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
    this.preferences = minimal;
    this.handleClose();
  }

  handlePreferenceChange(key: keyof CookiePreferences): void {
    if (key === 'necessary') return;
    this.preferences = { ...this.preferences, [key]: !this.preferences[key] };
  }

  handleClose(): void {
    this.showBanner = false;
    this.closed.emit();
  }

  private evaluateVisibilityAndLoad(): void {
    if (this.forceShow) {
      this.showBanner = true;
      const saved = this.getConsent();
      if (saved) this.preferences = saved;
      return;
    }
    const saved = this.getConsent();
    if (!saved) {
      this.showBanner = true;
    } else {
      this.preferences = saved;
      this.showBanner = false;
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
    const match = document.cookie.match(
      new RegExp(
        '(?:^|; )' +
          name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') +
          '=([^;]*)'
      )
    );
    return match ? decodeURIComponent(match[1]) : null;
  }
}
