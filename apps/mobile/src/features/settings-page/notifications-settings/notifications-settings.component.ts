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
  protected waterReminderSummary = signal('Nicht aktiviert');

  ngOnInit() {
    void this.loadSettings();
    this.page.on(Page.navigatedToEvent, this.onNavigatedTo);
  }

  ngOnDestroy() {
    this.page.off(Page.navigatedToEvent, this.onNavigatedTo);
  }

  private async loadSettings() {
    const config = await this.notificationService.loadWaterReminderConfig();

    if (!config || !config.enabled) {
      this.waterReminderEnabled.set(false);
      this.waterReminderSummary.set('Nicht aktiviert');
      return;
    }

    this.waterReminderEnabled.set(true);

    if (config.paused) {
      this.waterReminderSummary.set('Pausiert');
      return;
    }

    // Build summary based on configuration
    let summary = '';

    if (config.reminderType === 'fixed_times') {
      const times = config.fixedTimes ?? [];
      if (times.length === 1) {
        const time = times[0];
        summary = `Täglich um ${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
      } else if (times.length > 1) {
        summary = `${times.length} Erinnerungen pro Tag`;
      }
    } else if (config.reminderType === 'interval') {
      const hours = config.intervalHours ?? 2;
      summary = `Alle ${hours} Stunde${hours > 1 ? 'n' : ''}`;
    }

    // Add weekday info if not all days are active
    const allWeekdays = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    const activeWeekdays = config.activeWeekdays ?? allWeekdays;
    if (activeWeekdays.length < 7 && activeWeekdays.length > 0) {
      summary += ` • ${activeWeekdays.length} Tage`;
    }

    this.waterReminderSummary.set(summary || 'Konfiguriert');
  }

  private async checkNotificationStatus() {
    // Verify if the notification is actually scheduled
    const isScheduled =
      await this.notificationService.isWaterReminderScheduled();
    const config = await this.notificationService.loadWaterReminderConfig();

    // If saved as enabled but not actually scheduled, sync the state
    if (config?.enabled && !isScheduled && !config.paused) {
      console.warn(
        'Water reminder was enabled but not scheduled, syncing state',
      );
      this.waterReminderEnabled.set(false);
    }
  }

  protected get notificationSettings(): NotificationSetting[] {
    return [
      {
        icon: this.icons.Droplet,
        label: 'Trink-Erinnerung',
        subtitle: this.waterReminderSummary(),
        enabled: this.waterReminderEnabled(),
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

    void this.loadSettings();
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
