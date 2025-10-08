import { Component, computed, input } from '@angular/core';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { icons } from '@cooksona/constants/icons';
import type { DailyMetrics } from '@cooksona/models';

@Component({
  selector: 'app-steps-card',
  standalone: true,
  imports: [SvgInjectDirective],
  template: `
    <div
      class="bg-white p-6 rounded-2xl shadow-soft border border-base-200 h-full flex flex-col gap-4"
    >
      <div class="flex items-center gap-3">
        <span [svgInject]="icons.Dumbbell" class="w-8 h-8 text-primary"></span>
        <div>
          <h3 class="font-serif font-bold text-lg text-neutral">Schritte</h3>
          <p class="text-sm text-gray-500">
            {{ steps() | number: '1.0-0' }} /
            {{ stepGoal() | number: '1.0-0' }} Ziel
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <div class="w-full bg-base-200 rounded-full h-3 overflow-hidden">
          <div
            class="h-full bg-primary transition-all duration-500"
            [style.width.%]="progress()"
          ></div>
        </div>

        <div class="grid grid-cols-3 gap-4 text-sm text-gray-600">
          <div class="p-3 bg-base-100 rounded-xl border border-base-200">
            <p class="font-semibold text-neutral">Schritte</p>
            <p class="text-lg font-bold text-primary">
              {{ steps() | number: '1.0-0' }}
            </p>
          </div>
          <div class="p-3 bg-base-100 rounded-xl border border-base-200">
            <p class="font-semibold text-neutral">Kilometer</p>
            <p class="text-lg font-bold text-secondary">
              {{ kilometers() | number: '1.1-1' }} km
            </p>
          </div>
          <div class="p-3 bg-base-100 rounded-xl border border-base-200">
            <p class="font-semibold text-neutral">Kalorien</p>
            <p class="text-lg font-bold text-success">
              {{ calories() | number: '1.0-0' }} kcal
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class StepsCardComponent {
  protected readonly icons = icons;

  metrics = input.required<DailyMetrics>();
  stepGoal = input<number>(10000);

  protected steps = computed(() => this.metrics().steps ?? 0);
  protected kilometers = computed(() => this.metrics().stepsKilometers ?? 0);
  protected calories = computed(() => this.metrics().stepsCalories ?? 0);

  protected progress = computed(() => {
    const goal = this.stepGoal();
    if (!goal) return 0;
    return Math.min((this.steps() / goal) * 100, 100);
  });
}
