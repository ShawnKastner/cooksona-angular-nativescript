import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  signal,
  inject,
  effect,
} from '@angular/core';
import {
  NativeScriptCommonModule,
  ModalDialogService,
} from '@nativescript/angular';
import { AuthService } from '@cooksona/auth';
import { User } from '@cooksona/models';
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
  CreditCard,
  LogOut,
} from '@cooksona/constants/icons';
import { ApplicationSettings, isIOS, Application } from '@nativescript/core';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationPreferencesService } from '../../core/services/notification-preferences.service';
import { confirm } from '@nativescript/core/ui/dialogs';
import { RouterExtensions } from '@nativescript/angular';
import { SubscriptionModalComponent } from '../profile-page/subscription-modal/subscription-modal.component';
import { ThemeService } from '../../core/services/theme.service';

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
  private readonly modalService = inject(ModalDialogService);
  private readonly themeService = inject(ThemeService);
  private readonly notificationService = inject(NotificationService);
  private readonly notificationPreferences = inject(
    NotificationPreferencesService,
  );
  private skipToggleInitialization = true;

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
    CreditCard,
    LogOut,
  } as const;

  protected readonly isIOS = isIOS;
  protected user = signal<User | null>(null);
  protected darkMode = signal(false);
  protected notifications = signal(true);
  protected settingsSections: SettingsSection[] = [];
  private readonly syncTheme = effect(() => {
    const isDark = this.themeService.isDark();
    if (this.darkMode() !== isDark) {
      this.darkMode.set(isDark);
    }
    if (this.settingsSections.length) {
      this.updateToggleValue('Dunkler Modus', isDark);
    }
  });

  ngOnInit() {
    this.loadUserData();
    this.loadSettings();
    this.initializeSettingsSections();
    setTimeout(() => {
      this.skipToggleInitialization = false;
    });
    // Refresh notification preference when returning from system settings
    Application.on(Application.resumeEvent, this.onAppResume);
  }

  ngOnDestroy() {
    Application.off(Application.resumeEvent, this.onAppResume);
  }

  private loadUserData() {
    const currentUser = this.auth.currentUser as User;
    if (currentUser) {
      this.user.set(currentUser);
    }
  }

  private loadSettings() {
    // Load saved settings
    this.darkMode.set(this.themeService.isDarkMode);
    // Use cached preference; the NotificationPreferencesService persists per-user and
    // will be updated via API when enabling/disabling reminders.
    this.notifications.set(
      this.notificationPreferences.getCachedWaterReminderEnabled(),
    );
  }

  private initializeSettingsSections() {
    const user = this.user();
    const subscriptionLabel = this.getSubscriptionLabel(user);

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
        title: 'Abonnement',
        items: [
          {
            icon: this.icons.CreditCard,
            label: 'Abo verwalten',
            subtitle: subscriptionLabel,
            action: () => this.manageSubscription(),
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
            action: () => this.navigateToNotifications(),
            showChevron: true,
            type: 'navigation',
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
      {
        title: 'Konto',
        items: [
          {
            icon: this.icons.LogOut,
            label: 'Abmelden',
            action: () => this.onLogout(),
            showChevron: false,
            type: 'navigation',
          },
        ],
      },
    ];
  }

  protected navigateBack() {
    this.routerExtensions.back();
  }

  protected onToggleChange(item: SettingsItem, event: { value: boolean }) {
    const newValue = !!event?.value;

    if (this.skipToggleInitialization) {
      this.updateToggleValue(item.label, newValue);
      return;
    }

    if (item.label === 'Push-Benachrichtigungen') {
      this.toggleNotifications(newValue);
    } else if (item.label === 'Dunkler Modus') {
      this.toggleDarkMode(newValue);
    }
  }

  protected toggleNotifications(value?: boolean) {
    const newValue = value ?? !this.notifications();

    if (newValue) {
      this.notifications.set(true);
      void this.notificationService.enableWaterReminders().then((result) => {
        if (!result.success) {
          // If permission denied or failed, reflect the actual state
          this.notifications.set(false);
        }
      });
    } else {
      this.notifications.set(false);
      void this.notificationService.disableWaterReminders();
    }

    // Update the toggle value in the settings sections
    this.updateToggleValue('Push-Benachrichtigungen', newValue);
  }

  private readonly onAppResume = async () => {
    // Re-read cached preference and refresh UI when the app resumes
    try {
      const cached =
        this.notificationPreferences.getCachedWaterReminderEnabled();
      this.notifications.set(cached);
      this.updateToggleValue('Push-Benachrichtigungen', cached);
    } catch (e) {
      // ignore
    }
  };

  protected toggleDarkMode(value?: boolean) {
    const newValue = value ?? !this.darkMode();
    this.themeService.setTheme(newValue ? 'dark' : 'light');
    this.darkMode.set(newValue);

    // Update the toggle value in the settings sections
    this.updateToggleValue('Dunkler Modus', newValue);
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

  protected navigateToNotifications() {
    this.routerExtensions.navigate(['/notifications-settings']);
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

  protected async manageSubscription() {
    try {
      const selectedPlan = await this.modalService.showModal(
        SubscriptionModalComponent,
        {
          fullscreen: true,
          animated: true,
          stretched: true,
        },
      );

      if (selectedPlan) {
        console.log('User selected plan:', selectedPlan);
        // TODO: Process the subscription purchase
        // For now, just log it
      }
    } catch (error) {
      console.error('Error showing subscription modal:', error);
    }
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

  protected onLogout() {
    this.auth.logout();
    this.routerExtensions
      .navigate(['/login'], {
        clearHistory: true,
      })
      .catch(() => {
        // Ignore navigation errors
      });
  }
}
