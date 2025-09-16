import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy, DestroyRef, NgZone, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { ProUpgradeModalComponent } from '../../shared/ui/modals/pro-upgrade-modal.component';
import {
  User as UserIcon,
  Mail,
  Star,
  Inbox,
  ChevronDown,
} from 'libs/constants/icons';
import { AuthService } from '@cooksona/auth';
import { ContactApiService } from '@cooksona/api';
import { ApiService } from '@cooksona/api';
import { Message } from '@cooksona/models/contact.models';
import { User } from '@cooksona/models/user.models';

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
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly contactApi = inject(ContactApiService);
  private readonly api = inject(ApiService);
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

  // Form
  form!: FormGroup;
  saveError: string | null = null;
  saveSuccess: string | null = null;
  isEditing = false;
  isSaving = false;

  // Requests
  contactRequests: Message[] = [];
  loadingRequests = false;
  expandedMessageId: string | null = null;
  currentPage = 1;
  readonly PAGE_SIZE = 5;

  ngOnInit(): void {
    const u = this.auth.currentUser as User | null;
    this.form = this.fb.group({
      name: [
        u?.name ?? '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZäöüÄÖÜß\s-]+$/),
        ],
      ],
      email: [
        u?.email ?? '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
    });

    // Load contact requests
    if (u?.id) void this.loadRequests(u.id);

    // If user later updates (rare), reflect in form
    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (!user) return;
      this.form.patchValue(
        { name: user.name ?? '', email: user.email ?? '' },
        { emitEvent: false }
      );
    });
  }

  ngOnDestroy(): void {}

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
  private get u(): any {
    return this.auth.currentUser as any;
  }
  private get endsAt(): Date | null {
    const iso = this.u?.subscriptionEndsAt as string | null | undefined;
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
    return !!this.u?.lifetimeSubscription;
  }
  get hasPaypalId(): boolean {
    return !!this.u?.paypalSubscriptionId;
  }
  get subStatus(): string | null {
    return this.u?.subscriptionStatus ?? null;
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
      !this.u?.subscriptionEndsAt &&
      this.subStatus !== 'active' &&
      !this.isLifetime;
    return (
      this.subStatus === 'canceled' || (ended && !this.isLifetime) || neverPro
    );
  }

  async loadRequests(userId: string): Promise<void> {
    this.loadingRequests = true;
    try {
      const data = await this.contactApi.fetchUserContactRequests(userId);
      this.contactRequests = data ?? [];
    } catch {
      this.contactRequests = [];
    } finally {
      this.loadingRequests = false;
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
      await this.auth.updateProfile(this.form.value);
      this.zone.run(() => {
        this.saveSuccess = 'Profil aktualisiert.';
        this.isEditing = false;
        this.cdr.markForCheck();
      });
    } catch (err: any) {
      this.zone.run(() => {
        const backendMessage = err?.message || err?.error || err?.detail;
        this.saveError =
          typeof backendMessage === 'string' && backendMessage.trim().length > 0
            ? backendMessage
            : 'Aktualisierung fehlgeschlagen.';
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
  }

  async performCancelFlow(): Promise<void> {
    this.cancelError = null;
    this.cancelSuccess = false;
    this.cancelLoading = true;
    try {
      await this.auth.cancelSubscription();
    } catch (err: any) {
      const backendMessage = err?.message || err?.error || err?.detail;
      this.cancelError =
        typeof backendMessage === 'string' && backendMessage.trim().length > 0
          ? backendMessage
          : 'Kündigung fehlgeschlagen.';
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
          } catch {}
          setTimeout(() => {
            this.showCancelModal = false;
          }, 3000);
          return;
        }
      } catch (err: any) {
        const message = String(err?.message || err?.error || '');
        const status = (err as any)?.status || (err as any)?.statusCode;
        if (status === 429 || /429|Too Many Requests/i.test(message)) {
          this.cancelError =
            'Zu viele Anfragen an den Server. Bitte warte kurz und versuche es erneut.';
          this.cancelLoading = false;
          return;
        }
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    this.cancelError =
      'Die Kündigung wurde angefragt, die Bestätigung steht noch aus. Bitte versuche es später erneut.';
    this.cancelLoading = false;
  }

  async confirmReactivate(): Promise<void> {
    try {
      await this.auth.reactivateSubscription();
    } finally {
      this.showReactivateModal = false;
    }
  }

  async confirmDelete(): Promise<void> {
    try {
      await this.auth.deleteAccount();
      window.location.href = '/';
    } catch {}
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
