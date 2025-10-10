import { Component, computed, effect, inject, signal } from '@angular/core';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { icons } from '@cooksona/constants/icons';
import { HealthDashboardComponent } from './health-dashboard/health-dashboard.component';
import { HydrationTrackerComponent } from './hydration-tracker/hydration-tracker';
import { ManualEntryModalComponent } from './manual-entry-modal.ts/manual-entry-modal';
import { HealthOnboardingModalComponent } from './health-onboarding-modal/health-onboarding-modal';
import { HealthStore } from '@cooksona/health';
import type { ActivityType, UserProfile } from '@cooksona/models/health.models';
import { TrackActivityModalComponent } from './track-activity-modal/track-activity-modal.component';
import { TrackMealModalComponent } from './track-meal-modal/track-meal-modal.component';
import { getDateString } from '@cooksona/models';
import type { ActivityEntry, MealEntry, MealType } from '@cooksona/api';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ACTIVITY_OPTIONS } from '@cooksona/constants/activities';

@Component({
  selector: 'app-health',
  standalone: true,
  templateUrl: './health.component.html',
  imports: [
    SvgInjectDirective,
    HealthDashboardComponent,
    HydrationTrackerComponent,
    ManualEntryModalComponent,
    HealthOnboardingModalComponent,
    TrackActivityModalComponent,
    TrackMealModalComponent,
  ],
})
export class HealthComponent {
  protected readonly icons = icons;
  private readonly store = inject(HealthStore);
  private readonly snackbar = inject(SnackbarService);

  protected readonly loading = this.store.loading;
  protected readonly mutating = this.store.mutating;
  protected readonly healthData = this.store.healthData;
  protected readonly todaysMetrics = this.store.todaysMetrics;
  protected readonly selectedMetrics = this.store.metricsForSelectedDate;
  protected readonly selectedDate = this.store.selectedDate;
  protected readonly dayLabel = this.store.dayLabel;
  protected readonly dateLabel = this.store.dateLabel;
  protected readonly isToday = this.store.isToday;
  protected readonly meals = this.store.meals;
  protected readonly activities = this.store.activities;
  protected readonly hasLoadedOnce = this.store.hasLoadedOnce;
  protected readonly error = this.store.error;

  protected readonly selectedDateString = computed(() =>
    getDateString(this.selectedDate()),
  );

  protected readonly mealSections = computed<
    Array<{
      key: MealType;
      label: string;
      icon: keyof typeof icons;
      totalCalories: number;
      items: MealEntry[];
    }>
  >(() => {
    const base: Array<{
      key: MealType;
      label: string;
      icon: keyof typeof icons;
      totalCalories: number;
      items: MealEntry[];
    }> = [
      {
        key: 'breakfast',
        label: 'Frühstück',
        icon: 'Soup',
        totalCalories: 0,
        items: [],
      },
      {
        key: 'lunch',
        label: 'Mittagessen',
        icon: 'Sandwich',
        totalCalories: 0,
        items: [],
      },
      {
        key: 'dinner',
        label: 'Abendessen',
        icon: 'UtensilsCrossed',
        totalCalories: 0,
        items: [],
      },
      {
        key: 'snacks',
        label: 'Snacks',
        icon: 'Cookie',
        totalCalories: 0,
        items: [],
      },
    ];

    for (const meal of this.meals()) {
      const section = base.find((s) => s.key === meal.mealType);
      if (section) {
        section.items.push(meal);
        section.totalCalories += meal.calories;
      }
    }
    return base;
  });

  protected readonly totalMealCalories = computed(() =>
    this.meals().reduce((sum, meal) => sum + meal.calories, 0),
  );

  protected readonly totalActivityCalories = computed(() =>
    this.activities().reduce(
      (sum, activity) => sum + activity.caloriesBurned,
      0,
    ),
  );
  protected Math = Math;
  private readonly activityLabelMap = new Map(
    ACTIVITY_OPTIONS.map((opt) => [opt.type, opt.label]),
  );

  protected getActivityLabel(type: ActivityType): string {
    return this.activityLabelMap.get(type) ?? type;
  }

  protected isAppleHealthActivity(activity: ActivityEntry): boolean {
    return activity.isFromAppleHealth === true;
  }

  constructor() {
    void this.store.load();

    effect(() => {
      if (this.store.hasLoadedOnce() && this.store.requiresOnboarding()) {
        this.isOnboardingOpen.set(true);
      }
    });

    effect(() => {
      const error = this.store.error();
      if (error) {
        this.snackbar.error(error);
      }
    });
  }

  // Modals
  protected isManualEntryOpen = signal(false);
  protected isOnboardingOpen = signal(false);
  protected isTrackActivityOpen = signal(false);
  protected isTrackMealOpen = signal(false);

  // Date navigation proxies
  prevDay() {
    this.store.goToPreviousDay();
  }
  nextDay() {
    this.store.goToNextDay();
  }

  async refresh(): Promise<void> {
    try {
      await this.store.load({ force: true });
      this.snackbar.info('Health-Daten wurden aktualisiert.');
    } catch (e) {
      // store.error effect handles messaging
    }
  }

  // Handlers
  async handleOnboardingComplete(profile: UserProfile): Promise<void> {
    try {
      await this.store.saveProfile(profile);
      this.isOnboardingOpen.set(false);
      await this.store.load({ force: true });
    } catch (e) {
      // store.error effect handles messaging
    }
  }

  async handleWaterUpdate(amountDelta: number): Promise<void> {
    try {
      await this.store.updateWater(amountDelta);
      this.snackbar.success('Wasseraufnahme aktualisiert.');
    } catch (e) {
      // store.error effect handles messaging
    }
  }

  async handleSaveActivity(calories: number): Promise<void> {
    try {
      await this.store.updateActivityCalories(calories);
      this.isManualEntryOpen.set(false);
      this.snackbar.success('Aktivität gespeichert.');
    } catch (e) {
      // store.error effect handles messaging
    }
  }

  async handleSaveNutrition(data: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }): Promise<void> {
    try {
      await this.store.updateNutrition(data);
      this.isManualEntryOpen.set(false);
      this.snackbar.success('Nährwerte gespeichert.');
    } catch (e) {
      // store.error effect handles messaging
    }
  }

  async handleTrackActivity(data: {
    activityType: string;
    durationMinutes: number;
    caloriesBurned: number;
  }): Promise<void> {
    try {
      await this.store.trackActivity({
        ...data,
        date: this.selectedDateString(),
      });
      this.isTrackActivityOpen.set(false);
      this.snackbar.success('Aktivität wurde hinzugefügt.');
    } catch (e) {
      // store.error effect handles messaging
    }
  }

  async handleTrackMeal(data: {
    name: string;
    mealType: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }): Promise<void> {
    try {
      await this.store.createMeal({
        ...data,
        date: this.selectedDateString(),
        sourceType: 'manual',
      });
      this.isTrackMealOpen.set(false);
      this.snackbar.success('Mahlzeit wurde gespeichert.');
    } catch (e) {
      // store.error effect handles messaging
    }
  }

  async handleDeleteMeal(meal: MealEntry): Promise<void> {
    try {
      await this.store.deleteMeal(meal.id);
      this.snackbar.success('Mahlzeit wurde gelöscht.');
    } catch (e) {
      // store.error effect handles messaging
    }
  }

  async handleDeleteActivity(activity: ActivityEntry): Promise<void> {
    if (this.isAppleHealthActivity(activity)) {
      this.snackbar.warning(
        'Apple Health Aktivitäten können nicht gelöscht werden.',
      );
      return;
    }
    try {
      await this.store.deleteActivity(activity.id);
      this.snackbar.success('Aktivität wurde gelöscht.');
    } catch (e) {
      // store.error effect handles messaging
    }
  }
}
