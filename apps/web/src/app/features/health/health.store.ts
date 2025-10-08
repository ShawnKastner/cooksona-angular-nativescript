import { Injectable, computed, inject, signal } from '@angular/core';
import {
  ActivityEntry,
  HealthApiService,
  ListActivitiesDto,
  ListMealsDto,
  MealEntry,
  MetricUpdates,
  TrackActivityDto,
  UpdateActivityDto,
} from '@cooksona/api';
import {
  DailyMetrics,
  HealthData,
  UserProfile,
  getDateString,
  getDefaultMetrics,
  getMetricsForDate,
  getTodaysMetrics,
} from '@cooksona/models';

interface LoadOptions {
  force?: boolean;
  date?: Date;
}

@Injectable({ providedIn: 'root' })
export class HealthStore {
  private readonly api = inject(HealthApiService);

  private readonly MIN_RELOAD_INTERVAL_MS = 60_000;

  private pendingLoad: Promise<void> | null = null;

  private readonly lastLoadedAt = signal<number | null>(null);

  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);
  readonly healthData = signal<HealthData | null>(null);
  readonly selectedDate = signal<Date>(new Date());
  readonly meals = signal<MealEntry[]>([]);
  readonly activities = signal<ActivityEntry[]>([]);

  readonly isToday = computed(() => {
    const current = this.selectedDate();
    const now = new Date();
    return (
      current.getFullYear() === now.getFullYear() &&
      current.getMonth() === now.getMonth() &&
      current.getDate() === now.getDate()
    );
  });

  readonly dayLabel = computed(() => {
    const selected = this.selectedDate();
    if (this.isToday()) return 'Heute';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      selected.getFullYear() === yesterday.getFullYear() &&
      selected.getMonth() === yesterday.getMonth() &&
      selected.getDate() === yesterday.getDate()
    ) {
      return 'Gestern';
    }

    return selected.toLocaleDateString('de-DE', { weekday: 'long' });
  });

  readonly dateLabel = computed(() =>
    this.selectedDate().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly todaysMetrics = computed<DailyMetrics>(() => {
    const data = this.healthData();
    return data ? getTodaysMetrics(data) : getDefaultMetrics();
  });

  readonly metricsForSelectedDate = computed<DailyMetrics>(() => {
    const data = this.healthData();
    const date = this.selectedDate();
    if (!data) {
      const fallback = getDefaultMetrics();
      return { ...fallback, date: getDateString(date), eatenMeals: {} };
    }
    return getMetricsForDate(data, date);
  });

  readonly profile = computed<UserProfile | null>(
    () => this.healthData()?.userProfile ?? null,
  );
  readonly requiresOnboarding = computed(
    () => !!this.healthData() && !this.profile(),
  );

  readonly hasLoadedOnce = computed(() => this.lastLoadedAt() !== null);

  readonly calorieGoal = computed(() => {
    return this.healthData()?.calorieTarget ?? 0;
  });

  readonly proteinGoal = computed(() => {
    return this.healthData()?.macroTargets?.protein ?? 0;
  });

  readonly carbsGoal = computed(() => {
    return this.healthData()?.macroTargets?.carbs ?? 0;
  });

  readonly fatGoal = computed(() => {
    return this.healthData()?.macroTargets?.fat ?? 0;
  });

  readonly totalCaloriesWithActivity = computed(() => {
    const base = this.calorieGoal();
    const activity = this.metricsForSelectedDate().caloriesBurned;
    return Math.max(0, Math.round(base + activity));
  });

  readonly remainingCalories = computed(() => {
    const total = this.totalCaloriesWithActivity();
    const eaten = this.metricsForSelectedDate().caloriesEaten;
    return Math.max(0, Math.round(total - eaten));
  });

  readonly calorieProgress = computed(() => {
    const total = this.totalCaloriesWithActivity();
    if (!total) return 0;
    return (this.metricsForSelectedDate().caloriesEaten / total) * 100;
  });

  readonly proteinProgress = computed(() => {
    const goal = this.proteinGoal();
    if (!goal) return 0;
    return (this.metricsForSelectedDate().protein / goal) * 100;
  });

  readonly carbsProgress = computed(() => {
    const goal = this.carbsGoal();
    if (!goal) return 0;
    return (this.metricsForSelectedDate().carbs / goal) * 100;
  });

  readonly fatProgress = computed(() => {
    const goal = this.fatGoal();
    if (!goal) return 0;
    return (this.metricsForSelectedDate().fat / goal) * 100;
  });

  async load(options: LoadOptions = {}): Promise<boolean> {
    const force = options.force === true;

    if (this.pendingLoad) {
      if (force) {
        await this.pendingLoad;
      } else {
        await this.pendingLoad;
        return false;
      }
    }

    const lastLoadedAt = this.lastLoadedAt();
    if (
      !force &&
      lastLoadedAt &&
      Date.now() - lastLoadedAt < this.MIN_RELOAD_INTERVAL_MS
    ) {
      return false;
    }

    this.pendingLoad = this.performLoad(options.date);

    try {
      await this.pendingLoad;
      return true;
    } finally {
      this.pendingLoad = null;
    }
  }

  private async performLoad(dateOverride?: Date): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.api.getHealthState();

      if (!data) {
        this.healthData.set({
          userId: '',
          basalMetabolicRate: 0,
          maintenanceCalories: 0,
          calorieTarget: 0,
          macroTargets: {
            protein: 0,
            carbs: 0,
            fat: 0,
          },
          userProfile: undefined,
          dailyMetrics: [],
        });
      } else {
        this.healthData.set(data);
      }

      const baseDate = dateOverride ?? new Date();
      this.selectedDate.set(baseDate);

      await this.refreshMealsAndActivities(baseDate);

      this.markDataFresh();
    } catch (error: unknown) {
      console.error('Failed to load health data', error);
      this.error.set(
        this.resolveErrorMessage(
          error,
          'Gesundheitsdaten konnten nicht geladen werden',
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }

  private markDataFresh(): void {
    this.lastLoadedAt.set(Date.now());
  }

  setSelectedDate(date: Date): void {
    this.selectedDate.set(date);
    void this.refreshMealsAndActivities(date);
  }

  goToPreviousDay(): void {
    const current = this.selectedDate();
    const next = new Date(current.getTime() - 86400000);
    this.selectedDate.set(next);
    void this.refreshMealsAndActivities(next);
  }

  goToNextDay(): void {
    if (this.isToday()) return;
    const current = this.selectedDate();
    const next = new Date(current.getTime() + 86400000);
    this.selectedDate.set(next);
    void this.refreshMealsAndActivities(next);
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    this.mutating.set(true);
    this.error.set(null);
    try {
      const data = await this.api.saveProfile(profile);
      if (data) {
        this.healthData.set(data);
        this.markDataFresh();
      }
    } catch (error: unknown) {
      console.error('Failed to save profile', error);
      this.error.set(
        this.resolveErrorMessage(
          error,
          'Profil konnte nicht gespeichert werden',
        ),
      );
      throw error;
    } finally {
      this.mutating.set(false);
    }
  }

  async updateMetrics(updates: MetricUpdates): Promise<void> {
    this.mutating.set(true);
    this.error.set(null);
    try {
      const data = await this.api.updateMetricsForDate(
        this.selectedDate(),
        updates,
      );
      if (data) {
        this.healthData.set(data);
        this.markDataFresh();
      }
    } catch (error: unknown) {
      console.error('Failed to update metrics', error);
      this.error.set(
        this.resolveErrorMessage(
          error,
          'Messwerte konnten nicht aktualisiert werden',
        ),
      );
      throw error;
    } finally {
      this.mutating.set(false);
    }
  }

  async updateWater(amountDelta: number): Promise<void> {
    if (!amountDelta) return;
    await this.updateMetrics({ water: amountDelta });
  }

  async updateActivityCalories(calories: number): Promise<void> {
    await this.updateMetrics({ activityCalories: calories });
  }

  async updateNutrition(data: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }): Promise<void> {
    await this.updateMetrics({
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
    });
  }

  async trackActivity(activity: TrackActivityDto): Promise<void> {
    this.mutating.set(true);
    this.error.set(null);
    try {
      const data = await this.api.trackActivity(activity);
      if (data) {
        this.healthData.set(data);
      }
      await this.loadActivitiesForDate(this.selectedDate());
      this.markDataFresh();
    } catch (error: unknown) {
      console.error('Failed to track activity', error);
      this.error.set(
        this.resolveErrorMessage(
          error,
          'Aktivität konnte nicht gespeichert werden',
        ),
      );
      throw error;
    } finally {
      this.mutating.set(false);
    }
  }

  async createMeal(meal: {
    date?: string;
    name: string;
    sourceType: 'manual' | 'recipe' | 'barcode';
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
    recipeId?: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    salt?: number | null;
    sugar?: number | null;
    fiber?: number | null;
    saturatedFat?: number | null;
  }): Promise<void> {
    this.mutating.set(true);
    this.error.set(null);
    try {
      const data = await this.api.createMeal(meal);
      if (data) {
        this.healthData.set(data);
      }
      await this.loadMealsForDate(this.selectedDate());
      this.markDataFresh();
    } catch (error: unknown) {
      console.error('Failed to create meal', error);
      this.error.set(
        this.resolveErrorMessage(
          error,
          'Mahlzeit konnte nicht gespeichert werden',
        ),
      );
      throw error;
    } finally {
      this.mutating.set(false);
    }
  }

  async loadMeals(query?: ListMealsDto): Promise<MealEntry[]> {
    this.error.set(null);
    try {
      const meals = await this.api.listMeals(query);
      return meals || [];
    } catch (error: unknown) {
      console.error('Failed to load meals', error);
      this.error.set(
        this.resolveErrorMessage(
          error,
          'Mahlzeiten konnten nicht geladen werden',
        ),
      );
      return [];
    }
  }

  private async loadMealsForDate(date: Date): Promise<void> {
    const dateString = getDateString(date);
    const meals = await this.loadMeals({ date: dateString });
    this.meals.set(meals);
  }

  async loadActivities(query?: ListActivitiesDto): Promise<ActivityEntry[]> {
    this.error.set(null);
    try {
      const activities = await this.api.listActivities(query);
      return activities || [];
    } catch (error: unknown) {
      console.error('Failed to load activities', error);
      this.error.set(
        this.resolveErrorMessage(
          error,
          'Aktivitäten konnten nicht geladen werden',
        ),
      );
      return [];
    }
  }

  private async loadActivitiesForDate(date: Date): Promise<void> {
    const dateString = getDateString(date);
    const activities = await this.loadActivities({ date: dateString });
    this.activities.set(activities);
  }

  private async refreshMealsAndActivities(date: Date): Promise<void> {
    await Promise.all([
      this.loadMealsForDate(date),
      this.loadActivitiesForDate(date),
    ]);
  }

  async updateActivity(id: string, activity: UpdateActivityDto): Promise<void> {
    this.mutating.set(true);
    this.error.set(null);
    try {
      const data = await this.api.updateActivity(id, activity);
      if (data) {
        this.healthData.set(data);
      }
      await this.loadActivitiesForDate(this.selectedDate());
      this.markDataFresh();
    } catch (error: unknown) {
      console.error('Failed to update activity', error);
      this.error.set(
        this.resolveErrorMessage(
          error,
          'Aktivität konnte nicht aktualisiert werden',
        ),
      );
      throw error;
    } finally {
      this.mutating.set(false);
    }
  }

  async deleteActivity(id: string): Promise<void> {
    this.mutating.set(true);
    this.error.set(null);
    try {
      const data = await this.api.deleteActivity(id);
      if (data) {
        this.healthData.set(data);
      }
      await this.loadActivitiesForDate(this.selectedDate());
      this.markDataFresh();
    } catch (error: unknown) {
      console.error('Failed to delete activity', error);
      this.error.set(
        this.resolveErrorMessage(
          error,
          'Aktivität konnte nicht gelöscht werden',
        ),
      );
      throw error;
    } finally {
      this.mutating.set(false);
    }
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
      const { message } = error as { message?: unknown };
      if (typeof message === 'string') {
        return message;
      }
    }
    return fallback;
  }
}
