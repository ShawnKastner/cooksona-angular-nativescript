import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserApiService } from '@cooksona/api';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-verification.html',
  styleUrls: ['./email-verification.scss'],
})
export class EmailVerification implements OnInit {
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
      this.router.navigate(['/login']).catch(() => {});
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
    } catch {
      this.status = 'error';
      this.message = 'Der Verifizierungslink ist ungültig oder abgelaufen.';
    }
  }

  goToLogin() {
    this.router.navigate(['/login']).catch(() => {});
  }
}
