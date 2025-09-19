import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
  ChangeDetectionStrategy,
  HostListener,
  signal,
} from '@angular/core';
import { SvgInjectDirective } from '../../../directives/svg-inject.directive';
import {
  BarChart2,
  Check,
  Sparkles,
  Target,
  Award,
  Printer,
  X,
  ListTree,
  Wand2,
} from '@cooksona/constants/icons';
import { SubscriptionType, User } from '@cooksona/models/user.models';
import { FocusTrapDirective } from '../../focus-trap.directive';
import { ApiService } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';
import { toErrorMessage } from '../../../utils/error.utils';

type ModalView = 'selection' | 'paypal' | 'processing' | 'success';

@Component({
  selector: 'app-pro-upgrade-modal',
  standalone: true,
  imports: [CommonModule, SvgInjectDirective, FocusTrapDirective],
  templateUrl: './pro-upgrade-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProUpgradeModalComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly icons = {
    BarChart2,
    Check,
    Sparkles,
    Target,
    Award,
    Printer,
    X,
    ListTree,
    Wand2,
  } as const;

  view = signal<ModalView>('selection');
  selectedPlan = signal<SubscriptionType>('yearly');
  isProcessing = signal(false);
  error = signal<string | null>(null);
  subscriptionResult = signal<'success' | 'failure' | null>(null);

  private bodyOverflowPrev: string | null = null;
  private reloadTimer: ReturnType<typeof setTimeout> | null = null;
  private polling = signal(false);
  private lastPollingError = signal<string | null>(null);

  get canCloseNow(): boolean {
    return !this.isProcessing && this.view() !== 'paypal';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        // lock body scroll
        if (typeof document !== 'undefined') {
          this.bodyOverflowPrev = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
        }
        // reset view when opening
        this.view.set('selection');
        this.isProcessing.set(false);
        this.error.set(null);
        this.selectedPlan.set('yearly');
        this.subscriptionResult.set(null);
      } else {
        // unlock on close
        if (typeof document !== 'undefined') {
          document.body.style.overflow = this.bodyOverflowPrev ?? '';
        }
        // small delay to reset state similar to React
        setTimeout(() => {
          this.view.set('selection');
          this.isProcessing.set(false);
          this.error.set(null);
          this.selectedPlan.set('yearly');
          this.subscriptionResult.set(null);
        }, 300);
      }
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.bodyOverflowPrev ?? '';
    }
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
  }

  handleOverlayClick(): void {
    if (this.canCloseNow) this.close.emit();
  }

  handleClose(): void {
    if (this.canCloseNow) this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.canCloseNow) this.close.emit();
  }

  setSelectedPlan(plan: SubscriptionType): void {
    this.selectedPlan.set(plan);
  }

  setView(v: ModalView): void {
    this.view.set(v);
  }

  handleProceedToPayment(): void {
    this.error.set(null);
    this.setView('paypal');
  }

  async handlePayPalSuccess(): Promise<void> {
    // Start processing UI and poll the backend for webhook confirmation
    this.error.set(null);
    this.isProcessing.set(true);
    this.setView('processing');
    this.subscriptionResult.set(null);
    this.lastPollingError.set(null);

    const maxAttempts = 15; // ~30s if 2s interval (we use 2s)
    const intervalMs = 2000;
    this.polling.set(true);
    for (let attempt = 0; attempt < maxAttempts && this.polling; attempt++) {
      try {
        const user = await this.api.get<User>('/users/me');
        if (
          user &&
          (user.subscriptionStatus === 'active' ||
            !!user.paypalSubscriptionId ||
            !!user.subscriptionType)
        ) {
          this.subscriptionResult.set('success');
          this.isProcessing.set(false);
          try {
            await this.auth.refreshCurrentUser();
          } catch (refreshError) {
            console.warn(
              'Failed to refresh current user after PayPal confirmation',
              refreshError
            );
          }
          this.setView('success');
          // Auto reload after 3s
          this.reloadTimer = setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }, 3000);
          return;
        }
      } catch (error) {
        this.lastPollingError.set(toErrorMessage(error, ''));
      }
      await new Promise((res) => setTimeout(res, intervalMs));
    }

    // timed out
    this.subscriptionResult.set('failure');
    this.isProcessing.set(false);
    this.setView('success');
    const lastErr = this.lastPollingError();
    this.error.set(
      lastErr && lastErr.trim().length > 0
        ? lastErr
        : 'Die Zahlung konnte nicht bestätigt werden. Bitte prüfe dein PayPal-Konto oder versuche es später erneut.'
    );
  }
}
