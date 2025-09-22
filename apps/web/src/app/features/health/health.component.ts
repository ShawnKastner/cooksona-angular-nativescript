import { Component, computed, inject, signal } from '@angular/core';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { icons } from '@cooksona/constants/icons';
import { HealthDashboardComponent } from './health-dashboard/health-dashboard.component';
import { HydrationTrackerComponent } from './hydration-tracker/hydration-tracker';
import { ManualEntryModalComponent } from './manual-entry-modal.ts/manual-entry-modal';
import { HealthOnboardingModalComponent } from './health-onboarding-modal/health-onboarding-modal';
import { AuthService } from '@cooksona/auth';
import { HealthApiService } from '@cooksona/api';
import {
  getDefaultMetrics,
  getMetricsForDate,
  getTodaysMetrics,
} from '@cooksona/models';
import type {
  DailyMetrics,
  HealthData,
  UserProfile,
} from '@cooksona/models/health.models';
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
  ],
})
export class HealthComponent {
  protected readonly icons = icons;
  private readonly auth = inject(AuthService);
  private readonly healthApi = inject(HealthApiService);
  private readonly snackbar = inject(SnackbarService);

  protected isLoading = signal(false);
  protected healthData = signal<HealthData | null>(null);

  constructor() {
    // Load on init
    this.loadHealthData();
  }

  // Date navigation
  protected selectedDate = signal<Date>(new Date());
  protected isToday = computed(() => {
    const d = this.selectedDate();
    const n = new Date();
    return (
      d.getFullYear() === n.getFullYear() &&
      d.getMonth() === n.getMonth() &&
      d.getDate() === n.getDate()
    );
  });
  protected dayLabel = computed(() =>
    this.isToday()
      ? 'Heute'
      : this.selectedDate().toLocaleDateString('de-DE', { weekday: 'long' })
  );
  protected dateLabel = computed(() =>
    this.selectedDate().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  );

  protected todaysMetrics = computed<DailyMetrics>(() => {
    const data = this.healthData();
    return data ? getTodaysMetrics(data) : getDefaultMetrics();
  });
  protected selectedMetrics = computed<DailyMetrics | null>(() => {
    const data = this.healthData();
    return data ? getMetricsForDate(data, this.selectedDate()) : null;
  });

  // Template helpers to avoid using `new` or complex expressions in HTML
  prevDay() {
    const d = this.selectedDate();
    this.selectedDate.set(new Date(d.getTime() - 86400000));
  }
  nextDay() {
    if (this.isToday()) return;
    const d = this.selectedDate();
    this.selectedDate.set(new Date(d.getTime() + 86400000));
  }

  // Modals
  protected isManualEntryOpen = signal(false);
  protected isOnboardingOpen = signal(false);

  // Load data
  async loadHealthData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.healthApi.getHealthState();
      if (data) this.healthData.set(data);
      if (data && !data.userProfile) {
        this.isOnboardingOpen.set(true);
      }
    } catch (e) {
      this.snackbar.error(
        'Fehler beim Laden der Gesundheitsdaten. Bitte versuche es später erneut.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  // Handlers
  async handleOnboardingComplete(profile: UserProfile): Promise<void> {
    try {
      const updated = await this.healthApi.saveProfile(profile);
      if (updated) this.healthData.set(updated);
      this.isOnboardingOpen.set(false);
    } catch (e) {
      this.snackbar.error(
        'Fehler beim Speichern des Profils. Bitte versuche es später erneut.'
      );
    }
  }

  async handleWaterUpdate(amountDelta: number): Promise<void> {
    try {
      const updated = await this.healthApi.updateMetricsForDate(
        this.selectedDate(),
        {
          water: amountDelta,
        }
      );
      if (updated) this.healthData.set(updated);
    } catch (e) {
      this.snackbar.error(
        'Fehler beim Aktualisieren der Wasseraufnahme. Bitte versuche es später erneut.'
      );
    }
  }

  async handleSaveActivity(calories: number): Promise<void> {
    try {
      const updated = await this.healthApi.updateMetricsForDate(
        this.selectedDate(),
        {
          activityCalories: calories,
        }
      );
      if (updated) this.healthData.set(updated);
      this.isManualEntryOpen.set(false);
    } catch (e) {
      this.snackbar.error(
        'Fehler beim Speichern der Aktivität. Bitte versuche es später erneut.'
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
      const updated = await this.healthApi.updateMetricsForDate(
        this.selectedDate(),
        data
      );
      if (updated) this.healthData.set(updated);
      this.isManualEntryOpen.set(false);
    } catch (e) {
      this.snackbar.error(
        'Fehler beim Speichern der Ernährung. Bitte versuche es später erneut.'
      );
    }
  }
}
