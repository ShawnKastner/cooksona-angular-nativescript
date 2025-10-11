import {
  Component,
  NO_ERRORS_SCHEMA,
  OnDestroy,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Droplet, ChevronRight } from '@cooksona/constants/icons';
import {
  ApplicationSettings,
  EventData,
  NavigatedData,
  Page,
} from '@nativescript/core';
import { RouterExtensions } from '@nativescript/angular';
import { NotificationService } from '../../../core/services/notification.service';

interface NotificationSetting {
  icon: string;
  label: string;
  subtitle: string;
  enabled: boolean;
  time?: string;
  action: () => void;
}

@Component({
  selector: 'ns-notifications-settings',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './notifications-settings.component.html',
})
export class NotificationsSettingsComponent implements OnInit, OnDestroy {
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly notificationService = inject(NotificationService);
  private readonly page = inject(Page);

  protected readonly icons = {
    Droplet,
    ChevronRight,
  } as const;

  protected waterReminderEnabled = signal(false);
  protected waterReminderTime = signal('09:00');

  ngOnInit() {
    this.loadSettings();
    this.checkNotificationStatus();
    this.page.on(Page.navigatedToEvent, this.onNavigatedTo);
  }

  ngOnDestroy() {
    this.page.off(Page.navigatedToEvent, this.onNavigatedTo);
  }

  private loadSettings() {
    // Load saved settings
    this.waterReminderEnabled.set(
      ApplicationSettings.getBoolean('water_reminder_enabled', false),
    );
    this.waterReminderTime.set(
      ApplicationSettings.getString('water_reminder_time', '09:00'),
    );
  }

  private async checkNotificationStatus() {
    // Verify if the notification is actually scheduled
    const isScheduled =
      await this.notificationService.isWaterReminderScheduled();
    const savedEnabled = ApplicationSettings.getBoolean(
      'water_reminder_enabled',
      false,
    );

    // If saved as enabled but not actually scheduled, sync the state
    if (savedEnabled && !isScheduled) {
      console.warn(
        'Water reminder was enabled but not scheduled, syncing state',
      );
      ApplicationSettings.setBoolean('water_reminder_enabled', false);
      this.waterReminderEnabled.set(false);
    }
  }

  protected get notificationSettings(): NotificationSetting[] {
    return [
      {
        icon: this.icons.Droplet,
        label: 'Trink-Erinnerung',
        subtitle: this.waterReminderEnabled()
          ? `Täglich um ${this.waterReminderTime()}`
          : 'Nicht aktiviert',
        enabled: this.waterReminderEnabled(),
        time: this.waterReminderTime(),
        action: () => this.editWaterReminder(),
      },
    ];
  }

  protected navigateBack() {
    this.routerExtensions.back();
  }

  protected async editWaterReminder() {
    this.routerExtensions.navigate(['/edit-water-reminder']);
  }

  private readonly onNavigatedTo = (args: EventData) => {
    const navData = args as NavigatedData;
    if (!navData?.isBackNavigation) {
      return;
    }

    this.loadSettings();
    void this.checkNotificationStatus();
  };

  protected async onToggleChange(
    setting: NotificationSetting,
    event: { value: boolean },
  ) {
    const newValue = !!event?.value;

    if (setting.label === 'Trink-Erinnerung') {
      const wasEnabled = this.waterReminderEnabled();

      if (!newValue && wasEnabled) {
        // User is turning it off - cancel the notification silently
        await this.notificationService.cancelWaterReminder();
        ApplicationSettings.setBoolean('water_reminder_enabled', false);
        this.waterReminderEnabled.set(false);
      } else if (newValue && !wasEnabled) {
        // User is turning it on - navigate to time selection
        this.waterReminderEnabled.set(true);
        this.editWaterReminder();
      }
    }
  }
}
