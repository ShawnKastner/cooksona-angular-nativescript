import { Injectable, NgZone, inject } from '@angular/core';
import { LocalNotifications } from '@nativescript/local-notifications';
import { ApplicationSettings } from '@nativescript/core';
import { RouterExtensions } from '@nativescript/angular';
import {
  WaterReminderConfig,
  ReminderType,
  Weekday,
  WaterReminderTime,
  QuietHours,
} from '@cooksona/models';
import { ProfileSettingsApiService } from '@cooksona/api';
import { HealthStore } from '@cooksona/health';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly WATER_REMINDER_BASE_ID = 1001;
  private readonly WATER_REMINDER_ACTION = 'water-reminder';
  private readonly WATER_REMINDER_CONFIG_KEY = 'water_reminder_config_v2';
  private readonly WATER_REMINDER_SCHEDULED_IDS_KEY =
    'water_reminder_scheduled_ids';
  private tapHandlerInitialized = false;

  private readonly profileSettingsApi = inject(ProfileSettingsApiService);
  private readonly healthStore = inject(HealthStore);

  constructor(
    private readonly routerExtensions: RouterExtensions,
    private readonly ngZone: NgZone,
  ) {}

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('Requesting notification permissions...');
      const hasPermission = await LocalNotifications.hasPermission();
      console.log('Has permission:', hasPermission);

      if (!hasPermission) {
        console.log('Requesting permission from user...');
        const granted = await LocalNotifications.requestPermission();
        console.log('Permission granted:', granted);
        return granted;
      }
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule water reminders based on configuration
   */
  async scheduleWaterReminders(
    config: WaterReminderConfig,
  ): Promise<boolean> {
    try {
      console.log('Scheduling water reminders with config:', config);

      // First, request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permission not granted');
        return false;
      }

      // Cancel any existing water reminders
      await this.cancelWaterReminders();

      // If not enabled or paused, don't schedule anything
      if (!config.enabled || config.paused) {
        console.log('Water reminders disabled or paused, not scheduling');
        return true;
      }

      // Get reminder times based on type
      const times =
        config.reminderType === ReminderType.FIXED_TIMES
          ? this.getFixedReminderTimes(config)
          : this.getIntervalReminderTimes(config);

      if (!times || times.length === 0) {
        console.warn('No reminder times to schedule');
        return false;
      }

      // Filter times by weekday and quiet hours
      const filteredTimes = this.filterReminderTimes(times, config);

      // Limit to max reminders per day if set
      const limitedTimes = config.maxRemindersPerDay
        ? filteredTimes.slice(0, config.maxRemindersPerDay)
        : filteredTimes;

      console.log(`Scheduling ${limitedTimes.length} reminder(s)`);

      // Schedule each reminder
      const notifications = limitedTimes.map((time, index) => {
        const notificationTime = this.calculateNotificationTime(time);
        const notificationId = this.WATER_REMINDER_BASE_ID + index;

        return {
          id: notificationId,
          title: '💧 Zeit zu trinken!',
          body: this.getNotificationBody(config),
          badge: 1,
          sound: 'default',
          at: notificationTime,
          interval: 'day',
          payload: {
            action: this.WATER_REMINDER_ACTION,
          },
        };
      });

      if (notifications.length > 0) {
        const scheduled = await LocalNotifications.schedule(notifications);
        const success = scheduled && scheduled.length > 0;

        if (success) {
          // Save scheduled IDs for later cancellation
          const ids = notifications.map((n) => n.id);
          this.saveScheduledIds(ids);

          // Save config locally
          this.saveConfigLocally(config);

          // Sync with backend
          await this.syncConfigWithBackend(config);
        }

        console.log('Water reminders scheduled:', success);
        return success;
      }

      return false;
    } catch (error) {
      console.error('Error scheduling water reminders:', error);
      return false;
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async scheduleWaterReminder(hour: number, minute: number): Promise<boolean> {
    const config: WaterReminderConfig = {
      enabled: true,
      reminderType: ReminderType.FIXED_TIMES,
      fixedTimes: [{ hour, minute }],
      activeWeekdays: Object.values(Weekday),
    };
    return this.scheduleWaterReminders(config);
  }

  private getFixedReminderTimes(
    config: WaterReminderConfig,
  ): WaterReminderTime[] {
    return config.fixedTimes || [];
  }

  private getIntervalReminderTimes(
    config: WaterReminderConfig,
  ): WaterReminderTime[] {
    const times: WaterReminderTime[] = [];

    if (!config.intervalHours) {
      return times;
    }

    const startHour = config.intervalStartHour ?? 7;
    const startMinute = config.intervalStartMinute ?? 0;
    const endHour = config.intervalEndHour ?? 22;
    const endMinute = config.intervalEndMinute ?? 0;

    let currentHour = startHour;
    const currentMinute = startMinute;

    while (true) {
      times.push({ hour: currentHour, minute: currentMinute });

      // Add interval
      currentHour += config.intervalHours;
      if (currentHour > endHour || (currentHour === endHour && currentMinute > endMinute)) {
        break;
      }
    }

    return times;
  }

  private filterReminderTimes(
    times: WaterReminderTime[],
    config: WaterReminderConfig,
  ): WaterReminderTime[] {
    return times.filter((time) => {
      // Check quiet hours
      if (config.quietHours && this.isInQuietHours(time, config.quietHours)) {
        return false;
      }
      return true;
    });
  }

  private isInQuietHours(time: WaterReminderTime, quietHours: QuietHours): boolean {
    const timeMinutes = time.hour * 60 + time.minute;
    const startMinutes = quietHours.startHour * 60 + quietHours.startMinute;
    const endMinutes = quietHours.endHour * 60 + quietHours.endMinute;

    if (startMinutes < endMinutes) {
      // Normal case: start and end on same day
      return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
    } else {
      // Overnight case: quiet hours span midnight
      return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
    }
  }

  private calculateNotificationTime(time: WaterReminderTime): Date {
    const now = new Date();
    const notificationTime = new Date();
    notificationTime.setHours(time.hour, time.minute, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    return notificationTime;
  }

  private getNotificationBody(config: WaterReminderConfig): string {
    // Check if we can show progress
    const waterGoal = config.waterGoalMl ?? 2500;
    const currentIntake = this.healthStore.todaysMetrics().waterIntake;
    const remaining = waterGoal - currentIntake;

    if (remaining > 0 && remaining < waterGoal) {
      return `Noch ${remaining} ml bis zum Tagesziel!`;
    } else if (remaining <= 0) {
      return `Tagesziel erreicht! 🎉 Weiter so!`;
    }

    return 'Vergiss nicht, ein Glas Wasser zu trinken.';
  }

  private saveScheduledIds(ids: number[]): void {
    ApplicationSettings.setString(
      this.WATER_REMINDER_SCHEDULED_IDS_KEY,
      JSON.stringify(ids),
    );
  }

  private getScheduledIds(): number[] {
    const idsJson = ApplicationSettings.getString(
      this.WATER_REMINDER_SCHEDULED_IDS_KEY,
      '[]',
    );
    try {
      return JSON.parse(idsJson);
    } catch {
      return [];
    }
  }

  private saveConfigLocally(config: WaterReminderConfig): void {
    ApplicationSettings.setString(
      this.WATER_REMINDER_CONFIG_KEY,
      JSON.stringify(config),
    );
  }

  private async syncConfigWithBackend(
    config: WaterReminderConfig,
  ): Promise<void> {
    try {
      // Try to get existing settings
      const existing = await this.profileSettingsApi.getNotificationSettings();

      if (existing) {
        // Update existing
        await this.profileSettingsApi.updateNotificationSettings({
          waterReminder: config,
        });
      } else {
        // Create new
        await this.profileSettingsApi.createNotificationSettings({
          waterReminder: config,
        });
      }

      console.log('Notification settings synced with backend');
    } catch (error) {
      console.error('Failed to sync notification settings with backend:', error);
      // Don't fail the whole operation if backend sync fails
    }
  }

  /**
   * Cancel all water reminder notifications
   */
  async cancelWaterReminders(): Promise<void> {
    try {
      const ids = this.getScheduledIds();
      if (ids.length > 0) {
        for (const id of ids) {
          await LocalNotifications.cancel(id);
        }
        console.log(`Cancelled ${ids.length} water reminder(s)`);
      }
      // Also cancel legacy single reminder
      await LocalNotifications.cancel(this.WATER_REMINDER_BASE_ID);
    } catch (error) {
      console.error('Error cancelling water reminders:', error);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async cancelWaterReminder(): Promise<void> {
    await this.cancelWaterReminders();
  }

  /**
   * Check if water reminder is scheduled
   */
  async isWaterReminderScheduled(): Promise<boolean> {
    try {
      const allIds = await LocalNotifications.getScheduledIds();
      const savedIds = this.getScheduledIds();

      // Check if any of our saved IDs are actually scheduled
      if (savedIds.length > 0) {
        return savedIds.some((id) => allIds.includes(id));
      }

      // Fallback: check for legacy single reminder
      return allIds.includes(this.WATER_REMINDER_BASE_ID);
    } catch (error) {
      console.error('Error checking scheduled notifications:', error);
      return false;
    }
  }

  /**
   * Get all scheduled notification IDs from NativeScript API
   */
  async getAllScheduledIds(): Promise<number[]> {
    try {
      return await LocalNotifications.getScheduledIds();
    } catch (error) {
      console.error('Error getting scheduled IDs:', error);
      return [];
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      const ids = await this.getAllScheduledIds();
      if (ids.length > 0) {
        for (const id of ids) {
          await LocalNotifications.cancel(id);
        }
      }
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    callback: (notification: unknown) => void,
  ): void {
    LocalNotifications.addOnMessageReceivedCallback(callback);
  }

  /**
   * Load water reminder configuration
   */
  async loadWaterReminderConfig(): Promise<WaterReminderConfig | null> {
    try {
      // Try to load from backend first
      const settings = await this.profileSettingsApi.getNotificationSettings();
      if (settings?.waterReminder) {
        // Save to local storage for offline access
        this.saveConfigLocally(settings.waterReminder);
        return settings.waterReminder;
      }

      // Fallback to local storage
      const configJson = ApplicationSettings.getString(
        this.WATER_REMINDER_CONFIG_KEY,
        '',
      );
      if (configJson) {
        return JSON.parse(configJson) as WaterReminderConfig;
      }

      // Check for legacy settings
      const legacyTime = ApplicationSettings.getString(
        'water_reminder_time',
        '',
      );
      const legacyEnabled = ApplicationSettings.getBoolean(
        'water_reminder_enabled',
        false,
      );

      if (legacyTime && legacyEnabled) {
        const [hour, minute] = legacyTime.split(':').map(Number);
        return {
          enabled: true,
          reminderType: ReminderType.FIXED_TIMES,
          fixedTimes: [{ hour, minute }],
          activeWeekdays: Object.values(Weekday),
        };
      }

      return null;
    } catch (error) {
      console.error('Error loading water reminder config:', error);
      return null;
    }
  }

  /**
   * Pause water reminders
   */
  async pauseWaterReminders(): Promise<boolean> {
    const config = await this.loadWaterReminderConfig();
    if (!config) {
      return false;
    }

    config.paused = true;
    this.saveConfigLocally(config);
    await this.syncConfigWithBackend(config);
    await this.cancelWaterReminders();

    console.log('Water reminders paused');
    return true;
  }

  /**
   * Resume water reminders
   */
  async resumeWaterReminders(): Promise<boolean> {
    const config = await this.loadWaterReminderConfig();
    if (!config) {
      return false;
    }

    config.paused = false;
    this.saveConfigLocally(config);
    await this.syncConfigWithBackend(config);

    // Re-schedule reminders
    return await this.scheduleWaterReminders(config);
  }

  /**
   * Check if daily water goal is reached and suppress reminders if needed
   */
  shouldSuppressWaterReminders(): boolean {
    const config = this.getLocalConfig();
    if (!config?.waterGoalMl) {
      return false;
    }

    const currentIntake = this.healthStore.todaysMetrics().waterIntake;
    return currentIntake >= config.waterGoalMl;
  }

  private getLocalConfig(): WaterReminderConfig | null {
    const configJson = ApplicationSettings.getString(
      this.WATER_REMINDER_CONFIG_KEY,
      '',
    );
    if (configJson) {
      try {
        return JSON.parse(configJson) as WaterReminderConfig;
      } catch {
        return null;
      }
    }
    return null;
  }

  async initializeWaterReminderNavigation(): Promise<void> {
    if (this.tapHandlerInitialized) {
      return;
    }

    try {
      await LocalNotifications.addOnMessageReceivedCallback((notification) => {
        const action = notification?.payload?.action;
        if (action !== this.WATER_REMINDER_ACTION) {
          return;
        }

        this.ngZone.run(() => {
          console.log('Water reminder tapped, navigating to health hub');
          this.routerExtensions.navigate(['/home', 'health'], {
            clearHistory: false,
          });
        });
      });

      this.tapHandlerInitialized = true;
    } catch (error) {
      console.error(
        'Failed to initialize water reminder tap navigation:',
        error,
      );
    }
  }
}
