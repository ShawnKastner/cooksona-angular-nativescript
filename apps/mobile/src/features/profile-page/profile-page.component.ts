import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import {
  NativeScriptCommonModule,
  ModalDialogService,
} from '@nativescript/angular';
import { Router } from '@angular/router';
import { AuthService } from '@cooksona/auth';
import { User } from '@cooksona/models';
import { SvgToDataUriPipe } from '../../utils/svg-to-data-uri.pipe';
import {
  User as UserIcon,
  LogOut,
  Apple,
  Heart,
  ChevronDown,
  Settings,
} from '@cooksona/constants/icons';
import { isIOS, isAndroid, ApplicationSettings } from '@nativescript/core';
import { confirm } from '@nativescript/core/ui/dialogs';
import { HealthKitService } from '../../plugins/healthkit/healthkit.service';
import { HealthConnectionModalComponent } from './health-connection-modal/health-connection-modal.component';

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  icon?: string;
  imageIcon?: string;
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
  private readonly health = inject(HealthKitService);
  private readonly modalService = inject(ModalDialogService);

  protected readonly icons = {
    User: UserIcon,
    LogOut,
    Apple,
    Heart,
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

  private checkHealthConnection() {
    if (this.isIOS && this.health.isAvailable()) {
      // Check if we have a stored connection status
      const storedStatus = ApplicationSettings.getBoolean(
        'healthkit_connected',
        false,
      );

      // Use the stored status as the source of truth
      this.healthConnected.set(storedStatus);

      // Optionally verify with HealthKit API in the background
      // If authorization was revoked externally, we could detect it here
      // and update the stored status, but for now we trust the stored value
    } else if (this.isAndroid) {
      // Android path will come later (Google Fit)
      const storedStatus = ApplicationSettings.getBoolean(
        'googlefit_connected',
        false,
      );
      this.healthConnected.set(storedStatus);
    } else {
      this.healthConnected.set(false);
    }
  }

  protected async toggleHealthConnection() {
    if (this.healthConnected()) {
      // Show confirmation dialog before disconnecting
      const result = await confirm({
        title: 'Verbindung trennen?',
        message: 'Möchtest du die Verbindung zu Apple Health wirklich trennen?',
        okButtonText: 'Trennen',
        cancelButtonText: 'Abbrechen',
      });

      if (result) {
        this.loading.set(true);
        this.disconnectHealthService();
      }
    } else {
      // Show beautiful connection modal
      this.showHealthConnectionModal();
    }
  }

  private async showHealthConnectionModal() {
    try {
      const shouldConnect = await this.modalService.showModal(
        HealthConnectionModalComponent,
        {
          fullscreen: false,
          animated: true,
          stretched: false,
        },
      );

      if (shouldConnect) {
        this.loading.set(true);
        this.connectHealthService();
      }
    } catch (error) {
      console.error('Error showing health connection modal:', error);
    }
  }

  private async connectHealthService() {
    try {
      if (this.isIOS) {
        if (!this.health.isAvailable()) {
          throw new Error('Apple Health ist auf diesem Gerät nicht verfügbar.');
        }
        await this.health.requestAuthorization();

        // Save the connection status persistently
        ApplicationSettings.setBoolean('healthkit_connected', true);
        this.healthConnected.set(true);
      } else if (this.isAndroid) {
        // TODO: Implement Google Fit later
        throw new Error('Google Fit wird bald unterstützt.');
      }
    } catch (error) {
      console.error('Failed to connect health service:', error);
      // TODO: show a nice dialog/toast
    } finally {
      this.loading.set(false);
    }
  }

  private async disconnectHealthService() {
    try {
      if (this.isIOS) {
        await this.health.disconnect();
        // Clear the persistent connection status
        ApplicationSettings.setBoolean('healthkit_connected', false);
        // Inform the user they can revoke in iOS Settings > Health > Apps > Cooksona
      } else if (this.isAndroid) {
        // TODO: later for Google Fit
        ApplicationSettings.setBoolean('googlefit_connected', false);
      }
      this.healthConnected.set(false);
    } catch (error) {
      console.error('Failed to disconnect health service:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private loadUserData() {
    const currentUser = this.auth.currentUser as User;
    this.user.set(currentUser);
  }

  get settingsSections(): SettingsSection[] {
    return [
      {
        title: 'Health Integration',
        items: [
          {
            imageIcon: this.isIOS
              ? '~/assets/images/apple_health_icon.png'
              : '~/assets/images/google_fit_icon.png',
            label: this.isIOS ? 'Apple Health' : 'Google Fit',
            subtitle: this.healthConnected() ? 'Verbunden' : 'Nicht verbunden',
            action: () => this.toggleHealthConnection(),
            showChevron: false,
            isConnected: this.healthConnected(),
          },
        ],
      },
    ];
  }

  protected get userLabel(): string {
    const u = this.user();
    return u?.name || u?.email || 'Unbekannter Benutzer';
  }

  protected get userEmail(): string {
    const u = this.user();
    return u?.email || '';
  }

  protected navigateToSettings() {
    this.router.navigate(['/settings']).catch((err) => {
      console.error('Navigation to settings failed:', err);
    });
  }

  protected onLogout() {
    this.auth.logout();
    this.router.navigateByUrl('/login').catch(() => {
      // Ignore navigation errors
    });
  }
}
