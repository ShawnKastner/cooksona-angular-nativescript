import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { Eye, EyeOff, LogIn } from '@cooksona/constants/icons';
import { AuthService } from '@cooksona/auth';
import { ApiService } from '@cooksona/api';
import { toErrorMessage } from '../../../shared/utils/error.utils';
import { LoadingSpinnerSmallComponent } from '../../../shared/ui/loading-spinner/loading-spinner-small.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SvgInjectDirective,
    LoadingSpinnerSmallComponent,
  ],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  fb = inject(NonNullableFormBuilder);
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  info = signal<string | null>(null);
  error = signal<string | null>(null);
  resendState = signal<'idle' | 'sending' | 'sent' | 'error'>('idle');
  resendError = signal<string | null>(null);
  showPassword = signal(false);

  protected readonly icons = { LogIn, Eye, EyeOff } as const;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('registered') === 'true') {
      this.info.set(
        'Registrierung erfolgreich! Bitte prüfe deine E-Mails und bestätige deine Adresse.',
      );
      this.clearQueryParams();
    }
    if (params.get('registered') === 'invite') {
      this.info.set(
        'Account erfolgreich erstellt! Du kannst dich jetzt direkt einloggen.',
      );
      this.clearQueryParams();
    }
    if (params.get('inviteError') === 'used') {
      this.error.set(
        'Dieser Einladungslink wurde bereits verwendet oder ist ungültig. Bitte fordere eine neue Einladung an oder logge dich direkt ein.',
      );
      this.clearQueryParams();
    }
    if (params.get('reset') === 'success') {
      this.info.set(
        'Dein Passwort wurde erfolgreich zurückgesetzt. Du kannst dich jetzt einloggen.',
      );
      this.clearQueryParams();
    }
  }

  private clearQueryParams(): void {
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  async submit(): Promise<void> {
    this.error.set(null);
    this.info.set(null);

    if (!this.loginForm.controls.email.value) {
      this.error.set('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }
    if (!this.loginForm.controls.password.value) {
      this.error.set('Bitte gib dein Passwort ein');
      return;
    }

    try {
      await this.auth.login({
        email: this.loginForm.controls.email.value,
        password: this.loginForm.controls.password.value,
      });
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es später erneut.',
        ),
      );
    }
  }

  async resendEmail(): Promise<void> {
    this.resendError.set(null);
    if (!this.loginForm.controls.email.value) {
      this.resendError.set('Bitte E-Mail angeben, um erneut zu senden.');
      this.resendState.set('error');
      return;
    }
    this.resendState.set('sending');
    try {
      await this.api.post('/auth/resend-verification', {
        email: this.loginForm.controls.email.value,
      });
      this.resendState.set('sent');
      this.info.set('E-Mail wurde erneut versendet.');
    } catch (error) {
      this.resendError.set(
        toErrorMessage(
          error,
          'Senden fehlgeschlagen. Bitte versuche es später erneut.',
        ),
      );
      this.resendState.set('error');
    }
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  navigateToRegister(): void {
    this.router
      .navigate(['/register'])
      .catch((navigationError) =>
        console.error('Navigation to register failed', navigationError),
      );
  }

  navigateToForgot(): void {
    this.router
      .navigate(['/forgot-password'])
      .catch((navigationError) =>
        console.error('Navigation to forgot-password failed', navigationError),
      );
  }

  get shouldShowResend(): boolean {
    return (
      this.error() === 'Bitte bestätige zuerst deine E-Mail-Adresse.' &&
      !!this.loginForm.controls.email.value
    );
  }
}
