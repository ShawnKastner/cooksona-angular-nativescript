import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { LogIn } from 'libs/constants/icons';
import { AuthService } from '@cooksona/auth';
import { ApiService } from '@cooksona/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SvgInjectDirective],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit {
  email = '';
  password = '';
  info: string | null = null;
  error: string | null = null;
  resendState: 'idle' | 'sending' | 'sent' | 'error' = 'idle';
  resendError: string | null = null;
  showPassword = false;

  protected readonly icons = { LogIn } as const;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('registered') === 'true') {
      this.info =
        'Registrierung erfolgreich! Bitte prüfe deine E-Mails und bestätige deine Adresse.';
      this.clearQueryParams();
    }
    if (params.get('registered') === 'invite') {
      this.info =
        'Account erfolgreich erstellt! Du kannst dich jetzt direkt einloggen.';
      this.clearQueryParams();
    }
    if (params.get('inviteError') === 'used') {
      this.error =
        'Dieser Einladungslink wurde bereits verwendet oder ist ungültig. Bitte fordere eine neue Einladung an oder logge dich direkt ein.';
      this.clearQueryParams();
    }
    if (params.get('reset') === 'success') {
      this.info =
        'Dein Passwort wurde erfolgreich zurückgesetzt. Du kannst dich jetzt einloggen.';
      this.clearQueryParams();
    }
  }

  private clearQueryParams(): void {
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  async submit() {
    this.error = null;
    this.info = null;

    if (!this.email) {
      this.error = 'Bitte gib eine gültige E-Mail-Adresse ein';
      return;
    }
    if (!this.password) {
      this.error = 'Bitte gib dein Passwort ein';
      return;
    }

    try {
      await this.auth.login({ email: this.email, password: this.password });
      await this.router.navigateByUrl('/');
    } catch (err: unknown) {
      const normalizeMessage = (m: unknown): string => {
        if (m === null || m === undefined) return '';
        if (typeof m === 'string') return m;
        if (Array.isArray(m)) return m.join('\n');
        if (typeof m === 'object') {
          const obj = m as Record<string, unknown>;
          const msg = obj['message'];
          return typeof msg === 'string' ? msg : JSON.stringify(m);
        }
        return String(m);
      };

      if (err && typeof err === 'object') {
        const obj = err as Record<string, unknown>;
        const backendMessage =
          obj['message'] ?? obj['error'] ?? obj['detail'] ?? err;
        const msg = normalizeMessage(backendMessage);
        this.error = msg || 'Ein unbekannter Fehler ist aufgetreten.';
      } else if (typeof err === 'string') {
        this.error = err;
      } else {
        this.error = 'Ein unbekannter Fehler ist aufgetreten.';
      }
    }
  }

  async resendEmail() {
    this.resendError = null;
    if (!this.email) {
      this.resendError = 'Bitte E-Mail angeben, um erneut zu senden.';
      this.resendState = 'error';
      return;
    }
    this.resendState = 'sending';
    try {
      await this.api.post('/auth/resend-verification', { email: this.email });
      this.resendState = 'sent';
      this.info = 'E-Mail wurde erneut versendet.';
    } catch (err: unknown) {
      let backendMessage: unknown;
      if (typeof err === 'string') backendMessage = err;
      else if (err && typeof err === 'object') {
        const obj = err as Record<string, unknown>;
        backendMessage = obj['message'] ?? obj['error'] ?? obj['detail'];
      }
      this.resendError =
        typeof backendMessage === 'string' && backendMessage.trim().length > 0
          ? backendMessage
          : 'Senden fehlgeschlagen. Bitte versuche es später erneut.';
      this.resendState = 'error';
    }
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
