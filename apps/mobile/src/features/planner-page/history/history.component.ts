import { Component, NO_ERRORS_SCHEMA, inject, output } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { BookOpen } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { PlannerStore } from '../planner.store';
import { MealPlan } from '@cooksona/models';

@Component({
  selector: 'ns-history',
  templateUrl: './history.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HistoryComponent {
  private readonly store = inject(PlannerStore);
  selectPlan = output<boolean>();
  icons = {
    BookOpen,
  } as const;

  plans = this.store.plans;

  formatDate(dateStr: string): string {
    // Some NativeScript runtimes may ignore explicit locale in toLocaleDateString
    // when Intl locale data isn't available. Format deterministically as dd.MM.yyyy.
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  getDaysCount(plan: MealPlan): number {
    return plan.days.length;
  }

  onPlanSelect(plan: MealPlan) {
    // Set the selected plan as active in the shared store
    this.store.activePlanId.set(plan.id);
    this.selectPlan.emit(true);
  }
}
