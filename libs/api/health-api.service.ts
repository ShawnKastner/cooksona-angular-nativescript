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

export type MealSourceType = 'manual' | 'recipe' | 'barcode';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type CreateMealEntryDto = {
  date?: string; // YYYY-MM-DD, optional
  name: string;
  sourceType: MealSourceType;
  mealType: MealType;
  recipeId?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  salt?: number | null;
  sugar?: number | null;
  fiber?: number | null;
  saturatedFat?: number | null;
};

export type UpdateMealEntryDto = {
  date?: string;
  name?: string;
  sourceType?: MealSourceType;
  mealType?: MealType;
  recipeId?: string | null;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  salt?: number | null;
  sugar?: number | null;
  fiber?: number | null;
  saturatedFat?: number | null;
};

export type ListMealsDto = {
  date?: string; // YYYY-MM-DD, optional
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

  // GET /health/meals
  listMeals(query?: ListMealsDto): Promise<any> {
    const url = query?.date
      ? `/health/meals?date=${query.date}`
      : '/health/meals';
    return this.api.get<any>(url);
  }

  // POST /health/meals
  createMeal(meal: CreateMealEntryDto): Promise<HealthData | undefined> {
    return this.api.post<HealthData>('/health/meals', meal);
  }

  // PUT /health/meals/:id
  updateMeal(
    id: string,
    meal: UpdateMealEntryDto,
  ): Promise<HealthData | undefined> {
    return this.api.put<HealthData>(`/health/meals/${id}`, meal);
  }

  // DELETE /health/meals/:id
  deleteMeal(id: string): Promise<HealthData | undefined> {
    return this.api.delete<HealthData>(`/health/meals/${id}`);
  }
}
