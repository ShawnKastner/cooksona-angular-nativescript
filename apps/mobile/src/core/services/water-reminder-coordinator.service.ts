import { Injectable, effect, inject } from '@angular/core';
import { Application } from '@nativescript/core';
import { HealthStore } from '@cooksona/health';
import { NotificationService } from './notification.service';
import { NotificationPreferencesService } from './notification-preferences.service';

@Injectable({ providedIn: 'root' })
export class WaterReminderCoordinatorService {
  private readonly healthStore = inject(HealthStore);
  private readonly notificationService = inject(NotificationService);
  private readonly preferences = inject(NotificationPreferencesService);

  private readonly WATER_GOAL_DEFAULT = 2500;

  constructor() {
    effect(() => {
      const metrics = this.healthStore.todaysMetrics();
      const enabled = this.preferences.getCachedWaterReminderEnabled();
      if (!enabled) {
        return;
      }
      void this.notificationService.handleWaterIntakeChange(
        metrics.waterIntake,
        metrics.date,
        this.WATER_GOAL_DEFAULT,
      );
    });

    void this.notificationService.syncWaterReminderSchedule();
    Application.on(Application.resumeEvent, this.onAppResume);
  }

  private readonly onAppResume = () => {
    void this.notificationService.syncWaterReminderSchedule();
  };
}
