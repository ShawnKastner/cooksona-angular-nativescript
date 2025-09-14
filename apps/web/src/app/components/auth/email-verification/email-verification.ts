import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-verification.html',
  styleUrls: ['./email-verification.scss'],
})
export class EmailVerification {
  status: 'pending' | 'success' | 'error' = 'pending';
  message = '';

  constructor(private route: ActivatedRoute, private router: Router) {
    const params = this.route.snapshot.queryParamMap;
    const token = params.get('token');
    if (!token) {
      // no token -> redirect to login
      this.router.navigate(['/login']).catch(() => {});
      return;
    }
    // Simulate verification call
    this.verifyEmail(token);
  }

  private verifyEmail(token: string) {
    this.status = 'pending';
    // TODO: replace with real API call
    setTimeout(() => {
      if (token === 'ok' || token.length > 10) {
        this.status = 'success';
        this.message =
          'Deine E-Mail wurde erfolgreich bestätigt! Du kannst dich jetzt einloggen.';
      } else {
        this.status = 'error';
        this.message = 'Der Verifizierungslink ist ungültig oder abgelaufen.';
      }
    }, 800);
  }

  goToLogin() {
    this.router.navigate(['/login']).catch(() => {});
  }
}
