import { Component, input, output, signal } from '@angular/core';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { icons } from '@cooksona/constants/icons';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

const MEAL_TYPES: Array<{
  key: MealType;
  label: string;
  description: string;
  icon: keyof typeof icons;
}> = [
  {
    key: 'breakfast',
    label: 'Frühstück',
    description: 'Starte energiegeladen in den Tag',
    icon: 'Soup',
  },
  {
    key: 'lunch',
    label: 'Mittagessen',
    description: 'Herzhafte Stärkung zur Tagesmitte',
    icon: 'Sandwich',
  },
  {
    key: 'dinner',
    label: 'Abendessen',
    description: 'Leichte und wohltuende Mahlzeit',
    icon: 'UtensilsCrossed',
  },
  {
    key: 'snacks',
    label: 'Snacks',
    description: 'Kleine Zwischenmahlzeiten & Drinks',
    icon: 'Cookie',
  },
];

@Component({
  selector: 'app-track-meal-modal',
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
                Mahlzeit erfassen
              </h2>
              <p class="text-sm text-gray-500 mt-1">
                Ergänze Mahlzeiten, die nicht automatisch aus deinem Plan
                übernommen wurden.
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
            <div class="space-y-6">
              <div>
                <label class="font-semibold text-sm text-neutral mb-2 block"
                  >Titel der Mahlzeit</label
                >
                <div class="relative">
                  <div
                    class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                  >
                    <span
                      [svgInject]="icons.Apple"
                      class="w-5 h-5 text-gray-400"
                    ></span>
                  </div>
                  <input
                    type="text"
                    class="w-full pl-12 pr-4 py-3 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-neutral"
                    placeholder="z.B. Avocado Toast"
                    [value]="name()"
                    (input)="onNameChange($event)"
                  />
                </div>
              </div>

              <div>
                <label class="font-semibold text-sm text-neutral mb-3 block"
                  >Kategorie</label
                >
                <div class="grid sm:grid-cols-2 gap-3">
                  @for (meal of mealTypes; track meal.key) {
                    <button
                      type="button"
                      class="p-4 rounded-xl border transition-colors text-left"
                      [class.border-primary]="mealType() === meal.key"
                      [class.bg-primary/10]="mealType() === meal.key"
                      (click)="selectMealType(meal.key)"
                    >
                      <div class="flex items-center gap-3">
                        <span
                          [svgInject]="icons[meal.icon]"
                          class="w-6 h-6 text-primary"
                        ></span>
                        <div>
                          <p class="font-semibold text-neutral text-sm">
                            {{ meal.label }}
                          </p>
                          <p class="text-xs text-gray-500">
                            {{ meal.description }}
                          </p>
                        </div>
                      </div>
                    </button>
                  }
                </div>
              </div>

              <div>
                <label class="font-semibold text-sm text-neutral mb-3 block"
                  >Nährwerte</label
                >
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <span class="text-xs text-gray-500 font-medium"
                      >Kalorien (kcal)</span
                    >
                    <input
                      type="number"
                      min="0"
                      class="mt-1 w-full px-3 py-2 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      [value]="nutrition().calories"
                      (input)="onNutritionChange('calories', $event)"
                    />
                  </div>
                  <div>
                    <span class="text-xs text-gray-500 font-medium"
                      >Protein (g)</span
                    >
                    <input
                      type="number"
                      min="0"
                      class="mt-1 w-full px-3 py-2 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      [value]="nutrition().protein"
                      (input)="onNutritionChange('protein', $event)"
                    />
                  </div>
                  <div>
                    <span class="text-xs text-gray-500 font-medium"
                      >Kohlenhydrate (g)</span
                    >
                    <input
                      type="number"
                      min="0"
                      class="mt-1 w-full px-3 py-2 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      [value]="nutrition().carbs"
                      (input)="onNutritionChange('carbs', $event)"
                    />
                  </div>
                  <div>
                    <span class="text-xs text-gray-500 font-medium"
                      >Fett (g)</span
                    >
                    <input
                      type="number"
                      min="0"
                      class="mt-1 w-full px-3 py-2 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      [value]="nutrition().fat"
                      (input)="onNutritionChange('fat', $event)"
                    />
                  </div>
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
                    [svgInject]="icons.Clipboard"
                    class="w-5 h-5 text-gray-400"
                  ></span>
                  Name: {{ name() || '–' }}
                </li>
                <li class="flex items-center gap-2">
                  <span
                    [svgInject]="icons.Utensils"
                    class="w-5 h-5 text-gray-400"
                  ></span>
                  Kategorie:
                  {{ selectedMealTypeLabel() || '–' }}
                </li>
                <li class="flex items-center gap-2">
                  <span
                    [svgInject]="icons.Flame"
                    class="w-5 h-5 text-gray-400"
                  ></span>
                  Kalorien: {{ nutrition().calories }} kcal
                </li>
                <li class="text-xs text-gray-500 leading-snug">
                  Hinweis: Kalorien und Makros beziehen sich auf die gesamte
                  Portion.
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
                  Mahlzeit speichern
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
export class TrackMealModalComponent {
  protected readonly icons = icons;
  protected readonly mealTypes = MEAL_TYPES;

  isOpen = input<boolean>(false);
  close = output<void>();
  save = output<{
    name: string;
    mealType: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>();

  protected name = signal('');
  protected mealType = signal<MealType | null>(null);
  protected nutrition = signal({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  protected error = signal('');

  selectedMealTypeLabel(): string {
    const type = this.mealType();
    return this.mealTypes.find((m) => m.key === type)?.label || '';
  }

  onNameChange(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value ?? '');
    this.error.set('');
  }

  selectMealType(type: MealType): void {
    this.mealType.set(type);
    this.error.set('');
  }

  onNutritionChange(
    field: 'calories' | 'protein' | 'carbs' | 'fat',
    event: Event,
  ): void {
    const value = Number((event.target as HTMLInputElement).value ?? 0);
    const sanitized = Number.isFinite(value) ? Math.max(0, value) : 0;
    this.nutrition.set({ ...this.nutrition(), [field]: sanitized });
    this.error.set('');
  }

  submit(): void {
    const name = this.name().trim();
    const mealType = this.mealType();
    const nutrition = this.nutrition();

    if (!name) {
      this.error.set('Bitte gib einen Namen für die Mahlzeit ein.');
      return;
    }
    if (!mealType) {
      this.error.set('Bitte wähle eine Kategorie aus.');
      return;
    }
    if (nutrition.calories <= 0) {
      this.error.set('Bitte gib mindestens die Kalorienmenge an.');
      return;
    }

    this.save.emit({
      name,
      mealType,
      calories: Math.round(nutrition.calories),
      protein: Math.round(nutrition.protein),
      carbs: Math.round(nutrition.carbs),
      fat: Math.round(nutrition.fat),
    });
  }
}
