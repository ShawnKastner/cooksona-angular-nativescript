import { Component, computed, input, output } from '@angular/core';
import type { ActivityEntry } from '@cooksona/api';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { icons } from '@cooksona/constants/icons';
import { ACTIVITY_OPTIONS } from '@cooksona/constants/activities';

@Component({
  selector: 'app-activity-section',
  standalone: true,
  imports: [SvgInjectDirective],
  template: `
    <div class="bg-white rounded-2xl shadow-soft border border-base-200">
      <header
        class="p-6 border-b border-base-200 flex items-center justify-between"
      >
        <div>
          <h3 class="text-lg font-serif font-bold text-neutral">Aktivitäten</h3>
          <p class="text-sm text-gray-500">
            Trainings- und Bewegungsdaten für den ausgewählten Tag.
          </p>
        </div>
        <div class="text-sm text-gray-500 font-semibold">
          {{ totalCalories() | number: '1.0-0' }} kcal
        </div>
      </header>

      @if (activities().length === 0) {
        <div class="p-6 text-sm text-gray-500">
          Noch keine Aktivitäten für diesen Tag erfasst.
        </div>
      } @else {
        <div class="divide-y divide-base-200">
          @for (activity of activities(); track activity.id) {
            <div class="p-6 flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <span
                    [svgInject]="icons.Dumbbell"
                    class="w-8 h-8 text-primary"
                  ></span>
                  <div>
                    <p class="font-semibold text-neutral">
                      {{ getActivityLabel(activity.activityType) }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ formatDuration(activity.durationMinutes) }} •
                      {{ activity.caloriesBurned | number: '1.0-0' }} kcal
                    </p>
                    @if (activity.isFromAppleHealth) {
                      <p class="text-[11px] text-blue-500 font-semibold mt-1">
                        Aus Apple Health synchronisiert
                      </p>
                    }
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400 uppercase tracking-wide">
                    {{ activity.date }}
                  </span>
                  <button
                    type="button"
                    class="p-2 rounded-full hover:bg-error/10 text-error transition-colors disabled:opacity-40"
                    [disabled]="activity.isFromAppleHealth"
                    (click)="onDelete(activity.id)"
                  >
                    <span [svgInject]="icons.Trash" class="w-5 h-5"></span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ActivitySectionComponent {
  protected readonly icons = icons;

  activities = input<ActivityEntry[]>([]);
  deleteActivity = output<string>();

  private labelMap = new Map<string, string>(
    ACTIVITY_OPTIONS.map(
      (activity) => [activity.type, activity.label] as const,
    ),
  );

  protected totalCalories = computed(() =>
    (this.activities() ?? []).reduce(
      (sum, activity) => sum + (activity.caloriesBurned || 0),
      0,
    ),
  );

  protected getActivityLabel(type: string): string {
    if (type === 'active_energy') {
      return 'Aktivitätsenergie';
    }
    return this.labelMap.get(type) ?? type;
  }

  protected formatDuration(minutes: number): string {
    if (!minutes) return '0 min';
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  protected onDelete(id: string): void {
    this.deleteActivity.emit(id);
  }
}
