import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { Mail } from '@cooksona/constants/icons';
import { AuthService } from '@cooksona/auth';
import { toErrorMessage } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInjectDirective, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  fb = inject(NonNullableFormBuilder);
  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  isLoading = signal(false);
  protected readonly icons = { Mail } as const;

  constructor(private readonly auth: AuthService) {}

  async submit() {
    this.error.set(null);
    this.message.set(null);
    this.isLoading.set(true);
    try {
      await this.auth.requestPasswordReset(
        this.forgotPasswordForm.controls.email.value,
      );
      this.message.set(
        'Wenn die E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts versendet.',
      );
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Fehler beim Senden der E-Mail. Bitte versuche es später erneut.',
        ),
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
