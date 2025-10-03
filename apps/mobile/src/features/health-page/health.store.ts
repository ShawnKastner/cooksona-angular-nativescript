import { Injectable, computed, inject, signal } from '@angular/core';
import { HealthApiService, MetricUpdates } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';
import {
  DailyMetrics,
  HealthData,
  UserProfile,
  getDefaultMetrics,
  getMetricsForDate,
  getTodaysMetrics,
  getDateString,
} from '@cooksona/models';

@Injectable({ providedIn: 'root' })
export class HealthStore {
  private readonly api = inject(HealthApiService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);
  readonly healthData = signal<HealthData | null>(null);
  readonly selectedDate = signal<Date>(new Date());

  private readonly activityMultipliers: Record<
    NonNullable<UserProfile>['activityLevel'],
    number
  > = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  private readonly goalAdjustments: Record<
    NonNullable<UserProfile>['goal'],
    number
  > = {
    lose: -300,
    maintain: 0,
    gain: 300,
  };

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

    // Return weekday name in German (avoid Intl because JSCore on iOS may not provide it)
    const weekdays = [
      'Sonntag',
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
    ];
    return weekdays[selected.getDay()];
  });

  readonly dateLabel = computed(() =>
    this.formatDate(this.selectedDate().toDateString()),
  );

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

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

  readonly tdee = computed(() => {
    const data = this.healthData();
    const profile = this.profile();
    if (!data || !profile) return 0;
    return Math.round(
      data.bmr * (this.activityMultipliers[profile.activityLevel] ?? 1),
    );
  });

  readonly calorieGoal = computed(() => {
    const profile = this.profile();
    if (!profile) return 0;
    return Math.round(this.tdee() + (this.goalAdjustments[profile.goal] ?? 0));
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

  readonly proteinGoal = computed(() =>
    Math.round((this.calorieGoal() * 0.3) / 4),
  );
  readonly carbsGoal = computed(() =>
    Math.round((this.calorieGoal() * 0.4) / 4),
  );
  readonly fatGoal = computed(() => Math.round((this.calorieGoal() * 0.3) / 9));

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

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.api.getHealthState();
      this.healthData.set(data ?? null);
      if (data && !data.userProfile) {
        this.selectedDate.set(new Date());
      }
    } catch (e: any) {
      console.error('Failed to load health data', e);
      this.error.set(
        e?.message ?? 'Gesundheitsdaten konnten nicht geladen werden',
      );
    } finally {
      this.loading.set(false);
    }
  }

  setSelectedDate(date: Date) {
    this.selectedDate.set(date);
  }

  goToPreviousDay() {
    const current = this.selectedDate();
    this.selectedDate.set(new Date(current.getTime() - 86400000));
  }

  goToNextDay() {
    if (this.isToday()) return;
    const current = this.selectedDate();
    this.selectedDate.set(new Date(current.getTime() + 86400000));
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    this.mutating.set(true);
    this.error.set(null);
    try {
      const data = await this.api.saveProfile(profile);
      if (data) this.healthData.set(data);
    } catch (e: any) {
      console.error('Failed to save profile', e);
      this.error.set(e?.message ?? 'Profil konnte nicht gespeichert werden');
      throw e;
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
      if (data) this.healthData.set(data);
    } catch (e: any) {
      console.error('Failed to update metrics', e);
      this.error.set(
        e?.message ?? 'Messwerte konnten nicht aktualisiert werden',
      );
      throw e;
    } finally {
      this.mutating.set(false);
    }
  }

  async updateWater(amountDelta: number): Promise<void> {
    if (!amountDelta) return;
    await this.updateMetrics({ water: amountDelta });
  }

  async updateActivity(calories: number): Promise<void> {
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
}
