import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  inject,
  computed,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { HealthStore } from '@cooksona/health';
import { DayHeaderComponent } from './day-header/day-header.component';
import { CalorieProgressComponent } from './calorie-progress/calorie-progress.component';
import { MacronutrientsComponent } from './macronutrients/macronutrients.component';
import { WaterProgressComponent } from './water-progress/water-progress.component';
import { TrackingActionsComponent } from './tracking-actions/tracking-actions.component';
import { MealSectionComponent } from './meal-section/meal-section.component';
import { ActivitySectionComponent } from './activity-section/activity-section.component';
import { StepsCardComponent } from './steps-card/steps-card.component';
import { HealthKitSyncService } from '../../plugins/healthkit/healthkit-sync.service';
import { PullToRefresh } from '@nativescript-community/ui-pulltorefresh';
import {
  GestureTypes,
  SwipeGestureEventData,
  SwipeDirection,
} from '@nativescript/core';
import { SnackBar } from '@nativescript/community/ui-snackbar';

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
  private readonly snackbar = new SnackBar();

  @ViewChild('contentContainer', { static: false })
  contentContainer?: ElementRef;

  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly metrics = this.store.metricsForSelectedDate;
  protected readonly hasLoadedOnce = this.store.hasLoadedOnce;
  protected readonly isBusy = signal(false); // For pull-to-refresh loading indicator
  protected readonly isTransitioning = signal(false);

  protected readonly requiresOnboarding = this.store.requiresOnboarding;

  // Step goal from user profile
  protected readonly stepGoal = computed(() => {
    const profile = this.store.healthData()?.userProfile;
    return profile?.stepGoal || 10000; // Default 10,000 steps
  });

  // Swipe gesture configuration
  private readonly SWIPE_THRESHOLD = 100; // Minimum distance in pixels
  private readonly MIN_VELOCITY = 0.5; // Minimum swipe velocity
  private isSwipeInProgress = false;

  async ngOnInit(): Promise<void> {
    await this.store.load();

    // Automatically navigate to onboarding if profile is not complete
    if (this.store.requiresOnboarding()) {
      this.startOnboarding();
      return;
    }

    // Sync all Apple Health data in the background
    if (this.store.shouldSyncHealthKit()) {
      void this.syncHealthKitData();
    }
  }

  private async syncHealthKitData(): Promise<void> {
    try {
      // Sync workouts
      const workoutResult = await this.healthKitSync.syncTodayWorkouts();

      // Sync steps to daily metrics (always updates with latest values)
      const stepsResult = await this.healthKitSync.syncTodaySteps();

      // Sync active energy as activity (always updates with latest values)
      const energyResult = await this.healthKitSync.syncTodayActiveEnergy();

      const shouldReload =
        workoutResult.synced > 0 ||
        stepsResult.synced === true ||
        energyResult.synced === true;

      if (shouldReload) {
        await this.store.load({ force: true });
      }
    } catch (error) {
      console.error('Failed to sync HealthKit data:', error);
      // Don't show error to user, just log it
    } finally {
      this.store.markHealthKitSynced();
    }
  }

  async onRefresh(args: { object: PullToRefresh }): Promise<void> {
    this.isBusy.set(true);

    try {
      // Force resync of all HealthKit data
      await Promise.all([
        this.healthKitSync.syncTodayWorkouts(),
        this.healthKitSync.forceResyncSteps(),
        this.healthKitSync.forceResyncActiveEnergy(),
      ]);

      // Reload health data to get updated values
      await this.store.load({ force: true });
      this.store.markHealthKitSynced();
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

  /**
   * Handle swipe gesture for day navigation
   * Swipe left = next day, Swipe right = previous day
   */
  onSwipe(args: SwipeGestureEventData): void {
    // Prevent multiple simultaneous swipes
    if (this.isSwipeInProgress || this.isTransitioning()) {
      return;
    }

    const direction = args.direction;

    // Swipe left = next day
    if (direction === SwipeDirection.left) {
      this.navigateToNextDay();
    }
    // Swipe right = previous day
    else if (direction === SwipeDirection.right) {
      this.navigateToPreviousDay();
    }
  }

  private async navigateToPreviousDay(): Promise<void> {
    if (this.isTransitioning()) return;

    this.isSwipeInProgress = true;
    this.isTransitioning.set(true);

    try {
      // Animate transition
      await this.animateTransition('right');

      // Update date (store handles data loading)
      this.store.goToPreviousDay();

      // Announce to screen readers
      this.announceDate('previous');
    } catch (error) {
      console.error('Failed to navigate to previous day:', error);
    } finally {
      this.isSwipeInProgress = false;
      this.isTransitioning.set(false);
    }
  }

  private async navigateToNextDay(): Promise<void> {
    if (this.isTransitioning()) return;

    // Check if we're already on today
    if (this.store.isToday()) {
      this.showBoundaryMessage('future');
      return;
    }

    this.isSwipeInProgress = true;
    this.isTransitioning.set(true);

    try {
      // Animate transition
      await this.animateTransition('left');

      // Update date (store handles data loading)
      this.store.goToNextDay();

      // Announce to screen readers
      this.announceDate('next');
    } catch (error) {
      console.error('Failed to navigate to next day:', error);
    } finally {
      this.isSwipeInProgress = false;
      this.isTransitioning.set(false);
    }
  }

  /**
   * Animate content transition with fade effect
   */
  private async animateTransition(direction: 'left' | 'right'): Promise<void> {
    const container = this.contentContainer?.nativeElement;
    if (!container) return;

    try {
      // Quick fade out
      await container.animate({
        opacity: 0.3,
        duration: 150,
        curve: 'easeOut',
      });

      // Quick fade back in
      await container.animate({
        opacity: 1,
        duration: 150,
        curve: 'easeIn',
      });
    } catch (error) {
      console.error('Animation error:', error);
      // Reset opacity in case of error
      container.opacity = 1;
    }
  }

  /**
   * Show message when user reaches first or last available day
   */
  private showBoundaryMessage(boundary: 'past' | 'future'): void {
    const message =
      boundary === 'future'
        ? 'Du bist bereits beim heutigen Tag'
        : 'Keine weiteren Tage verfügbar';

    this.snackbar
      .simple(message, undefined, undefined, 2)
      .then(() => {
        // Snackbar shown successfully
      })
      .catch((error) => {
        console.error('Failed to show snackbar:', error);
      });
  }

  /**
   * Announce date change to screen readers
   */
  private announceDate(direction: 'previous' | 'next'): void {
    const dateLabel = this.store.dateLabel();
    const dayLabel = this.store.dayLabel();
    const message =
      direction === 'next'
        ? `Nächster Tag: ${dayLabel}, ${dateLabel}`
        : `Vorheriger Tag: ${dayLabel}, ${dateLabel}`;

    // For screen readers - announce the date change
    if (typeof (global as any).accessibility !== 'undefined') {
      (global as any).accessibility.announce(message);
    }
  }
}
