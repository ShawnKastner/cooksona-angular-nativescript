import { Component, inject, NO_ERRORS_SCHEMA } from '@angular/core';
import { HealthStore } from '@cooksona/health';

@Component({
  selector: 'ns-macronutrients',
  templateUrl: './macronutrients.component.html',
  standalone: true,
  imports: [],
  schemas: [NO_ERRORS_SCHEMA],
})
export class MacronutrientsComponent {
  private readonly store = inject(HealthStore);

  protected readonly proteinGoal = this.store.proteinGoal;
  protected readonly carbsGoal = this.store.carbsGoal;
  protected readonly fatGoal = this.store.fatGoal;
  protected readonly calorieProgress = this.store.calorieProgress;
  protected readonly proteinProgress = this.store.proteinProgress;
  protected readonly carbsProgress = this.store.carbsProgress;
  protected readonly fatProgress = this.store.fatProgress;
  protected readonly metrics = this.store.metricsForSelectedDate;
  protected readonly Math = Math;
}
