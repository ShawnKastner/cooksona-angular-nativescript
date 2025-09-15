import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { BarChart2, Check, Sparkles, Target, Award, Printer, X, ListTree, Wand2 } from 'libs/constants/icons';
import { SubscriptionType, User } from '@cooksona/models/user.models';
import { ApiService } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';

type ModalView = 'selection' | 'paypal' | 'processing' | 'success';

@Component({
  selector: 'app-pro-upgrade-modal',
  standalone: true,
  imports: [CommonModule, SvgInjectDirective],
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        (click)="handleOverlayClick()"
      >
        <div
          class="relative w-full bg-white rounded-2xl shadow-2xl pointer-events-auto"
          [ngClass]="view === 'paypal' ? 'max-w-[560px]' : 'max-w-lg'"
          [style.maxHeight]="'min(90vh, 820px)'"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 md:px-8 pt-6">
            <h2 class="text-xl font-extrabold text-neutral tracking-tight">
              {{ view === 'selection' ? 'CookSona Pro freischalten' : view === 'paypal' ? 'Mit PayPal bezahlen' : view === 'success' ? 'Upgrade erfolgreich' : 'Verarbeite Zahlung' }}
            </h2>
            <button
              type="button"
              (click)="handleClose()"
              [disabled]="!canCloseNow"
              class="p-2 rounded-full text-gray-400 hover:bg-base-200 hover:text-gray-700 transition disabled:opacity-50"
              aria-label="Schließen"
            >
              <span class="w-6 h-6" [svgInject]="icons.X"></span>
            </button>
          </div>

          <!-- Scrollable content -->
          <div class="px-6 md:px-8 pb-6" [style.maxHeight]="'calc(min(90vh, 820px) - 4rem)'" style="overflow-y: auto;">
            <!-- SELECTION -->
            @if (view === 'selection') {
              <div>
                <div class="w-20 h-20 mx-auto mt-2 bg-gradient-to-br from-secondary to-amber-500 rounded-full flex items-center justify-center text-white shadow-lg mb-6">
                  <span class="w-10 h-10" [svgInject]="icons.Sparkles"></span>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-8">
                  <div class="flex flex-col items-center gap-2">
                    <span class="w-8 h-8" [svgInject]="icons.BarChart2"></span>
                    <h3 class="font-semibold text-neutral text-sm text-center">Erweiterte Statistiken</h3>
                  </div>
                  <div class="flex flex-col items-center gap-2">
                    <span class="w-8 h-8" [svgInject]="icons.Target"></span>
                    <h3 class="font-semibold text-neutral text-sm text-center">Zielgerichtete Planung</h3>
                  </div>
                  <div class="flex flex-col items-center gap-2">
                    <span class="w-8 h-8" [svgInject]="icons.Award"></span>
                    <h3 class="font-semibold text-neutral text-sm text-center">Exklusive Rezepte</h3>
                  </div>
                  <div class="flex flex-col items-center gap-2">
                    <span class="w-8 h-8" [svgInject]="icons.Printer"></span>
                    <h3 class="font-semibold text-neutral text-sm text-center">Druckbare Einkaufslisten</h3>
                  </div>
                  <div class="flex flex-col items-center gap-2">
                    <span class="w-8 h-8" [svgInject]="icons.ListTree"></span>
                    <h3 class="font-semibold text-neutral text-sm text-center">Sortierte Zutaten</h3>
                  </div>
                  <div class="flex flex-col items-center gap-2">
                    <span class="w-8 h-8" [svgInject]="icons.Wand2"></span>
                    <h3 class="font-semibold text-neutral text-sm text-center">KI-gestützte Empfehlungen</h3>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div
                    (click)="setSelectedPlan('monthly')"
                    class="p-4 rounded-xl border-2 cursor-pointer transition-all"
                    [ngClass]="selectedPlan === 'monthly' ? 'border-primary bg-primary/5' : 'border-base-200 bg-white hover:border-primary/50'"
                  >
                    <h4 class="font-bold text-lg text-neutral">Monatlich</h4>
                    <p class="text-2xl font-bold text-primary">4.99€ <span class="text-base font-normal text-gray-500">/ Monat</span></p>
                  </div>
                  <div
                    (click)="setSelectedPlan('yearly')"
                    class="relative p-4 rounded-xl border-2 cursor-pointer transition-all"
                    [ngClass]="selectedPlan === 'yearly' ? 'border-primary bg-primary/5' : 'border-base-200 bg-white hover:border-primary/50'"
                  >
                    <div class="absolute -top-3 right-3 bg-secondary text-secondary-content text-xs font-bold px-2 py-0.5 rounded-full">Beliebtester Plan</div>
                    <h4 class="font-bold text-lg text-neutral">Jährlich</h4>
                    <p class="text-2xl font-bold text-primary">49.99€ <span class="text-base font-normal text-gray-500">/ Jahr</span></p>
                    <p class="text-sm text-green-600 font-semibold">Spare über 16%!</p>
                  </div>
                </div>

                <button
                  type="button"
                  (click)="handleProceedToPayment()"
                  class="w-full flex items-center justify-center gap-3 bg-primary text-primary-content font-bold py-3.5 px-4 rounded-xl hover:bg-primary-focus focus:outline-none focus:ring-4 focus:ring-primary/40 transition-all duration-300"
                >
                  Weiter zur Bezahlung
                </button>
                <p class="text-xs text-gray-400 mt-3 text-center">Zahlungen werden sicher über PayPal abgewickelt.</p>
              </div>
            }

            <!-- PAYPAL SHEET -->
            @if (view === 'paypal') {
              <div class="mt-2">
                <div class="flex items-center justify-center mb-4">
                  <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" class="h-10 drop-shadow" />
                </div>
                <div class="w-full max-w-[520px] mx-auto rounded-xl border border-gray-100 p-3 sm:p-4 text-center">
                  <!-- Placeholder for PayPal Smart Button integration -->
                  <button type="button" (click)="handlePayPalSuccess()" class="w-full bg-[#FFC439] text-black font-semibold py-2 rounded-md hover:brightness-95 transition">
                    Mit PayPal abonnieren
                  </button>
                </div>
                @if (error) {
                  <div class="text-center text-red-600 mt-3">{{ error }}</div>
                }
                <button type="button" (click)="setView('selection')" class="mt-5 w-full text-center font-semibold text-primary hover:bg-primary/5 rounded-lg py-2 transition">
                  Zurück zur Auswahl
                </button>
                <p class="text-[11px] text-gray-400 mt-4 text-center">Hinweis: Die Zahlung wird als echtes PayPal-Abo eingerichtet und automatisch abgebucht.</p>
              </div>
            }

            <!-- PROCESSING -->
            @if (view === 'processing') {
              <div class="flex flex-col items-center justify-center text-center py-10">
                <div class="w-24 h-24 rounded-full flex items-center justify-center">
                  <div class="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h2 class="text-2xl font-serif font-bold text-neutral mt-6">Verarbeite Zahlung</h2>
                <p class="text-gray-600 mt-2">Bitte warten — wir bestätigen die Zahlung mit PayPal.</p>
              </div>
            }

            <!-- SUCCESS / FAILURE -->
            @if (view === 'success') {
              <div class="flex flex-col items-center justify-center text-center py-10">
                @if (subscriptionResult === 'success') {
                  <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                    <div class="w-20 h-20 bg-success rounded-full flex items-center justify-center">
                      <span class="w-12 h-12 text-white" [svgInject]="icons.Check"></span>
                    </div>
                  </div>
                  <h2 class="text-3xl font-serif font-bold text-neutral mt-6">Upgrade erfolgreich!</h2>
                  <p class="text-gray-600 mt-2">Willkommen bei Pro! Alle exklusiven Funktionen sind jetzt freigeschaltet.</p>
                } @else {
                  <div class="w-full max-w-md mx-auto mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-800 rounded">
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="font-semibold">Zahlungsbestätigung fehlgeschlagen</p>
                        <p class="text-sm mt-1">{{ error || 'Wir konnten die Zahlung nicht automatisch bestätigen.' }}</p>
                      </div>
                    </div>
                    <div class="mt-3 flex flex-wrap justify-center gap-3">
                      <button type="button" (click)="close.emit()" class="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition">Zurück</button>
                    </div>
                  </div>
                  <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                    <div class="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
                      <span class="w-12 h-12 text-white" [svgInject]="icons.X"></span>
                    </div>
                  </div>
                  <h2 class="text-2xl font-serif font-bold text-neutral mt-6">Bestätigung ausstehend</h2>
                  <p class="text-gray-600 mt-2">{{ error || 'Wir konnten die Zahlung nicht automatisch bestätigen.' }}</p>
                  <p class="text-sm text-gray-500 mt-2">Bitte prüfe dein PayPal-Konto oder kontaktiere den Support.</p>
                }

                @if (!error) {
                  <span class="mt-8 text-sm text-gray-500">Die Seite wird automatisch aktualisiert…</span>
                } @else {
                  <button type="button" (click)="close.emit()" class="mt-8 bg-primary text-primary-content font-bold py-2.5 px-6 rounded-xl hover:bg-primary-focus transition-colors">Zurück</button>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class ProUpgradeModalComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly icons = { BarChart2, Check, Sparkles, Target, Award, Printer, X, ListTree, Wand2 } as const;

  view: ModalView = 'selection';
  selectedPlan: SubscriptionType = 'yearly';
  isProcessing = false;
  error: string | null = null;
  subscriptionResult: 'success' | 'failure' | null = null;

  private bodyOverflowPrev: string | null = null;
  private reloadTimer: any = null;
  private polling = false;

  get canCloseNow(): boolean {
    return !this.isProcessing && this.view !== 'paypal';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        // lock body scroll
        try {
          this.bodyOverflowPrev = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
        } catch {}
        // reset view when opening
        this.view = 'selection';
        this.isProcessing = false;
        this.error = null;
        this.selectedPlan = 'yearly';
        this.subscriptionResult = null;
      } else {
        // unlock on close
        try {
          document.body.style.overflow = this.bodyOverflowPrev || '';
        } catch {}
        // small delay to reset state similar to React
        setTimeout(() => {
          this.view = 'selection';
          this.isProcessing = false;
          this.error = null;
          this.selectedPlan = 'yearly';
          this.subscriptionResult = null;
        }, 300);
      }
    }
  }

  ngOnDestroy(): void {
    try { document.body.style.overflow = this.bodyOverflowPrev || ''; } catch {}
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
  }

  handleOverlayClick(): void {
    if (this.canCloseNow) this.close.emit();
  }

  handleClose(): void {
    if (this.canCloseNow) this.close.emit();
  }

  setSelectedPlan(plan: SubscriptionType): void {
    this.selectedPlan = plan;
  }

  setView(v: ModalView): void {
    this.view = v;
  }

  handleProceedToPayment(): void {
    this.error = null;
    this.setView('paypal');
  }

  async handlePayPalSuccess(): Promise<void> {
    // Start processing UI and poll the backend for webhook confirmation
    this.error = null;
    this.isProcessing = true;
    this.setView('processing');
    this.subscriptionResult = null;

    const maxAttempts = 15; // ~30s if 2s interval (we use 2s)
    const intervalMs = 2000;
    this.polling = true;
    for (let attempt = 0; attempt < maxAttempts && this.polling; attempt++) {
      try {
        const user = await this.api.get<User>('/users/me');
        if (
          user &&
          (user.subscriptionStatus === 'active' ||
            !!(user as any).paypalSubscriptionId ||
            (user as any).subscriptionType)
        ) {
          this.subscriptionResult = 'success';
          this.isProcessing = false;
          try { await this.auth.refreshCurrentUser(); } catch {}
          this.setView('success');
          // Auto reload after 3s
          this.reloadTimer = setTimeout(() => {
            try { window.location.reload(); } catch {}
          }, 3000);
          return;
        }
      } catch (err) {
        // ignore transient errors
        console.warn('Fehler beim Abfragen des Benutzerstatus', err);
      }
      await new Promise((res) => setTimeout(res, intervalMs));
    }

    // timed out
    this.subscriptionResult = 'failure';
    this.isProcessing = false;
    this.setView('success');
    this.error = 'Die Zahlung konnte nicht bestätigt werden. Bitte prüfe dein PayPal-Konto oder versuche es später erneut.';
  }
}
