import { Injectable } from '@angular/core';
import { ApplicationSettings } from '@nativescript/core';
import { HealthApiService, TrackActivityDto } from '@cooksona/api';
import { TodayMetrics } from './health-data.plugin.datasource';
import { Workout } from './health-domain.models';
import { mapWorkoutTypeToActivityType } from './__mappers__/workout-type.map';

interface StoredSummary {
  steps: number;
  distanceKm: number;
  activeKcal: number;
}

const SUMMARY_KEY_PREFIX = 'healthkit.syncedSummary.';
const WORKOUT_KEY_PREFIX = 'healthkit.syncedWorkouts.';

@Injectable()
export class HealthBackendDataSource {
  constructor(private readonly api: HealthApiService) {}

  async syncDailySummary(
    dateISO: string,
    metrics: TodayMetrics,
    syncedWorkoutCalories: number,
  ): Promise<void> {
    const previous = this.getStoredSummary(dateISO);
    const deltaKcal =
      metrics.activeKcal - (previous?.activeKcal ?? 0) - syncedWorkoutCalories;

    if (deltaKcal > 0) {
      await this.api.updateMetricsForDate(this.parseDate(dateISO), {
        activityCalories: deltaKcal,
      });
    }

    this.storeSummary(dateISO, metrics);
  }

  async syncWorkouts(dateISO: string, workouts: Workout[]): Promise<{
    errors: string[];
    syncedCalories: number;
  }> {
    if (!workouts.length) {
      return { errors: [], syncedCalories: 0 };
    }

    const syncedIds = new Set(this.getStoredWorkoutIds(dateISO));
    const errors: string[] = [];
    let syncedCalories = 0;

    for (const workout of workouts) {
      if (syncedIds.has(workout.id)) {
        continue;
      }

      const dto = this.mapToTrackDto(dateISO, workout);
      if (!dto) {
        syncedIds.add(workout.id);
        continue;
      }

      try {
        await this.api.trackActivity(dto);
        syncedIds.add(workout.id);
        syncedCalories += dto.caloriesBurned;
      } catch (error) {
        errors.push(this.resolveError(error, 'Workout konnte nicht synchronisiert werden.'));
      }
    }

    if (syncedIds.size) {
      this.storeWorkouts(dateISO, Array.from(syncedIds));
    }

    return { errors, syncedCalories };
  }

  private mapToTrackDto(dateISO: string, workout: Workout): TrackActivityDto | null {
    const activityType = mapWorkoutTypeToActivityType(workout.activityType);
    const durationMinutes = Math.max(1, Math.round(workout.durationSec / 60));
    const caloriesBurned = Math.max(0, Math.round(workout.activeKcal ?? 0));

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return null;
    }

    return {
      activityType,
      durationMinutes,
      caloriesBurned,
      date: dateISO,
    };
  }

  private getStoredSummary(dateISO: string): StoredSummary | null {
    const raw = ApplicationSettings.getString(this.summaryKey(dateISO));
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as StoredSummary;
      return parsed;
    } catch (error) {
      console.warn('Failed to parse stored Health summary', error);
      return null;
    }
  }

  private storeSummary(dateISO: string, metrics: TodayMetrics): void {
    const payload: StoredSummary = {
      steps: metrics.steps,
      distanceKm: metrics.distanceKm,
      activeKcal: metrics.activeKcal,
    };
    ApplicationSettings.setString(this.summaryKey(dateISO), JSON.stringify(payload));
  }

  private getStoredWorkoutIds(dateISO: string): string[] {
    const raw = ApplicationSettings.getString(this.workoutKey(dateISO));
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to parse stored workout IDs', error);
      return [];
    }
  }

  private storeWorkouts(dateISO: string, workoutIds: string[]): void {
    ApplicationSettings.setString(this.workoutKey(dateISO), JSON.stringify(workoutIds));
  }

  private summaryKey(dateISO: string): string {
    return `${SUMMARY_KEY_PREFIX}${dateISO}`;
  }

  private workoutKey(dateISO: string): string {
    return `${WORKOUT_KEY_PREFIX}${dateISO}`;
  }

  private parseDate(dateISO: string): Date {
    // Use noon to avoid timezone edge cases when converting ISO date-only strings.
    return new Date(`${dateISO}T12:00:00`);
  }

  private resolveError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message || fallback;
    }

    if (typeof error === 'string') {
      return error;
    }

    return fallback;
  }
}
