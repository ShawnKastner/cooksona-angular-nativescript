import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  DestroyRef,
  NgZone,
  ChangeDetectorRef,
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
import { ProUpgradeModalComponent } from '../../shared/ui/modals/pro-upgrade-modal.component';
import {
  User as UserIcon,
  Mail,
  Star,
  Inbox,
  ChevronDown,
} from '@cooksona/constants/icons';
import { AuthService } from '@cooksona/auth';
import { SnackbarService } from '../../shared/ui/snackbar.service';
import { ContactApiService } from '@cooksona/api';
import { ApiService } from '@cooksona/api';
import { Message } from '@cooksona/models/contact.models';
import { User } from '@cooksona/models/user.models';
import { toErrorMessage } from '../../shared/utils/error.utils';

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
  ],
  templateUrl: './profile.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly auth = inject(AuthService);
  private readonly contactApi = inject(ContactApiService);
  private readonly api = inject(ApiService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  // Icons
  readonly icons = { UserIcon, Mail, Star, Inbox, ChevronDown } as const;

  // Tabs
  activeTab: 'profile' | 'requests' = 'profile';

  // Modals & state
  isUpgradeModalOpen = false;
  showCancelModal = false;
  cancelLoading = false;
  cancelError: string | null = null;
  cancelSuccess = false;
  showReactivateModal = false;
  showDeleteModal = false;
  reactivateLoading = false;
  reactivateError: string | null = null;
  deleteError: string | null = null;

  // Form
  form!: FormGroup<ProfileFormModel>;
  saveError: string | null = null;
  saveSuccess: string | null = null;
  isEditing = false;
  isSaving = false;

  // Requests
  contactRequests: Message[] = [];
  loadingRequests = false;
  requestsError: string | null = null;
  expandedMessageId: string | null = null;
  currentPage = 1;
  readonly PAGE_SIZE = 5;

  ngOnInit(): void {
    const u = this.auth.currentUser as User | null;
    this.form = this.fb.group<ProfileFormModel>({
      name: this.fb.control<string>(u?.name ?? '', {
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZäöüÄÖÜß\s-]+$/),
        ],
      }),
      email: this.fb.control<string>(u?.email ?? '', {
        validators: [
          Validators.required,
          Validators.email,
          Validators.maxLength(100),
        ],
      }),
    });

    // Load contact requests
    if (u?.id) void this.loadRequests(u.id);

    // If user later updates (rare), reflect in form
    this.auth.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (!user) return;
        this.form.patchValue(
          { name: user.name ?? '', email: user.email ?? '' },
          { emitEvent: false }
        );
      });
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
      this.subStatus === 'canceled' || (ended && !this.isLifetime) || neverPro
    );
  }

  async loadRequests(userId: string): Promise<void> {
    this.loadingRequests = true;
    this.requestsError = null;
    try {
      const data = await this.contactApi.fetchUserContactRequests(userId);
      this.contactRequests = data ?? [];
    } catch (error) {
      this.contactRequests = [];
      this.requestsError = toErrorMessage(
        error,
        'Die Nachrichten konnten nicht geladen werden. Bitte versuche es später erneut.'
      );
    } finally {
      this.loadingRequests = false;
      this.zone.run(() => this.cdr.markForCheck());
    }
  }

  setActiveTab(tab: 'profile' | 'requests'): void {
    this.activeTab = tab;
  }

  // Form submit
  async handleSubmit(): Promise<void> {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saveError = null;
    this.saveSuccess = null;
    this.isSaving = true;
    this.cdr.markForCheck();
    try {
      const value = this.form.getRawValue();
      await this.auth.updateProfile(value);
      this.zone.run(() => {
        this.snackbar.success('Profil aktualisiert.');
        this.saveSuccess = null;
        this.isEditing = false;
        this.cdr.markForCheck();
      });
    } catch (error) {
      this.zone.run(() => {
        const msg = toErrorMessage(
          error,
          'Aktualisierung fehlgeschlagen. Bitte versuche es später erneut.'
        );
        this.saveError = msg;
        this.snackbar.error(msg);
        this.cdr.markForCheck();
      });
    } finally {
      this.zone.run(() => {
        this.isSaving = false;
        this.cdr.markForCheck();
      });
    }
  }

  // Subscription actions
  openCancelModal(): void {
    this.showCancelModal = true;
    this.cancelLoading = false;
    this.cancelError = null;
    this.cancelSuccess = false;
  }

  openReactivateModal(): void {
    this.showReactivateModal = true;
    this.reactivateError = null;
    this.reactivateLoading = false;
  }

  openDeleteModal(): void {
    this.deleteError = null;
    this.showDeleteModal = true;
  }

  async performCancelFlow(): Promise<void> {
    this.cancelError = null;
    this.cancelSuccess = false;
    this.cancelLoading = true;
    try {
      await this.auth.cancelSubscription();
    } catch (error) {
      this.cancelError = toErrorMessage(
        error,
        'Kündigung fehlgeschlagen. Bitte versuche es später erneut.'
      );
      this.cancelLoading = false;
      return;
    }

    const start = Date.now();
    const maxTotalMs = 60_000;
    const intervalMs = 5000;
    while (Date.now() - start < maxTotalMs) {
      try {
        const user = await this.api.get<User>('/users/me');
        if (user?.subscriptionStatus === 'canceled') {
          this.cancelSuccess = true;
          this.cancelLoading = false;
          try {
            await this.auth.refreshCurrentUser();
          } catch (refreshError) {
            console.warn(
              'Failed to refresh current user after cancellation',
              refreshError
            );
          }
          setTimeout(() => {
            this.showCancelModal = false;
          }, 3000);
          return;
        }
      } catch (error: unknown) {
        const errObject =
          typeof error === 'object' && error !== null
            ? (error as {
                message?: unknown;
                error?: unknown;
                status?: unknown;
                statusCode?: unknown;
              })
            : {};
        const messageValue =
          typeof errObject.message === 'string'
            ? errObject.message
            : typeof errObject.error === 'string'
            ? errObject.error
            : '';
        const statusRaw = errObject.status ?? errObject.statusCode ?? undefined;
        const status =
          typeof statusRaw === 'number'
            ? statusRaw
            : typeof statusRaw === 'string'
            ? Number(statusRaw)
            : undefined;
        if (status === 429 || /429|Too Many Requests/i.test(messageValue)) {
          this.cancelError =
            'Zu viele Anfragen an den Server. Bitte warte kurz und versuche es erneut.';
          this.cancelLoading = false;
          return;
        }
        this.cancelError = toErrorMessage(
          error,
          'Der Kündigungsstatus konnte nicht geprüft werden. Bitte versuche es später erneut.'
        );
        this.cancelLoading = false;
        return;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    this.cancelError =
      'Die Kündigung wurde angefragt, die Bestätigung steht noch aus. Bitte versuche es später erneut.';
    this.cancelLoading = false;
  }

  async confirmReactivate(): Promise<void> {
    this.reactivateError = null;
    this.reactivateLoading = true;
    try {
      await this.auth.reactivateSubscription();
      await this.auth
        .refreshCurrentUser()
        .catch((refreshError) =>
          console.warn(
            'Failed to refresh current user after reactivation',
            refreshError
          )
        );
      this.zone.run(() => {
        this.snackbar.success('Abonnement wurde reaktiviert.');
        this.showReactivateModal = false;
        this.reactivateLoading = false;
        this.cdr.markForCheck();
      });
    } catch (error) {
      this.zone.run(() => {
        this.reactivateError = toErrorMessage(
          error,
          'Die Reaktivierung ist fehlgeschlagen. Bitte versuche es später erneut.'
        );
        this.reactivateLoading = false;
        this.cdr.markForCheck();
      });
    }
  }

  async confirmDelete(): Promise<void> {
    this.deleteError = null;
    try {
      await this.auth.deleteAccount();
      window.location.href = '/';
    } catch (error) {
      this.zone.run(() => {
        this.deleteError = toErrorMessage(
          error,
          'Das Profil konnte nicht gelöscht werden. Bitte versuche es später erneut.'
        );
        this.snackbar.error(this.deleteError);
        this.cdr.markForCheck();
      });
    }
  }

  // UI helpers
  toggleMessage(id: string): void {
    this.expandedMessageId = this.expandedMessageId === id ? null : id;
  }

  get paginatedRequests(): Message[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.contactRequests.slice(start, start + this.PAGE_SIZE);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.contactRequests.length / this.PAGE_SIZE));
  }
}
