import {
  Component,
  inject,
  NO_ERRORS_SCHEMA,
  signal,
  computed,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { HealthStore } from '../health.store';
import type { ActivityEntry } from '@cooksona/api';
import {
  Dumbbell,
  Pencil,
  Trash,
  ChevronDown,
} from '@cooksona/constants/icons';
import { ACTIVITY_OPTIONS } from '@cooksona/constants/activities';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { action, alert } from '@nativescript/core/ui/dialogs';
import { RouterExtensions } from '@nativescript/angular';
import { showCustomConfirm } from '../../../utils/custom-confirm';
import { Frame } from '@nativescript/core';

@Component({
  selector: 'ns-activity-section',
  templateUrl: './activity-section.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ActivitySectionComponent {
  private readonly store = inject(HealthStore);
  private readonly routerExtensions = inject(RouterExtensions);

  protected readonly loading = this.store.loading;
  protected readonly activities = this.store.activities;
  protected expandedActivity = signal<string | null>(null);

  protected readonly icons = {
    Dumbbell,
    Pencil,
    Trash,
    ChevronDown,
  } as const;

  // Computed total calories from activities
  protected readonly totalCalories = computed<number>(() => {
    return this.activities().reduce(
      (sum, activity) => sum + activity.caloriesBurned,
      0,
    );
  });

  protected toggleActivity(id: string): void {
    const current = this.expandedActivity();
    this.expandedActivity.set(current === id ? null : id);
  }

  protected getActivityLabel(activityType: string): string {
    const option = ACTIVITY_OPTIONS.find((opt) => opt.type === activityType);
    return option?.label || activityType;
  }

  protected async onLongPress(activity: ActivityEntry): Promise<void> {
    try {
      const result = await action({
        title: this.getActivityLabel(activity.activityType),
        message: `${this.formatDuration(activity.durationMinutes)} • ${activity.caloriesBurned} kcal`,
        cancelButtonText: 'Abbrechen',
        actions: ['Bearbeiten', 'Löschen'],
      });

      // Action sheet is now closed, proceed with the selected action
      if (result === 'Bearbeiten') {
        // Navigate immediately without animation to prevent action sheet from staying open
        this.routerExtensions
          .navigate(['/edit-activity'], {
            queryParams: {
              id: activity.id,
              activityType: activity.activityType,
              activityLabel: this.getActivityLabel(activity.activityType),
              durationMinutes: activity.durationMinutes.toString(),
              caloriesBurned: activity.caloriesBurned.toString(),
              date: activity.date,
            },
            animated: false, // Disable animation to close action sheet properly
            transition: {
              name: 'fade',
              duration: 200,
            },
          })
          .catch((err) => {
            console.error('Navigation error:', err);
            alert({
              title: 'Fehler',
              message: 'Navigation fehlgeschlagen.',
              okButtonText: 'OK',
            });
          });
      } else if (result === 'Löschen') {
        // Use setTimeout to ensure action sheet is fully closed before showing confirm
        setTimeout(async () => {
          await this.deleteActivity(activity);
        }, 300);
      }
    } catch (error) {
      console.error('Error showing action sheet:', error);
    }
  }

  private async deleteActivity(activity: ActivityEntry): Promise<void> {
    try {
      const confirmed = await showCustomConfirm({
        title: 'Aktivität löschen',
        message: `Möchtest du "${this.getActivityLabel(activity.activityType)}" wirklich löschen?`,
        okButtonText: 'Löschen',
        cancelButtonText: 'Abbrechen',
        okButtonColor: '#EF4444', // Red color for destructive action
      });

      if (confirmed) {
        await this.store.deleteActivity(activity.id);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      await alert({
        title: 'Fehler',
        message: 'Aktivität konnte nicht gelöscht werden.',
        okButtonText: 'OK',
      });
    }
  }

  protected getActivityIcon(activityType: string): string {
    // You can add more specific icons based on activity type
    return this.icons.Dumbbell;
  }

  protected formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
}
