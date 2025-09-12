import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
})
export class ForgotPassword {
  email = '';
  message: string | null = null;
  error: string | null = null;
  isLoading = false;

  async submit() {
    this.error = null;
    this.message = null;
    this.isLoading = true;
    try {
      // TODO: call real auth service
      await new Promise((r) => setTimeout(r, 700));
      this.message =
        'Wenn die E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts versendet.';
    } catch {
      this.error = 'Fehler beim Senden der E-Mail.';
    } finally {
      this.isLoading = false;
    }
  }
}
