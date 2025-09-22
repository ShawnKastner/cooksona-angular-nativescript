import { Component, OnInit, inject, signal } from '@angular/core';
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
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { Eye, EyeOff } from '../../../../../../libs/constants/icons';

interface InviteRedeemInfo {
  presetRole: 'admin' | 'user';
  presetLifetimeSubscription?: boolean;
  presetSubscriptionEndsAt?: string | null;
}

@Component({
  selector: 'app-invite-redeem-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SvgInjectDirective],
  templateUrl: './invite-redeem.component.html',
})
export class InviteRedeemPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly invites = inject(InviteRedeemApiService);

  loading = signal(false);
  submitting = signal(false);
  showPassword = signal(false);
  error = signal<string | null>(null);
  invite = signal<InviteRedeemInfo | null>(null);
  /**
   * Preserve the raw email as typed to avoid unintended lowercasing by inputs.
   */
  private rawEmail = '';

  readonly icons = { Eye, EyeOff } as const;

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

    this.submitting.set(true);
    this.error.set(null);

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
        .catch((navigationError) =>
          console.error(
            'Redirect to login after invite redeem failed',
            navigationError,
          ),
        );
    } catch (error) {
      this.error.set(
        toErrorMessage(error, 'Ein unbekannter Fehler ist aufgetreten'),
      );
    } finally {
      this.submitting.set(false);
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
    this.showPassword.set(!this.showPassword());
  }

  navigateToLogin(event?: Event): void {
    event?.preventDefault();
    this.router
      .navigate(['/login'])
      .catch((navigationError) =>
        console.error('Navigation to login failed', navigationError),
      );
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
    this.loading.set(true);
    try {
      const safeToken = encodeURIComponent(token);
      const invite = await this.api.get<InviteRedeemInfo>(
        `/invites/redeem/${safeToken}`,
      );
      if (!invite) {
        this.navigateToInviteError();
        return;
      }

      this.invite.set(invite);
    } catch (error) {
      console.error('Failed to load invite details', error);
      this.navigateToInviteError();
    } finally {
      this.loading.set(false);
    }
  }

  private navigateToInviteError(): void {
    this.router
      .navigate(['/login'], { queryParams: { inviteError: 'used' } })
      .catch((navigationError) =>
        console.error(
          'Redirect to login after invite error failed',
          navigationError,
        ),
      );
  }
}
