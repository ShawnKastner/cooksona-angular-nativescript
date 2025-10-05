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

export type UpdateActivityDto = {
  date?: string; // YYYY-MM-DD, optional
  activityType?: string;
  durationMinutes?: number;
  caloriesBurned?: number;
};

export type ListActivitiesDto = {
  date?: string; // YYYY-MM-DD, optional
};

export type ActivityEntry = {
  id: string;
  userId: string;
  date: string;
  activityType: string;
  durationMinutes: number;
  caloriesBurned: number;
  createdAt: string;
  updatedAt: string;
};

export type MealSourceType = 'manual' | 'recipe' | 'barcode';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

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
  mealType?: MealType; // optional filter by meal type
};

export type MealEntry = {
  id: string;
  userId: string;
  date: string;
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
  createdAt: string;
  updatedAt: string;
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

  // GET /health/activities
  async listActivities(query?: ListActivitiesDto): Promise<ActivityEntry[]> {
    const params = new URLSearchParams();
    if (query?.date) params.append('date', query.date);
    const url = params.toString()
      ? `/health/activities?${params.toString()}`
      : '/health/activities';
    const result = await this.api.get<ActivityEntry[]>(url);
    return result || [];
  }

  // PUT /health/activities/:id
  updateActivity(
    id: string,
    activity: UpdateActivityDto,
  ): Promise<HealthData | undefined> {
    return this.api.put<HealthData>(`/health/activities/${id}`, activity);
  }

  // DELETE /health/activities/:id
  deleteActivity(id: string): Promise<HealthData | undefined> {
    return this.api.delete<HealthData>(`/health/activities/${id}`);
  }

  // GET /health/meals
  async listMeals(query?: ListMealsDto): Promise<MealEntry[]> {
    const params = new URLSearchParams();
    if (query?.date) params.append('date', query.date);
    if (query?.mealType) params.append('mealType', query.mealType);
    const url = params.toString()
      ? `/health/meals?${params.toString()}`
      : '/health/meals';
    const result = await this.api.get<MealEntry[]>(url);
    return result || [];
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
