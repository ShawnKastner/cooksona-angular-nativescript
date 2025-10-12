import { Injectable, NgZone } from '@angular/core';
import { LocalNotifications } from '@nativescript/local-notifications';
import { ApplicationSettings } from '@nativescript/core';
import { RouterExtensions } from '@nativescript/angular';

export interface WaterReminderConfig {
  enabled: boolean;
  hour: number;
  minute: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly WATER_REMINDER_ID = 1001;
  private readonly WATER_REMINDER_ACTION = 'water-reminder';
  private tapHandlerInitialized = false;

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
   * Schedule daily water reminder notification
   */
  async scheduleWaterReminder(hour: number, minute: number): Promise<boolean> {
    try {
      console.log(`Scheduling water reminder for ${hour}:${minute}...`);

      // First, request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permission not granted');
        return false;
      }

      // Cancel any existing water reminder
      await this.cancelWaterReminder();

      // Calculate the notification time
      const now = new Date();
      const notificationTime = new Date();
      notificationTime.setHours(hour, minute, 0, 0);

      // If the time has passed today, schedule for tomorrow
      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      console.log('Scheduling notification for:', notificationTime);

      // Schedule the notification
      const scheduled = await LocalNotifications.schedule([
        {
          id: this.WATER_REMINDER_ID,
          title: '💧 Zeit zu trinken!',
          body: 'Vergiss nicht, ein Glas Wasser zu trinken.',
          badge: 1,
          sound: 'default',
          at: notificationTime,
          // Schedule daily
          interval: 'day',
          payload: {
            action: this.WATER_REMINDER_ACTION,
          },
        },
      ]);

      const success = scheduled && scheduled.length > 0;
      console.log('Water reminder scheduled:', success);
      return success;
    } catch (error) {
      console.error('Error scheduling water reminder:', error);
      return false;
    }
  }

  /**
   * Cancel water reminder notification
   */
  async cancelWaterReminder(): Promise<void> {
    try {
      await LocalNotifications.cancel(this.WATER_REMINDER_ID);
      console.log('Water reminder cancelled');
    } catch (error) {
      console.error('Error cancelling water reminder:', error);
    }
  }

  /**
   * Check if water reminder is scheduled
   */
  async isWaterReminderScheduled(): Promise<boolean> {
    try {
      const ids = await LocalNotifications.getScheduledIds();
      return ids.includes(this.WATER_REMINDER_ID);
    } catch (error) {
      console.error('Error checking scheduled notifications:', error);
      return false;
    }
  }

  /**
   * Get all scheduled notification IDs
   */
  async getScheduledIds(): Promise<number[]> {
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
      const ids = await this.getScheduledIds();
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
  addNotificationReceivedListener(callback: (notification: any) => void): void {
    LocalNotifications.addOnMessageReceivedCallback(callback);
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
