import { Component, computed, input, output, signal } from '@angular/core';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { icons } from '@cooksona/constants/icons';
import {
  ACTIVITY_OPTIONS,
  ActivityCategory,
  ACTIVITY_CATEGORIES,
} from '@cooksona/constants/activities';
import { calculateCaloriesBurned, type ActivityOption } from '@cooksona/models';

@Component({
  selector: 'app-track-activity-modal',
  standalone: true,
  imports: [SvgInjectDirective],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        (click)="close.emit()"
      >
        <div
          class="bg-base-100 w-full max-w-3xl rounded-2xl shadow-soft-xl border border-base-200 overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <header
            class="p-6 border-b border-base-200 flex items-start justify-between gap-4"
          >
            <div>
              <h2 class="text-2xl font-serif font-bold text-neutral">
                Aktivität protokollieren
              </h2>
              <p class="text-sm text-gray-500 mt-1">
                Wähle eine Aktivität und trage deine Dauer ein. Kalorien werden
                automatisch anhand deines Profils berechnet.
              </p>
            </div>
            <button
              type="button"
              class="p-2 rounded-full text-gray-400 hover:bg-base-200 hover:text-neutral transition-colors"
              (click)="close.emit()"
            >
              <span [svgInject]="icons.X" class="w-6 h-6"></span>
            </button>
          </header>

          <div class="grid lg:grid-cols-[1fr,320px] gap-6 p-6">
            <div class="space-y-5">
              <div>
                <label class="font-semibold text-sm text-neutral mb-2 block"
                  >Aktivität</label
                >
                <div
                  class="relative border-2 border-base-200 rounded-xl focus-within:border-primary transition-colors"
                >
                  <div class="absolute inset-y-0 left-0 flex items-center pl-4">
                    <span
                      [svgInject]="icons.Dumbbell"
                      class="w-5 h-5 text-gray-400"
                    ></span>
                  </div>
                  <input
                    type="search"
                    class="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent focus:outline-none text-neutral"
                    placeholder="Suche nach einer Aktivität..."
                    [value]="searchTerm()"
                    (input)="onSearch($event)"
                  />
                </div>
                <div
                  class="mt-3 max-h-64 overflow-y-auto border border-base-200 rounded-xl divide-y divide-base-200"
                >
                  @for (category of filteredCategories(); track category.category) {
                    <div>
                      <div class="px-4 py-2 bg-base-200/60 text-xs font-bold uppercase text-gray-500 sticky top-0">
                        {{ category.category }}
                      </div>
                      @for (activity of category.activities; track activity.type) {
                        <button
                          type="button"
                          class="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-primary/10 transition-colors"
                          [class.bg-primary/10]="activity.type === activityType()"
                          (click)="selectActivity(activity)"
                        >
                          <span class="font-medium text-sm text-neutral">
                            {{ activity.label }}
                          </span>
                          <span class="text-xs text-gray-500">
                            {{ activity.met ?? '–' }} MET
                          </span>
                        </button>
                      }
                    </div>
                  }
                </div>
                @if (selectedActivityLabel()) {
                  <p class="text-xs text-gray-500 mt-2">
                    Ausgewählt: <strong>{{ selectedActivityLabel() }}</strong>
                  </p>
                }
              </div>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="font-semibold text-sm text-neutral mb-2 block"
                    >Dauer (Minuten)</label
                  >
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <span
                        [svgInject]="icons.Clock"
                        class="w-5 h-5 text-gray-400"
                      ></span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      class="w-full pl-12 pr-4 py-3 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-neutral"
                      [value]="durationMinutes()"
                      (input)="onDurationChange($event)"
                    />
                  </div>
                </div>
                <div>
                  <label class="font-semibold text-sm text-neutral mb-2 block"
                    >Berechnete Kalorien</label
                  >
                  <div
                    class="px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-primary font-semibold"
                  >
                    {{ calculatedCalories() }} kcal
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    Basierend auf {{ weight() }}&nbsp;kg Körpergewicht.
                  </p>
                </div>
              </div>
            </div>

            <aside
              class="bg-base-200/60 rounded-2xl border border-base-200 p-6 space-y-4"
            >
              <h3 class="font-serif font-semibold text-neutral text-lg">
                Zusammenfassung
              </h3>
              <ul class="space-y-3 text-sm text-gray-600">
                <li class="flex items-center gap-2">
                  <span
                    [svgInject]="icons.ClipboardList"
                    class="w-5 h-5 text-gray-400"
                  ></span>
                  Aktivität: {{ selectedActivityLabel() || '–' }}
                </li>
                <li class="flex items-center gap-2">
                  <span
                    [svgInject]="icons.Clock"
                    class="w-5 h-5 text-gray-400"
                  ></span>
                  Dauer: {{ durationMinutes() }} Minuten
                </li>
                <li class="flex items-center gap-2">
                  <span
                    [svgInject]="icons.Flame"
                    class="w-5 h-5 text-gray-400"
                  ></span>
                  Kalorien: {{ calculatedCalories() }} kcal
                </li>
              </ul>
              @if (error()) {
                <p class="text-xs text-error">{{ error() }}</p>
              }
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold py-3 shadow-soft hover:bg-primary-focus transition-colors"
                  (click)="submit()"
                >
                  <span [svgInject]="icons.Check" class="w-4 h-4"></span>
                  Aktivität speichern
                </button>
                <button
                  type="button"
                  class="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-base-200 text-neutral font-semibold py-3 hover:bg-base-200 transition-colors"
                  (click)="close.emit()"
                >
                  <span [svgInject]="icons.X" class="w-4 h-4"></span>
                  Abbrechen
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    }
  `,
})
export class TrackActivityModalComponent {
  protected readonly icons = icons;
  protected readonly categories = ACTIVITY_CATEGORIES;

  isOpen = input<boolean>(false);
  close = output<void>();
  save = output<{
    activityType: string;
    durationMinutes: number;
    caloriesBurned: number;
  }>();
  weight = input<number>(70);

  protected activityType = signal<string | null>(null);
  protected durationMinutes = signal<number>(30);
  protected searchTerm = signal('');
  protected error = signal('');

  protected readonly filteredCategories = computed<ActivityCategory[]>(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.categories;
    }
    return this.categories
      .map((category) => ({
        ...category,
        activities: category.activities.filter((activity) =>
          activity.label.toLowerCase().includes(term),
        ),
      }))
      .filter((category) => category.activities.length > 0);
  });

  protected readonly selectedActivity = computed<ActivityOption | null>(() => {
    const type = this.activityType();
    if (!type) return null;
    return ACTIVITY_OPTIONS.find((activity) => activity.type === type) ?? null;
  });

  protected readonly selectedActivityLabel = computed(() => {
    return this.selectedActivity()?.label ?? '';
  });

  protected readonly calculatedCalories = computed(() => {
    const type = this.activityType();
    const duration = this.durationMinutes();
    if (!type || duration <= 0) return 0;
    return calculateCaloriesBurned(type, duration, this.weight());
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  selectActivity(activity: ActivityOption): void {
    this.activityType.set(activity.type);
    this.error.set('');
  }

  onDurationChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value ?? 0);
    this.durationMinutes.set(Number.isFinite(value) ? Math.max(0, value) : 0);
  }

  submit(): void {
    const activityType = this.activityType();
    const duration = this.durationMinutes();
    if (!activityType) {
      this.error.set('Bitte wähle eine Aktivität aus.');
      return;
    }
    if (!duration || duration <= 0) {
      this.error.set('Bitte gib eine Dauer größer als 0 Minuten ein.');
      return;
    }

    this.save.emit({
      activityType,
      durationMinutes: Math.round(duration),
      caloriesBurned: this.calculatedCalories(),
    });
  }
}
