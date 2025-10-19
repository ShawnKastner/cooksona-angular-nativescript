import { Injectable, NgZone } from '@angular/core';
import { RouterExtensions } from '@nativescript/angular';
import {
  ApplicationSettings,
  Utils,
  isAndroid,
  isIOS,
} from '@nativescript/core';
import { LocalNotifications } from '@nativescript/local-notifications';
import { NotificationPreferencesService } from './notification-preferences.service';

interface ScheduledReminderRecord {
  id: number;
  fireDate: number; // Unix timestamp in milliseconds
}

export type EnableReminderResult =
  | { success: true }
  | { success: false; reason: 'permission_denied' | 'unknown' };

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly WATER_REMINDER_ACTION = 'water-reminder';
  private readonly WATER_REMINDER_SCHEDULE_KEY = 'water_reminder_schedule';
  private readonly WATER_REMINDER_SUPPRESSED_UNTIL_KEY =
    'water_reminder_suppressed_until';
  private readonly WATER_REMINDER_NEXT_ID_KEY = 'water_reminder_next_id';

  private readonly WATER_REMINDER_TIMES: ReadonlyArray<{
    hour: number;
    minute: number;
  }> = [
    { hour: 9, minute: 0 },
    { hour: 11, minute: 30 },
    { hour: 14, minute: 30 },
    { hour: 17, minute: 30 },
  ];

  private readonly DAYS_TO_SCHEDULE_AHEAD = 3;
  private readonly WATER_GOAL_DEFAULT = 2500;

  private tapHandlerInitialized = false;

  constructor(
    private readonly routerExtensions: RouterExtensions,
    private readonly ngZone: NgZone,
    private readonly preferences: NotificationPreferencesService,
  ) {}

  async hasPermission(): Promise<boolean> {
    try {
      return await LocalNotifications.hasPermission();
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const alreadyGranted = await LocalNotifications.hasPermission();
      if (alreadyGranted) {
        return true;
      }
      const granted = await LocalNotifications.requestPermission();
      return !!granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async enableWaterReminders(): Promise<EnableReminderResult> {
    const permissionGranted = await this.requestPermissions();
    if (!permissionGranted) {
      return { success: false, reason: 'permission_denied' };
    }

    await this.preferences.setWaterReminderEnabled(true);
    await this.syncWaterReminderSchedule();
    return { success: true };
  }

  async disableWaterReminders(): Promise<void> {
    await this.preferences.setWaterReminderEnabled(false);
    await this.cancelAllWaterReminders();
    this.saveSchedule([]);
    this.clearSuppressedUntil();
  }

  async syncWaterReminderSchedule(): Promise<void> {
    const enabled = this.preferences.getCachedWaterReminderEnabled();
    if (!enabled) {
      await this.cancelAllWaterReminders();
      this.saveSchedule([]);
      return;
    }

    if (!(await this.hasPermission())) {
      return;
    }

    const now = new Date();
    const nowTs = now.getTime();
    const todayKey = this.toDateKey(now);

    const suppressedFor = this.getSuppressedUntil();
    if (suppressedFor && suppressedFor < todayKey) {
      this.clearSuppressedUntil();
    }

    const stored = this.getStoredSchedule();
    const expired = stored.filter((entry) => entry.fireDate <= nowTs);
    if (expired.length) {
      await this.cancelByIds(expired.map((entry) => entry.id));
    }
    const upcoming = stored.filter((entry) => entry.fireDate > nowTs);

    const newEntries: ScheduledReminderRecord[] = [];

    for (let dayOffset = 0; dayOffset < this.DAYS_TO_SCHEDULE_AHEAD; dayOffset++) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + dayOffset);
      const dateKey = this.toDateKey(date);

      if (suppressedFor && suppressedFor === dateKey) {
        continue;
      }

      for (const timeSlot of this.WATER_REMINDER_TIMES) {
        const fireDate = new Date(date);
        fireDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
        const fireTs = fireDate.getTime();

        if (dayOffset === 0 && fireTs <= nowTs) {
          continue;
        }

        const alreadyScheduled = upcoming.some(
          (entry) => Math.abs(entry.fireDate - fireTs) < 500,
        );
        if (alreadyScheduled) {
          continue;
        }

        newEntries.push({
          id: this.generateNotificationId(),
          fireDate: fireTs,
        });
      }
    }

    if (newEntries.length) {
      try {
        await LocalNotifications.schedule(
          newEntries.map((entry) => ({
            id: entry.id,
            title: '💧 Zeit zu trinken!',
            body: 'Trink jetzt ein Glas Wasser und bleib hydriert.',
            badge: 1,
            sound: 'default',
            at: new Date(entry.fireDate),
            payload: { action: this.WATER_REMINDER_ACTION },
          })),
        );
      } catch (error) {
        console.error('Failed to schedule water reminders:', error);
        return;
      }
    }

    const updatedSchedule = [...upcoming, ...newEntries].sort(
      (a, b) => a.fireDate - b.fireDate,
    );
    this.saveSchedule(updatedSchedule);
  }

  async cancelAllWaterReminders(): Promise<void> {
    try {
      const ids = this.getStoredSchedule().map((entry) => entry.id);
      if (ids.length) {
        await this.cancelByIds(ids);
      }
    } catch (error) {
      console.error('Error cancelling water reminders:', error);
    }
  }

  async handleWaterIntakeChange(
    waterIntake: number,
    metricsDate: string,
    waterGoal = this.WATER_GOAL_DEFAULT,
  ): Promise<void> {
    const enabled = this.preferences.getCachedWaterReminderEnabled();
    if (!enabled) {
      return;
    }

    const todayKey = this.toDateKey(new Date());
    if (metricsDate !== todayKey) {
      return;
    }

    if (waterIntake >= waterGoal) {
      await this.suppressRemindersForToday();
      return;
    }

    if (this.getSuppressedUntil() === todayKey) {
      this.clearSuppressedUntil();
      await this.syncWaterReminderSchedule();
    }
  }

  getReminderDisplayTimes(locale?: string): string[] {
    const formatter = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
    const referenceDate = new Date();
    return this.WATER_REMINDER_TIMES.map((slot) => {
      const date = new Date(referenceDate);
      date.setHours(slot.hour, slot.minute, 0, 0);
      return formatter.format(date);
    });
  }

  openSystemNotificationSettings(): void {
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
          console.log('Water reminder tapped, navigating to water log');
          this.routerExtensions.navigate(['/home', 'health'], {
            clearHistory: false,
            queryParams: { focus: 'water' },
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

  private async suppressRemindersForToday(): Promise<void> {
    const today = new Date();
    const todayKey = this.toDateKey(today);
    const nowTs = today.getTime();

    const schedule = this.getStoredSchedule();
    const idsToCancel = schedule
      .filter((entry) => {
        if (entry.fireDate <= nowTs) {
          return false;
        }
        const dateKey = this.toDateKey(new Date(entry.fireDate));
        return dateKey === todayKey;
      })
      .map((entry) => entry.id);

    if (idsToCancel.length) {
      await this.cancelByIds(idsToCancel);
    }

    const remaining = schedule.filter((entry) => !idsToCancel.includes(entry.id));
    this.saveSchedule(remaining);
    this.setSuppressedUntil(todayKey);
  }

  private async cancelByIds(ids: number[]): Promise<void> {
    for (const id of ids) {
      try {
        await LocalNotifications.cancel(id);
      } catch (error) {
        console.error('Failed to cancel notification', id, error);
      }
    }
  }

  private getStoredSchedule(): ScheduledReminderRecord[] {
    const raw = ApplicationSettings.getString(this.WATER_REMINDER_SCHEDULE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as ScheduledReminderRecord[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(
        (entry) =>
          entry &&
          typeof entry.id === 'number' &&
          typeof entry.fireDate === 'number' &&
          Number.isFinite(entry.fireDate),
      );
    } catch (error) {
      console.warn('Failed to parse stored schedule, clearing cache.', error);
      return [];
    }
  }

  private saveSchedule(schedule: ScheduledReminderRecord[]): void {
    ApplicationSettings.setString(
      this.WATER_REMINDER_SCHEDULE_KEY,
      JSON.stringify(schedule),
    );
  }

  private getSuppressedUntil(): string | null {
    return (
      ApplicationSettings.getString(this.WATER_REMINDER_SUPPRESSED_UNTIL_KEY) ||
      null
    );
  }

  private setSuppressedUntil(dateKey: string): void {
    ApplicationSettings.setString(
      this.WATER_REMINDER_SUPPRESSED_UNTIL_KEY,
      dateKey,
    );
  }

  private clearSuppressedUntil(): void {
    ApplicationSettings.remove(this.WATER_REMINDER_SUPPRESSED_UNTIL_KEY);
  }

  private generateNotificationId(): number {
    const current = ApplicationSettings.getNumber(
      this.WATER_REMINDER_NEXT_ID_KEY,
      1200,
    );
    const next = current + 1;
    ApplicationSettings.setNumber(this.WATER_REMINDER_NEXT_ID_KEY, next);
    return current;
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
