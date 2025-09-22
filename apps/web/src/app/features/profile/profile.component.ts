import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  DestroyRef,
  NgZone,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { ProUpgradeModalComponent } from '../../shared/ui/modals/pro-upgrade-modal/pro-upgrade-modal.component';
import {
  User as UserIcon,
  Mail,
  Star,
  Inbox,
  ChevronDown,
} from '@cooksona/constants/icons';
import { AuthService } from '@cooksona/auth';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ContactApiService } from '@cooksona/api';
import { ApiService } from '@cooksona/api';
import { Message } from '@cooksona/models/contact.models';
import { User } from '@cooksona/models/user.models';
import { toErrorMessage } from '../../shared/utils/error.utils';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import { RealTimeService } from '../../shared/services/realtime.service';

type ProfileFormModel = {
  name: FormControl<string>;
  email: FormControl<string>;
};

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SvgInjectDirective,
    ProUpgradeModalComponent,
    FormatDatePipe,
  ],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly auth = inject(AuthService);
  private readonly contactApi = inject(ContactApiService);
  private readonly api = inject(ApiService);
  private readonly snackbar = inject(SnackbarService);
  private readonly rts = inject(RealTimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  // Icons
  readonly icons = { UserIcon, Mail, Star, Inbox, ChevronDown } as const;

  // Tabs
  activeTab = signal<'profile' | 'requests'>('profile');

  // Modals & state
  isUpgradeModalOpen = signal(false);
  showCancelModal = signal(false);
  cancelLoading = signal(false);
  cancelSuccess = signal(false);
  showReactivateModal = signal(false);
  showDeleteModal = signal(false);
  reactivateLoading = signal(false);
  cancelError = signal<string | null>(null);
  reactivateError = signal<string | null>(null);
  deleteError = signal<string>('');

  // Form
  form!: FormGroup<ProfileFormModel>;
  saveError = signal<string | null>(null);
  saveSuccess = signal<string | null>(null);
  isEditing = signal(false);
  isSaving = signal(false);

  // Requests
  contactRequests = signal<Message[]>([]);
  loadingRequests = signal(false);
  requestsError = signal<string | null>(null);
  expandedMessageId = signal<string | null>(null);
  currentPage = 1;
  PAGE_SIZE = signal(5);

  ngOnInit(): void {
    const user = this.auth.currentUser as User | null;
    this.form = this.fb.group<ProfileFormModel>({
      name: this.fb.control<string>(user?.name ?? '', {
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZäöüÄÖÜß\s-]+$/),
        ],
      }),
      email: this.fb.control<string>(user?.email ?? '', {
        validators: [
          Validators.required,
          Validators.email,
          Validators.maxLength(100),
        ],
      }),
    });

    // Load contact requests
    if (user?.id) void this.loadRequests(user.id);

    // If user later updates (rare), reflect in form
    this.auth.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (!user) return;
        this.form.patchValue(
          { name: user.name ?? '', email: user.email ?? '' },
          { emitEvent: false },
        );
      });

    if (user?.id) {
      this.rts.connect({ userId: user.id });
      const off = this.rts.on<any>('user.updated', async (p) => {
        const pid = (p?.user as any)?.id ?? p?.userId;
        if (String(pid) !== String(user.id)) return;
        try {
          await this.auth.refreshCurrentUser();
          this.zone.run(() => this.cdr.markForCheck());
        } catch (e) {
          console.warn('Failed to refresh after user.updated', e);
        }
      });
      this.destroyRef.onDestroy(off);
    }
  }

  // Helpers
  formatDate(iso: string | null | undefined): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('de-DE');
    } catch {
      return String(iso);
    }
  }

  // Subscription derived flags for the template (avoid complex expr in HTML)
  private get currentUserSnapshot(): User | null {
    return this.auth.currentUser as User | null;
  }
  private get endsAt(): Date | null {
    const iso = this.currentUserSnapshot?.subscriptionEndsAt ?? null;
    if (!iso) return null;
    try {
      return new Date(iso);
    } catch {
      return null;
    }
  }
  private get now(): Date {
    return new Date();
  }

  get isLifetime(): boolean {
    return !!this.currentUserSnapshot?.lifetimeSubscription;
  }

  get hasPaypalId(): boolean {
    return !!this.currentUserSnapshot?.paypalSubscriptionId;
  }

  get subStatus(): string | null {
    return this.currentUserSnapshot?.subscriptionStatus ?? null;
  }

  get isInviteActiveNoPaypal(): boolean {
    return (
      !!this.endsAt &&
      this.endsAt > this.now &&
      !this.hasPaypalId &&
      !this.isLifetime
    );
  }

  get isActiveRecurring(): boolean {
    return (
      this.subStatus === 'active' && !!this.endsAt && this.endsAt > this.now
    );
  }

  get isCanceledStillActive(): boolean {
    return (
      this.subStatus === 'canceled' && !!this.endsAt && this.endsAt > this.now
    );
  }

  get showCancelAction(): boolean {
    return this.subStatus === 'active' && this.hasPaypalId;
  }

  get showReactivateAction(): boolean {
    return this.subStatus === 'suspended';
  }

  get showUpgradeCta(): boolean {
    const ended = !!this.endsAt && this.endsAt < this.now;
    const neverPro =
      !this.currentUserSnapshot?.subscriptionEndsAt &&
      this.subStatus !== 'active' &&
      !this.isLifetime;
    return (
      (this.subStatus === 'canceled' && ended) ||
      (ended && !this.isLifetime) ||
      neverPro
    );
  }

  async loadRequests(userId: string): Promise<void> {
    this.loadingRequests.set(true);
    this.requestsError.set(null);
    try {
      const data = await this.contactApi.fetchUserContactRequests(userId);
      this.contactRequests.set(data ?? []);
    } catch (error) {
      this.contactRequests.set([]);
      this.requestsError.set(
        toErrorMessage(
          error,
          'Die Nachrichten konnten nicht geladen werden. Bitte versuche es später erneut.',
        ),
      );
    } finally {
      this.loadingRequests.set(false);
    }
  }

  setActiveTab(tab: 'profile' | 'requests'): void {
    this.activeTab.set(tab);
  }

  // Form submit
  async handleSubmit(): Promise<void> {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saveError.set(null);
    this.saveSuccess.set(null);
    this.isSaving.set(true);
    try {
      const value = this.form.getRawValue();
      await this.auth.updateProfile(value);
      this.zone.run(() => {
        this.snackbar.success('Profil aktualisiert.');
        this.saveSuccess.set(null);
        this.isEditing.set(false);
      });
    } catch (error) {
      this.zone.run(() => {
        const msg = toErrorMessage(
          error,
          'Aktualisierung fehlgeschlagen. Bitte versuche es später erneut.',
        );
        this.saveError.set(msg);
        this.snackbar.error(msg);
      });
    } finally {
      this.zone.run(() => {
        this.isSaving.set(false);
        this.cdr.markForCheck();
      });
    }
  }

  // Subscription actions
  openCancelModal(): void {
    this.showCancelModal.set(true);
    this.cancelLoading.set(false);
    this.cancelError.set(null);
    this.cancelSuccess.set(false);
  }

  openReactivateModal(): void {
    this.showReactivateModal.set(true);
    this.reactivateError.set(null);
    this.reactivateLoading.set(false);
  }

  openDeleteModal(): void {
    this.deleteError.set('');
    this.showDeleteModal.set(true);
  }

  async performCancelFlow(): Promise<void> {
    this.cancelError.set(null);
    this.cancelSuccess.set(false);
    this.cancelLoading.set(true);
    try {
      await this.auth.cancelSubscription();
    } catch (error) {
      this.cancelError.set(
        toErrorMessage(
          error,
          'Kündigung fehlgeschlagen. Bitte versuche es später erneut.',
        ),
      );
      this.cancelLoading.set(false);
      return;
    }

    // WebSocket-Confirm abwarten
    const uid = (this.auth.currentUser as User | null)?.id;
    try {
      this.rts.connect({ userId: uid as any });
      await this.rts.waitFor<any>('user.updated', {
        filter: (p) => {
          const pid = (p?.user as any)?.id ?? p?.userId;
          return !uid || String(pid) === String(uid);
        },
        timeoutMs: 60000,
      });
      await this.auth.refreshCurrentUser();
      this.cancelSuccess.set(true);
      this.cancelLoading.set(false);
      setTimeout(() => this.showCancelModal.set(false), 3000);
    } catch (e) {
      this.cancelError.set(
        'Die Kündigung wurde angefragt, die Bestätigung steht noch aus. Bitte versuche es später erneut.',
      );
      this.cancelLoading.set(false);
    }
  }

  async confirmReactivate(): Promise<void> {
    this.reactivateError.set(null);
    this.reactivateLoading.set(true);
    try {
      await this.auth.reactivateSubscription();
      const uid = (this.auth.currentUser as User | null)?.id;
      this.rts.connect({ userId: uid as any });
      await this.rts.waitFor<any>('user.updated', {
        filter: (p) => {
          const pid = (p?.user as any)?.id ?? p?.userId;
          return !uid || String(pid) === String(uid);
        },
        timeoutMs: 60000,
      });
      await this.auth.refreshCurrentUser();
      this.zone.run(() => {
        this.snackbar.success('Abonnement wurde reaktiviert.');
        this.showReactivateModal.set(false);
        this.reactivateLoading.set(false);
        this.cdr.markForCheck();
      });
    } catch (error) {
      this.zone.run(() => {
        this.reactivateError.set(
          toErrorMessage(
            error,
            'Die Reaktivierung ist fehlgeschlagen. Bitte versuche es später erneut.',
          ),
        );
        this.reactivateLoading.set(false);
      });
    }
  }

  async confirmDelete(): Promise<void> {
    this.deleteError.set('');
    try {
      await this.auth.deleteAccount();
      window.location.href = '/';
    } catch (error) {
      this.zone.run(() => {
        this.deleteError.set(
          toErrorMessage(
            error,
            'Das Profil konnte nicht gelöscht werden. Bitte versuche es später erneut.',
          ),
        );
        this.snackbar.error(this.deleteError());
        this.cdr.markForCheck();
      });
    }
  }

  // UI helpers
  toggleMessage(id: string): void {
    this.expandedMessageId.set(this.expandedMessageId() === id ? null : id);
  }

  get paginatedRequests(): Message[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE();
    const requests = this.contactRequests();
    return requests.slice(start, start + this.PAGE_SIZE());
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.contactRequests().length / this.PAGE_SIZE()),
    );
  }

  getContactRequestLabel(text: string): string {
    switch (text) {
      case 'other':
        return 'Sonstiges';
      case 'feature':
        return 'Feature-Anfrage';
      case 'feedback':
        return 'Feedback';
      case 'support':
        return 'Support';
      default:
        return text;
    }
  }
}
