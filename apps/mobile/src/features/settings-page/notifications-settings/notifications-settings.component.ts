import {
  Component,
  NO_ERRORS_SCHEMA,
  OnDestroy,
  OnInit,
  computed,
  signal,
  inject,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Droplet } from '@cooksona/constants/icons';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationPreferencesService } from '../../../core/services/notification-preferences.service';
import { confirm } from '@nativescript/core/ui/dialogs';
import { NavigatedData, Page, Application } from '@nativescript/core';
import { RouterExtensions } from '@nativescript/angular';

@Component({
  selector: 'ns-notifications-settings',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './notifications-settings.component.html',
})
export class NotificationsSettingsComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly preferencesService = inject(NotificationPreferencesService);
  private readonly page = inject(Page);
  private readonly routerExtensions = inject(RouterExtensions);

  protected readonly icons = {
    Droplet,
  } as const;

  protected readonly isBusy = signal(false);
  protected readonly reminderEnabled = signal(false);
  protected readonly permissionGranted = signal<boolean | null>(null);
  protected readonly permissionLabel = computed(() => {
    const granted = this.permissionGranted();
    if (granted === null) {
      return 'Berechtigungsstatus wird geprüft…';
    }
    return granted
      ? 'Mitteilungen sind erlaubt'
      : 'Mitteilungen sind aktuell deaktiviert';
  });

  protected readonly reminderTimes = computed(() =>
    this.notificationService.getReminderDisplayTimes(),
  );

  async ngOnInit() {
    await this.loadState();
    this.page.on(Page.navigatedToEvent, this.onNavigatedBack);
    // If the user opens system settings and returns (resume), refresh state
    Application.on(Application.resumeEvent, this.onAppResume);
  }

  ngOnDestroy() {
    this.page.off(Page.navigatedToEvent, this.onNavigatedBack);
    Application.off(Application.resumeEvent, this.onAppResume);
  }

  protected async toggleReminders(event: { value: boolean }) {
    const shouldEnable = !!event?.value;

    if (this.isBusy()) {
      return;
    }

    this.isBusy.set(true);

    try {
      if (shouldEnable) {
        const result = await this.notificationService.enableWaterReminders();
        if (!result.success) {
          this.reminderEnabled.set(false);
          if (result.reason === 'permission_denied') {
            await this.showPermissionDialog();
          }
        } else {
          this.reminderEnabled.set(true);
        }
      } else {
        await this.notificationService.disableWaterReminders();
        this.reminderEnabled.set(false);
      }
    } finally {
      this.isBusy.set(false);
      await this.refreshPermissionStatus();
    }
  }

  protected async requestPermissions() {
    const granted = await this.notificationService.requestPermissions();
    if (!granted) {
      await this.showPermissionDialog();
    }
    await this.refreshPermissionStatus();
  }

  protected openSystemSettings() {
    this.notificationService.openSystemNotificationSettings();
  }

  protected navigateBack() {
    this.routerExtensions.back();
  }

  private async loadState() {
    this.isBusy.set(true);
    try {
      const [enabled] = await Promise.all([
        this.preferencesService.getWaterReminderEnabled(),
        this.refreshPermissionStatus(),
      ]);
      this.reminderEnabled.set(enabled);
      if (enabled) {
        await this.notificationService.syncWaterReminderSchedule();
      }
    } finally {
      this.isBusy.set(false);
    }
  }

  private async refreshPermissionStatus() {
    const granted = await this.notificationService.hasPermission();
    this.permissionGranted.set(granted);
  }

  private readonly onNavigatedBack = async (args: any) => {
    const data = args as NavigatedData | undefined;
    if (!data?.isBackNavigation) {
      return;
    }
    await this.loadState();
  };

  private readonly onAppResume = async () => {
    // When returning from system settings the permission state may have changed.
    await this.loadState();
  };

  private async showPermissionDialog() {
    const openSettings = await confirm({
      title: 'Mitteilungen deaktiviert',
      message:
        'Aktiviere Benachrichtigungen in den Geräteeinstellungen, um Trink-Erinnerungen zu erhalten.',
      okButtonText: 'Einstellungen',
      cancelButtonText: 'Abbrechen',
    });

    if (openSettings) {
      this.openSystemSettings();
    }
  }
}
