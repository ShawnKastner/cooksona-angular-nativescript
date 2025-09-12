import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
})
export class ResetPassword {
  token: string | null = null;
  password = '';
  confirmPassword = '';
  error: string | null = null;
  message: string | null = null;
  isLoading = false;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.router.navigate(['/login']).catch(() => {});
    }
  }

  async submit() {
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
      // TODO: call API to reset password
      await new Promise((r) => setTimeout(r, 700));
      this.router
        .navigate(['/login'], { queryParams: { reset: 'success' } })
        .catch(() => {});
    } catch {
      this.error =
        'Fehler beim Zurücksetzen des Passworts. Der Link ist möglicherweise abgelaufen oder ungültig.';
    } finally {
      this.isLoading = false;
    }
  }
}
