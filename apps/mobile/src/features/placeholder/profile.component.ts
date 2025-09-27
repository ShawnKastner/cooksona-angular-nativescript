import { Component, NO_ERRORS_SCHEMA, inject } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { AuthService } from '@cooksona/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'ns-profile',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <ScrollView>
      <StackLayout class="p-6 space-y-6">
        <Label text="Profil" class="text-2xl font-bold text-neutral"></Label>
        <StackLayout class="bg-white p-4 rounded-xl border border-base-200 space-y-2">
          <Label class="text-sm text-gray-500" text="Angemeldet als"></Label>
          <Label class="text-base font-semibold" [text]="userLabel"></Label>
        </StackLayout>

        <FlexboxLayout
          class="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl items-center justify-center active:opacity-90"
          (tap)="onLogout()"
        >
          <Label class="text-white font-bold" text="Abmelden"></Label>
        </FlexboxLayout>
      </StackLayout>
    </ScrollView>
  `,
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  get userLabel(): string {
    const u = this.auth.currentUser as any;
    return u?.name || u?.email || 'Unbekannter Benutzer';
  }

  onLogout() {
    this.auth.logout();
    // Navigate to login root
    this.router.navigateByUrl('/login').catch(() => {});
  }
}
