// apps/web/src/app/pages/invite-redeem/invite-redeem.page.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InviteRedeemApiService } from '@cooksona/api';

@Component({
  selector: 'app-invite-redeem-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6">
      <h2 class="text-2xl font-bold mb-2">Einladung einlösen</h2>
      <p class="text-gray-600" *ngIf="state === 'pending'">
        Wird verarbeitet...
      </p>
      <p class="text-success" *ngIf="state === 'success'">
        Einladung erfolgreich eingelöst. Du wirst weitergeleitet...
      </p>
      <p class="text-error" *ngIf="state === 'error'">
        Einlösen der Einladung ist fehlgeschlagen.
      </p>
    </div>
  `,
})
export class InviteRedeemPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invites = inject(InviteRedeemApiService);

  state: 'pending' | 'success' | 'error' = 'pending';

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.router.navigateByUrl('/login').catch(() => {});
      return;
    }
    try {
      // In a real flow, collect user data before redeem. Here it's just a placeholder.
      await this.invites.redeemInvite(token, {
        name: 'User',
        email: 'user@example.com',
        password: 'Temp#1234',
      });
      this.state = 'success';
      setTimeout(
        () => this.router.navigateByUrl('/login').catch(() => {}),
        1200
      );
    } catch {
      this.state = 'error';
    }
  }
}
