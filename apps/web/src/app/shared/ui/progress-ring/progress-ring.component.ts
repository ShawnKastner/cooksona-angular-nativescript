import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [NgClass],
  template: ` <div class="flex flex-col items-center">
    <svg width="120" height="120" viewBox="0 0 120 120" class="-rotate-90">
      <circle
        cx="60"
        cy="60"
        [attr.r]="radius()"
        class="text-base-200"
        [attr.stroke-width]="10"
        stroke="currentColor"
        fill="transparent"
      />
      <circle
        cx="60"
        cy="60"
        [attr.r]="radius()"
        [ngClass]="colorClass()"
        [attr.stroke-width]="10"
        stroke="currentColor"
        fill="transparent"
        [attr.stroke-dasharray]="circumference()"
        [attr.stroke-dashoffset]="offset()"
        stroke-linecap="round"
        style="transition: stroke-dashoffset 0.5s ease-out"
      />
    </svg>
    <div class="text-center -mt-20">
      <p class="text-lg font-bold text-neutral">{{ value() }}</p>
      <p class="text-sm text-gray-500">/ {{ total() }} {{ unit() }}</p>
    </div>
    <p class="mt-14 text-xs font-semibold uppercase text-gray-500">
      {{ label() }}
    </p>
  </div>`,
})
export class ProgressRingComponent {
  // signal inputs (Angular v20)
  progress = input<number>(0);
  colorClass = input<string>('');
  value = input<number>(0);
  total = input<number>(0);
  unit = input<string>('');
  label = input<string>('');

  radius = computed(() => 50);
  circumference = computed(() => 2 * Math.PI * this.radius());
  offset = computed(
    () =>
      this.circumference() -
      ((this.progress() || 0) / 100) * this.circumference()
  );
}
