import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserApiService } from '@cooksona/api';
import { toErrorMessage } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-verification.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailVerificationComponent implements OnInit {
  status: 'pending' | 'success' | 'error' = 'pending';
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private users: UserApiService
  ) {}

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const token = params.get('token');
    if (!token) {
      this.router
        .navigate(['/login'])
        .catch((navigationError) =>
          console.error('Redirect to login failed', navigationError)
        );
      return;
    }
    this.status = 'pending';
    try {
      const res = await this.users.verifyEmail(token);
      if (res && res.ok) {
        this.status = 'success';
        this.message =
          'Deine E-Mail wurde erfolgreich bestätigt! Du kannst dich jetzt einloggen.';
      } else {
        this.status = 'success';
        this.message =
          'Deine E-Mail wurde erfolgreich bestätigt! Du kannst dich jetzt einloggen.';
      }
    } catch (error) {
      this.status = 'error';
      this.message = toErrorMessage(
        error,
        'Der Verifizierungslink ist ungültig oder abgelaufen.'
      );
    }
  }

  goToLogin(): void {
    this.router
      .navigate(['/login'])
      .catch((navigationError) =>
        console.error('Navigation to login failed', navigationError)
      );
  }
}
