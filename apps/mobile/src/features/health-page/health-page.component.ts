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
import {
  PanGestureEventData,
  GestureStateTypes,
  ScrollView,
  View,
  Screen,
} from '@nativescript/core';
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
  protected readonly hasLoadedOnce = this.store.hasLoadedOnce;
  protected readonly isBusy = signal(false); // For pull-to-refresh loading indicator
  protected hintMessage = signal<string | null>(null); // transient hint (e.g., "Kein weiterer Tag")
  protected isAnimating = signal(false); // blocks repeated swipes during transition
  private isDragging = false;
  private ignorePan = false;
  private dragOffset = 0;
  private readonly panActivationDistance = 12;
  private readonly panCommitFraction = 0.25;
  private readonly panFlingVelocity = 700;
  @ViewChild('scrollView', { read: ElementRef, static: false })
  protected scrollViewRef?: ElementRef<ScrollView>;
  @ViewChild('content', { read: ElementRef, static: false })
  protected contentRef?: ElementRef<View>;

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
    if (this.store.shouldSyncHealthKit()) {
      void this.syncHealthKitData();
    }
  }

  onPan(event: PanGestureEventData): void {
    if (this.isAnimating()) {
      return;
    }

    const content = this.contentRef?.nativeElement;
    if (!content) {
      return;
    }
    const scrollView = this.scrollViewRef?.nativeElement;

    switch (event.state) {
      case GestureStateTypes.began: {
        this.isDragging = false;
        this.ignorePan = false;
        this.dragOffset = 0;
        return;
      }
      case GestureStateTypes.changed: {
        if (this.ignorePan) {
          return;
        }
        if (!this.isDragging) {
          const absX = Math.abs(event.deltaX);
          const absY = Math.abs(event.deltaY);
          if (absX < this.panActivationDistance) {
            return;
          }
          if (absY > absX) {
            this.ignorePan = true;
            return;
          }
          this.isDragging = true;
          this.toggleScrollInteraction(scrollView, false);
        }

        const width = this.getContentWidth(content);
        const maxOffset = width;
        const clamped = Math.max(-maxOffset, Math.min(maxOffset, event.deltaX));
        content.translateX = clamped;
        this.dragOffset = clamped;
        return;
      }
      case GestureStateTypes.cancelled:
      case GestureStateTypes.ended: {
        const offset = this.dragOffset;
        const dragging = this.isDragging;
        this.isDragging = false;
        this.ignorePan = false;
        this.dragOffset = 0;
        this.toggleScrollInteraction(scrollView, true);

        if (!dragging) {
          if (offset !== 0) {
            content.translateX = 0;
          }
          return;
        }

        const width = this.getContentWidth(content);
        const threshold = Math.min(width * this.panCommitFraction, 140);
        const velocity = (event as any).deltaX ?? 0;
        const hasNext = this.store.hasNextDay();
        const hasPrevious = this.store.hasPreviousDay();
        const shouldGoNext =
          (offset <= -threshold && hasNext) ||
          (velocity < -this.panFlingVelocity && hasNext);
        const shouldGoPrevious =
          (offset >= threshold && hasPrevious) ||
          (velocity > this.panFlingVelocity && hasPrevious);

        if (shouldGoNext) {
          void this.animateDayChange(
            'next',
            () => this.store.goToNextDay(),
            offset,
          );
          return;
        }

        if (shouldGoPrevious) {
          void this.animateDayChange(
            'previous',
            () => this.store.goToPreviousDay(),
            offset,
          );
          return;
        }

        if (offset <= -threshold && !hasNext) {
          this.showHint('Kein weiterer Tag');
        } else if (offset >= threshold && !hasPrevious) {
          this.showHint('Kein vorheriger Tag');
        }

        void content
          .animate({
            translate: { x: 0, y: 0 },
            duration: 180,
            curve: 'easeOut',
          })
          .catch(() => {
            content.translateX = 0;
          });
        return;
      }
      default:
        return;
    }
  }

  private showHint(text: string): void {
    this.hintMessage.set(text);
    // auto-hide after short delay
    setTimeout(() => this.hintMessage.set(null), 900);
  }

  private async goToNextDay(): Promise<void> {
    if (!this.store.hasNextDay()) {
      this.showHint('Kein weiterer Tag');
      return;
    }
    await this.animateDayChange('next', () => this.store.goToNextDay());
  }

  private async goToPreviousDay(): Promise<void> {
    if (!this.store.hasPreviousDay()) {
      this.showHint('Kein vorheriger Tag');
      return;
    }
    await this.animateDayChange('previous', () => this.store.goToPreviousDay());
  }

  private resetScrollPosition(): void {
    const scrollView = this.scrollViewRef?.nativeElement;
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

  private async animateDayChange(
    direction: 'next' | 'previous',
    changeDay: () => void,
    startOffset = 0,
  ): Promise<void> {
    if (this.isAnimating()) {
      return;
    }
    const content = this.contentRef?.nativeElement;
    this.isAnimating.set(true);

    if (!content) {
      changeDay();
      this.resetScrollPosition();
      this.isAnimating.set(false);
      return;
    }

    const width = this.getContentWidth(content);
    const isNext = direction === 'next';
    const exitOffset = isNext ? -width : width;
    const fromOffset = startOffset ?? 0;

    let dayChanged = false;
    let originalHeight: number | null = null;

    try {
      // Fix height to prevent content shift during animation
      originalHeight = this.getContentHeight(content);
      if (originalHeight > 0) {
        content.height = originalHeight;
      }

      if (Math.abs(fromOffset - exitOffset) < 1) {
        content.translateX = exitOffset;
      } else {
        const outDuration = this.animationDurationForDistance(
          Math.abs(exitOffset - fromOffset),
          width,
        );
        await content
          .animate({
            translate: { x: exitOffset, y: 0 },
            duration: outDuration,
            curve: 'easeInOut',
          })
          .catch(() => {
            content.translateX = exitOffset;
          });
      }

      changeDay();
      dayChanged = true;
      this.resetScrollPosition();
      await this.waitForLayoutTick(content);

      const refreshedWidth = this.getContentWidth(content);
      const entryOffset = isNext ? refreshedWidth : -refreshedWidth;
      content.translateX = entryOffset;

      const inDuration = this.animationDurationForDistance(
        Math.abs(entryOffset),
        refreshedWidth,
      );

      await content
        .animate({
          translate: { x: 0, y: 0 },
          duration: inDuration,
          curve: 'easeInOut',
        })
        .catch(() => {
          content.translateX = 0;
        });
    } catch (error) {
      if (!dayChanged) {
        changeDay();
        this.resetScrollPosition();
      }
    } finally {
      content.translateX = 0;
      // Restore automatic height
      if (originalHeight !== null) {
        content.height = NaN; // NaN means 'auto' in NativeScript
      }
      this.isAnimating.set(false);
    }
  }

  private getContentWidth(view: View): number {
    const native = view as any;
    const measured =
      typeof native?.getMeasuredWidth === 'function'
        ? native.getMeasuredWidth()
        : 0;
    if (measured && measured > 0) {
      return measured;
    }
    const actual =
      typeof native?.getActualSize === 'function'
        ? native.getActualSize()
        : undefined;
    if (actual?.width && actual.width > 0) {
      return actual.width;
    }
    return Screen.mainScreen.widthDIPs || 360;
  }

  private getContentHeight(view: View): number {
    const native = view as any;
    const measured =
      typeof native?.getMeasuredHeight === 'function'
        ? native.getMeasuredHeight()
        : 0;
    if (measured && measured > 0) {
      return measured;
    }
    const actual =
      typeof native?.getActualSize === 'function'
        ? native.getActualSize()
        : undefined;
    if (actual?.height && actual.height > 0) {
      return actual.height;
    }
    return 0;
  }

  private animationDurationForDistance(
    distance: number,
    width: number,
  ): number {
    if (!width || width <= 0) {
      return 200;
    }
    const progress = Math.min(1, distance / width);
    return Math.round(140 + progress * 140);
  }

  private waitForLayoutTick(view: View): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          view.requestLayout?.();
        } catch (e) {
          // ignore
        }
        resolve();
      }, 0);
    });
  }

  private toggleScrollInteraction(
    scrollView: ScrollView | undefined,
    enabled: boolean,
  ): void {
    if (!scrollView) {
      return;
    }

    try {
      scrollView.isUserInteractionEnabled = enabled;
      if (scrollView.ios) {
        if (typeof scrollView.ios.setScrollEnabled === 'function') {
          scrollView.ios.setScrollEnabled(enabled);
        } else if (scrollView.ios.scrollEnabled !== undefined) {
          scrollView.ios.scrollEnabled = enabled;
        }
      }
      if (
        scrollView.android &&
        typeof scrollView.android.setNestedScrollingEnabled === 'function'
      ) {
        scrollView.android.setNestedScrollingEnabled(enabled);
      }
    } catch (e) {
      // ignore platform quirks
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
}
