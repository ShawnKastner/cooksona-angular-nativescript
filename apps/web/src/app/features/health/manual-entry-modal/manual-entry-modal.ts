import { Component, input, output, signal } from '@angular/core';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { icons } from '@cooksona/constants/icons';

@Component({
  selector: 'app-manual-entry-modal',
  standalone: true,
  imports: [SvgInjectDirective],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 transition-opacity"
        (click)="close.emit()"
      >
        <div
          class="bg-base-100 rounded-2xl shadow-soft-xl w-full max-w-lg transform transition-all border border-base-200"
          (click)="$event.stopPropagation()"
        >
          <header
            class="p-6 border-b border-base-200 flex items-start justify-between"
          >
            <div>
              <h2
                class="text-2xl font-serif font-bold text-neutral flex items-center gap-3"
              >
                Manueller Eintrag
              </h2>
              <p class="text-gray-500 text-sm mt-1">
                Trage Aktivitäten oder Nährwerte ein.
              </p>
            </div>
            <button
              (click)="close.emit()"
              class="p-2 rounded-full text-gray-400 hover:bg-base-200 hover:text-neutral transition-colors"
              type="button"
            >
              <span [svgInject]="icons.X" class="w-6 h-6"></span>
            </button>
          </header>
          <div class="p-6">
            <div class="flex gap-2 p-1 bg-base-200 rounded-lg mb-6">
              <button
                (click)="activeTab.set('activity'); error.set('')"
                [class]="
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-colors ' +
                  (activeTab() === 'activity'
                    ? 'bg-white text-primary'
                    : 'text-gray-600 hover:bg-white/50')
                "
                type="button"
              >
                <span [svgInject]="icons.Target" class="w-5 h-5"></span>
                Aktivität
              </button>
              <button
                (click)="activeTab.set('nutrition'); error.set('')"
                [class]="
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-colors ' +
                  (activeTab() === 'nutrition'
                    ? 'bg-white text-primary'
                    : 'text-gray-600 hover:bg-white/50')
                "
                type="button"
              >
                <span [svgInject]="icons.Flame" class="w-5 h-5"></span>
                Nährwerte
              </button>
            </div>
            @if (error()) {
              <p class="text-error text-sm mb-4 text-center">{{ error() }}</p>
            }
            @if (activeTab() === 'activity') {
              <div class="space-y-4">
                <div
                  class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-3"
                >
                  <span
                    [svgInject]="icons.Info"
                    class="w-5 h-5 flex-shrink-0 text-blue-500"
                  ></span>
                  <div>
                    <span class="font-bold">Apple Health Integration:</span>
                    Eine direkte Anbindung ist nur in nativen iOS-Apps möglich.
                    In einer zukünftigen App werden diese Daten automatisch
                    synchronisiert.
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-bold text-neutral mb-2"
                    >Verbrannte Kalorien (kcal)</label
                  >
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <span
                        [svgInject]="icons.Flame"
                        class="w-5 h-5 text-gray-400"
                      ></span>
                    </div>
                    <input
                      type="number"
                      [value]="activityCalories()"
                      (input)="onActivityInput($event)"
                      placeholder="z.B. 350"
                      class="w-full pl-12 pr-4 py-3 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-neutral"
                      min="1"
                    />
                  </div>
                </div>

                <div class="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    (click)="close.emit()"
                    class="bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    (click)="saveActivity()"
                    class="bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary-focus transition-colors"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            } @else {
              <div class="space-y-4">
                <p class="text-sm text-gray-500">
                  Trage hier manuell gegessene Nährwerte ein, die nicht aus
                  deinem Plan stammen.
                </p>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-bold text-neutral mb-2"
                      >Kalorien (kcal)</label
                    >
                    <input
                      type="number"
                      [value]="nutrition().calories"
                      (input)="onNutritionInput('calories', $event)"
                      placeholder="z.B. 500"
                      class="w-full px-3 py-2 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      min="0"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-neutral mb-2"
                      >Protein (g)</label
                    >
                    <input
                      type="number"
                      [value]="nutrition().protein"
                      (input)="onNutritionInput('protein', $event)"
                      placeholder="z.B. 30"
                      class="w-full px-3 py-2 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      min="0"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-neutral mb-2"
                      >Kohlenhydrate (g)</label
                    >
                    <input
                      type="number"
                      [value]="nutrition().carbs"
                      (input)="onNutritionInput('carbs', $event)"
                      placeholder="z.B. 50"
                      class="w-full px-3 py-2 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      min="0"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-neutral mb-2"
                      >Fett (g)</label
                    >
                    <input
                      type="number"
                      [value]="nutrition().fat"
                      (input)="onNutritionInput('fat', $event)"
                      placeholder="z.B. 15"
                      class="w-full px-3 py-2 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      min="0"
                    />
                  </div>
                </div>
                <div class="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    (click)="close.emit()"
                    class="bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    (click)="saveNutrition()"
                    class="bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary-focus transition-colors"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class ManualEntryModalComponent {
  protected readonly icons = icons;

  isOpen = input<boolean>(false);
  close = output<void>();
  saveActivityEvent = output<number>({ alias: 'saveActivity' });
  saveNutritionEvent = output<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>({ alias: 'saveNutrition' });

  activeTab = signal<'activity' | 'nutrition'>('activity');
  activityCalories = signal(0);
  nutrition = signal({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  error = signal('');

  onActivityInput(event: Event) {
    const value = Number((event.target as HTMLInputElement).value || 0);
    this.activityCalories.set(value);
  }

  onNutritionInput(
    field: 'calories' | 'protein' | 'carbs' | 'fat',
    event: Event,
  ) {
    const value = Number((event.target as HTMLInputElement).value || 0);
    const n = this.nutrition();
    this.nutrition.set({ ...n, [field]: value });
  }

  saveActivity() {
    const num = this.activityCalories();
    if (isNaN(num) || num <= 0) {
      this.error.set('Bitte eine gültige, positive Kalorienzahl eingeben.');
      return;
    }
    this.saveActivityEvent.emit(num);
  }

  saveNutrition() {
    const data = this.nutrition();
    if (
      data.calories === 0 &&
      data.protein === 0 &&
      data.carbs === 0 &&
      data.fat === 0
    ) {
      this.error.set('Bitte mindestens einen Wert eingeben.');
      return;
    }
    if (Object.values(data).some((v) => v < 0)) {
      this.error.set('Werte dürfen nicht negativ sein.');
      return;
    }
    this.saveNutritionEvent.emit(data);
  }
}
