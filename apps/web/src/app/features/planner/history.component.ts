import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MealPlan } from '@cooksona/models/plan.models';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { Trash, Calendar } from '@cooksona/constants/icons';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, SvgInjectDirective],
  template: `
    @if(plans.length === 0) {
    <div class="text-center text-gray-500 py-12">
      <p class="font-serif-strong text-xl text-neutral">
        Noch keine Pläne erstellt.
      </p>
      <p class="text-sm mt-1">Dein erster Plan erscheint hier!</p>
    </div>
    }@else {
    <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2 -mr-2">
      @for(plan of plans; track plan) {
      <div
        (click)="onSelect(plan.id)"
        class="w-full p-4 rounded-xl cursor-pointer transition-all duration-300 flex justify-between items-center group border border-base-200"
        [ngClass]="
          activePlanId === plan.id
            ? 'bg-primary/10 border-primary shadow-soft'
            : 'bg-white hover:bg-base-100/50 hover:shadow-soft transform hover:-translate-y-px'
        "
      >
        <div class="flex-1 overflow-hidden">
          <div class="font-semibold text-neutral flex items-center gap-2">
            <span
              class="w-4 h-4 text-gray-400 flex-shrink-0"
              [svgInject]="icons.Calendar"
            ></span>
            <span class="truncate">
              Plan vom {{ plan.createdAt | date : 'dd.MM.yyyy' }}
            </span>
          </div>
          <p class="text-sm text-gray-500 truncate">
            {{ plan.options.planDays }} Tage,
            {{ plan.options.diet || 'Gemischt' }}
          </p>
        </div>
        <button
          type="button"
          (click)="onDelete($event, plan.id)"
          aria-label="Plan löschen"
          class="p-2 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-error transition-all ml-2"
        >
          <span class="w-5 h-5" [svgInject]="icons.Trash"></span>
        </button>
      </div>
      }
    </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  @Input() plans: MealPlan[] = [];
  @Input() activePlanId: string | null = null;
  @Output() selectPlan = new EventEmitter<string>();
  @Output() deletePlan = new EventEmitter<string>();

  readonly icons = { Trash, Calendar } as const;

  onSelect(id: string): void {
    this.selectPlan.emit(id);
  }

  onDelete(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.deletePlan.emit(id);
  }
}
