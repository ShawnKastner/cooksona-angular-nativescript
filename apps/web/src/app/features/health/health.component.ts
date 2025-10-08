import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { icons } from '@cooksona/constants/icons';
import { HealthDashboardComponent } from './health-dashboard/health-dashboard.component';
import { HydrationTrackerComponent } from './hydration-tracker/hydration-tracker';
import { ManualEntryModalComponent } from './manual-entry-modal.ts/manual-entry-modal';
import { HealthOnboardingModalComponent } from './health-onboarding-modal/health-onboarding-modal';
import { StepsCardComponent } from './steps-card/steps-card.component';
import { MealSectionComponent } from './meal-section/meal-section.component';
import { ActivitySectionComponent } from './activity-section/activity-section.component';
import { HealthStore } from './health.store';
import type { UserProfile } from '@cooksona/models';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';

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
    StepsCardComponent,
    MealSectionComponent,
    ActivitySectionComponent,
  ],
})
export class HealthComponent implements OnInit {
  protected readonly icons = icons;
  private readonly store = inject(HealthStore);
  private readonly snackbar = inject(SnackbarService);

  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly healthData = this.store.healthData;
  protected readonly metrics = this.store.metricsForSelectedDate;
  protected readonly meals = this.store.meals;
  protected readonly activities = this.store.activities;

  protected readonly dayLabel = this.store.dayLabel;
  protected readonly dateLabel = this.store.dateLabel;
  protected readonly isToday = this.store.isToday;

  protected readonly requiresOnboarding = this.store.requiresOnboarding;
  protected readonly profile = this.store.profile;

  protected readonly stepGoal = computed(
    () => this.profile()?.stepGoal ?? 10000,
  );

  protected isManualEntryOpen = signal(false);
  protected isOnboardingOpen = signal(false);
  protected isRefreshing = signal(false);

  constructor() {
    effect(() => {
      if (this.requiresOnboarding()) {
        this.isOnboardingOpen.set(true);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.store.load();
  }

  prevDay(): void {
    this.store.goToPreviousDay();
  }

  nextDay(): void {
    this.store.goToNextDay();
  }

  async handleRefresh(): Promise<void> {
    this.isRefreshing.set(true);
    try {
      await this.store.load({ force: true });
      const currentError = this.error();
      if (currentError) {
        this.snackbar.error(currentError);
      } else {
        this.snackbar.success('Gesundheitsdaten aktualisiert.');
      }
    } catch (error: unknown) {
      console.error('Refresh failed', error);
      this.snackbar.error(
        this.getErrorMessage(
          error,
          'Aktualisierung fehlgeschlagen. Bitte versuche es später erneut.',
        ),
      );
    } finally {
      this.isRefreshing.set(false);
    }
  }

  async handleOnboardingComplete(profile: UserProfile): Promise<void> {
    try {
      await this.store.saveProfile(profile);
      this.isOnboardingOpen.set(false);
      await this.store.load({ force: true });
      this.snackbar.success('Profil gespeichert.');
    } catch (error: unknown) {
      console.error('Failed to save profile', error);
      this.snackbar.error(
        this.getErrorMessage(
          error,
          'Fehler beim Speichern des Profils. Bitte versuche es später erneut.',
        ),
      );
    }
  }

  async handleWaterUpdate(amountDelta: number): Promise<void> {
    try {
      await this.store.updateWater(amountDelta);
    } catch (error: unknown) {
      console.error('Failed to update water', error);
      this.snackbar.error(
        this.getErrorMessage(
          error,
          'Fehler beim Aktualisieren der Wasseraufnahme. Bitte versuche es später erneut.',
        ),
      );
    }
  }

  async handleSaveActivity(calories: number): Promise<void> {
    try {
      await this.store.updateActivityCalories(calories);
      this.isManualEntryOpen.set(false);
      this.snackbar.success('Aktivität gespeichert.');
    } catch (error: unknown) {
      console.error('Failed to save activity calories', error);
      this.snackbar.error(
        this.getErrorMessage(
          error,
          'Fehler beim Speichern der Aktivität. Bitte versuche es später erneut.',
        ),
      );
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
    } catch (error: unknown) {
      console.error('Failed to save nutrition', error);
      this.snackbar.error(
        this.getErrorMessage(
          error,
          'Fehler beim Speichern der Ernährung. Bitte versuche es später erneut.',
        ),
      );
    }
  }

  async handleDeleteActivity(id: string): Promise<void> {
    try {
      await this.store.deleteActivity(id);
      this.snackbar.success('Aktivität gelöscht.');
    } catch (error: unknown) {
      console.error('Failed to delete activity', error);
      this.snackbar.error(
        this.getErrorMessage(
          error,
          'Aktivität konnte nicht gelöscht werden. Bitte versuche es später erneut.',
        ),
      );
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
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
