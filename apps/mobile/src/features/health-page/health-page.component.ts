import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  inject,
  computed,
  signal,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { HealthStore } from './health.store';
import { DayHeaderComponent } from './day-header/day-header.component';
import { CalorieProgressComponent } from './calorie-progress/calorie-progress.component';
import { MacronutrientsComponent } from './macronutrients/macronutrients.component';
import { WaterProgressComponent } from './water-progress/water-progress.component';
import { TrackingActionsComponent } from './tracking-actions/tracking-actions.component';
import { MealSectionComponent } from './meal-section/meal-section.component';
import { ActivitySectionComponent } from './activity-section/activity-section.component';
import { StepsCardComponent } from './steps-card/steps-card.component';
import { HealthKitSyncService } from '../../plugins/healthkit/healthkit-sync.service';

@Component({
  selector: 'ns-health-page',
  standalone: true,
  templateUrl: './health-page.component.html',
  imports: [
    NativeScriptCommonModule,
    DayHeaderComponent,
    CalorieProgressComponent,
    MacronutrientsComponent,
    WaterProgressComponent,
    TrackingActionsComponent,
    MealSectionComponent,
    ActivitySectionComponent,
    StepsCardComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HealthPageComponent implements OnInit {
  private readonly store = inject(HealthStore);
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly healthKitSync = inject(HealthKitSyncService);

  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly metrics = this.store.metricsForSelectedDate;
  protected readonly isBusy = signal(false); // For pull-to-refresh loading indicator

  protected readonly requiresOnboarding = this.store.requiresOnboarding;

  // Step goal from user profile
  protected readonly stepGoal = computed(() => {
    const profile = this.store.healthData()?.userProfile;
    return profile?.stepGoal || 10000; // Default 10,000 steps
  });

  async ngOnInit(): Promise<void> {
    await this.store.load();

    // Automatically navigate to onboarding if profile is not complete
    if (this.store.requiresOnboarding()) {
      this.startOnboarding();
      return;
    }

    // Sync all Apple Health data in the background
    this.syncHealthKitData();
  }

  private async syncHealthKitData(): Promise<void> {
    try {
      // Sync workouts
      const workoutResult = await this.healthKitSync.syncTodayWorkouts();
      if (workoutResult.synced > 0) {
        console.log(
          `Successfully synced ${workoutResult.synced} workout(s) from Apple Health`,
        );
      }

      // Sync steps to daily metrics (always updates with latest values)
      const stepsResult = await this.healthKitSync.syncTodaySteps();
      if (stepsResult.synced) {
        console.log(
          `Successfully synced ${stepsResult.steps} steps to daily metrics`,
        );
      }

      // Sync active energy as activity (always updates with latest values)
      const energyResult = await this.healthKitSync.syncTodayActiveEnergy();
      if (energyResult.synced) {
        console.log(
          `Successfully synced ${energyResult.calories} kcal active energy as activity`,
        );
      }

      // Always reload data after sync to show latest values
      // Steps and active energy change throughout the day
      await this.store.load();
    } catch (error) {
      console.error('Failed to sync HealthKit data:', error);
      // Don't show error to user, just log it
    }
  }

  async onRefresh(args: any): Promise<void> {
    console.log('[Health Page] Pull-to-refresh triggered');
    this.isBusy.set(true);

    try {
      // Force resync of all HealthKit data
      console.log('[Health Page] Starting force resync...');
      const results = await Promise.all([
        this.healthKitSync.syncTodayWorkouts(),
        this.healthKitSync.forceResyncSteps(),
        this.healthKitSync.forceResyncActiveEnergy(),
      ]);

      console.log('[Health Page] Sync results:', results);

      // Reload health data to get updated values
      console.log('[Health Page] Reloading health data...');
      await this.store.load();

      console.log('[Health Page] Refresh complete');
    } catch (error) {
      console.error('[Health Page] Refresh failed:', error);
    } finally {
      // Tell pull-to-refresh we're done
      this.isBusy.set(false);
      args.object.refreshing = false;
    }
  }

  startOnboarding(): void {
    this.routerExtensions.navigate(['/home/health-onboarding'], {
      clearHistory: false,
      animated: true,
    });
  }
}
