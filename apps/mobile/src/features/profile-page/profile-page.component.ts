import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { Router } from '@angular/router';
import { AuthService } from '@cooksona/auth';
import { User } from '@cooksona/models';
import { SvgToDataUriPipe } from '../../utils/svg-to-data-uri.pipe';
import {
  User as UserIcon,
  LogOut,
  Apple,
  Heart,
  CreditCard,
  ChevronDown,
  Settings,
} from '@cooksona/constants/icons';
import { isIOS, isAndroid } from '@nativescript/core';

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  icon: string;
  label: string;
  subtitle?: string;
  action: () => void;
  showChevron?: boolean;
  isConnected?: boolean;
}

@Component({
  selector: 'ns-profile-page',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly icons = {
    User: UserIcon,
    LogOut,
    Apple,
    Heart,
    CreditCard,
    ChevronDown,
    Settings,
  } as const;

  protected readonly isIOS = isIOS;
  protected readonly isAndroid = isAndroid;

  protected user = signal<User | null>(null);
  protected healthConnected = signal(false);
  protected loading = signal(false);

  ngOnInit() {
    this.loadUserData();
    this.checkHealthConnection();
  }

  private loadUserData() {
    const currentUser = this.auth.currentUser as User;
    this.user.set(currentUser);
  }

  private checkHealthConnection() {
    // TODO: Implement actual health connection check
    // This would check if Apple Health or Google Fit is connected
    this.healthConnected.set(false);
  }

  get settingsSections(): SettingsSection[] {
    const user = this.user();
    const subscriptionLabel = this.getSubscriptionLabel(user);

    return [
      {
        title: 'Abonnement',
        items: [
          {
            icon: this.icons.CreditCard,
            label: 'Abo verwalten',
            subtitle: subscriptionLabel,
            action: () => this.manageSubscription(),
            showChevron: true,
          },
        ],
      },
      {
        title: 'Health Integration',
        items: [
          {
            icon: this.isIOS ? this.icons.Apple : this.icons.Heart,
            label: this.isIOS ? 'Apple Health' : 'Google Fit',
            subtitle: this.healthConnected() ? 'Verbunden' : 'Nicht verbunden',
            action: () => this.toggleHealthConnection(),
            showChevron: true,
            isConnected: this.healthConnected(),
          },
        ],
      },
    ];
  }

  private getSubscriptionLabel(user: User | null): string {
    if (!user) return 'Nicht geladen';

    if (user.lifetimeSubscription) {
      return 'Lifetime Abo';
    }

    if (user.subscriptionStatus === 'active') {
      if (user.subscriptionType === 'monthly') {
        return 'Monatliches Abo';
      } else if (user.subscriptionType === 'yearly') {
        return 'Jährliches Abo';
      }
    }

    return 'Kostenloser Plan';
  }

  protected get userLabel(): string {
    const u = this.user();
    return u?.name || u?.email || 'Unbekannter Benutzer';
  }

  protected get userEmail(): string {
    const u = this.user();
    return u?.email || '';
  }

  protected manageSubscription() {
    // TODO: Navigate to subscription management or open subscription modal
    console.log('Manage subscription');
    // For now, we could show a dialog or navigate to a subscription page
    // this.router.navigate(['/subscription-management']);
  }

  protected toggleHealthConnection() {
    this.loading.set(true);

    if (this.healthConnected()) {
      // Disconnect from health service
      this.disconnectHealthService();
    } else {
      // Connect to health service
      this.connectHealthService();
    }
  }

  private async connectHealthService() {
    try {
      if (this.isIOS) {
        // TODO: Implement Apple Health connection
        console.log('Connecting to Apple Health...');
        // Example: await this.healthService.connectAppleHealth();
      } else if (this.isAndroid) {
        // TODO: Implement Google Fit connection
        console.log('Connecting to Google Fit...');
        // Example: await this.healthService.connectGoogleFit();
      }

      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.healthConnected.set(true);
    } catch (error) {
      console.error('Failed to connect health service:', error);
      // TODO: Show error dialog
    } finally {
      this.loading.set(false);
    }
  }

  private async disconnectHealthService() {
    try {
      if (this.isIOS) {
        // TODO: Implement Apple Health disconnection
        console.log('Disconnecting from Apple Health...');
      } else if (this.isAndroid) {
        // TODO: Implement Google Fit disconnection
        console.log('Disconnecting from Google Fit...');
      }

      // Simulate disconnection delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.healthConnected.set(false);
    } catch (error) {
      console.error('Failed to disconnect health service:', error);
      // TODO: Show error dialog
    } finally {
      this.loading.set(false);
    }
  }

  protected onLogout() {
    this.auth.logout();
    this.router.navigateByUrl('/login').catch(() => {});
  }
}
