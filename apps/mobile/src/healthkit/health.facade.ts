import { Injectable } from '@angular/core';
import { ApplicationSettings, isIOS } from '@nativescript/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ActivitySummary, Workout } from './health-domain.models';
import {
  DateRange,
  HealthDataPluginDataSource,
  TodayMetrics,
} from './health-data.plugin.datasource';
import { HealthKitIosDataSource } from './healthkit.ios.datasource';
import { DEFAULT_STEP_GOAL, HealthStore } from './health.store';

const STEP_GOAL_KEY = 'healthkit.stepGoal';

@Injectable()
export class HealthFacade {
  readonly errors$ = this.store.errors$;

  constructor(
    private readonly store: HealthStore,
    private readonly pluginData: HealthDataPluginDataSource,
    private readonly iosData: HealthKitIosDataSource,
  ) {
    const savedGoal = ApplicationSettings.getNumber(STEP_GOAL_KEY, DEFAULT_STEP_GOAL);
    this.store.setGoal(savedGoal);
  }

  async init(): Promise<void> {
    if (!isIOS) {
      const message = 'Apple Health ist nur auf iOS verfügbar.';
      this.store.setError(message);
      return Promise.reject(message);
    }

    try {
      const [pluginAvailable, kitAvailable] = await Promise.all([
        this.pluginData.isAvailable(),
        Promise.resolve(this.iosData.isAvailable()),
      ]);

      if (!pluginAvailable || !kitAvailable) {
        const message = 'Apple Health ist auf diesem Gerät nicht verfügbar.';
        this.store.setError(message);
        return Promise.reject(message);
      }

      await this.pluginData.requestAuthorization();
      await this.iosData.requestAuthorization();

      await this.syncToday();
    } catch (error) {
      const message = this.resolveError(error, 'Apple Health konnte nicht verbunden werden.');
      this.store.setError(message);
      return Promise.reject(message);
    }
  }

  async syncToday(): Promise<void> {
    try {
      const context = this.buildTodayContext();
      const metrics = await this.pluginData.readTodayMetrics(context.range);
      const workouts = await this.iosData.fetchWorkouts(context.range);

      this.publishSummary(metrics, context.dateISO);
      this.store.setWorkouts(workouts);
      this.store.clearError();
    } catch (error) {
      const message = this.resolveError(error, 'Synchronisation der Gesundheitsdaten fehlgeschlagen.');
      this.store.setError(message);
      return Promise.reject(message);
    }
  }

  startLiveStepMonitoring(): void {
    void this.pluginData
      .startStepMonitoring(
        () => {
          void this.syncToday().catch(() => undefined);
        },
        (message) => this.store.setError(message),
      )
      .catch((error) => {
        const message = this.resolveError(
          error,
          'Live-Aktualisierung der Schritte konnte nicht gestartet werden.',
        );
        this.store.setError(message);
      });
  }

  observeSummary(): Observable<ActivitySummary> {
    return this.store.summary$.pipe(
      filter((summary): summary is ActivitySummary => summary !== null),
    );
  }

  observeWorkouts(): Observable<Workout[]> {
    return this.store.workouts$;
  }

  setStepGoal(goal: number): void {
    this.store.setGoal(goal);
    ApplicationSettings.setNumber(STEP_GOAL_KEY, this.store.goalSnapshot);
  }

  private publishSummary(metrics: TodayMetrics, dateISO: string): void {
    this.store.setSummary({
      dateISO,
      steps: metrics.steps,
      distanceKm: metrics.distanceKm,
      activeKcal: metrics.activeKcal,
    });
  }

  private buildTodayContext(): { range: DateRange; dateISO: string } {
    const now = new Date();
    const start = new Date(now.getTime());
    start.setHours(0, 0, 0, 0);

    return {
      range: { start, end: now },
      dateISO: this.formatLocalDateISO(start),
    };
  }

  private formatLocalDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resolveError(error: unknown, fallback: string): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message || fallback;
    }

    return fallback;
  }
}
