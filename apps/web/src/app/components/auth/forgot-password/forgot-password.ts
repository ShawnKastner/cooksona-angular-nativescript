import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { Mail } from 'libs/constants/icons';
import { AuthService } from '@cooksona/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInjectDirective],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  email = '';
  message: string | null = null;
  error: string | null = null;
  isLoading = false;
  protected readonly icons = { Mail } as const;

  constructor(private readonly auth: AuthService) {}

  async submit() {
    this.error = null;
    this.message = null;
    this.isLoading = true;
    try {
      await this.auth.requestPasswordReset(this.email);
      this.message =
        'Wenn die E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts versendet.';
    } catch {
      this.error = 'Fehler beim Senden der E-Mail.';
    } finally {
      this.isLoading = false;
    }
  }
}
