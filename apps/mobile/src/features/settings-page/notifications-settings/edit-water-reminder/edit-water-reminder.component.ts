import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import {
  ApplicationSettings,
  Utils,
  isAndroid,
  isIOS,
} from '@nativescript/core';
import { RouterExtensions } from '@nativescript/angular';
import { NotificationService } from '../../../../core/services/notification.service';
import { confirm } from '@nativescript/core/ui/dialogs';

@Component({
  selector: 'ns-edit-water-reminder',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './edit-water-reminder.component.html',
})
export class EditWaterReminderComponent implements OnInit {
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly notificationService = inject(NotificationService);

  protected selectedHour = 9;
  protected selectedMinute = 0;
  protected reminderEnabled = signal(false);
  protected isSaving = signal(false);
  protected hourItems: string[] = [];
  protected minuteItems: string[] = [];

  ngOnInit() {
    // Initialize picker items
    this.hourItems = Array.from({ length: 24 }, (_, i) =>
      i.toString().padStart(2, '0'),
    );
    this.minuteItems = Array.from({ length: 60 }, (_, i) =>
      i.toString().padStart(2, '0'),
    );

    this.loadSettings();
    void this.requestNotificationPermissions();
  }

  private async requestNotificationPermissions(
    showPromptOnDenied = false,
  ): Promise<boolean> {
    try {
      const granted = await this.notificationService.requestPermissions();

      if (!granted && showPromptOnDenied) {
        await this.showNotificationPermissionDialog();
      }

      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      if (showPromptOnDenied) {
        await this.showNotificationPermissionDialog();
      }
      return false;
    }
  }

  private loadSettings() {
    const savedTime = ApplicationSettings.getString(
      'water_reminder_time',
      '09:00',
    );
    const [hour, minute] = savedTime.split(':').map(Number);

    this.selectedHour = hour;
    this.selectedMinute = minute;
    this.reminderEnabled.set(
      ApplicationSettings.getBoolean('water_reminder_enabled', false),
    );
  }

  protected get formattedTime(): string {
    const h = this.selectedHour.toString().padStart(2, '0');
    const m = this.selectedMinute.toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  protected get selectedHourIndex(): number {
    return this.selectedHour;
  }

  protected get selectedMinuteIndex(): number {
    return this.selectedMinute;
  }

  protected onHourChange(args: any) {
    const newIndex = this.getSelectedIndexFromArgs(args);
    if (newIndex === null) {
      console.warn('Hour change event without index payload', args);
      return;
    }

    this.selectedHour = newIndex;
  }

  protected onMinuteChange(args: any) {
    const newIndex = this.getSelectedIndexFromArgs(args);
    if (newIndex === null) {
      console.warn('Minute change event without index payload', args);
      return;
    }

    this.selectedMinute = newIndex;
  }

  private getSelectedIndexFromArgs(args: any): number | null {
    if (!args) {
      return null;
    }

    if (typeof args?.newIndex === 'number') {
      return args.newIndex;
    }

    if (typeof args?.value === 'number') {
      return args.value;
    }

    if (typeof args?.value === 'string' && args.value.trim() !== '') {
      const parsed = Number(args.value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    const picker = args?.object as { selectedIndex: number } | undefined;
    if (picker && typeof picker.selectedIndex === 'number') {
      return picker.selectedIndex;
    }

    return null;
  }

  protected async saveSettings() {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    const hour = this.selectedHour;
    const minute = this.selectedMinute;
    const timeString = this.formattedTime;

    try {
      // Save to ApplicationSettings (local storage)
      ApplicationSettings.setString('water_reminder_time', timeString);

      // Schedule the notification
      const success = await this.notificationService.scheduleWaterReminder(
        hour,
        minute,
      );

      if (success) {
        ApplicationSettings.setBoolean('water_reminder_enabled', true);
        this.routerExtensions.back();
      } else {
        ApplicationSettings.setBoolean('water_reminder_enabled', false);
        this.reminderEnabled.set(false);
        await this.showNotificationPermissionDialog();
      }
    } catch (error) {
      console.error('Error saving water reminder:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected navigateBack() {
    this.routerExtensions.back();
  }

  protected async toggleReminder(args: any) {
    const switchValue = args.object.checked;
    this.reminderEnabled.set(switchValue);

    if (!switchValue) {
      // Disable and cancel
      ApplicationSettings.setBoolean('water_reminder_enabled', false);
      await this.notificationService.cancelWaterReminder();
      return;
    }

    // Request permissions when enabling the reminder so the user sees the prompt immediately
    const permissionGranted = await this.requestNotificationPermissions(true);
    if (!permissionGranted) {
      console.warn('Notification permission denied by user');
      this.reminderEnabled.set(false);
      ApplicationSettings.setBoolean('water_reminder_enabled', false);
      if (args?.object) {
        args.object.checked = false;
      }
      return;
    }
  }

  private async showNotificationPermissionDialog(): Promise<void> {
    const shouldOpenSettings = await confirm({
      title: 'Mitteilungen deaktiviert',
      message:
        'Aktiviere Mitteilungen in den Geräteeinstellungen, um Trink-Erinnerungen zu erhalten.',
      okButtonText: 'Einstellungen',
      cancelButtonText: 'Abbrechen',
    });

    if (shouldOpenSettings) {
      this.openNotificationSettings();
    }
  }

  private openNotificationSettings(): void {
    if (isIOS) {
      Utils.openUrl('app-settings:');
      return;
    }

    if (isAndroid) {
      const context = Utils.android.getApplicationContext();
      if (!context) {
        return;
      }

      const sdkInt = android.os.Build.VERSION.SDK_INT;
      const intent =
        sdkInt >= 26
          ? new android.content.Intent(
              android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS,
            )
          : new android.content.Intent(
              android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            );

      if (sdkInt >= 26) {
        intent.putExtra(
          android.provider.Settings.EXTRA_APP_PACKAGE,
          context.getPackageName(),
        );
      } else {
        intent.setData(
          android.net.Uri.fromParts('package', context.getPackageName(), ''),
        );
      }

      intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);

      context.startActivity(intent);
    }
  }
}
