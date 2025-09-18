import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { LoadingSpinnerSmallComponent } from '../../../shared/ui/loading-spinner-small.component';

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
  private readonly cdr = inject(ChangeDetectorRef);
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  info: string | null = null;
  error: string | null = null;
  resendState: 'idle' | 'sending' | 'sent' | 'error' = 'idle';
  resendError: string | null = null;
  showPassword = signal(false);

  protected readonly icons = { LogIn, Eye, EyeOff } as const;

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

  async submit(): Promise<void> {
    this.error = null;
    this.info = null;
    this.markForCheck();

    if (!this.loginForm.controls.email.value) {
      this.error = 'Bitte gib eine gültige E-Mail-Adresse ein';
      this.markForCheck();
      return;
    }
    if (!this.loginForm.controls.password.value) {
      this.error = 'Bitte gib dein Passwort ein';
      this.markForCheck();
      return;
    }

    try {
      await this.auth.login({
        email: this.loginForm.controls.email.value,
        password: this.loginForm.controls.password.value,
      });
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.error = toErrorMessage(
        error,
        'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es später erneut.'
      );
      this.markForCheck();
    }
  }

  async resendEmail(): Promise<void> {
    this.resendError = null;
    this.markForCheck();
    if (!this.loginForm.controls.email.value) {
      this.resendError = 'Bitte E-Mail angeben, um erneut zu senden.';
      this.resendState = 'error';
      this.markForCheck();
      return;
    }
    this.resendState = 'sending';
    this.markForCheck();
    try {
      await this.api.post('/auth/resend-verification', {
        email: this.loginForm.controls.email.value,
      });
      this.resendState = 'sent';
      this.info = 'E-Mail wurde erneut versendet.';
      this.markForCheck();
    } catch (error) {
      this.resendError = toErrorMessage(
        error,
        'Senden fehlgeschlagen. Bitte versuche es später erneut.'
      );
      this.resendState = 'error';
      this.markForCheck();
    }
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  navigateToRegister(): void {
    this.router
      .navigate(['/register'])
      .catch((navigationError) =>
        console.error('Navigation to register failed', navigationError)
      );
  }

  navigateToForgot(): void {
    this.router
      .navigate(['/forgot-password'])
      .catch((navigationError) =>
        console.error('Navigation to forgot-password failed', navigationError)
      );
  }

  get shouldShowResend(): boolean {
    return (
      this.error === 'Bitte bestätige zuerst deine E-Mail-Adresse.' &&
      !!this.loginForm.controls.email.value
    );
  }

  private markForCheck(): void {
    this.cdr.markForCheck();
  }
}
