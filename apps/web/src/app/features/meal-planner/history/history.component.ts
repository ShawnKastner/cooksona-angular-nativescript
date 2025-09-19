import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MealPlan } from '@cooksona/models/plan.models';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { Trash, Calendar } from '@cooksona/constants/icons';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, SvgInjectDirective],
  templateUrl: './history.component.html',
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
