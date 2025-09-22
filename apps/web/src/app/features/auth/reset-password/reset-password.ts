import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '@cooksona/auth';
import { toErrorMessage } from '../../../shared/utils/error.utils';
import { Eye, EyeOff } from '@cooksona/constants/icons';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SvgInjectDirective],
  templateUrl: './reset-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  fb = inject(NonNullableFormBuilder);
  resetPasswordForm = this.fb.group({
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required],
  });
  token = signal<string | null>(null);
  error = signal<string | null>(null);
  message = signal<string | null>(null);
  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  readonly icons = { Eye, EyeOff } as const;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {
    this.token.set(this.route.snapshot.queryParamMap.get('token'));
    if (!this.token()) {
      void this.router
        .navigate(['/login'])
        .catch((navigationError) =>
          console.error('Redirect to login failed', navigationError),
        );
    }
  }

  async submit(): Promise<void> {
    this.error.set(null);
    this.message.set(null);
    const token = this.token();
    if (!token) {
      this.error.set(
        'Kein Token gefunden. Bitte nutze den Link aus der E-Mail.',
      );
      return;
    }
    if (this.resetPasswordForm.controls.password.value.length < 8) {
      this.error.set('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (this.passwordsNotMatching()) {
      this.error.set('Die Passwörter stimmen nicht überein.');
      return;
    }
    this.isLoading.set(true);
    try {
      await this.auth.resetPassword(
        token,
        this.resetPasswordForm.controls.password.value,
      );
      void this.router
        .navigate(['/login'], { queryParams: { reset: 'success' } })
        .catch((navigationError) =>
          console.error('Navigation to login failed', navigationError),
        );
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Fehler beim Zurücksetzen des Passworts. Der Link ist möglicherweise abgelaufen oder ungültig.',
        ),
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleShowPassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  passwordsNotMatching(): boolean {
    return (
      this.resetPasswordForm.controls.password.value !==
      this.resetPasswordForm.controls.confirmPassword.value
    );
  }
}
