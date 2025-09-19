import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { AuthService } from '@cooksona/auth';

declare global {
  interface Window {
    paypal?: any;
  }
}

let paypalScriptPromise: Promise<void> | null = null;
let paypalClientIdInUse: string | null = null;

function ensurePayPalSdk(clientId: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(
      new Error('PayPal ist im aktuellen Kontext nicht verfügbar.')
    );
  }

  if (!clientId || clientId.trim().length === 0) {
    return Promise.reject(
      new Error('PayPal-Konfiguration fehlt. Bitte kontaktiere den Support.')
    );
  }

  if (window.paypal) {
    return Promise.resolve();
  }

  if (paypalScriptPromise) {
    // If the client id changed, we need to reload the SDK
    if (paypalClientIdInUse && paypalClientIdInUse !== clientId) {
      // Remove any previous script tag and reset so we can load with the new client id
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-paypal-sdk]'
      );
      if (existing?.parentElement) existing.parentElement.removeChild(existing);
      window.paypal = undefined;
      paypalScriptPromise = null;
    } else {
      return paypalScriptPromise;
    }
  }

  paypalClientIdInUse = clientId;
  paypalScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src =
      'https://www.paypal.com/sdk/js?client-id=' +
      encodeURIComponent(clientId) +
      '&vault=true&intent=subscription';
    script.async = true;
    script.dataset['paypalSdk'] = 'true';
    script.onload = () => resolve();
    script.onerror = () => {
      paypalScriptPromise = null;
      reject(new Error('PayPal SDK konnte nicht geladen werden.'));
    };
    document.body.appendChild(script);
  });

  return paypalScriptPromise;
}

@Component({
  selector: 'app-paypal-subscription-smart-button',
  standalone: true,
  imports: [CommonModule],
  template:
    '<div #paypalButtonContainer class="paypal-button-container"></div>',
  styles: [
    `
      :host {
        display: block;
      }
      .paypal-button-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayPalSubscriptionSmartButtonComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() planId = '';
  @Input() clientId = '';
  @Output() success = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();

  @ViewChild('paypalButtonContainer', { static: true })
  private readonly buttonContainer!: ElementRef<HTMLElement>;

  private readonly auth = inject(AuthService);
  private paypalButtonsInstance: any | null = null;
  private hasView = false;

  ngAfterViewInit(): void {
    this.hasView = true;
    void this.renderButtons();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.hasView) return;
    if (changes['planId'] && !changes['planId'].firstChange) {
      void this.renderButtons();
      return;
    }
    if (changes['clientId'] && !changes['clientId'].firstChange) {
      void this.renderButtons();
    }
  }

  ngOnDestroy(): void {
    this.destroyButtons();
  }

  private async renderButtons(): Promise<void> {
    this.destroyButtons();

    const planId = this.planId.trim();
    const clientId = this.clientId.trim();

    if (!planId) {
      this.error.emit(
        new Error(
          'Es wurde kein gültiger PayPal-Plan angegeben. Bitte später erneut versuchen.'
        )
      );
      return;
    }

    try {
      await ensurePayPalSdk(clientId);
    } catch (err) {
      this.error.emit(err);
      return;
    }

    if (!window.paypal || !this.buttonContainer?.nativeElement) {
      this.error.emit(
        new Error(
          'PayPal konnte nicht initialisiert werden. Bitte später erneut versuchen.'
        )
      );
      return;
    }

    const container = this.buttonContainer.nativeElement;
    container.innerHTML = '';

    try {
      const buttons = window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'subscribe',
        },
        createSubscription: (_data: any, actions: any) => {
          const payload: Record<string, unknown> = {
            plan_id: planId,
          };
          const currentUser = this.auth.currentUser;
          if (currentUser?.id) {
            payload['custom_id'] = currentUser.id;
          }
          return actions.subscription.create(payload);
        },
        onApprove: (data: any) => {
          this.success.emit(data);
        },
        onError: (err: any) => {
          this.error.emit(err);
        },
      });

      this.paypalButtonsInstance = buttons;
      await buttons.render(container);
    } catch (err) {
      this.error.emit(err);
    }
  }

  private destroyButtons(): void {
    if (this.paypalButtonsInstance?.close) {
      try {
        void this.paypalButtonsInstance.close();
      } catch {
        // ignore cleanup errors
      }
    }
    this.paypalButtonsInstance = null;

    if (this.buttonContainer?.nativeElement) {
      this.buttonContainer.nativeElement.innerHTML = '';
    }
  }
}
