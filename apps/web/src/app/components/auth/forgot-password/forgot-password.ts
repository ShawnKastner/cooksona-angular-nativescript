import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { Mail } from 'libs/constants/icons';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInjectDirective],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
})
export class ForgotPassword {
  email = '';
  message: string | null = null;
  error: string | null = null;
  isLoading = false;
  protected readonly icons = { Mail } as const;

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
