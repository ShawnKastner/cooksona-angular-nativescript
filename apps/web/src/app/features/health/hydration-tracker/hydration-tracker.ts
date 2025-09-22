import { Component, computed, input, output } from '@angular/core';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { icons } from '@cooksona/constants/icons';

@Component({
  selector: 'app-hydration-tracker',
  standalone: true,
  imports: [SvgInjectDirective],
  template: `
    <div
      class="bg-white p-6 rounded-2xl shadow-soft border border-base-200 h-full flex flex-col items-center"
    >
      <h3 class="font-serif font-bold text-lg text-neutral mb-1">Hydration</h3>
      <p class="text-sm text-gray-500 mb-4">
        <span class="font-bold text-primary">{{ currentIntake() }}</span> /
        {{ WATER_GOAL }} ml
      </p>

      <div class="relative w-32 h-64 my-auto">
        <svg
          viewBox="0 0 100 200"
          class="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="bottle-mask">
              <path
                d="M15 195V45C15 25.67 31.67 10 50 10S85 25.67 85 45V195H15Z"
              />
            </clipPath>
          </defs>

          <g clip-path="url(#bottle-mask)">
            <path
              [attr.d]="waterPath()"
              class="text-blue-400 transition-all duration-500 ease-out"
              fill="currentColor"
            />
          </g>

          <path
            d="M15 195V45C15 25.67 31.67 10 50 10S85 25.67 85 45V195H15Z"
            stroke="currentColor"
            class="text-base-300"
            stroke-width="4"
          />
          <path
            d="M35 5H65C67.7614 5 70 7.23858 70 10V10H30V10C30 7.23858 32.2386 5 35 5Z"
            stroke="currentColor"
            class="text-base-300"
            stroke-width="4"
          />

          @for (p of marks; track p) {
            <line
              [attr.x1]="20"
              [attr.y1]="195 - p * 1.8"
              [attr.x2]="30"
              [attr.y2]="195 - p * 1.8"
              stroke="currentColor"
              class="text-base-300/80"
              stroke-width="2"
            />
          }
        </svg>

        <div
          class="absolute inset-0 flex flex-col justify-end items-center pb-2 pointer-events-none"
        >
          <p class="font-bold text-white text-lg drop-shadow-md">
            {{ Math.round(progress()) }}%
          </p>
        </div>

        @if (goalReached()) {
          <div
            class="absolute -top-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center text-white animate-fade-in shadow-lg"
          >
            <span [svgInject]="icons.Check" class="w-5 h-5"></span>
          </div>
        }
      </div>

      <div class="grid grid-cols-2 gap-3 mt-auto w-full">
        <button
          (click)="updateIntake.emit(GLASS_SIZE)"
          class="bg-primary/10 text-primary font-bold py-3 rounded-xl hover:bg-primary/20 transition-colors text-lg"
          type="button"
        >
          + {{ GLASS_SIZE }}ml
        </button>
        <button
          (click)="updateIntake.emit(-GLASS_SIZE)"
          [disabled]="currentIntake() <= 0"
          class="bg-base-200 text-neutral font-bold py-3 rounded-xl hover:bg-base-300 transition-colors disabled:opacity-50 text-lg"
          type="button"
        >
          - {{ GLASS_SIZE }}ml
        </button>
      </div>
    </div>
  `,
})
export class HydrationTrackerComponent {
  protected readonly icons = icons;
  protected readonly WATER_GOAL = 2000;
  protected readonly GLASS_SIZE = 250;
  protected marks = [25, 50, 75];
  // Expose Math for template usage
  protected Math = Math;

  // Input value from parent (ml)
  currentIntake = input<number>(0);
  // Emit delta updates (+/- ml)
  updateIntake = output<number>();
  protected progress = computed(() =>
    Math.min((this.currentIntake() / this.WATER_GOAL) * 100, 100),
  );
  protected goalReached = computed(
    () => this.currentIntake() >= this.WATER_GOAL,
  );
  protected waterTopY = computed(() => 195 - this.progress() * 1.8);
  protected waterPath = computed(
    () =>
      `M 0 195 V ${this.waterTopY()} C 0 ${this.waterTopY() - 5}, 100 ${
        this.waterTopY() - 5
      }, 100 ${this.waterTopY()} V 195 H 0 Z`,
  );
}
