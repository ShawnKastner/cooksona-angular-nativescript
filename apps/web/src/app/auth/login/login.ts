import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { LogIn } from 'libs/constants/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SvgInjectDirective],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  email = '';
  password = '';
  info: string | null = null;
  error: string | null = null;
  resendState: 'idle' | 'sending' | 'sent' | 'error' = 'idle';
  resendError: string | null = null;
  showPassword = false;

  protected readonly icons = { LogIn } as const;

  constructor(private router: Router) {}

  submit() {
    // lightweight validation + placeholder behaviour
    this.error = null;
    this.info = null;

    if (!this.email) {
      this.error = 'Bitte E-Mail eingeben.';
      return;
    }
    if (!this.password) {
      this.error = 'Bitte Passwort eingeben.';
      return;
    }

    // TODO: call auth service. For now, simulate success and navigate or show info
    this.info = 'Erfolgreich angemeldet (Simuliert).';
    // Example navigation (uncomment if you have a dashboard route)
    // this.router.navigate(['/dashboard']);
  }

  resendEmail() {
    this.resendError = null;
    if (!this.email) {
      this.resendError = 'Bitte E-Mail angeben, um erneut zu senden.';
      this.resendState = 'error';
      return;
    }
    // Simulate sending flow
    this.resendState = 'sending';
    setTimeout(() => {
      this.resendState = 'sent';
      this.info = 'E-Mail wurde erneut versendet.';
    }, 700);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  navigateToRegister() {
    // navigate to register route if exists
    this.router.navigate(['/register']).catch(() => {});
  }

  navigateToForgot() {
    this.router.navigate(['/forgot-password']).catch(() => {});
  }

  get shouldShowResend() {
    return (
      this.error === 'Bitte bestätige zuerst deine E-Mail-Adresse.' &&
      !!this.email
    );
  }
}
