import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  signal,
  inject,
  computed,
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
import { confirm, action } from '@nativescript/core/ui/dialogs';
import {
  WaterReminderConfig,
  ReminderType,
  Weekday,
  WaterReminderTime,
} from '@cooksona/models';

interface WeekdayOption {
  day: Weekday;
  label: string;
  shortLabel: string;
}

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

  // Configuration
  protected config = signal<WaterReminderConfig>({
    enabled: false,
    paused: false,
    reminderType: ReminderType.FIXED_TIMES,
    fixedTimes: [{ hour: 9, minute: 0 }],
    activeWeekdays: Object.values(Weekday),
    waterGoalMl: 2500,
  });

  protected isSaving = signal(false);
  protected isLoading = signal(true);

  // UI State
  protected showAdvancedSettings = signal(false);
  protected hourItems: string[] = [];
  protected minuteItems: string[] = [];
  protected intervalOptions = [
    { value: 1, label: 'Jede Stunde' },
    { value: 2, label: 'Alle 2 Stunden' },
    { value: 3, label: 'Alle 3 Stunden' },
    { value: 4, label: 'Alle 4 Stunden' },
  ];

  // Weekday options
  protected weekdayOptions: WeekdayOption[] = [
    { day: Weekday.MONDAY, label: 'Montag', shortLabel: 'Mo' },
    { day: Weekday.TUESDAY, label: 'Dienstag', shortLabel: 'Di' },
    { day: Weekday.WEDNESDAY, label: 'Mittwoch', shortLabel: 'Mi' },
    { day: Weekday.THURSDAY, label: 'Donnerstag', shortLabel: 'Do' },
    { day: Weekday.FRIDAY, label: 'Freitag', shortLabel: 'Fr' },
    { day: Weekday.SATURDAY, label: 'Samstag', shortLabel: 'Sa' },
    { day: Weekday.SUNDAY, label: 'Sonntag', shortLabel: 'So' },
  ];

  // Computed properties
  protected reminderTypeIsFixed = computed(
    () => this.config().reminderType === ReminderType.FIXED_TIMES,
  );
  protected reminderTypeIsInterval = computed(
    () => this.config().reminderType === ReminderType.INTERVAL,
  );
  protected hasQuietHours = computed(() => !!this.config().quietHours);
  protected activeWeekdaysCount = computed(
    () => this.config().activeWeekdays?.length ?? 0,
  );

  async ngOnInit() {
    // Initialize picker items
    this.hourItems = Array.from({ length: 24 }, (_, i) =>
      i.toString().padStart(2, '0'),
    );
    this.minuteItems = Array.from({ length: 60 }, (_, i) =>
      i.toString().padStart(2, '0'),
    );

    await this.loadSettings();
    void this.requestNotificationPermissions();
    this.isLoading.set(false);
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

  private async loadSettings() {
    const loadedConfig =
      await this.notificationService.loadWaterReminderConfig();
    if (loadedConfig) {
      this.config.set(loadedConfig);
    }
  }

  // Toggle reminder enabled/disabled
  protected async toggleReminder(args: { value: boolean }) {
    const newConfig = { ...this.config(), enabled: args.value };

    if (!args.value) {
      // Disable and cancel
      newConfig.enabled = false;
      this.config.set(newConfig);
      await this.notificationService.cancelWaterReminders();
      await this.saveConfig();
      return;
    }

    // Request permissions when enabling
    const permissionGranted = await this.requestNotificationPermissions(true);
    if (!permissionGranted) {
      console.warn('Notification permission denied by user');
      newConfig.enabled = false;
      this.config.set(newConfig);
      return;
    }

    this.config.set(newConfig);
  }

  // Toggle pause/resume
  protected async togglePause(args: { value: boolean }) {
    const newConfig = { ...this.config(), paused: args.value };
    this.config.set(newConfig);

    if (args.value) {
      await this.notificationService.pauseWaterReminders();
    } else {
      await this.notificationService.resumeWaterReminders();
    }
  }

  // Toggle reminder type
  protected onReminderTypeChange(args: { value: string }) {
    const newConfig = { ...this.config() };
    newConfig.reminderType = args.value as ReminderType;

    // Set defaults based on type
    if (newConfig.reminderType === ReminderType.INTERVAL) {
      newConfig.intervalHours = newConfig.intervalHours ?? 2;
      newConfig.intervalStartHour = newConfig.intervalStartHour ?? 7;
      newConfig.intervalStartMinute = newConfig.intervalStartMinute ?? 0;
      newConfig.intervalEndHour = newConfig.intervalEndHour ?? 22;
      newConfig.intervalEndMinute = newConfig.intervalEndMinute ?? 0;
    }

    this.config.set(newConfig);
  }

  // Add a new fixed time
  protected async addFixedTime() {
    const newTime: WaterReminderTime = { hour: 12, minute: 0 };
    const newConfig = { ...this.config() };
    newConfig.fixedTimes = [...(newConfig.fixedTimes ?? []), newTime];
    this.config.set(newConfig);
  }

  // Remove a fixed time
  protected removeFixedTime(index: number) {
    const newConfig = { ...this.config() };
    newConfig.fixedTimes = newConfig.fixedTimes?.filter((_, i) => i !== index);
    this.config.set(newConfig);
  }

  // Edit a fixed time
  protected async editFixedTime(index: number) {
    const time = this.config().fixedTimes?.[index];
    if (!time) return;

    const formattedTime = `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;

    const result = await action({
      title: 'Uhrzeit bearbeiten',
      message: `Aktuelle Zeit: ${formattedTime}`,
      actions: ['Ändern', 'Löschen', 'Abbrechen'],
      cancelButtonText: 'Abbrechen',
    });

    if (result === 'Ändern') {
      // Navigate to time picker (simplified for now - using prompts)
      this.showTimePickerForFixedTime(index);
    } else if (result === 'Löschen') {
      this.removeFixedTime(index);
    }
  }

  private showTimePickerForFixedTime(index: number) {
    // For simplicity, we'll add hour/minute adjustment
    // In a real app, this would be a modal with proper time pickers
    console.log('TODO: Show time picker modal for index', index);
  }

  // Update interval hours
  protected onIntervalHoursChange(args: { value: number }) {
    const newConfig = { ...this.config() };
    newConfig.intervalHours = args.value;
    this.config.set(newConfig);
  }

  // Toggle weekday
  protected toggleWeekday(day: Weekday) {
    const newConfig = { ...this.config() };
    const activeWeekdays = newConfig.activeWeekdays ?? [];

    if (activeWeekdays.includes(day)) {
      newConfig.activeWeekdays = activeWeekdays.filter((d) => d !== day);
    } else {
      newConfig.activeWeekdays = [...activeWeekdays, day];
    }

    this.config.set(newConfig);
  }

  protected isWeekdayActive(day: Weekday): boolean {
    return this.config().activeWeekdays?.includes(day) ?? false;
  }

  // Toggle quiet hours
  protected toggleQuietHours(args: { value: boolean }) {
    const newConfig = { ...this.config() };

    if (args.value) {
      // Enable quiet hours with default values
      newConfig.quietHours = {
        startHour: 22,
        startMinute: 0,
        endHour: 7,
        endMinute: 0,
      };
    } else {
      newConfig.quietHours = undefined;
    }

    this.config.set(newConfig);
  }

  // Update quiet hours
  protected updateQuietHours(
    field: 'startHour' | 'startMinute' | 'endHour' | 'endMinute',
    value: number,
  ) {
    const newConfig = { ...this.config() };
    if (!newConfig.quietHours) return;

    newConfig.quietHours = { ...newConfig.quietHours, [field]: value };
    this.config.set(newConfig);
  }

  // Update max reminders
  protected onMaxRemindersChange(args: { value: number }) {
    const newConfig = { ...this.config() };
    newConfig.maxRemindersPerDay = args.value > 0 ? args.value : undefined;
    this.config.set(newConfig);
  }

  // Update water goal
  protected onWaterGoalChange(args: { value: number }) {
    const newConfig = { ...this.config() };
    newConfig.waterGoalMl = args.value;
    this.config.set(newConfig);
  }

  // Format time for display
  protected formatTime(time: WaterReminderTime): string {
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
  }

  // Format quiet hours for display
  protected formatQuietHoursDisplay(): string {
    const qh = this.config().quietHours;
    if (!qh) return '';

    const start = `${qh.startHour.toString().padStart(2, '0')}:${qh.startMinute.toString().padStart(2, '0')}`;
    const end = `${qh.endHour.toString().padStart(2, '0')}:${qh.endMinute.toString().padStart(2, '0')}`;
    return `${start} - ${end}`;
  }

  protected async saveSettings() {
    if (this.isSaving()) return;

    this.isSaving.set(true);

    try {
      await this.saveConfig();
      this.routerExtensions.back();
    } catch (error) {
      console.error('Error saving water reminder:', error);
      await confirm({
        title: 'Fehler',
        message: 'Die Einstellungen konnten nicht gespeichert werden.',
        okButtonText: 'OK',
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  private async saveConfig() {
    const config = this.config();

    // Validate configuration
    if (
      config.reminderType === ReminderType.FIXED_TIMES &&
      (!config.fixedTimes || config.fixedTimes.length === 0)
    ) {
      await confirm({
        title: 'Ungültige Konfiguration',
        message: 'Bitte füge mindestens eine Erinnerungszeit hinzu.',
        okButtonText: 'OK',
      });
      return;
    }

    if (config.enabled && !config.paused) {
      // Schedule notifications
      const success =
        await this.notificationService.scheduleWaterReminders(config);

      if (!success) {
        await this.showNotificationPermissionDialog();
        return;
      }
    } else {
      // Just save config without scheduling
      ApplicationSettings.setString(
        'water_reminder_config_v2',
        JSON.stringify(config),
      );
    }

    console.log('Water reminder settings saved successfully');
  }

  protected navigateBack() {
    this.routerExtensions.back();
  }

  protected toggleAdvancedSettings() {
    this.showAdvancedSettings.set(!this.showAdvancedSettings());
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
