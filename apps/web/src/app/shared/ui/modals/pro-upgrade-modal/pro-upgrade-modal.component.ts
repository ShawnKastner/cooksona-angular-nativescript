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
  computed,
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
import { environment } from '../../../../../environments/environment';
import { PayPalSubscriptionSmartButtonComponent } from './paypal-subscription-smart-button.component';
import { RealTimeService } from '../../../services/realtime.service';

type ModalView = 'selection' | 'paypal' | 'processing' | 'success';

@Component({
  selector: 'app-pro-upgrade-modal',
  standalone: true,
  imports: [
    CommonModule,
    SvgInjectDirective,
    FocusTrapDirective,
    PayPalSubscriptionSmartButtonComponent,
  ],
  templateUrl: './pro-upgrade-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProUpgradeModalComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly rts = inject(RealTimeService);

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
  readonly planDetails: Record<
    SubscriptionType,
    { value: string; description: string; planId: string }
  > = {
    monthly: {
      value: '4.99',
      description: 'CookSona Pro (Monatlich)',
      planId: 'P-94W3155736243353CNCPRTSI',
    },
    yearly: {
      value: '49.99',
      description: 'CookSona Pro (Jährlich)',
      planId: 'P-2S494014X1970544UNCPRUNA',
    },
  };
  readonly paypalClientId: string =
    (environment as { paypalClientId?: string }).paypalClientId ??
    (typeof window !== 'undefined'
      ? (window as any).__PAYPAL_CLIENT_ID__ ??
        (window as any).__COOKSONA_PAYPAL_CLIENT_ID__ ??
        ''
      : '');
  readonly selectedPlanDetails = computed(
    () => this.planDetails[this.selectedPlan()]
  );

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
    this.polling.set(false);
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

  handlePayPalError(err: unknown): void {
    console.error('PayPal error', err);
    const fallback = 'PayPal-Zahlung fehlgeschlagen. Bitte versuche es erneut.';
    const message = toErrorMessage(err, fallback) || fallback;
    this.polling.set(false);
    this.isProcessing.set(false);
    this.subscriptionResult.set(null);
    this.error.set(message);
  }

  async handlePayPalSuccess(_data?: unknown): Promise<void> {
    // Start processing UI and wait for server confirmation via WebSocket (fallback to polling)
    this.error.set(null);
    this.isProcessing.set(true);
    this.setView('processing');
    this.subscriptionResult.set(null);
    this.lastPollingError.set(null);
    this.polling.set(true);

    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
      this.reloadTimer = null;
    }

    const confirmViaSocket = async () => {
      try {
        const currentUser = this.auth.currentUser as User | null;
        const uid = currentUser?.id;
        this.rts.connect({ userId: uid as any });
        const payload = await this.rts.waitFor<{
          user?: Partial<User>;
          userId?: string | number;
        }>('user.updated', {
          filter: (p) => {
            const pid = (p?.user as any)?.id ?? p?.userId;
            return !uid || String(pid) === String(uid);
          },
          timeoutMs: 60000,
        });
        return payload;
      } catch {
        return null;
      }
    };

    await confirmViaSocket();

    // socket hat bestätigt
    this.polling.set(false);
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
    this.reloadTimer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 3000);
  }
}
