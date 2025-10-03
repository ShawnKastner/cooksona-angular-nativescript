import { Component, inject, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { HealthStore } from '../health.store';
import { NativeScriptAnimatedCircleModule } from '@nativescript/animated-circle/angular';

@Component({
  selector: 'ns-calorie-progress',
  templateUrl: './calorie-progress.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, NativeScriptAnimatedCircleModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class CalorieProgressComponent {
  private readonly store = inject(HealthStore);

  protected readonly remainingCalories = this.store.remainingCalories;
  protected readonly calorieGoal = this.store.calorieGoal;
  protected readonly calorieProgress = this.store.calorieProgress;
  protected readonly proteinProgress = this.store.proteinProgress;
  protected readonly carbsProgress = this.store.carbsProgress;
  protected readonly fatProgress = this.store.fatProgress;
  protected readonly proteinGoal = this.store.proteinGoal;
  protected readonly carbsGoal = this.store.carbsGoal;
  protected readonly fatGoal = this.store.fatGoal;
  protected readonly Math = Math;
  protected readonly metrics = this.store.metricsForSelectedDate;

  protected get isOverGoal(): boolean {
    const goal = this.calorieGoal();
    const eaten = this.metrics().caloriesEaten;
    return eaten > goal;
  }

  protected get displayProgress(): number {
    const goal = this.calorieGoal();
    const eaten = this.metrics().caloriesEaten;

    if (goal === 0) return 0;

    const percentage = (eaten / goal) * 100;

    return Math.min(Math.max(percentage, 0), 100);
  }

  protected get displayCalories(): string {
    const goal = this.calorieGoal();
    const eaten = this.metrics().caloriesEaten;
    const burned = this.metrics().caloriesBurned;

    const remaining = goal + burned - eaten;
    const absValue = Math.abs(Math.round(remaining));

    if (remaining < 0) {
      return `${absValue} kcal`;
    } else if (remaining === 0) {
      return 'Ziel erreicht!';
    } else {
      return `${absValue} kcal`;
    }
  }

  protected get displayLabel(): string {
    return this.isOverGoal ? 'Zuviel' : 'Verbleibend';
  }
}
