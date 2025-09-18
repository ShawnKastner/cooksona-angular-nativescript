import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy,
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
              class="px-3 py-1.5 text-sm font-semibold rounded-lg border border-base-300 text-neutral hover:bg-base-200 transition-colors"
              (click)="toggleDetails()"
            >
              {{ showDetails ? 'Schließen' : 'Einstellungen' }}
            </button>
            <button
              class="px-3 py-1.5 text-sm font-semibold rounded-lg bg-primary text-primary-content hover:bg-primary-focus transition-colors"
              (click)="handleAccept(true)"
            >
              Alle akzeptieren
            </button>
            <button
              class="px-3 py-1.5 text-sm font-semibold rounded-lg text-neutral hover:bg-base-200 transition-colors"
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
                <label
                  class="relative inline-flex items-center cursor-not-allowed opacity-70"
                >
                  <input
                    type="checkbox"
                    class="sr-only"
                    [checked]="preferences.necessary"
                    disabled
                  />
                  <div class="h-5 w-10 rounded-full bg-base-300"></div>
                  <div
                    class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow"
                  ></div>
                </label>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-semibold">Funktionale Cookies</h4>
                  <p class="text-sm">
                    Ermöglichen erweiterte Funktionen und Personalisierung, wie
                    z.B. Ihre Einstellungen zu speichern.
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    class="sr-only peer"
                    [checked]="preferences.functional"
                    (change)="handlePreferenceChange('functional')"
                  />
                  <div
                    class="h-5 w-10 rounded-full bg-base-300 peer-checked:bg-primary transition-colors"
                  ></div>
                  <div
                    class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
                  ></div>
                </label>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-semibold">Analyse Cookies</h4>
                  <p class="text-sm">
                    Helfen uns zu verstehen, wie Besucher mit der Website
                    interagieren, um unsere Dienste zu verbessern.
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    class="sr-only peer"
                    [checked]="preferences.analytics"
                    (change)="handlePreferenceChange('analytics')"
                  />
                  <div
                    class="h-5 w-10 rounded-full bg-base-300 peer-checked:bg-primary transition-colors"
                  ></div>
                  <div
                    class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
                  ></div>
                </label>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-semibold">Marketing Cookies</h4>
                  <p class="text-sm">
                    Werden verwendet, um Werbung besser auf Ihre Interessen
                    abzustimmen.
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    class="sr-only peer"
                    [checked]="preferences.marketing"
                    (change)="handlePreferenceChange('marketing')"
                  />
                  <div
                    class="h-5 w-10 rounded-full bg-base-300 peer-checked:bg-primary transition-colors"
                  ></div>
                  <div
                    class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
                  ></div>
                </label>
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
                  class="px-4 py-2 font-bold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  (click)="handleClose()"
                >
                  Schließen
                </button>
                <button
                  class="px-4 py-2 font-bold rounded-xl bg-primary text-primary-content hover:bg-primary-focus transition-colors"
                  (click)="handleAccept(false)"
                >
                  Auswahl speichern
                </button>
                } @else {
                <button
                  class="px-4 py-2 font-bold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${escapedName}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : null;
  }
}
