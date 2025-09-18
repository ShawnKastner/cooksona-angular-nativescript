import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, InviteRedeemApiService } from '@cooksona/api';
import { toErrorMessage } from '../../shared/utils/error.utils';

interface InviteRedeemInfo {
  presetRole: 'admin' | 'user';
  presetLifetimeSubscription?: boolean;
  presetSubscriptionEndsAt?: string | null;
}

@Component({
  selector: 'app-invite-redeem-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <ng-container *ngIf="loading; else loaded">
      <div class="flex items-center justify-center py-10">
        <div class="w-full max-w-md">
          <div
            class="bg-white shadow-soft-xl rounded-2xl px-8 md:px-10 pt-8 pb-10 border border-base-200/50 text-center"
          >
            <span class="text-lg text-gray-500">Lade Einladung ...</span>
          </div>
        </div>
      </div>
    </ng-container>

    <ng-template #loaded>
      <ng-container *ngIf="invite as currentInvite">
        <div class="flex items-center justify-center py-10">
          <div class="w-full max-w-md">
            <form
              [formGroup]="form"
              (ngSubmit)="onSubmit()"
              class="bg-white shadow-soft-xl rounded-2xl px-8 md:px-10 pt-8 pb-10 border border-base-200/50"
            >
              <div class="mb-8 text-center">
                <h1 class="text-4xl font-serif font-bold text-neutral">
                  Einladung annehmen
                </h1>
                <p class="text-gray-500 mt-2">
                  Erstelle deinen Account und starte direkt durch.
                </p>
              </div>

              <div
                *ngIf="error"
                class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6"
                role="alert"
              >
                <span class="block sm:inline">{{ error }}</span>
              </div>

              <div class="mb-4">
                <label
                  class="block text-neutral text-sm font-bold mb-2"
                  for="name"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  formControlName="name"
                  required
                  placeholder="Dein Name"
                  class="w-full px-4 py-3 bg-base-200 border-2 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-primary transition-all duration-200 text-neutral placeholder-gray-500"
                />
              </div>

              <div class="mb-4">
                <label
                  class="block text-neutral text-sm font-bold mb-2"
                  for="email"
                >
                  E-Mail
                </label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  (input)="onEmailInput($event)"
                  required
                  placeholder="deine.email@example.com"
                  class="w-full px-4 py-3 bg-base-200 border-2 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-primary transition-all duration-200 text-neutral placeholder-gray-500"
                />
              </div>

              <div class="mb-8">
                <label
                  class="block text-neutral text-sm font-bold mb-2"
                  for="password"
                >
                  Passwort
                </label>
                <div class="relative">
                  <input
                    id="password"
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="password"
                    required
                    placeholder="******************"
                    class="w-full px-4 py-3 bg-base-200 border-2 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-primary transition-all duration-200 text-neutral placeholder-gray-500"
                  />
                  <button
                    type="button"
                    (click)="togglePasswordVisibility()"
                    class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
                    aria-label="Passwort anzeigen oder verbergen"
                  >
                    <svg
                      *ngIf="showPassword; else eyeIcon"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-5 h-5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.338 6.701 18 12 18c1.474 0 2.79-.21 3.961-.582M7.5 7.5L3 3m18 18l-4.5-4.5M9.88 9.88a3 3 0 104.24 4.24"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M10.5 5.23A10.45 10.45 0 0112 5c5.299 0 8.774 2.662 10.066 6-.512 1.375-1.388 2.64-2.553 3.737l-3.099-3.099a3 3 0 00-4.242-4.242L10.5 5.23z"
                      />
                    </svg>
                    <ng-template #eyeIcon>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-5 h-5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.201.07.42 0 .631C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </ng-template>
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <button
                  type="submit"
                  [disabled]="form.invalid || submitting"
                  class="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-focus focus:outline-none focus:ring-4 focus:ring-primary/40 transition-all duration-300 disabled:bg-base-300 disabled:shadow-none transform hover:-translate-y-0.5 shadow-soft"
                >
                  Account erstellen
                </button>
              </div>

              <div class="mt-8 text-center text-gray-500 text-sm">
                Bereits ein Konto?
                <a
                  class="font-bold text-primary hover:text-primary-focus cursor-pointer"
                  href="/login"
                  (click)="navigateToLogin($event)"
                >
                  Hier anmelden
                </a>
              </div>

              <div class="mt-8 text-center text-gray-500 text-sm">
                Du wurdest eingeladen als
                <b>{{
                  currentInvite.presetRole === 'admin'
                    ? 'Administrator'
                    : 'Benutzer'
                }}</b
                >.<br />
                <span
                  *ngIf="currentInvite.presetLifetimeSubscription"
                  class="text-green-600"
                >
                  Dein Account erhält ein lebenslanges Abonnement.
                </span>
                <span
                  *ngIf="
                    !currentInvite.presetLifetimeSubscription &&
                    currentInvite.presetSubscriptionEndsAt
                  "
                  class="text-blue-600"
                >
                  Dein Abonnement läuft bis:
                  {{ formatDate(currentInvite.presetSubscriptionEndsAt) }}
                </span>
                <span
                  *ngIf="
                    !currentInvite.presetLifetimeSubscription &&
                    !currentInvite.presetSubscriptionEndsAt
                  "
                  class="text-gray-600"
                >
                  Kein Abonnement hinterlegt.
                </span>
              </div>
            </form>
          </div>
        </div>
      </ng-container>
    </ng-template>
  `,
})
export class InviteRedeemPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly invites = inject(InviteRedeemApiService);

  loading = true;
  submitting = false;
  showPassword = false;
  error: string | null = null;
  invite: InviteRedeemInfo | null = null;
  /**
   * Preserve the raw email as typed to avoid unintended lowercasing by inputs.
   */
  private rawEmail = '';

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.navigateToInviteError();
      return;
    }

    await this.loadInvite(token);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.navigateToInviteError();
      return;
    }

    this.submitting = true;
    this.error = null;

    try {
      const { name, password } = this.form.getRawValue();
      const emailControl = this.form.controls.email;
      const emailValue = this.rawEmail || emailControl.value;

      await this.invites.redeemInvite(token, {
        name: name.trim(),
        email: emailValue.trim(),
        password,
      });
      await this.router
        .navigate(['/login'], { queryParams: { registered: 'invite' } })
        .catch(() => {});
    } catch (error) {
      this.error = toErrorMessage(
        error,
        'Ein unbekannter Fehler ist aufgetreten'
      );
    } finally {
      this.submitting = false;
    }
  }

  onEmailInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target) {
      return;
    }

    this.rawEmail = target.value.toLowerCase();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  navigateToLogin(event?: Event): void {
    event?.preventDefault();
    this.router.navigate(['/login']).catch(() => {});
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString();
  }

  private async loadInvite(token: string): Promise<void> {
    this.loading = true;
    try {
      const safeToken = encodeURIComponent(token);
      const invite = await this.api.get<InviteRedeemInfo>(
        `/invites/redeem/${safeToken}`
      );
      if (!invite) {
        this.navigateToInviteError();
        return;
      }

      this.invite = invite;
    } catch {
      this.navigateToInviteError();
    } finally {
      this.loading = false;
    }
  }

  private navigateToInviteError(): void {
    this.router
      .navigate(['/login'], { queryParams: { inviteError: 'used' } })
      .catch(() => {});
  }

}
