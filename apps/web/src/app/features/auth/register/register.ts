import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserPlus, Eye, EyeOff } from 'libs/constants/icons';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { Router } from '@angular/router';
import { AuthService } from '@cooksona/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInjectDirective],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  error: string | null = null;
  isLoading = false;
  showPassword = false;
  showPassword2 = false;
  protected readonly icons = { UserPlus, Eye, EyeOff } as const;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  async submit() {
    this.error = null;
    const nameOk =
      this.name.trim().length >= 2 &&
      this.name.trim().length <= 50 &&
      /^[a-zA-ZäöüÄÖÜß\s-]+$/.test(this.name.trim());
    if (!nameOk) {
      this.error = 'Bitte gib einen gültigen Namen an.';
      return;
    }
    const emailOk = /.+@.+\..+/.test(this.email);
    if (!emailOk) {
      this.error = 'Bitte gib eine gültige E-Mail-Adresse ein';
      return;
    }
    const pw = this.password;
    const pwOk =
      pw.length >= 8 &&
      pw.length <= 72 &&
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        pw
      );
    if (!pwOk) {
      this.error =
        'Das Passwort muss mind. 8 Zeichen und Groß-/Kleinbuchstaben, Zahl und Sonderzeichen enthalten.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Die Passwörter stimmen nicht überein.';
      return;
    }
    this.isLoading = true;
    try {
      await this.auth.register({
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password,
      });
      await this.router.navigateByUrl('/login?registered=true');
    } finally {
      this.isLoading = false;
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
  togglePassword2() {
    this.showPassword2 = !this.showPassword2;
  }
  navigateToLogin() {
    this.router.navigate(['/login']).catch(() => {});
  }
}
