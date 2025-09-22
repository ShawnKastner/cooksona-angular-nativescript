import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col items-center justify-center bg-base-100/50 rounded-2xl border-dashed border-base-200"
      [class.p-12]="!compact"
      [class.p-6]="compact"
      [class.border-2]="!withOutBorder"
      role="status"
      aria-live="polite"
    >
      <div
        class="border-4 border-primary border-t-transparent rounded-full animate-spin"
        [class.w-20]="!compact"
        [class.h-20]="!compact"
        [class.w-12]="compact"
        [class.h-12]="compact"
      ></div>
      @if(!compact){
      <p class="mt-6 text-xl font-serif font-semibold text-neutral">
        {{ label }}
      </p>
      <p class="text-sm text-gray-500 mt-1">
        {{ subLabel }}
      </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {
  @Input() label?: string;
  @Input() subLabel?: string;
  /** Compact mode: smaller spinner and no text */
  @Input() compact = false;
  @Input() withOutBorder = false;
}
