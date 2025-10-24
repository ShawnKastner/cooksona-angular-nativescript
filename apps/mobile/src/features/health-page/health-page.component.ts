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
  PanGestureEventData,
  GestureStateTypes,
  Screen,
} from '@nativescript/core';

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

  @ViewChild('pagerContainer', { static: false })
  pagerContainer?: ElementRef;

  @ViewChild('scrollView', { static: false })
  scrollView?: ElementRef;

  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly metrics = this.store.metricsForSelectedDate;
  protected readonly hasLoadedOnce = this.store.hasLoadedOnce;
  protected readonly isBusy = signal(false); // For pull-to-refresh loading indicator
  protected readonly isTransitioning = signal(false);
  protected readonly isPanning = signal(false); // Signal for template binding
  protected readonly isToday = this.store.isToday;

  protected readonly requiresOnboarding = this.store.requiresOnboarding;

  // Step goal from user profile
  protected readonly stepGoal = computed(() => {
    const profile = this.store.healthData()?.userProfile;
    return profile?.stepGoal || 10000; // Default 10,000 steps
  });

  // Pan gesture configuration
  private readonly PAN_THRESHOLD = signal(80); // Minimum distance to trigger page change
  private readonly ANIMATION_DURATION = signal(300); // Snap animation duration
  // Small threshold to detect horizontal intent before disabling vertical scroll
  private readonly HORIZONTAL_DETECT_THRESHOLD = signal(8);
  private screenWidth = Screen.mainScreen.widthDIPs;

  // Internal flag to mark when we've determined the gesture is a horizontal swipe
  private panDetected = signal(false);
  // Internal flag to mark when we've determined the gesture is a vertical scroll
  private verticalDetected = signal(false);

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
   * Handle pan gesture for continuous day navigation
   * Like a page turner effect similar to Yazio
   */
  // Accept either a DOM/Event (from template) or a PanGestureEventData and normalize
  onPan(event: Event | PanGestureEventData): void {
    const args = event as PanGestureEventData;
    const container = this.pagerContainer?.nativeElement;
    // If we're transitioning between days, ignore gestures
    if (this.isTransitioning()) return;

    const deltaX = args.deltaX ?? 0;
    const deltaY = (args as any).deltaY ?? 0;
    const state = args.state;

    if (state === GestureStateTypes.began) {
      // Gesture started - don't immediately disable vertical scrolling.
      // We'll only disable when horizontal intent is detected in 'changed'.
      this.panDetected.set(false);
      this.verticalDetected.set(false);
    } else if (state === GestureStateTypes.changed) {
      // If we haven't yet decided the gesture intent, check it now.
      if (!this.panDetected() && !this.verticalDetected()) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // If horizontal movement dominates, mark as horizontal pan.
        if (absX > absY && absX > this.HORIZONTAL_DETECT_THRESHOLD()) {
          this.panDetected.set(true);
          this.isPanning.set(true);
        }

        // If vertical movement dominates, mark as vertical scroll and don't
        // allow horizontal panning for the remainder of this gesture.
        if (absY > absX && absY > this.HORIZONTAL_DETECT_THRESHOLD()) {
          this.verticalDetected.set(true);
          // keep isPanning false so ScrollView stays enabled
        }
      }

      // If a vertical gesture was detected, do not treat this as a horizontal pan
      if (this.verticalDetected()) return;

      // If it's a horizontal pan, handle translation
      if (!this.panDetected()) return;

      let newTranslateX = deltaX;

      // Prevent panning right (to next day) if already on today
      if (this.store.isToday() && deltaX < 0) {
        // Apply resistance effect
        newTranslateX = deltaX * 0.3;
      }

      // Apply the translation
      if (container) {
        container.translateX = newTranslateX;

        // Subtle opacity effect for better visual feedback
        const progress = Math.abs(deltaX) / this.screenWidth;
        const opacity = Math.max(0.7, 1 - progress * 0.3);
        container.opacity = opacity;
      }
    } else if (
      state === GestureStateTypes.ended ||
      state === GestureStateTypes.cancelled
    ) {
      // Ensure pan flags are reset immediately so ScrollView becomes usable
      this.isPanning.set(false);
      this.panDetected.set(false);

      // Pan ended - decide whether to snap to next/prev day or bounce back
      this.handlePanEnd(deltaX);
    }
  }

  /**
   * Handle pan end and decide whether to change day or snap back
   */
  private async handlePanEnd(deltaX: number): Promise<void> {
    // Ensure panning flags are cleared regardless of container availability
    this.isPanning.set(false);
    this.panDetected.set(false);
    this.verticalDetected.set(false);

    const container = this.pagerContainer?.nativeElement;
    if (!container) return;

    // Determine if we should change the day based on pan distance
    const shouldChangePage = Math.abs(deltaX) > this.PAN_THRESHOLD();

    if (shouldChangePage && deltaX > 0) {
      // Panned right - go to previous day
      await this.snapToPreviousDay(container);
    } else if (shouldChangePage && deltaX < 0 && !this.store.isToday()) {
      // Panned left - go to next day (only if not today)
      await this.snapToNextDay(container);
    } else {
      // Not enough distance or boundary hit - snap back to current position
      await this.snapBack(container);
    }
  }

  /**
   * Snap to previous day with animation
   */
  private async snapToPreviousDay(container: any): Promise<void> {
    this.isTransitioning.set(true);

    try {
      // Animate slide to the right (full screen width)
      await container.animate({
        translate: { x: this.screenWidth, y: 0 },
        opacity: 0.7,
        duration: this.ANIMATION_DURATION(),
        curve: 'easeOut',
      });

      // Change to previous day
      this.store.goToPreviousDay();
      this.announceDate('previous');

      // Reset position without animation
      container.translateX = 0;
      container.opacity = 1;
      this.resetScrollPosition();
    } catch (error) {
      console.error('Failed to snap to previous day:', error);
      container.translateX = 0;
      container.opacity = 1;
    } finally {
      this.isTransitioning.set(false);
    }
  }

  /**
   * Snap to next day with animation
   */
  private async snapToNextDay(container: any): Promise<void> {
    this.isTransitioning.set(true);

    try {
      // Animate slide to the left (full screen width)
      await container.animate({
        translate: { x: -this.screenWidth, y: 0 },
        opacity: 0.7,
        duration: this.ANIMATION_DURATION(),
        curve: 'easeOut',
      });

      // Change to next day
      this.store.goToNextDay();
      this.announceDate('next');

      // Reset position without animation
      container.translateX = 0;
      container.opacity = 1;
      this.resetScrollPosition();
    } catch (error) {
      console.error('Failed to snap to next day:', error);
      container.translateX = 0;
      container.opacity = 1;
    } finally {
      this.isTransitioning.set(false);
    }
  }

  /**
   * Snap back to current position if pan threshold not met
   */
  private async snapBack(container: any): Promise<void> {
    try {
      await container.animate({
        translate: { x: 0, y: 0 },
        opacity: 1,
        duration: 200,
        curve: 'spring',
      });
    } catch (error) {
      console.error('Failed to snap back:', error);
      container.translateX = 0;
      container.opacity = 1;
    }
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
    if (typeof (globalThis as any).accessibility !== 'undefined') {
      (globalThis as any).accessibility.announce(message);
    }
  }

  private resetScrollPosition(): void {
    const scrollView = this.scrollView?.nativeElement;
    if (!scrollView) {
      return;
    }

    try {
      if (typeof scrollView.scrollToVerticalOffset === 'function') {
        scrollView.scrollToVerticalOffset(0, false);
      } else if (scrollView?.ios?.setContentOffset) {
        scrollView.ios.setContentOffset({ x: 0, y: 0 }, false);
      }
    } catch (e) {
      // ignore platform-specific inconsistencies
    }
  }
}
