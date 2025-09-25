import { Component, inject, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  NativeScriptCommonModule,
  NativeScriptFormsModule,
  NativeScriptRouterModule,
  RouterExtensions,
} from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Apple, Google, LogIn } from '@cooksona/constants/icons';
import { AuthService } from '@cooksona/auth';
import { Page } from '@nativescript/core';

@Component({
  selector: 'ns-login',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    ReactiveFormsModule,
    NativeScriptFormsModule,
    SvgToDataUriPipe,
    NativeScriptRouterModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);

  form!: FormGroup;

  error = signal<string | null>(null);
  mailError = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  icons = {
    LogIn,
    Google,
    Apple,
  } as const;

  constructor(
    private routerExt: RouterExtensions,
    private fb: FormBuilder,
    private page: Page,
  ) {
    this.page.actionBarHidden = true;
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  async onLoginTap() {
    this.mailError.set(null);
    this.error.set(null);
    this.passwordError.set(null);

    if (this.form.controls['email'].invalid) {
      this.mailError.set('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    if (this.form.controls['password'].invalid) {
      this.passwordError.set('Bitte gib dein Passwort ein.');
      return;
    }

    try {
      await this.authService.login({
        email: (this.form.controls['email'].value || '').trim(),
        password: this.form.controls['password'].value,
      });
      await this.routerExt.navigateByUrl('/home', { clearHistory: true });
    } catch (error) {
      console.error('Login error:', error);
      const message =
        (error as any)?.message ||
        'Es ist ein unbekannter Fehler aufgetreten. Bitte versuche es erneut.';
      this.error.set(message);
    }
  }

  googleSignIn() {
    // TODO: Implement login with google
    console.log('Google signIn tapped');
  }

  appleSignIn() {
    // TODO: Implement login with apple
    console.log('Apple login tapped');
  }

  goToRegister() {
    // Navigate to the register screen
    console.log('Tapped');

    this.routerExt.navigateByUrl('/register', { clearHistory: true });
  }

  goToForgotPassword() {
    this.routerExt.navigateByUrl('/forgot-password', { clearHistory: true });
  }
}
