import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { UserPlus, Eye, EyeOff } from '@cooksona/constants/icons';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { Router } from '@angular/router';
import { AuthService } from '@cooksona/auth';
import { toErrorMessage } from '../../../shared/utils/error.utils';
import { LoadingSpinnerSmallComponent } from '../../../shared/ui/loading-spinner/loading-spinner-small.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SvgInjectDirective,
    LoadingSpinnerSmallComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  fb = inject(NonNullableFormBuilder);
  registerForm = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZäöüÄÖÜß\s-]+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
        Validators.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        ),
      ],
    ],
    confirmPassword: ['', [Validators.required]],
  });
  error = signal<string | null>(null);
  isLoading = signal(false);
  showPassword = signal(false);
  showPassword2 = signal(false);
  protected readonly icons = { UserPlus, Eye, EyeOff } as const;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  async submit(): Promise<void> {
    this.error.set(null);

    if (!this.registerForm.controls.name.valid) {
      this.error.set('Bitte gib einen gültigen Namen an.');
      return;
    }

    if (!this.registerForm.controls.email.valid) {
      this.error.set('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    if (!this.registerForm.controls.password.valid) {
      this.error.set(
        'Das Passwort muss mind. 8 Zeichen und Groß-/Kleinbuchstaben, Zahl und Sonderzeichen enthalten.',
      );
      return;
    }
    if (
      this.registerForm.controls.password.value !==
      this.registerForm.controls.confirmPassword.value
    ) {
      this.error.set('Die Passwörter stimmen nicht überein.');
      return;
    }
    this.isLoading.set(true);
    try {
      await this.auth.register({
        name: this.registerForm.controls.name.value.trim(),
        email: this.registerForm.controls.email.value.trim(),
        password: this.registerForm.controls.password.value,
      });
      await this.router.navigateByUrl('/login?registered=true');
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Die Registrierung ist fehlgeschlagen. Bitte versuche es später erneut.',
        ),
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }
  togglePassword2() {
    this.showPassword2.set(!this.showPassword2());
  }
  navigateToLogin(): void {
    this.router
      .navigate(['/login'])
      .catch((navigationError) =>
        console.error('Navigation to login failed', navigationError),
      );
  }
}
