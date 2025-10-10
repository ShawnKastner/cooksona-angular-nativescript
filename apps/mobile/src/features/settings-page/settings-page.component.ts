import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { AuthService } from '@cooksona/auth';
import { AuthUser } from '@cooksona/auth';
import { SvgToDataUriPipe } from '../../utils/svg-to-data-uri.pipe';
import {
  Bell,
  Moon,
  Globe,
  Shield,
  Info,
  ChevronRight,
  User as UserIcon,
  Settings as SettingsIcon,
  Apple,
  ChefHat,
} from '@cooksona/constants/icons';
import { ApplicationSettings, isIOS } from '@nativescript/core';
import { confirm } from '@nativescript/core/ui/dialogs';
import { RouterExtensions } from '@nativescript/angular';

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
  value?: string;
  type?: 'toggle' | 'navigation' | 'info';
  toggleValue?: boolean;
}

@Component({
  selector: 'ns-settings-page',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './settings-page.component.html',
})
export class SettingsPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly routerExtensions = inject(RouterExtensions);

  protected readonly icons = {
    Bell,
    Moon,
    Globe,
    Shield,
    Info,
    ChevronRight,
    User: UserIcon,
    Settings: SettingsIcon,
    Apple,
    ChefHat,
  } as const;

  protected readonly isIOS = isIOS;
  protected user = signal<AuthUser | null>(null);
  protected darkMode = signal(false);
  protected notifications = signal(true);
  protected settingsSections: SettingsSection[] = [];

  ngOnInit() {
    this.loadUserData();
    this.loadSettings();
    this.initializeSettingsSections();
  }

  private loadUserData() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      this.user.set(currentUser);
    }
  }

  private loadSettings() {
    // Load saved settings
    this.darkMode.set(
      ApplicationSettings.getBoolean('dark_mode_enabled', false),
    );
    this.notifications.set(
      ApplicationSettings.getBoolean('notifications_enabled', true),
    );
  }

  private initializeSettingsSections() {
    this.settingsSections = [
      {
        title: 'Konto',
        items: [
          {
            icon: this.icons.User,
            label: 'Profil bearbeiten',
            subtitle: 'Name, E-Mail, Passwort',
            action: () => this.navigateToEditProfile(),
            showChevron: true,
            type: 'navigation',
          },
        ],
      },
      {
        title: 'Planung',
        items: [
          {
            icon: this.icons.Apple,
            label: 'Ernährungseinstellungen',
            subtitle: 'Diät, Allergien, Mahlzeiten',
            action: () => this.navigateToNutritionSettings(),
            showChevron: true,
            type: 'navigation',
          },
          {
            icon: this.icons.ChefHat,
            label: 'Plan-Personalisierung',
            subtitle: 'Lieblingszutaten, Küchenausstattung',
            action: () => this.navigateToPlanPersonalization(),
            showChevron: true,
            type: 'navigation',
          },
        ],
      },
      {
        title: 'Benachrichtigungen',
        items: [
          {
            icon: this.icons.Bell,
            label: 'Push-Benachrichtigungen',
            subtitle: 'Erhalte Erinnerungen und Updates',
            action: () => this.toggleNotifications(),
            type: 'toggle',
            toggleValue: this.notifications(),
          },
        ],
      },
      {
        title: 'Darstellung',
        items: [
          {
            icon: this.icons.Moon,
            label: 'Dunkler Modus',
            subtitle: 'Dunkles Design aktivieren',
            action: () => this.toggleDarkMode(),
            type: 'toggle',
            toggleValue: this.darkMode(),
          },
        ],
      },
      {
        title: 'Allgemein',
        items: [
          {
            icon: this.icons.Globe,
            label: 'Sprache',
            subtitle: 'Deutsch',
            action: () => this.navigateToLanguage(),
            showChevron: true,
            type: 'navigation',
          },
          {
            icon: this.icons.Shield,
            label: 'Datenschutz',
            action: () => this.navigateToPrivacy(),
            showChevron: true,
            type: 'navigation',
          },
          {
            icon: this.icons.Info,
            label: 'Über die App',
            subtitle: 'Version 1.0.0',
            action: () => this.navigateToAbout(),
            showChevron: true,
            type: 'navigation',
          },
        ],
      },
    ];
  }

  protected navigateBack() {
    this.routerExtensions.back();
  }

  protected onToggleChange(item: SettingsItem) {
    if (item.action) {
      item.action();
    }
  }

  protected toggleNotifications() {
    const newValue = !this.notifications();
    this.notifications.set(newValue);
    ApplicationSettings.setBoolean('notifications_enabled', newValue);

    // Update the toggle value in the settings sections
    this.updateToggleValue('Push-Benachrichtigungen', newValue);

    // TODO: Implement actual notification settings
    console.log('Notifications:', newValue);
  }

  protected toggleDarkMode() {
    const newValue = !this.darkMode();
    this.darkMode.set(newValue);
    ApplicationSettings.setBoolean('dark_mode_enabled', newValue);

    // Update the toggle value in the settings sections
    this.updateToggleValue('Dunkler Modus', newValue);

    // TODO: Implement actual dark mode theme switching
    console.log('Dark mode:', newValue);
  }

  private updateToggleValue(label: string, value: boolean) {
    for (const section of this.settingsSections) {
      const item = section.items.find((i) => i.label === label);
      if (item) {
        item.toggleValue = value;
        break;
      }
    }
  }

  protected navigateToEditProfile() {
    console.log('Navigate to edit profile');
    // TODO: Implement edit profile page
  }

  protected navigateToNutritionSettings() {
    this.routerExtensions.navigate(['/nutrition-settings']);
  }

  protected navigateToPlanPersonalization() {
    this.routerExtensions.navigate(['/plan-personalization']);
  }

  protected navigateToLanguage() {
    console.log('Navigate to language settings');
    // TODO: Implement language settings
  }

  protected navigateToPrivacy() {
    console.log('Navigate to privacy settings');
    // TODO: Implement privacy settings
  }

  protected navigateToAbout() {
    console.log('Navigate to about page');
    // TODO: Implement about page
  }

  protected async deleteAccount() {
    const result = await confirm({
      title: 'Konto löschen?',
      message:
        'Möchtest du dein Konto wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      okButtonText: 'Löschen',
      cancelButtonText: 'Abbrechen',
    });

    if (result) {
      // TODO: Implement account deletion
      console.log('Delete account confirmed');
    }
  }
}
