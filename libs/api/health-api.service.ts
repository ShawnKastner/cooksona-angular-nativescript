import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import type { HealthData, UserProfile } from '@cooksona/models';
import { getDateString } from '@cooksona/models';

export type MetricUpdates = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  water?: number;
  activityCalories?: number;
};

export type TrackActivityDto = {
  date?: string; // YYYY-MM-DD, optional
  activityType: string;
  durationMinutes: number;
  caloriesBurned: number;
};

@Injectable({ providedIn: 'root' })
export class HealthApiService {
  constructor(private readonly api: ApiService) {}

  // GET /health
  getHealthState(): Promise<HealthData | undefined> {
    return this.api.get<HealthData>('/health');
  }

  // POST /health/profile
  saveProfile(profile: UserProfile): Promise<HealthData | undefined> {
    return this.api.post<HealthData>('/health/profile', profile);
  }

  // POST /health/metrics/today
  updateTodayMetrics(updates: MetricUpdates): Promise<HealthData | undefined> {
    return this.api.post<HealthData>('/health/metrics/today', updates);
  }

  // POST /health/metrics
  updateMetricsForDate(
    date: Date,
    updates: MetricUpdates,
  ): Promise<HealthData | undefined> {
    return this.api.post<HealthData>('/health/metrics', {
      date: getDateString(date),
      ...updates,
    });
  }

  // POST /health/activities
  trackActivity(activity: TrackActivityDto): Promise<HealthData | undefined> {
    return this.api.post<HealthData>('/health/activities', activity);
  }
}
