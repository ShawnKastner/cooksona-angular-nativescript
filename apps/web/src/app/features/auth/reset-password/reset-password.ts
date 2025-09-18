import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@cooksona/auth';
import { toErrorMessage } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  token: string | null = null;
  password = '';
  confirmPassword = '';
  error: string | null = null;
  message: string | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      void this.router
        .navigate(['/login'])
        .catch((navigationError) =>
          console.error('Redirect to login failed', navigationError)
        );
    }
  }

  async submit(): Promise<void> {
    this.error = null;
    this.message = null;
    if (!this.token) {
      this.error = 'Kein Token gefunden. Bitte nutze den Link aus der E-Mail.';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Das Passwort muss mindestens 8 Zeichen lang sein.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Die Passwörter stimmen nicht überein.';
      return;
    }
    this.isLoading = true;
    try {
      await this.auth.resetPassword(this.token, this.password);
      void this.router
        .navigate(['/login'], { queryParams: { reset: 'success' } })
        .catch((navigationError) =>
          console.error('Navigation to login failed', navigationError)
        );
    } catch (error) {
      this.error = toErrorMessage(
        error,
        'Fehler beim Zurücksetzen des Passworts. Der Link ist möglicherweise abgelaufen oder ungültig.'
      );
    } finally {
      this.isLoading = false;
    }
  }
}
